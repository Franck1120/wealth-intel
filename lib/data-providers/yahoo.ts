/**
 * Yahoo Finance data provider
 * Wraps yahoo-finance2 package for stock/ETF/index data
 */

import YahooFinance from 'yahoo-finance2';

// Create instance -- v3 requires instantiation, no more static calls
const yahooFinance = new YahooFinance({ validation: { logErrors: false } });

// ── Types ──────────────────────────────────────────────────────────────────

export interface YahooQuote {
  symbol: string;
  shortName: string | null;
  longName: string | null;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  marketCap: number | null;
  currency: string;
  exchange: string;
  quoteType: string;
  fetchedAt: Date;
}

export interface HistoricalPrice {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export interface QuoteSummary {
  symbol: string;
  shortName: string | null;
  longName: string | null;
  sector: string | null;
  industry: string | null;
  currency: string;
  exchange: string;
  marketCap: number | null;
  enterpriseValue: number | null;
  trailingPE: number | null;
  forwardPE: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  eps: number | null;
  dividendYield: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;
  beta: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyDayAverage: number | null;
  twoHundredDayAverage: number | null;
  averageVolume: number | null;
  sharesOutstanding: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  profitMargin: number | null;
  returnOnEquity: number | null;
  debtToEquity: number | null;
  fetchedAt: Date;
}

export interface SymbolSearchResult {
  symbol: string;
  shortName: string | null;
  longName: string | null;
  exchange: string;
  quoteType: string;
  score: number;
}

type HistoricalPeriod = '1d' | '1w' | '1mo' | '3mo' | '6mo' | '1y' | '5y';

// ── Period mapping ─────────────────────────────────────────────────────────

const PERIOD_TO_RANGE: Record<HistoricalPeriod, { period1: Date; interval: '1d' | '1wk' | '1mo' }> = {
  '1d': {
    period1: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    interval: '1d',
  },
  '1w': {
    period1: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    interval: '1d',
  },
  '1mo': {
    period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    interval: '1d',
  },
  '3mo': {
    period1: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    interval: '1d',
  },
  '6mo': {
    period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    interval: '1wk',
  },
  '1y': {
    period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    interval: '1wk',
  },
  '5y': {
    period1: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
    interval: '1mo',
  },
};

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Get current quote data for a symbol.
 * Returns price, change, volume, market cap.
 */
export async function getQuote(symbol: string): Promise<YahooQuote> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.quote(symbol);

    return {
      symbol: result.symbol,
      shortName: result.shortName ?? null,
      longName: result.longName ?? null,
      regularMarketPrice: result.regularMarketPrice ?? 0,
      regularMarketChange: result.regularMarketChange ?? 0,
      regularMarketChangePercent: result.regularMarketChangePercent ?? 0,
      regularMarketVolume: result.regularMarketVolume ?? 0,
      marketCap: result.marketCap ?? null,
      currency: result.currency ?? 'USD',
      exchange: result.fullExchangeName ?? result.exchange ?? '',
      quoteType: result.quoteType ?? '',
      fetchedAt: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new YahooProviderError(`Failed to fetch quote for ${symbol}: ${message}`, symbol);
  }
}

/**
 * Get historical OHLCV price data for a symbol.
 */
export async function getHistoricalPrices(
  symbol: string,
  period: HistoricalPeriod = '3mo',
): Promise<HistoricalPrice[]> {
  try {
    const config = PERIOD_TO_RANGE[period];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.chart(symbol, {
      period1: config.period1,
      interval: config.interval,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (result.quotes ?? []).map((row: any) => ({
      date: row.date,
      open: row.open ?? 0,
      high: row.high ?? 0,
      low: row.low ?? 0,
      close: row.close ?? 0,
      adjClose: row.adjclose ?? row.close ?? 0,
      volume: row.volume ?? 0,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new YahooProviderError(
      `Failed to fetch historical prices for ${symbol}: ${message}`,
      symbol,
    );
  }
}

/**
 * Get detailed quote summary including fundamentals.
 * P/E, P/B, EPS, dividend yield, sector, industry, etc.
 */
export async function getQuoteSummary(symbol: string): Promise<QuoteSummary> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'summaryProfile',
        'summaryDetail',
        'defaultKeyStatistics',
        'financialData',
        'price',
      ],
    });

    const profile = result.summaryProfile;
    const detail = result.summaryDetail;
    const keyStats = result.defaultKeyStatistics;
    const financial = result.financialData;
    const price = result.price;

    return {
      symbol,
      shortName: price?.shortName ?? null,
      longName: price?.longName ?? null,
      sector: profile?.sector ?? null,
      industry: profile?.industry ?? null,
      currency: price?.currency ?? 'USD',
      exchange: price?.exchangeName ?? '',
      marketCap: price?.marketCap ?? null,
      enterpriseValue: keyStats?.enterpriseValue ?? null,
      trailingPE: detail?.trailingPE ?? null,
      forwardPE: keyStats?.forwardPE ?? null,
      priceToBook: keyStats?.priceToBook ?? null,
      priceToSales: keyStats?.priceToSalesTrailing12Months ?? null,
      eps: keyStats?.trailingEps ?? null,
      dividendYield: detail?.dividendYield ?? null,
      dividendRate: detail?.dividendRate ?? null,
      payoutRatio: detail?.payoutRatio ?? null,
      beta: keyStats?.beta ?? null,
      fiftyTwoWeekHigh: detail?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: detail?.fiftyTwoWeekLow ?? null,
      fiftyDayAverage: detail?.fiftyDayAverage ?? null,
      twoHundredDayAverage: detail?.twoHundredDayAverage ?? null,
      averageVolume: detail?.averageVolume ?? null,
      sharesOutstanding: keyStats?.sharesOutstanding ?? null,
      revenueGrowth: financial?.revenueGrowth ?? null,
      earningsGrowth: financial?.earningsGrowth ?? null,
      profitMargin: financial?.profitMargins ?? null,
      returnOnEquity: financial?.returnOnEquity ?? null,
      debtToEquity: financial?.debtToEquity ?? null,
      fetchedAt: new Date(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new YahooProviderError(
      `Failed to fetch quote summary for ${symbol}: ${message}`,
      symbol,
    );
  }
}

/**
 * Search for symbols matching a query string.
 */
export async function searchSymbol(query: string): Promise<SymbolSearchResult[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.search(query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (result.quotes ?? []).map((item: any) => ({
      symbol: item.symbol,
      shortName: item.shortname ?? null,
      longName: item.longname ?? null,
      exchange: item.exchDisp ?? item.exchange ?? '',
      quoteType: item.quoteType ?? '',
      score: item.score ?? 0,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new YahooProviderError(`Failed to search for "${query}": ${message}`, query);
  }
}

// ── Error class ────────────────────────────────────────────────────────────

export class YahooProviderError extends Error {
  public readonly provider = 'yahoo' as const;
  public readonly symbol: string;

  constructor(message: string, symbol: string) {
    super(message);
    this.name = 'YahooProviderError';
    this.symbol = symbol;
  }
}
