import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getQuote } from '@/lib/data-providers/yahoo';
import { getCoinPrice } from '@/lib/data-providers/coingecko';

type AssetType = 'stock' | 'etf' | 'crypto' | 'commodity' | 'forex' | 'reit';

interface PriceRecord {
  asset_symbol: string;
  asset_type: string;
  date: string;
  close: number;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  volume?: number | null;
  source: string;
  fetched_at?: string;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const YAHOO_TYPES: AssetType[] = ['stock', 'etf', 'commodity', 'forex', 'reit'];

/**
 * GET /api/data/prices?symbols=AAPL,BTC,VWCE.DE&type=stock
 * Fetch and cache prices for given symbols.
 *
 * - Checks price_cache for fresh data (< 4 hours old)
 * - Fetches stale/missing from Yahoo Finance (stock/etf/commodity/forex/reit)
 *   or CoinGecko (crypto)
 * - Upserts fresh data into price_cache
 * - Returns all prices
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const symbolsParam = request.nextUrl.searchParams.get('symbols');
  const type = (request.nextUrl.searchParams.get('type') ?? 'stock') as AssetType;

  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'No symbols provided' },
      { status: 400 },
    );
  }

  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: 'No valid symbols provided' },
      { status: 400 },
    );
  }

  if (symbols.length > 50) {
    return NextResponse.json(
      { error: 'Maximum 50 symbols per request' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const fourHoursAgo = new Date(Date.now() - FOUR_HOURS_MS).toISOString();

  // Check cache for fresh data
  const { data: cached } = await admin
    .from('price_cache')
    .select('*')
    .in('asset_symbol', symbols)
    .eq('asset_type', type)
    .gte('fetched_at', fourHoursAgo);

  const cachedSymbols = new Set(
    (cached ?? []).map((c) => c.asset_symbol),
  );
  const staleSymbols = symbols.filter((s) => !cachedSymbols.has(s));

  // If all symbols are fresh, return cached data
  if (staleSymbols.length === 0) {
    const response = NextResponse.json({
      data: cached ?? [],
      source: 'cache',
    });
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  }

  // Fetch stale symbols from the appropriate provider
  let freshPrices: PriceRecord[] = [];

  try {
    if (YAHOO_TYPES.includes(type)) {
      freshPrices = await fetchFromYahoo(staleSymbols, type);
    } else if (type === 'crypto') {
      freshPrices = await fetchFromCoinGecko(staleSymbols);
    } else {
      return NextResponse.json(
        { error: `Unsupported asset type: ${type}` },
        { status: 400 },
      );
    }
  } catch (fetchError) {
    const message =
      fetchError instanceof Error ? fetchError.message : 'Unknown fetch error';
    // Return cached data even if stale, with a warning
    return NextResponse.json({
      data: cached ?? [],
      stale_symbols: staleSymbols,
      warning: `Failed to fetch fresh prices: ${message}`,
      source: 'cache_stale',
    });
  }

  // Upsert fresh prices into cache
  if (freshPrices.length > 0) {
    const { error: upsertError } = await admin
      .from('price_cache')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(freshPrices as any, {
        onConflict: 'asset_symbol,asset_type',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Price cache upsert error:', upsertError.message);
    }
  }

  // Combine cached + fresh, removing duplicates (prefer fresh)
  const freshSymbols = new Set(freshPrices.map((p) => p.asset_symbol));
  const dedupedCached = (cached ?? []).filter(
    (c) => !freshSymbols.has(c.asset_symbol),
  );

  const response = NextResponse.json({
    data: [...dedupedCached, ...freshPrices],
    source: freshPrices.length > 0 ? 'mixed' : 'cache',
    fetched_count: freshPrices.length,
  });
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return response;
}

/**
 * Fetch quotes from Yahoo Finance for traditional assets.
 */
async function fetchFromYahoo(
  symbols: string[],
  type: AssetType,
): Promise<PriceRecord[]> {
  const results: PriceRecord[] = [];

  // Fetch quotes in parallel with concurrency limit
  const BATCH_SIZE = 10;

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (symbol) => {
      try {
        const quote = await getQuote(symbol);

        if (quote) {
          results.push({
            asset_symbol: symbol,
            asset_type: type,
            date: new Date().toISOString().split('T')[0],
            close: quote.regularMarketPrice,
            volume: quote.regularMarketVolume ?? null,
            source: 'yahoo',
          });
        }
      } catch (err) {
        console.error(`Yahoo fetch failed for ${symbol}:`, err);
      }
    });

    await Promise.all(promises);
  }

  return results;
}

/**
 * Fetch prices from CoinGecko for crypto assets.
 */
async function fetchFromCoinGecko(
  symbols: string[],
): Promise<PriceRecord[]> {
  const results: PriceRecord[] = [];
  const today = new Date().toISOString().split('T')[0];

  // CoinGecko supports batch queries, but we map symbols to coingecko IDs
  const BATCH_SIZE = 10;

  for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
    const batch = symbols.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (symbol) => {
      try {
        const coins = await getCoinPrice([symbol.toLowerCase()]);
        const coin = coins[0];

        if (coin) {
          results.push({
            asset_symbol: symbol,
            asset_type: 'crypto',
            date: today,
            close: coin.usd,
            volume: coin.usdVolume24h ?? null,
            source: 'coingecko',
          });
        }
      } catch (err) {
        console.error(`CoinGecko fetch failed for ${symbol}:`, err);
      }
    });

    await Promise.all(promises);
  }

  return results;
}
