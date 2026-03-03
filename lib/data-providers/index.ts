/**
 * Unified data providers index
 * Re-exports all provider modules and defines shared types
 */

// ── Shared Types ───────────────────────────────────────────────────────────

export type DataSource = 'yahoo' | 'coingecko' | 'fred' | 'defillama' | 'fear_greed' | 'ecb';

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePct24h: number;
  volume: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
  source: DataSource;
  fetchedAt: Date;
}

export interface ProviderError {
  provider: DataSource;
  message: string;
  statusCode?: number;
}

// ── Re-exports: Yahoo Finance ──────────────────────────────────────────────

export {
  getQuote,
  getHistoricalPrices,
  getQuoteSummary,
  searchSymbol,
  YahooProviderError,
} from '@/lib/data-providers/yahoo';

export type {
  YahooQuote,
  HistoricalPrice,
  QuoteSummary,
  SymbolSearchResult,
} from '@/lib/data-providers/yahoo';

// ── Re-exports: CoinGecko ──────────────────────────────────────────────────

export {
  getCoinPrice,
  getCoinMarketData,
  getTopCoins,
  getTrendingCoins,
  CoinGeckoProviderError,
} from '@/lib/data-providers/coingecko';

export type {
  CoinPrice,
  CoinMarketData,
  TopCoin,
  TrendingCoin,
} from '@/lib/data-providers/coingecko';

// ── Re-exports: FRED ───────────────────────────────────────────────────────

export {
  getSeriesData,
  getLatestValue,
  getMultipleSeries,
  FRED_SERIES,
  FredProviderError,
} from '@/lib/data-providers/fred';

export type {
  FredSeriesId,
  FredObservation,
  FredSeriesData,
  FredLatestValue,
  FredMultiSeriesResult,
} from '@/lib/data-providers/fred';

// ── Re-exports: DeFi Llama ─────────────────────────────────────────────────

export {
  getProtocolTVL,
  getTopProtocols,
  getChainTVL,
  getYieldPools,
  DefiLlamaProviderError,
} from '@/lib/data-providers/defillama';

export type {
  ProtocolTVL,
  TopProtocol,
  ChainTVLData,
  ChainTVLHistoryPoint,
  YieldPool,
} from '@/lib/data-providers/defillama';

// ── Re-exports: Fear & Greed ───────────────────────────────────────────────

export {
  getCryptoFearGreed,
  getFearGreedHistory,
  FearGreedProviderError,
} from '@/lib/data-providers/fear-greed';

export type {
  FearGreedClassification,
  FearGreedValue,
  FearGreedCurrent,
  FearGreedHistory,
} from '@/lib/data-providers/fear-greed';

// ── Re-exports: ECB ────────────────────────────────────────────────────────

export {
  getExchangeRate,
  getHistoricalRates,
  getEuribor,
  EcbProviderError,
} from '@/lib/data-providers/ecb';

export type {
  ExchangeRate,
  HistoricalRate,
  HistoricalRatesData,
  EuriborRate,
  EuriborData,
} from '@/lib/data-providers/ecb';
