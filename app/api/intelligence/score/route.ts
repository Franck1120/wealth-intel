import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { assetScoreRequestSchema } from '@/lib/validators';
import { getQuote, getQuoteSummary, getHistoricalPrices } from '@/lib/data-providers/yahoo';
import { getCoinPrice, getCoinMarketData } from '@/lib/data-providers/coingecko';
import {
  scoreEquity,
  scoreCrypto,
  scoreCommodity,
  type ScoringResult,
} from '@/lib/scoring/engine';
import type { Json } from '@/lib/supabase/types';
import { rateLimit } from '@/lib/rate-limit';
import { computeDailyReturns } from '@/lib/utils';

/**
 * POST /api/intelligence/score
 * Calculate a quantitative score for a single asset.
 *
 * Body: { assetId: string, symbol: string, type: 'stock'|'crypto'|'commodity'|'etf' }
 *
 * The scoring engine analyzes:
 * - Technical: momentum, volatility, trend strength
 * - Fundamental: P/E, P/B, ROE, margins (equity only)
 * - Sentiment: Fear & Greed index, market context
 * - Risk: drawdown, beta, volatility
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResult = await rateLimit(`score:${user.id}`, 10, 60_000);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Troppe richieste. Riprova tra poco.' },
      { status: 429 },
    );
  }

  const body: unknown = await request.json();
  const parsed = assetScoreRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { assetId, symbol, type } = parsed.data;

  const admin = createAdminClient();

  try {
    // Fetch sentiment for the scoring blend
    const sentimentScore = await getCachedSentiment();

    let scoringResult: ScoringResult;

    if (type === 'stock' || type === 'etf') {
      scoringResult = await scoreEquityAsset(symbol, sentimentScore);
    } else if (type === 'crypto') {
      scoringResult = await scoreCryptoAsset(symbol, sentimentScore);
    } else if (type === 'commodity') {
      scoringResult = await scoreCommodityAsset(symbol, sentimentScore);
    } else {
      return NextResponse.json(
        { error: `Unsupported asset type: ${type}` },
        { status: 400 },
      );
    }

    // Save scoring result to asset_scores table
    const scoreRecord = {
      asset_id: assetId,
      overall_score: scoringResult.overallScore,
      dimensions: scoringResult.dimensions as unknown as Json,
      ai_analysis: null as string | null,
      ai_model: null as string | null,
    };

    const { data: savedScore, error: saveError } = await admin
      .from('asset_scores')
      .upsert(scoreRecord, {
        onConflict: 'asset_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save score:', saveError.message);
      // Return score even if save fails
      return NextResponse.json({
        score: scoringResult,
        saved: false,
        warning: 'Score computed but failed to persist',
      });
    }

    return NextResponse.json({
      score: scoringResult,
      saved: true,
      record_id: savedScore.id,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown scoring error';
    return NextResponse.json(
      { error: `Scoring failed: ${message}` },
      { status: 500 },
    );
  }
}

/**
 * Score a stock or ETF using Yahoo Finance data.
 */
async function scoreEquityAsset(symbol: string, sentimentScore: number): Promise<ScoringResult> {
  // Fetch quote, summary, and historical prices in parallel
  const [quote, summary, history] = await Promise.all([
    getQuote(symbol),
    getQuoteSummary(symbol),
    getHistoricalPrices(symbol, '1y'),
  ]);

  if (!quote) {
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }

  const prices = history.map((h) => h.close);
  const volumes = history.map((h) => h.volume);
  const dailyReturns = computeDailyReturns(prices);

  return scoreEquity(
    {
      momentum: { prices, volumes },
      value: {
        pe: summary.trailingPE,
        pb: summary.priceToBook,
        evEbitda: null, // Not directly available from QuoteSummary
        dividendYield: summary.dividendYield,
        sectorMedianPE: 20, // Default sector median
      },
      quality: {
        roe: summary.returnOnEquity,
        debtToEquity: summary.debtToEquity,
        fcfMargin: null, // Not directly available
        currentRatio: null, // Not directly available
      },
      growth: {
        revenueGrowthYoY: summary.revenueGrowth,
        earningsGrowthYoY: summary.earningsGrowth,
        revenueGrowth3Y: null, // Would need multiple years of data
      },
      risk: {
        dailyReturns,
        beta: summary.beta,
        maxDrawdown1Y: null, // Could be computed from history
      },
    },
    sentimentScore,
  );
}

/**
 * Score a cryptocurrency using CoinGecko data.
 */
async function scoreCryptoAsset(symbol: string, sentimentScore: number): Promise<ScoringResult> {
  // getCoinPrice expects an array of CoinGecko IDs
  const coinId = symbol.toLowerCase();
  const [priceArr, marketData] = await Promise.all([
    getCoinPrice([coinId]),
    getCoinMarketData(coinId),
  ]);

  const price = priceArr[0];
  if (!price) {
    throw new Error(`Failed to fetch price for ${symbol}`);
  }

  // Build a synthetic price array from available percentage changes
  // CoinGecko provides percentage changes but not full price history
  // Use current price as single data point and derive returns from percentage changes
  const currentPrice = price.usd;
  const changePct24h = marketData.priceChangePercentage24h ?? 0;
  const changePct7d = marketData.priceChangePercentage7d ?? 0;
  const changePct30d = marketData.priceChangePercentage30d ?? 0;

  // Approximate daily returns from available data
  const dailyReturns = [changePct24h / 100];

  // Build a minimal price series from known percentage changes
  const price30dAgo = currentPrice / (1 + changePct30d / 100);
  const price7dAgo = currentPrice / (1 + changePct7d / 100);
  const price1dAgo = currentPrice / (1 + changePct24h / 100);
  const prices = [price30dAgo, price7dAgo, price1dAgo, currentPrice];
  const volumes = [
    price.usdVolume24h,
    price.usdVolume24h,
    price.usdVolume24h,
    price.usdVolume24h,
  ];

  return scoreCrypto(
    {
      momentum: { prices, volumes },
      marketCapRank: marketData.marketCapRank ?? 500,
      tvlToMcapRatio: null, // Would need DeFi Llama data
      risk: { dailyReturns, beta: null, maxDrawdown1Y: null },
      growth: {
        revenueGrowthYoY: null,
        earningsGrowthYoY: null,
        revenueGrowth3Y: null,
      },
    },
    sentimentScore,
  );
}

/**
 * Score a commodity using Yahoo Finance data.
 */
async function scoreCommodityAsset(symbol: string, sentimentScore: number): Promise<ScoringResult> {
  const [quote, history] = await Promise.all([
    getQuote(symbol),
    getHistoricalPrices(symbol, '1y'),
  ]);

  if (!quote) {
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }

  const prices = history.map((h) => h.close);
  const volumes = history.map((h) => h.volume);
  const dailyReturns = computeDailyReturns(prices);

  // Calculate mean reversion distance from 200-day SMA
  const sma200Slice = prices.slice(-200);
  const sma200 = sma200Slice.reduce((sum, p) => sum + p, 0) / sma200Slice.length;
  const currentPrice = quote.regularMarketPrice;
  const meanReversionDistance = sma200 > 0
    ? ((currentPrice - sma200) / sma200) * 100
    : 0;

  return scoreCommodity(
    {
      momentum: { prices, volumes },
      meanReversionDistance,
      seasonalScore: null, // Would need seasonal analysis
      risk: { dailyReturns, beta: null, maxDrawdown1Y: null },
      growth: {
        revenueGrowthYoY: null,
        earningsGrowthYoY: null,
        revenueGrowth3Y: null,
      },
    },
    sentimentScore,
  );
}

/**
 * Fetch the latest cached Fear & Greed sentiment value.
 */
async function getCachedSentiment(): Promise<number> {
  const admin = createAdminClient();

  const { data } = await admin
    .from('market_sentiment')
    .select('value')
    .eq('index_name', 'fear_greed_index')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.value as number) ?? 50;
}
