import { describe, it, expect } from 'vitest';
import {
  calculateCorrelation,
  buildCorrelationMatrix,
  findTopCorrelations,
  findDiversifiers,
} from '@/lib/calculations/correlation';

// ---------------------------------------------------------------------------
// calculateCorrelation
// ---------------------------------------------------------------------------

describe('calculateCorrelation', () => {
  it('returns 0 for fewer than 2 data points', () => {
    expect(calculateCorrelation([], [])).toBe(0);
    expect(calculateCorrelation([1], [2])).toBe(0);
  });

  it('returns 1.0 for perfect positive correlation', () => {
    const a = [1, 2, 3, 4, 5];
    const b = [10, 20, 30, 40, 50];
    expect(calculateCorrelation(a, b)).toBeCloseTo(1.0, 10);
  });

  it('returns -1.0 for perfect negative correlation', () => {
    const a = [1, 2, 3, 4, 5];
    const b = [50, 40, 30, 20, 10];
    expect(calculateCorrelation(a, b)).toBeCloseTo(-1.0, 10);
  });

  it('returns ~0 for uncorrelated data', () => {
    // Orthogonal pattern
    const a = [1, -1, 1, -1, 1, -1, 1, -1];
    const b = [1, 1, -1, -1, 1, 1, -1, -1];
    expect(Math.abs(calculateCorrelation(a, b))).toBeLessThan(0.1);
  });

  it('returns 1.0 for identical series (self-correlation)', () => {
    const a = [0.01, -0.02, 0.03, -0.01, 0.005];
    expect(calculateCorrelation(a, a)).toBeCloseTo(1.0, 10);
  });

  it('handles constant series (zero variance) by returning 0', () => {
    const a = [5, 5, 5, 5, 5];
    const b = [1, 2, 3, 4, 5];
    expect(calculateCorrelation(a, b)).toBe(0);
  });

  it('handles both constant series by returning 0', () => {
    const a = [3, 3, 3, 3];
    const b = [7, 7, 7, 7];
    expect(calculateCorrelation(a, b)).toBe(0);
  });

  it('uses minimum length when arrays differ in size', () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    const b = [10, 20, 30]; // only 3 elements
    const result = calculateCorrelation(a, b);
    // Should compute correlation on first 3 elements of each
    expect(result).toBeCloseTo(1.0, 10); // [1,2,3] vs [10,20,30] = perfect
  });

  it('returns value in range [-1, 1] for arbitrary data', () => {
    const a = [0.05, -0.03, 0.02, -0.04, 0.01, 0.06, -0.02, 0.03];
    const b = [0.01, 0.04, -0.01, 0.02, -0.03, 0.05, 0.01, -0.02];
    const corr = calculateCorrelation(a, b);
    expect(corr).toBeGreaterThanOrEqual(-1);
    expect(corr).toBeLessThanOrEqual(1);
  });

  it('is symmetric: corr(A, B) = corr(B, A)', () => {
    const a = [0.01, -0.02, 0.03, -0.01, 0.005];
    const b = [0.02, 0.01, -0.01, 0.03, -0.02];
    expect(calculateCorrelation(a, b)).toBeCloseTo(
      calculateCorrelation(b, a),
      10
    );
  });
});

// ---------------------------------------------------------------------------
// buildCorrelationMatrix
// ---------------------------------------------------------------------------

describe('buildCorrelationMatrix', () => {
  it('returns empty matrix for no assets', () => {
    const result = buildCorrelationMatrix([]);
    expect(result.symbols).toEqual([]);
    expect(result.matrix).toEqual([]);
  });

  it('returns 1x1 matrix with 1 on diagonal for single asset', () => {
    const result = buildCorrelationMatrix([
      { symbol: 'AAPL', dailyReturns: [0.01, -0.02, 0.03] },
    ]);
    expect(result.symbols).toEqual(['AAPL']);
    expect(result.matrix).toEqual([[1]]);
  });

  it('builds symmetric NxN matrix with 1s on diagonal', () => {
    const assets = [
      { symbol: 'AAPL', dailyReturns: [0.01, -0.02, 0.03, -0.01, 0.005] },
      { symbol: 'MSFT', dailyReturns: [0.005, -0.01, 0.02, -0.005, 0.01] },
      { symbol: 'GOOG', dailyReturns: [0.02, -0.03, 0.01, -0.02, 0.015] },
    ];

    const result = buildCorrelationMatrix(assets);

    expect(result.symbols).toEqual(['AAPL', 'MSFT', 'GOOG']);
    expect(result.matrix).toHaveLength(3);

    // Diagonal is 1
    for (let i = 0; i < 3; i++) {
      expect(result.matrix[i][i]).toBe(1);
    }

    // Symmetric: matrix[i][j] = matrix[j][i]
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(result.matrix[i][j]).toBeCloseTo(result.matrix[j][i], 10);
      }
    }
  });

  it('produces perfect correlation for identical return series', () => {
    const returns = [0.01, -0.02, 0.03, -0.01];
    const assets = [
      { symbol: 'A', dailyReturns: returns },
      { symbol: 'B', dailyReturns: [...returns] },
    ];

    const result = buildCorrelationMatrix(assets);
    expect(result.matrix[0][1]).toBeCloseTo(1.0, 10);
    expect(result.matrix[1][0]).toBeCloseTo(1.0, 10);
  });

  it('produces -1 correlation for perfectly inverse series', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.005];
    const assets = [
      { symbol: 'A', dailyReturns: returns },
      { symbol: 'B', dailyReturns: returns.map((r) => -r) },
    ];

    const result = buildCorrelationMatrix(assets);
    expect(result.matrix[0][1]).toBeCloseTo(-1.0, 10);
  });

  it('all values in matrix are in range [-1, 1]', () => {
    const assets = [
      { symbol: 'A', dailyReturns: [0.05, -0.03, 0.02, -0.04, 0.01] },
      { symbol: 'B', dailyReturns: [0.01, 0.04, -0.01, 0.02, -0.03] },
      { symbol: 'C', dailyReturns: [-0.02, 0.01, 0.03, -0.05, 0.04] },
    ];

    const result = buildCorrelationMatrix(assets);

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        expect(result.matrix[i][j]).toBeGreaterThanOrEqual(-1);
        expect(result.matrix[i][j]).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// findTopCorrelations
// ---------------------------------------------------------------------------

describe('findTopCorrelations', () => {
  const assets = [
    { symbol: 'A', dailyReturns: [0.01, -0.02, 0.03, -0.01, 0.005] },
    { symbol: 'B', dailyReturns: [0.01, -0.02, 0.03, -0.01, 0.005] }, // identical to A
    { symbol: 'C', dailyReturns: [-0.01, 0.02, -0.03, 0.01, -0.005] }, // inverse of A
    { symbol: 'D', dailyReturns: [0.005, 0.005, -0.01, 0.01, -0.005] }, // different
  ];

  const matrix = buildCorrelationMatrix(assets);

  it('returns pairs sorted by absolute correlation descending', () => {
    const top = findTopCorrelations(matrix);

    // First entry should have highest |correlation|
    for (let i = 1; i < top.length; i++) {
      expect(Math.abs(top[i - 1].correlation)).toBeGreaterThanOrEqual(
        Math.abs(top[i].correlation)
      );
    }
  });

  it('includes both perfect positive and perfect negative correlations at top', () => {
    const top = findTopCorrelations(matrix, 2);
    // A-B should be ~1.0, A-C should be ~-1.0 — both have |corr| = 1
    expect(top).toHaveLength(2);
    expect(Math.abs(top[0].correlation)).toBeCloseTo(1.0, 5);
    expect(Math.abs(top[1].correlation)).toBeCloseTo(1.0, 5);
  });

  it('respects the limit parameter', () => {
    const top = findTopCorrelations(matrix, 3);
    expect(top.length).toBeLessThanOrEqual(3);
  });

  it('excludes self-correlations (diagonal)', () => {
    const top = findTopCorrelations(matrix, 100);
    for (const entry of top) {
      expect(entry.assetA).not.toBe(entry.assetB);
    }
  });

  it('returns all pairs when limit exceeds pair count', () => {
    // 4 assets => 6 unique pairs (4 choose 2)
    const top = findTopCorrelations(matrix, 100);
    expect(top).toHaveLength(6);
  });

  it('returns empty array for single-asset matrix', () => {
    const singleMatrix = buildCorrelationMatrix([
      { symbol: 'A', dailyReturns: [0.01, -0.02, 0.03] },
    ]);
    expect(findTopCorrelations(singleMatrix)).toEqual([]);
  });

  it('returns empty array for empty matrix', () => {
    const emptyMatrix = buildCorrelationMatrix([]);
    expect(findTopCorrelations(emptyMatrix)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findDiversifiers
// ---------------------------------------------------------------------------

describe('findDiversifiers', () => {
  const assets = [
    { symbol: 'A', dailyReturns: [0.01, -0.02, 0.03, -0.01, 0.005] },
    { symbol: 'B', dailyReturns: [0.01, -0.02, 0.03, -0.01, 0.005] }, // same as A
    { symbol: 'C', dailyReturns: [-0.01, 0.02, -0.03, 0.01, -0.005] }, // inverse of A
    { symbol: 'D', dailyReturns: [0.003, 0.001, -0.002, 0.004, -0.001] }, // weakly correlated
  ];

  const matrix = buildCorrelationMatrix(assets);

  it('returns pairs sorted by correlation ascending (most negative first)', () => {
    const diversifiers = findDiversifiers(matrix);

    for (let i = 1; i < diversifiers.length; i++) {
      expect(diversifiers[i - 1].correlation).toBeLessThanOrEqual(
        diversifiers[i].correlation
      );
    }
  });

  it('places perfectly inversely correlated pair first', () => {
    const diversifiers = findDiversifiers(matrix, 1);
    expect(diversifiers).toHaveLength(1);
    expect(diversifiers[0].correlation).toBeCloseTo(-1.0, 5);
  });

  it('respects the limit parameter', () => {
    const diversifiers = findDiversifiers(matrix, 2);
    expect(diversifiers.length).toBeLessThanOrEqual(2);
  });

  it('returns empty for single-asset matrix', () => {
    const singleMatrix = buildCorrelationMatrix([
      { symbol: 'X', dailyReturns: [0.01, -0.02, 0.03] },
    ]);
    expect(findDiversifiers(singleMatrix)).toEqual([]);
  });

  it('returns empty for empty matrix', () => {
    const emptyMatrix = buildCorrelationMatrix([]);
    expect(findDiversifiers(emptyMatrix)).toEqual([]);
  });

  it('does not include self-correlations', () => {
    const diversifiers = findDiversifiers(matrix, 100);
    for (const entry of diversifiers) {
      expect(entry.assetA).not.toBe(entry.assetB);
    }
  });

  it('default limit is 5', () => {
    // 4 assets = 6 pairs, default limit 5
    const diversifiers = findDiversifiers(matrix);
    expect(diversifiers.length).toBeLessThanOrEqual(5);
  });

  it('identifies best diversification opportunity', () => {
    // Asset C is the inverse of A, so pairs involving C should appear first
    const diversifiers = findDiversifiers(matrix, 3);
    const firstPair = diversifiers[0];
    const pairAssets = [firstPair.assetA, firstPair.assetB].sort();
    // Should involve C paired with A or B (which are identical)
    expect(pairAssets).toContain('C');
  });
});
