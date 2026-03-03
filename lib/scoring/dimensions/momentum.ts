/**
 * Momentum Scoring Dimension
 *
 * Calculates a momentum score (0-100) from price and volume data
 * using RSI-14, SMA 50/200 crossover, and 52-week range position.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

export interface MomentumInput {
  /** Daily close prices, most recent last */
  prices: number[];
  /** Daily volumes, aligned with prices */
  volumes: number[];
}

export interface MomentumResult {
  /** Overall momentum score 0-100 */
  score: number;
  components: {
    /** RSI 14-day (0-100, >70 overbought, <30 oversold) */
    rsi14: number;
    /** SMA 50/200 crossover signal (-1 to 1) */
    smaCrossover: number;
    /** Position in 52-week range (0-1) */
    priceVs52wRange: number;
  };
}

/** Minimum data points required for momentum calculation */
const MIN_PRICES_FOR_RSI = 15;
const RSI_PERIOD = 14;
const SMA_SHORT_PERIOD = 50;
const SMA_LONG_PERIOD = 200;
const TRADING_DAYS_PER_YEAR = 252;

/** Weight allocation for momentum sub-scores */
const WEIGHTS = {
  rsi: 0.4,
  sma: 0.35,
  range: 0.25,
} as const;

/**
 * Calculate Simple Moving Average for the last N periods.
 * Returns null if insufficient data.
 */
function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, p) => acc + p, 0);
  return sum / period;
}

/**
 * Calculate RSI using the standard smoothed (Wilder) method.
 * Returns null if insufficient data.
 */
function calculateRSI(prices: number[], period: number): number | null {
  if (prices.length < period + 1) return null;

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Initial average gain/loss from first `period` changes
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }
  avgGain /= period;
  avgLoss /= period;

  // Smooth with Wilder's method for remaining changes
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Map RSI value to a momentum score.
 *
 * RSI < 30: bullish (oversold) -- score high
 * RSI 30-50: mildly bullish
 * RSI 50-70: neutral to mildly bearish
 * RSI > 70: strong momentum but overbought -- moderate score
 */
function mapRSIToScore(rsi: number): number {
  if (rsi < 30) {
    return clamp(80 + (30 - rsi), 0, 100);
  } else if (rsi < 50) {
    return clamp(50 + (50 - rsi), 0, 100);
  } else if (rsi <= 70) {
    return clamp(70 - rsi + 30, 0, 100);
  } else {
    return clamp(40 + (100 - rsi) * 0.5, 0, 100);
  }
}

/**
 * Score the SMA 50/200 crossover.
 * Positive when SMA50 > SMA200 (golden cross territory).
 */
function scoreSMACrossover(sma50: number | null, sma200: number | null): { score: number; signal: number } {
  if (sma50 === null || sma200 === null || sma200 === 0) {
    return { score: 50, signal: 0 };
  }

  const percentDiff = ((sma50 - sma200) / sma200) * 100;
  // Signal normalized to -1..1 range
  const signal = clamp(percentDiff / 10, -1, 1);

  let score: number;
  if (percentDiff > 5) {
    score = 90;
  } else if (percentDiff > 2) {
    score = 75;
  } else if (percentDiff >= 0) {
    score = 60;
  } else if (percentDiff >= -2) {
    score = 40;
  } else if (percentDiff >= -5) {
    score = 25;
  } else {
    score = 10;
  }

  return { score, signal };
}

/**
 * Score the current price's position within the 52-week range.
 * Middle range (0.3-0.7) is considered healthiest.
 */
function scoreRangePosition(prices: number[]): { score: number; position: number } {
  const tradingDays52w = TRADING_DAYS_PER_YEAR;
  const relevantPrices = prices.slice(-tradingDays52w);

  if (relevantPrices.length < 2) {
    return { score: 50, position: 0.5 };
  }

  const high = Math.max(...relevantPrices);
  const low = Math.min(...relevantPrices);
  const current = relevantPrices[relevantPrices.length - 1];

  if (high === low) {
    return { score: 50, position: 0.5 };
  }

  const position = (current - low) / (high - low);

  let score: number;
  if (position >= 0.3 && position <= 0.7) {
    // Sweet spot: scale 70-90 within the 0.3-0.7 band
    const normalized = (position - 0.3) / 0.4;
    // Peak score at 0.5 (center), tapering toward edges
    const distFromCenter = Math.abs(normalized - 0.5) * 2; // 0 at center, 1 at edges
    score = 90 - distFromCenter * 20; // 90 at center, 70 at edges
  } else if (position < 0.2) {
    // Near 52-week low -- could be catching a falling knife
    score = 30 + position * 100; // 30 at 0, 50 at 0.2
  } else if (position < 0.3) {
    // Transition zone
    score = 50 + (position - 0.2) * 200; // 50 at 0.2, 70 at 0.3
  } else if (position <= 0.85) {
    // 0.7-0.85 transition zone
    score = 70 - (position - 0.7) * 200; // 70 at 0.7, 40 at 0.85 (scaled as 70 -> ~40)
    score = 70 - ((position - 0.7) / 0.15) * 30; // 70 at 0.7, 40 at 0.85
  } else {
    // Extended (>0.85) -- overbought territory
    score = 40 + (1 - position) * 133; // ~60 at 0.85, ~40 at 1.0
  }

  return { score: clamp(score, 0, 100), position };
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round to two decimal places.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate the overall momentum score from price and volume data.
 *
 * @param input - Daily close prices and volumes
 * @returns MomentumResult with score 0-100 and component details
 */
export function calculateMomentum(input: MomentumInput): MomentumResult {
  const { prices } = input;

  if (prices.length < MIN_PRICES_FOR_RSI) {
    return {
      score: 50,
      components: { rsi14: 50, smaCrossover: 0, priceVs52wRange: 0.5 },
    };
  }

  // RSI-14
  const rsiValue = calculateRSI(prices, RSI_PERIOD) ?? 50;
  const rsiScore = mapRSIToScore(rsiValue);

  // SMA 50/200 Crossover
  const sma50 = calculateSMA(prices, SMA_SHORT_PERIOD);
  const sma200 = calculateSMA(prices, SMA_LONG_PERIOD);
  const { score: smaScore, signal: smaCrossoverSignal } = scoreSMACrossover(sma50, sma200);

  // 52-week range position
  const { score: rangeScore, position: rangePosition } = scoreRangePosition(prices);

  const overallScore = round2(
    rsiScore * WEIGHTS.rsi + smaScore * WEIGHTS.sma + rangeScore * WEIGHTS.range,
  );

  return {
    score: clamp(round2(overallScore), 0, 100),
    components: {
      rsi14: round2(rsiValue),
      smaCrossover: round2(smaCrossoverSignal),
      priceVs52wRange: round2(rangePosition),
    },
  };
}
