import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getQuote } from '@/lib/data-providers/yahoo';
import { getCoinPrice } from '@/lib/data-providers/coingecko';
import { chunk, delay } from '@/lib/utils';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

type AssetType = 'stock' | 'etf' | 'commodity' | 'forex' | 'crypto';

interface HoldingAsset {
  symbol: string;
  type: AssetType;
}

interface PriceCacheRow {
  asset_symbol: string;
  asset_type: string;
  date: string;
  close: number;
  volume: number | null;
  source: string;
}

/**
 * Cron: Refresh Prices
 * Schedule: Every 4 hours (0 *​/4 * * *)
 *
 * Fetches latest prices for all assets held by users and upserts
 * into the price_cache table.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Query all unique asset symbols from holdings
  const { data: holdings, error: holdingsError } = await supabase
    .from('holdings')
    .select('assets(symbol, type)')
    .not('assets', 'is', null);

  if (holdingsError) {
    return NextResponse.json(
      { error: 'Failed to fetch holdings', details: holdingsError.message },
      { status: 500 },
    );
  }

  // Deduplicate assets by symbol
  const assetMap = new Map<string, AssetType>();
  for (const holding of holdings ?? []) {
    const asset = holding.assets as unknown as HoldingAsset | null;
    if (asset?.symbol && asset?.type) {
      assetMap.set(asset.symbol, asset.type);
    }
  }

  // 2. Group by type
  const traditionalSymbols: string[] = [];
  const cryptoSymbols: string[] = [];

  for (const [symbol, type] of assetMap) {
    if (type === 'crypto') {
      cryptoSymbols.push(symbol);
    } else {
      traditionalSymbols.push(symbol);
    }
  }

  const results: PriceCacheRow[] = [];
  const errors: Array<{ symbol: string; error: string }> = [];

  // 3. Batch fetch traditional assets from Yahoo Finance
  const traditionalBatches = chunk(traditionalSymbols, BATCH_SIZE);
  for (const batch of traditionalBatches) {
    const batchResults = await Promise.allSettled(
      batch.map(async (symbol) => {
        try {
          const quote = await getQuote(symbol);
          return {
            asset_symbol: symbol,
            asset_type: assetMap.get(symbol) ?? 'stock',
            date: today,
            close: quote.regularMarketPrice,
            volume: quote.regularMarketVolume ?? null,
            source: 'yahoo',
          } satisfies PriceCacheRow;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          throw new Error(`${symbol}: ${message}`);
        }
      }),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          symbol: result.reason?.message?.split(':')[0] ?? 'unknown',
          error: result.reason?.message ?? 'Unknown error',
        });
      }
    }

    if (traditionalBatches.indexOf(batch) < traditionalBatches.length - 1) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // 4. Batch fetch crypto assets from CoinGecko
  const cryptoBatches = chunk(cryptoSymbols, BATCH_SIZE);
  for (const batch of cryptoBatches) {
    const batchResults = await Promise.allSettled(
      batch.map(async (symbol) => {
        try {
          const coins = await getCoinPrice([symbol.toLowerCase()]);
          const coin = coins[0];
          if (!coin) throw new Error(`No data for ${symbol}`);
          return {
            asset_symbol: symbol,
            asset_type: 'crypto',
            date: today,
            close: coin.usd,
            volume: coin.usdVolume24h ?? null,
            source: 'coingecko',
          } satisfies PriceCacheRow;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          throw new Error(`${symbol}: ${message}`);
        }
      }),
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          symbol: result.reason?.message?.split(':')[0] ?? 'unknown',
          error: result.reason?.message ?? 'Unknown error',
        });
      }
    }

    if (cryptoBatches.indexOf(batch) < cryptoBatches.length - 1) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // 5. Upsert all results into price_cache
  if (results.length > 0) {
    const { error: upsertError } = await supabase
      .from('price_cache')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(results as any, { onConflict: 'asset_symbol,asset_type,date,source' });

    if (upsertError) {
      return NextResponse.json(
        { error: 'Failed to upsert price cache', details: upsertError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    success: true,
    updated: results.length,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
