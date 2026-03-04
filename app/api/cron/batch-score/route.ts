import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { scoreEquity, scoreCrypto, scoreCommodity, type ScoringResult } from '@/lib/scoring/engine';
import type { Json } from '@/lib/supabase/types';
import { chunk, delay, computeDailyReturns } from '@/lib/utils';

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1000;

/** Minimum price history entries needed for scoring */
const MIN_PRICE_ENTRIES = 20;

type AssetType = 'stock' | 'etf' | 'commodity' | 'forex' | 'crypto';

interface UniqueAsset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
}

interface PriceCacheRow {
  asset_symbol: string;
  close: number;
  volume: number | null;
  date: string;
}

interface ScoreResult {
  asset_id: string;
  overall_score: number;
  dimensions: Json;
}

/**
 * Cron: Batch Score Assets
 * Schedule: Weekly on Monday at 03:00 UTC (0 3 * * 1)
 *
 * Calculates quantitative scores for all assets held in user portfolios
 * using the appropriate scoring engine per asset type, then upserts
 * results into the asset_scores table.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Get all unique assets from holdings
  const { data: holdings, error: holdingsError } = await supabase
    .from('holdings')
    .select('asset_id, assets(id, symbol, name, type)')
    .not('assets', 'is', null);

  if (holdingsError) {
    return NextResponse.json(
      { error: 'Failed to fetch holdings', details: holdingsError.message },
      { status: 500 },
    );
  }

  // Deduplicate assets
  const assetMap = new Map<string, UniqueAsset>();
  for (const holding of holdings ?? []) {
    const asset = holding.assets as unknown as UniqueAsset | null;
    if (asset?.id && !assetMap.has(asset.id)) {
      assetMap.set(asset.id, asset);
    }
  }

  const uniqueAssets = Array.from(assetMap.values());

  if (uniqueAssets.length === 0) {
    return NextResponse.json({
      success: true,
      scored: 0,
      message: 'No assets to score',
      timestamp: now,
    });
  }

  // 2. Fetch price history for all assets from cache (ordered by date ascending for time series)
  const symbols = uniqueAssets.map((a) => a.symbol);
  const { data: priceData } = await supabase
    .from('price_cache')
    .select('asset_symbol, close, volume, date')
    .in('asset_symbol', symbols)
    .order('date', { ascending: true });

  // Build price history map: symbol -> sorted price rows
  const priceHistoryMap = new Map<string, PriceCacheRow[]>();
  if (priceData) {
    for (const row of priceData) {
      const existing = priceHistoryMap.get(row.asset_symbol) ?? [];
      existing.push(row);
      priceHistoryMap.set(row.asset_symbol, existing);
    }
  }

  // Fetch latest sentiment value for the scoring blend
  const { data: sentimentRow } = await supabase
    .from('market_sentiment')
    .select('value')
    .eq('index_name', 'fear_greed_index')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sentimentScore = (sentimentRow?.value as number) ?? 50;

  // 3. Score assets in batches
  const results: ScoreResult[] = [];
  const errors: Array<{ symbol: string; error: string }> = [];
  const batches = chunk(uniqueAssets, BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const batchResults = await Promise.allSettled(
      batch.map(async (asset) => {
        const history = priceHistoryMap.get(asset.symbol);
        if (!history || history.length < MIN_PRICE_ENTRIES) {
          throw new Error(
            `Insufficient price data for ${asset.symbol} (${history?.length ?? 0} entries, need ${MIN_PRICE_ENTRIES})`,
          );
        }

        const prices = history.map((r) => r.close);
        const volumes = history.map((r) => r.volume ?? 0);
        const dailyReturns = computeDailyReturns(prices);

        let scoringResult: ScoringResult;

        switch (asset.type) {
          case 'crypto':
            scoringResult = scoreCrypto(
              {
                momentum: { prices, volumes },
                marketCapRank: 100, // Default; overridden when full data available
                tvlToMcapRatio: null,
                risk: { dailyReturns, beta: null, maxDrawdown1Y: null },
                growth: {
                  revenueGrowthYoY: null,
                  earningsGrowthYoY: null,
                  revenueGrowth3Y: null,
                },
              },
              sentimentScore,
            );
            break;
          case 'commodity':
          case 'forex':
            scoringResult = scoreCommodity(
              {
                momentum: { prices, volumes },
                meanReversionDistance: 0, // Neutral default
                seasonalScore: null,
                risk: { dailyReturns, beta: null, maxDrawdown1Y: null },
                growth: {
                  revenueGrowthYoY: null,
                  earningsGrowthYoY: null,
                  revenueGrowth3Y: null,
                },
              },
              sentimentScore,
            );
            break;
          case 'stock':
          case 'etf':
          default:
            scoringResult = scoreEquity(
              {
                momentum: { prices, volumes },
                value: {
                  pe: null,
                  pb: null,
                  evEbitda: null,
                  dividendYield: null,
                  sectorMedianPE: 20,
                },
                quality: {
                  roe: null,
                  debtToEquity: null,
                  fcfMargin: null,
                  currentRatio: null,
                },
                growth: {
                  revenueGrowthYoY: null,
                  earningsGrowthYoY: null,
                  revenueGrowth3Y: null,
                },
                risk: { dailyReturns, beta: null, maxDrawdown1Y: null },
              },
              sentimentScore,
            );
            break;
        }

        return {
          asset_id: asset.id,
          overall_score: scoringResult.overallScore,
          dimensions: scoringResult.dimensions as unknown as Json,
        } satisfies ScoreResult;
      }),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        const errMsg = result.reason instanceof Error ? result.reason.message : 'Unknown error';
        errors.push({
          symbol: errMsg.split(':')[0]?.trim() ?? 'unknown',
          error: errMsg,
        });
      }
    }

    // Delay between batches (skip after last batch)
    if (i < batches.length - 1) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // 4. Upsert scores into asset_scores table
  let upsertedCount = 0;
  if (results.length > 0) {
    const rows = results.map((r) => ({
      asset_id: r.asset_id,
      overall_score: r.overall_score,
      dimensions: r.dimensions,
    }));

    const { error: upsertError } = await supabase
      .from('asset_scores')
      .upsert(rows, { onConflict: 'asset_id' });

    if (upsertError) {
      return NextResponse.json(
        { error: 'Failed to upsert scores', details: upsertError.message },
        { status: 500 },
      );
    }

    upsertedCount = rows.length;
  }

  return NextResponse.json({
    success: true,
    scored: upsertedCount,
    totalAssets: uniqueAssets.length,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now,
  });
}
