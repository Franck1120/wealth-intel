/**
 * Growth Scoring Dimension
 *
 * Calculates a growth score (0-100) from revenue and earnings growth rates.
 * Measures year-over-year growth and 3-year CAGR for consistency.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

export interface GrowthInput {
  /** Revenue growth year-over-year in percentage (null if unavailable) */
  revenueGrowthYoY: number | null;
  /** Earnings growth year-over-year in percentage (null if unavailable) */
  earningsGrowthYoY: number | null;
  /** Revenue CAGR over 3 years in percentage (null if unavailable) */
  revenueGrowth3Y: number | null;
}

export interface GrowthResult {
  /** Overall growth score 0-100 */
  score: number;
  components: {
    revenueGrowthScore: number;
    earningsGrowthScore: number;
    consistencyScore: number;
  };
}

/** Weight allocation for growth sub-scores */
const WEIGHTS = {
  revenue: 0.4,
  earnings: 0.35,
  consistency: 0.25,
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
 * Score revenue growth year-over-year.
 * Higher revenue growth = higher score.
 */
function scoreRevenueGrowth(growth: number | null): number {
  if (growth === null) return 30;

  if (growth > 30) return 90;
  if (growth > 20) return 75;
  if (growth > 10) return 60;
  if (growth > 5) return 45;
  if (growth > 0) return 30;
  return 15;
}

/**
 * Score earnings growth year-over-year.
 * Higher earnings growth = higher score, with higher thresholds
 * since earnings are more volatile than revenue.
 */
function scoreEarningsGrowth(growth: number | null): number {
  if (growth === null) return 30;

  if (growth > 40) return 90;
  if (growth > 25) return 75;
  if (growth > 15) return 60;
  if (growth > 5) return 45;
  if (growth > 0) return 30;
  return 15;
}

/**
 * Score revenue growth consistency via 3-year CAGR.
 * Sustained growth over multiple years is more valuable than one-year spikes.
 */
function scoreConsistency(cagr3Y: number | null): number {
  if (cagr3Y === null) return 30;

  if (cagr3Y > 25) return 90;
  if (cagr3Y > 15) return 75;
  if (cagr3Y > 10) return 60;
  if (cagr3Y > 5) return 45;
  if (cagr3Y > 0) return 30;
  return 15;
}

/**
 * Calculate the overall growth score from revenue and earnings growth data.
 *
 * @param input - Growth metrics (revenue YoY, earnings YoY, 3Y CAGR)
 * @returns GrowthResult with score 0-100 and component details
 */
export function calculateGrowth(input: GrowthInput): GrowthResult {
  const { revenueGrowthYoY, earningsGrowthYoY, revenueGrowth3Y } = input;

  const revenueGrowthScore = scoreRevenueGrowth(revenueGrowthYoY);
  const earningsGrowthScore = scoreEarningsGrowth(earningsGrowthYoY);
  const consistencyScore = scoreConsistency(revenueGrowth3Y);

  const overallScore = round2(
    revenueGrowthScore * WEIGHTS.revenue +
    earningsGrowthScore * WEIGHTS.earnings +
    consistencyScore * WEIGHTS.consistency,
  );

  return {
    score: clamp(round2(overallScore), 0, 100),
    components: {
      revenueGrowthScore,
      earningsGrowthScore,
      consistencyScore,
    },
  };
}
