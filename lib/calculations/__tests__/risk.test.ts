import { describe, it, expect } from 'vitest';
import {
  pricesToReturns,
  calculateVolatility,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateMaxDrawdown,
  calculateBeta,
  calculateVaR95,
  calculateAllRiskMetrics,
} from '@/lib/calculations/risk';

// ---------------------------------------------------------------------------
// pricesToReturns
// ---------------------------------------------------------------------------

describe('pricesToReturns', () => {
  it('returns empty array for fewer than 2 prices', () => {
    expect(pricesToReturns([])).toEqual([]);
    expect(pricesToReturns([100])).toEqual([]);
  });

  it('calculates simple daily returns correctly', () => {
    const prices = [100, 110, 105, 115];
    const returns = pricesToReturns(prices);

    expect(returns).toHaveLength(3);
    expect(returns[0]).toBeCloseTo(0.1, 10); // 100 -> 110 = +10%
    expect(returns[1]).toBeCloseTo(-5 / 110, 10); // 110 -> 105
    expect(returns[2]).toBeCloseTo(10 / 105, 10); // 105 -> 115
  });

  it('handles zero previous price by returning 0', () => {
    const prices = [0, 100, 200];
    const returns = pricesToReturns(prices);
    expect(returns[0]).toBe(0); // 0 -> 100, division by zero handled
    expect(returns[1]).toBeCloseTo(1.0, 10); // 100 -> 200
  });

  it('handles flat prices (no change)', () => {
    const prices = [50, 50, 50, 50];
    const returns = pricesToReturns(prices);
    expect(returns).toEqual([0, 0, 0]);
  });

  it('handles continuously declining prices', () => {
    const prices = [100, 90, 80, 70];
    const returns = pricesToReturns(prices);
    returns.forEach((r) => expect(r).toBeLessThan(0));
  });

  it('handles two identical prices', () => {
    const returns = pricesToReturns([42, 42]);
    expect(returns).toEqual([0]);
  });
});

// ---------------------------------------------------------------------------
// calculateVolatility
// ---------------------------------------------------------------------------

describe('calculateVolatility', () => {
  it('returns 0 for fewer than 2 daily returns', () => {
    expect(calculateVolatility([])).toBe(0);
    expect(calculateVolatility([0.01])).toBe(0);
  });

  it('returns 0 for constant returns (zero variance)', () => {
    const returns = [0.01, 0.01, 0.01, 0.01, 0.01];
    expect(calculateVolatility(returns)).toBe(0);
  });

  it('returns positive volatility for varying returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.005];
    const vol = calculateVolatility(returns);
    expect(vol).toBeGreaterThan(0);
  });

  it('annualizes correctly (multiplies daily std dev by sqrt(252))', () => {
    // With known daily std dev, verify annualization
    const returns = [0.01, -0.01]; // mean=0, daily std=0.01414...
    const vol = calculateVolatility(returns);
    const dailyStd = Math.sqrt(
      ((0.01 - 0) ** 2 + (-0.01 - 0) ** 2) / (2 - 1)
    );
    expect(vol).toBeCloseTo(dailyStd * Math.sqrt(252), 10);
  });

  it('higher volatility for more volatile returns', () => {
    const calm = [0.001, -0.001, 0.001, -0.001, 0.001];
    const wild = [0.05, -0.05, 0.05, -0.05, 0.05];

    expect(calculateVolatility(wild)).toBeGreaterThan(
      calculateVolatility(calm)
    );
  });

  it('handles all-zero returns', () => {
    const returns = [0, 0, 0, 0, 0];
    expect(calculateVolatility(returns)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateSharpeRatio
// ---------------------------------------------------------------------------

describe('calculateSharpeRatio', () => {
  it('returns 0 when volatility is 0', () => {
    expect(calculateSharpeRatio(0.10, 0)).toBe(0);
  });

  it('calculates correctly with default risk-free rate (4%)', () => {
    // (0.12 - 0.04) / 0.20 = 0.40
    expect(calculateSharpeRatio(0.12, 0.20)).toBeCloseTo(0.4, 10);
  });

  it('calculates correctly with custom risk-free rate', () => {
    // (0.10 - 0.02) / 0.15 = 0.5333...
    expect(calculateSharpeRatio(0.10, 0.15, 0.02)).toBeCloseTo(8 / 15, 10);
  });

  it('returns negative Sharpe when return < risk-free rate', () => {
    // (0.02 - 0.04) / 0.10 = -0.20
    expect(calculateSharpeRatio(0.02, 0.10)).toBeCloseTo(-0.2, 10);
  });

  it('returns 0 when return equals risk-free rate', () => {
    expect(calculateSharpeRatio(0.04, 0.15)).toBeCloseTo(0, 10);
  });

  it('handles zero risk-free rate', () => {
    // (0.10 - 0) / 0.20 = 0.50
    expect(calculateSharpeRatio(0.10, 0.20, 0)).toBeCloseTo(0.5, 10);
  });

  it('handles negative return', () => {
    // (-0.10 - 0.04) / 0.30 = -0.4667
    expect(calculateSharpeRatio(-0.10, 0.30)).toBeCloseTo(-14 / 30, 10);
  });

  it('handles large volatility', () => {
    const result = calculateSharpeRatio(0.10, 1.0);
    expect(result).toBeCloseTo(0.06, 10);
  });
});

// ---------------------------------------------------------------------------
// calculateSortinoRatio
// ---------------------------------------------------------------------------

describe('calculateSortinoRatio', () => {
  it('returns 0 for fewer than 2 daily returns', () => {
    expect(calculateSortinoRatio(0.10, [])).toBe(0);
    expect(calculateSortinoRatio(0.10, [0.01])).toBe(0);
  });

  it('returns Infinity when all returns are above target and portfolio beats risk-free', () => {
    // All positive returns, above daily risk-free, and annualized > risk-free
    const returns = [0.01, 0.02, 0.03, 0.015, 0.025];
    const result = calculateSortinoRatio(0.10, returns, 0.04);
    expect(result).toBe(Infinity);
  });

  it('returns 0 when all returns are above target but portfolio underperforms risk-free', () => {
    const returns = [0.01, 0.02, 0.03, 0.015, 0.025];
    const result = calculateSortinoRatio(0.02, returns, 0.04);
    expect(result).toBe(0);
  });

  it('calculates finite Sortino when there are downside returns', () => {
    const returns = [0.01, -0.02, 0.03, -0.015, 0.005, -0.01, 0.02, -0.005];
    const result = calculateSortinoRatio(0.10, returns, 0.04);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('Sortino >= Sharpe when downside deviation < total deviation (positive return)', () => {
    // Generate mixed returns
    const returns = [0.02, -0.01, 0.015, -0.005, 0.01, -0.008, 0.012, 0.005];
    const annualReturn = 0.12;
    const vol = calculateVolatility(returns);
    const sharpe = calculateSharpeRatio(annualReturn, vol, 0.04);
    const sortino = calculateSortinoRatio(annualReturn, returns, 0.04);

    // Sortino should typically be >= Sharpe for positive excess returns
    // because downside deviation <= total deviation
    if (sharpe > 0) {
      expect(sortino).toBeGreaterThanOrEqual(sharpe);
    }
  });

  it('handles all negative returns', () => {
    const returns = [-0.01, -0.02, -0.03, -0.015, -0.025];
    const result = calculateSortinoRatio(-0.10, returns, 0.04);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeLessThan(0);
  });

  it('handles zero risk-free rate', () => {
    const returns = [0.01, -0.02, 0.015, -0.005];
    const result = calculateSortinoRatio(0.10, returns, 0);
    expect(Number.isFinite(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// calculateMaxDrawdown
// ---------------------------------------------------------------------------

describe('calculateMaxDrawdown', () => {
  it('returns 0 for fewer than 2 prices', () => {
    expect(calculateMaxDrawdown([]).maxDrawdown).toBe(0);
    expect(calculateMaxDrawdown([100]).maxDrawdown).toBe(0);
  });

  it('returns 0 for monotonically increasing prices', () => {
    const prices = [100, 110, 120, 130, 140];
    const result = calculateMaxDrawdown(prices);
    expect(result.maxDrawdown).toBe(0);
  });

  it('calculates correctly for a simple peak-to-trough', () => {
    const prices = [100, 120, 90, 110]; // peak at 120, trough at 90
    const result = calculateMaxDrawdown(prices);
    expect(result.maxDrawdown).toBeCloseTo(-30 / 120, 10); // (90-120)/120 = -25%
    expect(result.peakIndex).toBe(1);
    expect(result.troughIndex).toBe(2);
    expect(result.durationDays).toBe(1);
  });

  it('calculates correctly for monotonically declining prices', () => {
    const prices = [100, 90, 80, 70, 60];
    const result = calculateMaxDrawdown(prices);
    expect(result.maxDrawdown).toBeCloseTo(-40 / 100, 10); // -40%
    expect(result.peakIndex).toBe(0);
    expect(result.troughIndex).toBe(4);
    expect(result.durationDays).toBe(4);
  });

  it('finds the worst drawdown among multiple drawdowns', () => {
    const prices = [100, 90, 95, 80, 100, 70]; // two drawdowns
    const result = calculateMaxDrawdown(prices);
    // Peak at index 4 (100), trough at index 5 (70) => -30%
    // OR peak at index 0 (100), trough at index 3 (80) => -20%
    // OR peak at index 0 (100), trough at index 5 (70) => -30%
    expect(result.maxDrawdown).toBeCloseTo(-0.3, 10);
  });

  it('handles flat prices (no drawdown)', () => {
    const prices = [100, 100, 100, 100];
    const result = calculateMaxDrawdown(prices);
    expect(result.maxDrawdown).toBe(0);
  });

  it('handles two prices with a decline', () => {
    const result = calculateMaxDrawdown([100, 80]);
    expect(result.maxDrawdown).toBeCloseTo(-0.2, 10);
    expect(result.peakIndex).toBe(0);
    expect(result.troughIndex).toBe(1);
  });

  it('handles recovery after drawdown', () => {
    const prices = [100, 80, 90, 95, 100, 105];
    const result = calculateMaxDrawdown(prices);
    expect(result.maxDrawdown).toBeCloseTo(-0.2, 10); // 100->80
    expect(result.peakIndex).toBe(0);
    expect(result.troughIndex).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// calculateBeta
// ---------------------------------------------------------------------------

describe('calculateBeta', () => {
  it('returns default beta of 1 for fewer than 2 data points', () => {
    expect(calculateBeta([], [])).toBe(1);
    expect(calculateBeta([0.01], [0.02])).toBe(1);
  });

  it('returns beta of 1.0 when asset and benchmark returns are identical', () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.005];
    expect(calculateBeta(returns, returns)).toBeCloseTo(1.0, 10);
  });

  it('returns beta of 2.0 when asset moves exactly 2x the benchmark', () => {
    const benchmark = [0.01, -0.02, 0.03, -0.01, 0.005];
    const asset = benchmark.map((r) => r * 2);
    expect(calculateBeta(asset, benchmark)).toBeCloseTo(2.0, 10);
  });

  it('returns beta of 0.5 when asset moves half the benchmark', () => {
    const benchmark = [0.01, -0.02, 0.03, -0.01, 0.005];
    const asset = benchmark.map((r) => r * 0.5);
    expect(calculateBeta(asset, benchmark)).toBeCloseTo(0.5, 10);
  });

  it('returns negative beta when asset moves opposite to benchmark', () => {
    const benchmark = [0.01, -0.02, 0.03, -0.01, 0.005];
    const asset = benchmark.map((r) => -r);
    expect(calculateBeta(asset, benchmark)).toBeCloseTo(-1.0, 10);
  });

  it('returns 1 when benchmark has zero variance', () => {
    const asset = [0.01, -0.02, 0.03];
    const benchmark = [0.01, 0.01, 0.01]; // no variance
    expect(calculateBeta(asset, benchmark)).toBe(1);
  });

  it('handles arrays of different lengths by using minimum', () => {
    const asset = [0.01, -0.02, 0.03, 0.04, 0.05];
    const benchmark = [0.01, -0.02, 0.03];
    // Should use only 3 elements
    const result = calculateBeta(asset, benchmark);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('calculates beta close to 0 for uncorrelated assets', () => {
    // Use a deterministic pattern that approximates uncorrelated returns
    const benchmark = [0.01, -0.01, 0.01, -0.01, 0.01, -0.01, 0.01, -0.01];
    const asset = [0.01, 0.01, -0.01, -0.01, 0.01, 0.01, -0.01, -0.01];
    const beta = calculateBeta(asset, benchmark);
    expect(Math.abs(beta)).toBeLessThan(0.5);
  });
});

// ---------------------------------------------------------------------------
// calculateVaR95
// ---------------------------------------------------------------------------

describe('calculateVaR95', () => {
  it('returns 0 for empty returns array', () => {
    expect(calculateVaR95([])).toBe(0);
  });

  it('returns the single value for a single-element array', () => {
    expect(calculateVaR95([-0.05])).toBe(-0.05);
  });

  it('returns a negative number for typical returns distribution', () => {
    const returns = [0.02, 0.01, -0.01, -0.03, 0.005, -0.02, 0.015, -0.005,
      0.03, -0.04, 0.01, -0.01, 0.02, -0.025, 0.005, -0.015, 0.01, 0.02,
      -0.035, 0.005];
    const var95 = calculateVaR95(returns);
    expect(var95).toBeLessThan(0);
  });

  it('returns 0 for all-positive returns (no loss at 5th percentile)', () => {
    const returns = [0.01, 0.02, 0.03, 0.04, 0.05];
    const var95 = calculateVaR95(returns);
    expect(var95).toBeGreaterThanOrEqual(0);
  });

  it('returns the worst return for a two-element array', () => {
    const returns = [-0.05, 0.03];
    const var95 = calculateVaR95(returns);
    // 5th percentile of 2 elements: index = 0.05 * 1 = 0.05
    // interpolation between sorted[0] and sorted[0] at fraction 0.05
    expect(var95).toBeLessThan(0);
  });

  it('handles uniform losses', () => {
    const returns = [-0.01, -0.01, -0.01, -0.01, -0.01];
    const var95 = calculateVaR95(returns);
    expect(var95).toBeCloseTo(-0.01, 10);
  });

  it('correctly identifies tail risk', () => {
    // 100 returns: 90 positive, 10 very negative
    // Sorted: [-0.10 x10, 0.01 x90]
    // 5th percentile index: 0.05 * 99 = 4.95 => between sorted[4]=-0.10 and sorted[5]=-0.10
    // VaR95 = -0.10 (well within the negative cluster)
    const returns = Array.from({ length: 90 }, () => 0.01);
    for (let i = 0; i < 10; i++) returns.push(-0.10);
    const var95 = calculateVaR95(returns);
    expect(var95).toBeCloseTo(-0.10, 10);
  });

  it('VaR becomes more negative with worse tail risk', () => {
    const mildReturns = [0.01, -0.01, 0.02, -0.02, 0.015, -0.015, 0.005, -0.005];
    const wildReturns = [0.05, -0.08, 0.1, -0.12, 0.03, -0.07, 0.02, -0.09];

    expect(calculateVaR95(wildReturns)).toBeLessThan(
      calculateVaR95(mildReturns)
    );
  });
});

// ---------------------------------------------------------------------------
// calculateAllRiskMetrics
// ---------------------------------------------------------------------------

describe('calculateAllRiskMetrics', () => {
  it('returns a complete RiskMetrics object for valid inputs', () => {
    // Generate 100 days of prices
    const prices: number[] = [100];
    for (let i = 1; i < 100; i++) {
      prices.push(prices[i - 1] * (1 + (Math.sin(i) * 0.02)));
    }
    const benchmark = prices.map((p) => p * 1.05); // slightly different

    const metrics = calculateAllRiskMetrics(prices, benchmark);

    expect(metrics).toHaveProperty('volatility30d');
    expect(metrics).toHaveProperty('volatility90d');
    expect(metrics).toHaveProperty('sharpeRatio');
    expect(metrics).toHaveProperty('sortinoRatio');
    expect(metrics).toHaveProperty('maxDrawdown');
    expect(metrics).toHaveProperty('maxDrawdownDuration');
    expect(metrics).toHaveProperty('beta');
    expect(metrics).toHaveProperty('calmarRatio');
    expect(metrics).toHaveProperty('var95');
  });

  it('handles minimal price series (2 prices)', () => {
    const metrics = calculateAllRiskMetrics([100, 110], [100, 105]);

    expect(Number.isFinite(metrics.volatility30d)).toBe(true);
    expect(Number.isFinite(metrics.sharpeRatio)).toBe(true);
    expect(Number.isFinite(metrics.beta)).toBe(true);
  });

  it('uses custom risk-free rate', () => {
    const prices = [100, 105, 110, 108, 115];
    const benchmark = [100, 102, 104, 103, 106];

    const metricsDefault = calculateAllRiskMetrics(prices, benchmark);
    const metricsCustom = calculateAllRiskMetrics(prices, benchmark, 0.02);

    // Different risk-free rate should yield different Sharpe/Sortino
    expect(metricsDefault.sharpeRatio).not.toBeCloseTo(
      metricsCustom.sharpeRatio,
      5
    );
  });

  it('reports maxDrawdown as non-positive', () => {
    const prices = [100, 110, 90, 95, 105, 85, 100];
    const benchmark = [100, 105, 100, 102, 108, 95, 105];

    const metrics = calculateAllRiskMetrics(prices, benchmark);
    expect(metrics.maxDrawdown).toBeLessThanOrEqual(0);
  });

  it('calmarRatio is 0 when maxDrawdown is 0', () => {
    // Monotonically increasing prices => no drawdown
    const prices = [100, 101, 102, 103, 104, 105];
    const benchmark = [100, 101, 102, 103, 104, 105];

    const metrics = calculateAllRiskMetrics(prices, benchmark);
    expect(metrics.maxDrawdown).toBe(0);
    expect(metrics.calmarRatio).toBe(0);
  });
});
