/**
 * Quality Scoring Dimension
 *
 * Calculates a quality score (0-100) from fundamental quality metrics.
 * Equities only -- measures profitability, leverage, cash flow, and liquidity.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

export interface QualityInput {
  /** Return on Equity in percentage (null if unavailable) */
  roe: number | null;
  /** Debt-to-Equity ratio (null if unavailable) */
  debtToEquity: number | null;
  /** Free Cash Flow margin in percentage (null if unavailable) */
  fcfMargin: number | null;
  /** Current ratio -- current assets / current liabilities (null if unavailable) */
  currentRatio: number | null;
}

export interface QualityResult {
  /** Overall quality score 0-100 */
  score: number;
  components: {
    roeScore: number;
    debtScore: number;
    fcfScore: number;
    liquidityScore: number;
  };
}

/** Weight allocation for quality sub-scores */
const WEIGHTS = {
  roe: 0.3,
  debt: 0.25,
  fcf: 0.3,
  liquidity: 0.15,
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
 * Score Return on Equity.
 * Higher ROE = better profitability and capital efficiency.
 */
function scoreROE(roe: number | null): number {
  if (roe === null) return 30;

  if (roe > 20) return 90;
  if (roe > 15) return 75;
  if (roe > 10) return 60;
  if (roe > 5) return 40;
  return 20;
}

/**
 * Score Debt-to-Equity ratio.
 * Lower D/E = less financial leverage risk (higher score = safer).
 */
function scoreDebt(debtToEquity: number | null): number {
  if (debtToEquity === null) return 30;

  if (debtToEquity < 0.3) return 90;
  if (debtToEquity < 0.7) return 75;
  if (debtToEquity < 1.0) return 55;
  if (debtToEquity < 2.0) return 35;
  return 15;
}

/**
 * Score Free Cash Flow margin.
 * Higher FCF margin = better cash generation ability.
 */
function scoreFCF(fcfMargin: number | null): number {
  if (fcfMargin === null) return 30;

  if (fcfMargin > 15) return 90;
  if (fcfMargin > 10) return 75;
  if (fcfMargin > 5) return 55;
  if (fcfMargin > 0) return 35;
  return 15;
}

/**
 * Score Current Ratio (liquidity).
 * Higher current ratio = better ability to meet short-term obligations.
 */
function scoreLiquidity(currentRatio: number | null): number {
  if (currentRatio === null) return 30;

  if (currentRatio > 2) return 85;
  if (currentRatio > 1.5) return 70;
  if (currentRatio > 1) return 50;
  if (currentRatio > 0.5) return 30;
  return 15;
}

/**
 * Calculate the overall quality score from fundamental quality metrics.
 *
 * @param input - Quality metrics (ROE, D/E, FCF margin, current ratio)
 * @returns QualityResult with score 0-100 and component details
 */
export function calculateQuality(input: QualityInput): QualityResult {
  const { roe, debtToEquity, fcfMargin, currentRatio } = input;

  const roeScore = scoreROE(roe);
  const debtScore = scoreDebt(debtToEquity);
  const fcfScore = scoreFCF(fcfMargin);
  const liquidityScore = scoreLiquidity(currentRatio);

  const overallScore = round2(
    roeScore * WEIGHTS.roe +
    debtScore * WEIGHTS.debt +
    fcfScore * WEIGHTS.fcf +
    liquidityScore * WEIGHTS.liquidity,
  );

  return {
    score: clamp(round2(overallScore), 0, 100),
    components: {
      roeScore,
      debtScore,
      fcfScore,
      liquidityScore,
    },
  };
}
