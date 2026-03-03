/**
 * Value Scoring Dimension
 *
 * Calculates a value score (0-100) from fundamental valuation metrics.
 * Only meaningful for equities -- compares P/E, P/B, EV/EBITDA, and
 * dividend yield against sector benchmarks and absolute thresholds.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

export interface ValueInput {
  /** Price-to-Earnings ratio (null if unavailable or loss-making) */
  pe: number | null;
  /** Price-to-Book ratio (null if unavailable) */
  pb: number | null;
  /** Enterprise Value / EBITDA (null if unavailable) */
  evEbitda: number | null;
  /** Dividend yield in percentage (null if unavailable) */
  dividendYield: number | null;
  /** Sector median P/E for relative comparison */
  sectorMedianPE: number;
}

export interface ValueResult {
  /** Overall value score 0-100 */
  score: number;
  components: {
    peScore: number;
    pbScore: number;
    evEbitdaScore: number;
    dividendScore: number;
  };
}

/** Weight allocation for value sub-scores */
const WEIGHTS = {
  pe: 0.35,
  pb: 0.2,
  evEbitda: 0.25,
  dividend: 0.2,
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
 * Score P/E ratio relative to sector median.
 * Lower P/E relative to sector = higher value score.
 * Null or negative P/E (loss-making) defaults to 20.
 */
function scorePE(pe: number | null, sectorMedianPE: number): number {
  if (pe === null || pe <= 0) return 20;
  if (sectorMedianPE <= 0) return 50;

  const ratio = pe / sectorMedianPE;

  if (ratio < 0.7) return 90;
  if (ratio < 0.9) return 70;
  if (ratio < 1.1) return 50;
  if (ratio < 1.5) return 35;
  return 15;
}

/**
 * Score P/B ratio on absolute thresholds.
 * Lower P/B = higher value score (trading near or below book value).
 */
function scorePB(pb: number | null): number {
  if (pb === null) return 30;

  if (pb < 1) return 85;
  if (pb < 2) return 65;
  if (pb < 3) return 45;
  if (pb < 5) return 30;
  return 15;
}

/**
 * Score EV/EBITDA on absolute thresholds.
 * Lower EV/EBITDA = cheaper enterprise valuation.
 */
function scoreEvEbitda(evEbitda: number | null): number {
  if (evEbitda === null) return 30;

  if (evEbitda < 8) return 85;
  if (evEbitda < 12) return 65;
  if (evEbitda < 18) return 45;
  if (evEbitda < 25) return 30;
  return 15;
}

/**
 * Score dividend yield.
 * Higher yield = higher value score (income generation).
 */
function scoreDividend(dividendYield: number | null): number {
  if (dividendYield === null || dividendYield === 0) return 20;

  if (dividendYield > 5) return 85;
  if (dividendYield > 3) return 70;
  if (dividendYield > 2) return 55;
  if (dividendYield > 1) return 40;
  return 25;
}

/**
 * Calculate the overall value score from fundamental valuation metrics.
 *
 * @param input - Valuation ratios and sector comparison data
 * @returns ValueResult with score 0-100 and component details
 */
export function calculateValue(input: ValueInput): ValueResult {
  const { pe, pb, evEbitda, dividendYield, sectorMedianPE } = input;

  const peScore = scorePE(pe, sectorMedianPE);
  const pbScore = scorePB(pb);
  const evEbitdaScore = scoreEvEbitda(evEbitda);
  const dividendScore = scoreDividend(dividendYield);

  const overallScore = round2(
    peScore * WEIGHTS.pe +
    pbScore * WEIGHTS.pb +
    evEbitdaScore * WEIGHTS.evEbitda +
    dividendScore * WEIGHTS.dividend,
  );

  return {
    score: clamp(round2(overallScore), 0, 100),
    components: {
      peScore,
      pbScore,
      evEbitdaScore,
      dividendScore,
    },
  };
}
