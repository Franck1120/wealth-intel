/**
 * CoinGecko data provider
 * REST API wrapper for cryptocurrency market data
 * Free tier: 30 calls/min without API key
 */

const BASE_URL = 'https://api.coingecko.com/api/v3';

// ── Types ──────────────────────────────────────────────────────────────────

export interface CoinPrice {
  id: string;
  usd: number;
  usdChange24h: number;
  usdMarketCap: number;
  usdVolume24h: number;
  eur: number;
  eurChange24h: number;
  eurMarketCap: number;
  eurVolume24h: number;
  lastUpdated: string;
}

export interface CoinMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: Record<string, number>;
  marketCap: Record<string, number>;
  marketCapRank: number | null;
  totalVolume: Record<string, number>;
  high24h: Record<string, number>;
  low24h: Record<string, number>;
  priceChange24h: number | null;
  priceChangePercentage24h: number | null;
  priceChangePercentage7d: number | null;
  priceChangePercentage30d: number | null;
  priceChangePercentage1y: number | null;
  ath: Record<string, number>;
  athChangePercentage: Record<string, number>;
  athDate: Record<string, string>;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  fullyDilutedValuation: Record<string, number>;
  lastUpdated: string;
  fetchedAt: Date;
}

export interface TopCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  totalVolume: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  sparkline7d: number[] | null;
  fetchedAt: Date;
}

export interface TrendingCoin {
  id: string;
  coinId: number;
  name: string;
  symbol: string;
  marketCapRank: number | null;
  thumb: string;
  large: string;
  score: number;
  priceBtc: number;
}

// ── Internal helpers ───────────────────────────────────────────────────────


function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  const apiKey = process.env.COINGECKO_API_KEY;
  if (apiKey) {
    headers['x-cg-demo-key'] = apiKey;
  }

  return headers;
}

async function fetchCoinGecko<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new CoinGeckoProviderError(
        'CoinGecko rate limit exceeded (30 calls/min for demo). Retry after cooldown.',
        endpoint,
        429,
      );
    }
    throw new CoinGeckoProviderError(
      `CoinGecko API error: ${response.status} ${response.statusText}`,
      endpoint,
      response.status,
    );
  }

  return (await response.json()) as T;
}

// ── Raw response types (API shape) ─────────────────────────────────────────

interface SimplePriceResponse {
  [id: string]: {
    usd?: number;
    usd_24h_change?: number;
    usd_market_cap?: number;
    usd_24h_vol?: number;
    eur?: number;
    eur_24h_change?: number;
    eur_market_cap?: number;
    eur_24h_vol?: number;
    last_updated_at?: number;
  };
}

interface CoinDetailResponse {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; small: string; thumb: string };
  market_data: {
    current_price: Record<string, number>;
    market_cap: Record<string, number>;
    market_cap_rank: number | null;
    total_volume: Record<string, number>;
    high_24h: Record<string, number>;
    low_24h: Record<string, number>;
    price_change_24h: number | null;
    price_change_percentage_24h: number | null;
    price_change_percentage_7d: number | null;
    price_change_percentage_30d: number | null;
    price_change_percentage_1y: number | null;
    ath: Record<string, number>;
    ath_change_percentage: Record<string, number>;
    ath_date: Record<string, string>;
    circulating_supply: number | null;
    total_supply: number | null;
    max_supply: number | null;
    fully_diluted_valuation: Record<string, number>;
  };
  last_updated: string;
}

interface MarketCoinResponse {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  sparkline_in_7d?: { price: number[] };
}

interface TrendingResponse {
  coins: Array<{
    item: {
      id: string;
      coin_id: number;
      name: string;
      symbol: string;
      market_cap_rank: number | null;
      thumb: string;
      large: string;
      score: number;
      price_btc: number;
    };
  }>;
}

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Get simple price data for one or more coins in EUR and USD.
 * Includes 24h change, market cap, and volume.
 */
export async function getCoinPrice(ids: string[]): Promise<CoinPrice[]> {
  try {
    const data = await fetchCoinGecko<SimplePriceResponse>('/simple/price', {
      ids: ids.join(','),
      vs_currencies: 'usd,eur',
      include_24hr_change: 'true',
      include_market_cap: 'true',
      include_24hr_vol: 'true',
      include_last_updated_at: 'true',
    });

    return ids
      .filter((id) => data[id] !== undefined)
      .map((id) => {
        const coin = data[id];
        return {
          id,
          usd: coin.usd ?? 0,
          usdChange24h: coin.usd_24h_change ?? 0,
          usdMarketCap: coin.usd_market_cap ?? 0,
          usdVolume24h: coin.usd_24h_vol ?? 0,
          eur: coin.eur ?? 0,
          eurChange24h: coin.eur_24h_change ?? 0,
          eurMarketCap: coin.eur_market_cap ?? 0,
          eurVolume24h: coin.eur_24h_vol ?? 0,
          lastUpdated: coin.last_updated_at
            ? new Date(coin.last_updated_at * 1000).toISOString()
            : new Date().toISOString(),
        };
      });
  } catch (error) {
    if (error instanceof CoinGeckoProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new CoinGeckoProviderError(
      `Failed to fetch prices for [${ids.join(', ')}]: ${message}`,
      '/simple/price',
    );
  }
}

/**
 * Get detailed market data for a single coin.
 */
export async function getCoinMarketData(id: string): Promise<CoinMarketData> {
  try {
    const data = await fetchCoinGecko<CoinDetailResponse>(`/coins/${id}`, {
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false',
    });

    const md = data.market_data;
    return {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image.large,
      currentPrice: md.current_price,
      marketCap: md.market_cap,
      marketCapRank: md.market_cap_rank,
      totalVolume: md.total_volume,
      high24h: md.high_24h,
      low24h: md.low_24h,
      priceChange24h: md.price_change_24h,
      priceChangePercentage24h: md.price_change_percentage_24h,
      priceChangePercentage7d: md.price_change_percentage_7d,
      priceChangePercentage30d: md.price_change_percentage_30d,
      priceChangePercentage1y: md.price_change_percentage_1y,
      ath: md.ath,
      athChangePercentage: md.ath_change_percentage,
      athDate: md.ath_date,
      circulatingSupply: md.circulating_supply,
      totalSupply: md.total_supply,
      maxSupply: md.max_supply,
      fullyDilutedValuation: md.fully_diluted_valuation,
      lastUpdated: data.last_updated,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof CoinGeckoProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new CoinGeckoProviderError(
      `Failed to fetch market data for ${id}: ${message}`,
      `/coins/${id}`,
    );
  }
}

/**
 * Get top coins ranked by market cap.
 */
export async function getTopCoins(
  limit: number = 20,
  currency: string = 'usd',
): Promise<TopCoin[]> {
  try {
    const data = await fetchCoinGecko<MarketCoinResponse[]>('/coins/markets', {
      vs_currency: currency,
      order: 'market_cap_desc',
      per_page: String(limit),
      page: '1',
      sparkline: 'true',
    });

    return data.map((coin) => ({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      image: coin.image,
      currentPrice: coin.current_price,
      marketCap: coin.market_cap,
      marketCapRank: coin.market_cap_rank,
      totalVolume: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      priceChange24h: coin.price_change_24h,
      priceChangePercentage24h: coin.price_change_percentage_24h,
      circulatingSupply: coin.circulating_supply,
      totalSupply: coin.total_supply,
      sparkline7d: coin.sparkline_in_7d?.price ?? null,
      fetchedAt: new Date(),
    }));
  } catch (error) {
    if (error instanceof CoinGeckoProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new CoinGeckoProviderError(
      `Failed to fetch top coins: ${message}`,
      '/coins/markets',
    );
  }
}

/**
 * Get currently trending coins on CoinGecko.
 */
export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const data = await fetchCoinGecko<TrendingResponse>('/search/trending');

    return data.coins.map((entry) => ({
      id: entry.item.id,
      coinId: entry.item.coin_id,
      name: entry.item.name,
      symbol: entry.item.symbol,
      marketCapRank: entry.item.market_cap_rank,
      thumb: entry.item.thumb,
      large: entry.item.large,
      score: entry.item.score,
      priceBtc: entry.item.price_btc,
    }));
  } catch (error) {
    if (error instanceof CoinGeckoProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new CoinGeckoProviderError(
      `Failed to fetch trending coins: ${message}`,
      '/search/trending',
    );
  }
}

// ── Error class ────────────────────────────────────────────────────────────

export class CoinGeckoProviderError extends Error {
  public readonly provider = 'coingecko' as const;
  public readonly endpoint: string;
  public readonly statusCode: number | null;

  constructor(message: string, endpoint: string, statusCode: number | null = null) {
    super(message);
    this.name = 'CoinGeckoProviderError';
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }
}
