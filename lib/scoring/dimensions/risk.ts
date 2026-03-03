/**
 * Risk Scoring Dimension
 *
 * Calculates a risk score (0-100) where HIGHER = LOWER risk (safer).
 * Uses annualized volatility, beta, and maximum drawdown.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

export interface RiskInput {
  /** Array of daily percentage returns (e.g., 0.02 = 2%) */
  dailyReturns: number[];
  /** Beta versus benchmark (null if unavailable) */
  beta: number | null;
  /** Maximum drawdown in past year as a negative number (e.g., -0.25 = -25%) (null if unavailable) */
  maxDrawdown1Y: number | null;
}

export interface RiskResult {
  /** Overall risk score 0-100 (higher = lower risk / safer) */
  score: number;
  components: {
    volatilityScore: number;
    betaScore: number;
    drawdownScore: number;
  };
}

/** Minimum daily returns required for volatility calculation */
const MIN_RETURNS_FOR_VOLATILITY = 10;
const VOLATILITY_LOOKBACK_DAYS = 30;
const TRADING_DAYS_PER_YEAR = 252;

/** Weight allocation for risk sub-scores */
const WEIGHTS = {
  volatility: 0.4,
  beta: 0.25,
  drawdown: 0.35,
} as const;

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
 * Calculate standard deviation of an array of numbers.
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

/**
 * Calculate 30-day annualized volatility from daily returns.
 * Annualized = daily_std * sqrt(252)
 */
function calculateAnnualizedVolatility(dailyReturns: number[]): number | null {
  const recent = dailyReturns.slice(-VOLATILITY_LOOKBACK_DAYS);
  if (recent.length < MIN_RETURNS_FOR_VOLATILITY) return null;

  const dailyStd = standardDeviation(recent);
  return dailyStd * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Score volatility (higher score = lower volatility = safer).
 * Annualized volatility thresholds as percentages (0.15 = 15%).
 */
function scoreVolatility(annualizedVol: number | null): number {
  if (annualizedVol === null) return 50;

  // Convert to percentage for threshold comparison
  const volPct = annualizedVol * 100;

  if (volPct < 15) return 90;
  if (volPct < 25) return 70;
  if (volPct < 40) return 50;
  if (volPct < 60) return 30;
  return 15;
}

/**
 * Score beta (higher score = closer to market or lower beta = safer).
 * Low beta assets are less volatile relative to the market.
 */
function scoreBeta(beta: number | null): number {
  if (beta === null) return 50;

  const absBeta = Math.abs(beta);

  if (absBeta < 0.5) return 80;
  if (absBeta >= 0.5 && absBeta < 0.8) return 55;
  if (absBeta >= 0.8 && absBeta <= 1.2) return 70;
  if (absBeta > 1.2 && absBeta <= 1.5) return 55;
  return 30;
}

/**
 * Score maximum drawdown (higher score = smaller drawdown = safer).
 * Drawdown is expressed as a negative number (e.g., -0.20 = -20%).
 */
function scoreDrawdown(maxDrawdown: number | null): number {
  if (maxDrawdown === null) return 40;

  // Convert to percentage for easier threshold comparison
  const drawdownPct = maxDrawdown * 100;

  if (drawdownPct > -10) return 85;
  if (drawdownPct > -20) return 65;
  if (drawdownPct > -35) return 45;
  if (drawdownPct > -50) return 25;
  return 10;
}

/**
 * Calculate the overall risk score from volatility, beta, and drawdown data.
 * Higher score = lower risk (safer investment).
 *
 * @param input - Risk metrics (daily returns, beta, max drawdown)
 * @returns RiskResult with score 0-100 and component details
 */
export function calculateRisk(input: RiskInput): RiskResult {
  const { dailyReturns, beta, maxDrawdown1Y } = input;

  const annualizedVol = calculateAnnualizedVolatility(dailyReturns);
  const volatilityScore = scoreVolatility(annualizedVol);
  const betaScore = scoreBeta(beta);
  const drawdownScore = scoreDrawdown(maxDrawdown1Y);

  const overallScore = round2(
    volatilityScore * WEIGHTS.volatility +
    betaScore * WEIGHTS.beta +
    drawdownScore * WEIGHTS.drawdown,
  );

  return {
    score: clamp(round2(overallScore), 0, 100),
    components: {
      volatilityScore,
      betaScore,
      drawdownScore,
    },
  };
}
