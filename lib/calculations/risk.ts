/**
 * Risk Metrics Calculations
 *
 * Volatility, Sharpe, Sortino, Max Drawdown, Beta, VaR, Calmar.
 * Pure TypeScript math — no external dependencies.
 */

export interface RiskMetrics {
  /** Annualized 30-day volatility */
  volatility30d: number;
  /** Annualized 90-day volatility */
  volatility90d: number;
  /** Sharpe ratio: (return - risk_free) / volatility */
  sharpeRatio: number;
  /** Sortino ratio: (return - risk_free) / downside_deviation */
  sortinoRatio: number;
  /** Maximum peak-to-trough decline (negative number) */
  maxDrawdown: number;
  /** Duration of maximum drawdown in calendar days */
  maxDrawdownDuration: number;
  /** Beta vs benchmark */
  beta: number;
  /** Calmar ratio: annualized return / |max drawdown| */
  calmarRatio: number;
  /** Value at Risk 95% confidence, 1-day horizon */
  var95: number;
}

/** Trading days per year for annualization */
const TRADING_DAYS_PER_YEAR = 252;

/**
 * Calculate the arithmetic mean of an array of numbers.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate sample standard deviation.
 *
 * Uses Bessel's correction (N-1 denominator) for unbiased estimation.
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const sumSquaredDiffs = values.reduce(
    (sum, v) => sum + (v - avg) ** 2,
    0
  );
  return Math.sqrt(sumSquaredDiffs / (values.length - 1));
}

/**
 * Convert an array of prices to an array of simple daily returns.
 *
 * @param prices - Array of daily closing prices (chronological order)
 * @returns Array of daily returns (length = prices.length - 1)
 */
export function pricesToReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] === 0) {
      returns.push(0);
    } else {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
  }
  return returns;
}

/**
 * Calculate annualized volatility from daily returns.
 *
 * Formula: σ_daily * √252
 *
 * @param dailyReturns - Array of daily returns as decimals
 * @returns Annualized volatility as decimal (e.g., 0.20 = 20%)
 */
export function calculateVolatility(dailyReturns: number[]): number {
  if (dailyReturns.length < 2) return 0;
  const dailyStdDev = standardDeviation(dailyReturns);
  return dailyStdDev * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculate Sharpe Ratio.
 *
 * Measures excess return per unit of total risk.
 * Formula: (R_p - R_f) / σ_p
 *
 * @param annualizedReturn - Portfolio annualized return as decimal
 * @param annualizedVolatility - Portfolio annualized volatility as decimal
 * @param riskFreeRate - Risk-free rate as decimal (default 4% ECB rate)
 * @returns Sharpe ratio (dimensionless)
 */
export function calculateSharpeRatio(
  annualizedReturn: number,
  annualizedVolatility: number,
  riskFreeRate: number = 0.04
): number {
  if (annualizedVolatility === 0) return 0;
  return (annualizedReturn - riskFreeRate) / annualizedVolatility;
}

/**
 * Calculate Sortino Ratio.
 *
 * Like Sharpe but penalizes only downside volatility.
 * Formula: (R_p - R_f) / σ_downside
 *
 * @param annualizedReturn - Portfolio annualized return as decimal
 * @param dailyReturns - Array of daily returns as decimals
 * @param riskFreeRate - Risk-free rate as decimal (default 4% ECB rate)
 * @returns Sortino ratio (dimensionless)
 */
export function calculateSortinoRatio(
  annualizedReturn: number,
  dailyReturns: number[],
  riskFreeRate: number = 0.04
): number {
  if (dailyReturns.length < 2) return 0;

  // Daily target return (risk-free rate converted to daily)
  const dailyTarget = riskFreeRate / TRADING_DAYS_PER_YEAR;

  // Downside returns: only returns below the target
  const downsideReturns = dailyReturns.filter((r) => r < dailyTarget);

  if (downsideReturns.length === 0) {
    // No downside — infinite Sortino (return large number)
    return annualizedReturn > riskFreeRate ? Infinity : 0;
  }

  // Downside deviation: sqrt(mean of squared negative deviations)
  // Use all returns but zero out positive deviations
  const sumSquaredDownside = dailyReturns.reduce((sum, r) => {
    const diff = Math.min(r - dailyTarget, 0);
    return sum + diff ** 2;
  }, 0);

  const downsideDeviation = Math.sqrt(
    (sumSquaredDownside / dailyReturns.length) * TRADING_DAYS_PER_YEAR
  );

  if (downsideDeviation === 0) return 0;

  return (annualizedReturn - riskFreeRate) / downsideDeviation;
}

/**
 * Calculate Maximum Drawdown and its duration.
 *
 * Finds the largest peak-to-trough decline in the price series.
 *
 * @param prices - Array of daily closing prices (chronological order)
 * @returns Object with maxDrawdown (negative decimal), peak/trough indices, and duration
 */
export function calculateMaxDrawdown(prices: number[]): {
  maxDrawdown: number;
  peakIndex: number;
  troughIndex: number;
  durationDays: number;
} {
  if (prices.length < 2) {
    return { maxDrawdown: 0, peakIndex: 0, troughIndex: 0, durationDays: 0 };
  }

  let maxDrawdown = 0;
  let peakIndex = 0;
  let troughIndex = 0;
  let runningPeakIndex = 0;
  let runningPeak = prices[0];

  for (let i = 1; i < prices.length; i++) {
    // Update running peak
    if (prices[i] > runningPeak) {
      runningPeak = prices[i];
      runningPeakIndex = i;
    }

    // Calculate drawdown from running peak
    const drawdown =
      runningPeak === 0 ? 0 : (prices[i] - runningPeak) / runningPeak;

    // Check if this is the worst drawdown
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      peakIndex = runningPeakIndex;
      troughIndex = i;
    }
  }

  // Duration is the number of days from peak to trough
  const durationDays = troughIndex - peakIndex;

  return { maxDrawdown, peakIndex, troughIndex, durationDays };
}

/**
 * Calculate Beta of an asset vs a benchmark.
 *
 * Beta measures systematic risk relative to the market.
 * Formula: Cov(R_asset, R_benchmark) / Var(R_benchmark)
 *
 * @param assetReturns - Daily returns of the asset
 * @param benchmarkReturns - Daily returns of the benchmark
 * @returns Beta coefficient. 1.0 = moves with market, >1 = more volatile, <1 = less volatile
 */
export function calculateBeta(
  assetReturns: number[],
  benchmarkReturns: number[]
): number {
  const n = Math.min(assetReturns.length, benchmarkReturns.length);
  if (n < 2) return 1; // default beta

  const assetSlice = assetReturns.slice(0, n);
  const benchSlice = benchmarkReturns.slice(0, n);

  const assetMean = mean(assetSlice);
  const benchMean = mean(benchSlice);

  let covariance = 0;
  let benchVariance = 0;

  for (let i = 0; i < n; i++) {
    const assetDiff = assetSlice[i] - assetMean;
    const benchDiff = benchSlice[i] - benchMean;
    covariance += assetDiff * benchDiff;
    benchVariance += benchDiff ** 2;
  }

  // Sample covariance and variance (N-1 denominator)
  covariance /= n - 1;
  benchVariance /= n - 1;

  if (benchVariance === 0) return 1; // benchmark has no variance

  return covariance / benchVariance;
}

/**
 * Calculate Historical Value at Risk at 95% confidence level.
 *
 * VaR95 answers: "What is the worst expected 1-day loss at 95% confidence?"
 *
 * @param dailyReturns - Array of daily returns as decimals
 * @returns VaR95 as a negative decimal (e.g., -0.02 = 2% loss)
 */
export function calculateVaR95(dailyReturns: number[]): number {
  if (dailyReturns.length === 0) return 0;

  // Sort returns ascending (worst first)
  const sorted = [...dailyReturns].sort((a, b) => a - b);

  // 5th percentile index (linear interpolation)
  const percentileIndex = 0.05 * (sorted.length - 1);
  const lowerIndex = Math.floor(percentileIndex);
  const upperIndex = Math.ceil(percentileIndex);
  const fraction = percentileIndex - lowerIndex;

  if (lowerIndex === upperIndex) {
    return sorted[lowerIndex];
  }

  // Linear interpolation between the two closest values
  return sorted[lowerIndex] + fraction * (sorted[upperIndex] - sorted[lowerIndex]);
}

/**
 * Calculate all risk metrics from daily price series.
 *
 * Orchestrates all individual calculations into a single RiskMetrics object.
 *
 * @param dailyPrices - Array of daily closing prices (chronological, at least 31 entries)
 * @param benchmarkPrices - Array of benchmark daily closing prices (same period)
 * @param riskFreeRate - Annual risk-free rate as decimal (default 4%)
 * @returns Complete RiskMetrics object
 */
export function calculateAllRiskMetrics(
  dailyPrices: number[],
  benchmarkPrices: number[],
  riskFreeRate: number = 0.04
): RiskMetrics {
  const allReturns = pricesToReturns(dailyPrices);
  const benchmarkReturns = pricesToReturns(benchmarkPrices);

  // 30-day and 90-day volatility (use last N days of returns)
  const returns30d = allReturns.slice(-30);
  const returns90d = allReturns.slice(-90);

  const volatility30d = calculateVolatility(returns30d);
  const volatility90d = calculateVolatility(returns90d);

  // Annualized return from the full price series
  const totalReturn =
    dailyPrices.length >= 2 && dailyPrices[0] !== 0
      ? (dailyPrices[dailyPrices.length - 1] - dailyPrices[0]) /
        dailyPrices[0]
      : 0;
  const tradingDays = allReturns.length || 1;
  const years = tradingDays / TRADING_DAYS_PER_YEAR;
  const annualizedReturn =
    years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : totalReturn;

  // Full-period volatility for Sharpe/Sortino
  const fullVolatility = calculateVolatility(allReturns);

  // Sharpe and Sortino
  const sharpeRatio = calculateSharpeRatio(
    annualizedReturn,
    fullVolatility,
    riskFreeRate
  );
  const sortinoRatio = calculateSortinoRatio(
    annualizedReturn,
    allReturns,
    riskFreeRate
  );

  // Max Drawdown
  const drawdownResult = calculateMaxDrawdown(dailyPrices);

  // Beta
  const beta = calculateBeta(allReturns, benchmarkReturns);

  // Calmar Ratio: annualized return / |max drawdown|
  const calmarRatio =
    drawdownResult.maxDrawdown === 0
      ? 0
      : annualizedReturn / Math.abs(drawdownResult.maxDrawdown);

  // VaR 95%
  const var95 = calculateVaR95(allReturns);

  return {
    volatility30d,
    volatility90d,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown: drawdownResult.maxDrawdown,
    maxDrawdownDuration: drawdownResult.durationDays,
    beta,
    calmarRatio,
    var95,
  };
}
