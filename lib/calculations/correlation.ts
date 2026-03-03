/**
 * Cross-Asset Correlation Matrix
 *
 * Pearson correlation, matrix construction, diversification analysis.
 * Pure TypeScript math — no external dependencies.
 */

export interface CorrelationEntry {
  assetA: string;
  assetB: string;
  /** Pearson correlation coefficient, range [-1, 1] */
  correlation: number;
}

export interface CorrelationMatrix {
  /** Ordered list of asset symbols */
  symbols: string[];
  /** Symmetric NxN matrix of correlation coefficients */
  matrix: number[][];
}

/**
 * Calculate the arithmetic mean of an array.
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate Pearson correlation coefficient between two return series.
 *
 * Formula:
 *   r = Σ((x_i - x̄)(y_i - ȳ)) / sqrt(Σ(x_i - x̄)² * Σ(y_i - ȳ)²)
 *
 * @param returnsA - Daily returns of asset A
 * @param returnsB - Daily returns of asset B (must be same length as returnsA)
 * @returns Correlation coefficient in range [-1, 1]. Returns 0 if inputs are invalid.
 */
export function calculateCorrelation(
  returnsA: number[],
  returnsB: number[]
): number {
  const n = Math.min(returnsA.length, returnsB.length);
  if (n < 2) return 0;

  const a = returnsA.slice(0, n);
  const b = returnsB.slice(0, n);

  const meanA = mean(a);
  const meanB = mean(b);

  let sumAB = 0; // Σ((x_i - x̄)(y_i - ȳ))
  let sumAA = 0; // Σ(x_i - x̄)²
  let sumBB = 0; // Σ(y_i - ȳ)²

  for (let i = 0; i < n; i++) {
    const diffA = a[i] - meanA;
    const diffB = b[i] - meanB;
    sumAB += diffA * diffB;
    sumAA += diffA * diffA;
    sumBB += diffB * diffB;
  }

  const denominator = Math.sqrt(sumAA * sumBB);

  if (denominator === 0) return 0;

  // Clamp to [-1, 1] to handle floating-point precision issues
  const r = sumAB / denominator;
  return Math.max(-1, Math.min(1, r));
}

/**
 * Build an NxN Pearson correlation matrix from multiple asset return series.
 *
 * All return arrays should be aligned to the same date range and have the same length.
 * If arrays differ in length, the minimum overlapping length is used per pair.
 *
 * @param assets - Array of objects with symbol and dailyReturns
 * @returns CorrelationMatrix with symbols list and symmetric NxN matrix
 */
export function buildCorrelationMatrix(
  assets: { symbol: string; dailyReturns: number[] }[]
): CorrelationMatrix {
  const n = assets.length;
  const symbols = assets.map((a) => a.symbol);

  // Initialize NxN matrix
  const matrix: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => 0)
  );

  for (let i = 0; i < n; i++) {
    // Diagonal is always 1 (perfect self-correlation)
    matrix[i][i] = 1;

    for (let j = i + 1; j < n; j++) {
      const corr = calculateCorrelation(
        assets[i].dailyReturns,
        assets[j].dailyReturns
      );
      matrix[i][j] = corr;
      matrix[j][i] = corr; // symmetric
    }
  }

  return { symbols, matrix };
}

/**
 * Find the top N most correlated asset pairs.
 *
 * Excludes self-correlation (diagonal). Sorts by absolute correlation
 * value descending, so both strong positive and strong negative correlations
 * appear first.
 *
 * @param matrix - Correlation matrix from buildCorrelationMatrix
 * @param limit - Maximum number of pairs to return (default 10)
 * @returns Array of CorrelationEntry sorted by |correlation| descending
 */
export function findTopCorrelations(
  matrix: CorrelationMatrix,
  limit: number = 10
): CorrelationEntry[] {
  const entries: CorrelationEntry[] = [];
  const n = matrix.symbols.length;

  // Only iterate upper triangle to avoid duplicates
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      entries.push({
        assetA: matrix.symbols[i],
        assetB: matrix.symbols[j],
        correlation: matrix.matrix[i][j],
      });
    }
  }

  // Sort by absolute correlation descending
  entries.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  return entries.slice(0, limit);
}

/**
 * Find asset pairs with the lowest (most negative) correlation.
 *
 * These pairs provide the best diversification benefit — when one goes up,
 * the other tends to go down.
 *
 * @param matrix - Correlation matrix from buildCorrelationMatrix
 * @param limit - Maximum number of pairs to return (default 5)
 * @returns Array of CorrelationEntry sorted by correlation ascending (most negative first)
 */
export function findDiversifiers(
  matrix: CorrelationMatrix,
  limit: number = 5
): CorrelationEntry[] {
  const entries: CorrelationEntry[] = [];
  const n = matrix.symbols.length;

  // Only iterate upper triangle to avoid duplicates
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      entries.push({
        assetA: matrix.symbols[i],
        assetB: matrix.symbols[j],
        correlation: matrix.matrix[i][j],
      });
    }
  }

  // Sort ascending — most negative correlations first
  entries.sort((a, b) => a.correlation - b.correlation);

  return entries.slice(0, limit);
}
