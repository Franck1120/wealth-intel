import { describe, it, expect } from 'vitest';
import {
  calculatePortfolioSummary,
  calculateDailyReturn,
  calculateTimeWeightedReturn,
  calculateIRR,
  type HoldingWithPrice,
} from '@/lib/calculations/portfolio';

// ---------------------------------------------------------------------------
// calculatePortfolioSummary
// ---------------------------------------------------------------------------

describe('calculatePortfolioSummary', () => {
  it('returns zeros for an empty holdings array', () => {
    const result = calculatePortfolioSummary([]);
    expect(result.totalValue).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.totalGain).toBe(0);
    expect(result.totalGainPct).toBe(0);
    expect(result.holdings).toHaveLength(0);
    expect(result.allocationByType).toEqual({});
    expect(result.allocationByModule).toEqual({});
  });

  it('calculates correctly for a single holding with a gain', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'AAPL',
        name: 'Apple',
        type: 'stock',
        quantity: 10,
        avgCostBasis: 100,
        currentPrice: 150,
      },
    ];

    const result = calculatePortfolioSummary(holdings);

    expect(result.totalValue).toBe(1500);
    expect(result.totalCost).toBe(1000);
    expect(result.totalGain).toBe(500);
    expect(result.totalGainPct).toBe(0.5);
    expect(result.holdings).toHaveLength(1);

    const h = result.holdings[0];
    expect(h.marketValue).toBe(1500);
    expect(h.costBasis).toBe(1000);
    expect(h.gain).toBe(500);
    expect(h.gainPct).toBe(0.5);
    expect(h.allocationPct).toBe(1); // only holding = 100%
  });

  it('calculates correctly for a single holding with a loss', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'META',
        name: 'Meta',
        type: 'stock',
        quantity: 5,
        avgCostBasis: 300,
        currentPrice: 200,
      },
    ];

    const result = calculatePortfolioSummary(holdings);

    expect(result.totalGain).toBe(-500);
    expect(result.totalGainPct).toBeCloseTo(-1 / 3, 10);
  });

  it('calculates allocation percentages correctly for multiple holdings', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'AAPL',
        name: 'Apple',
        type: 'stock',
        quantity: 10,
        avgCostBasis: 100,
        currentPrice: 100,
      },
      {
        assetId: '2',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'crypto',
        quantity: 1,
        avgCostBasis: 30000,
        currentPrice: 30000,
      },
    ];

    const result = calculatePortfolioSummary(holdings);

    // Total value: 1000 + 30000 = 31000
    expect(result.totalValue).toBe(31000);
    expect(result.holdings[0].allocationPct).toBeCloseTo(1000 / 31000, 10);
    expect(result.holdings[1].allocationPct).toBeCloseTo(30000 / 31000, 10);

    // Sum of allocation pcts should be ~1
    const totalAlloc = result.holdings.reduce(
      (sum, h) => sum + h.allocationPct,
      0
    );
    expect(totalAlloc).toBeCloseTo(1, 10);
  });

  it('calculates allocationByType correctly', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'AAPL',
        name: 'Apple',
        type: 'stock',
        quantity: 10,
        avgCostBasis: 100,
        currentPrice: 100,
      },
      {
        assetId: '2',
        symbol: 'MSFT',
        name: 'Microsoft',
        type: 'Stock',
        quantity: 5,
        avgCostBasis: 200,
        currentPrice: 200,
      },
      {
        assetId: '3',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'crypto',
        quantity: 1,
        avgCostBasis: 40000,
        currentPrice: 40000,
      },
    ];

    const result = calculatePortfolioSummary(holdings);
    // stock: 1000 + 1000 = 2000, crypto: 40000, total: 42000
    expect(result.allocationByType['stock']).toBeCloseTo(2000 / 42000, 10);
    expect(result.allocationByType['crypto']).toBeCloseTo(40000 / 42000, 10);
  });

  it('calculates allocationByModule correctly with type-to-module mapping', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'AAPL',
        name: 'Apple',
        type: 'stock',
        quantity: 10,
        avgCostBasis: 100,
        currentPrice: 100,
      },
      {
        assetId: '2',
        symbol: 'SPY',
        name: 'S&P 500 ETF',
        type: 'etf',
        quantity: 5,
        avgCostBasis: 400,
        currentPrice: 400,
      },
      {
        assetId: '3',
        symbol: 'BTP',
        name: 'BTP 2030',
        type: 'gov_bond_it',
        quantity: 100,
        avgCostBasis: 95,
        currentPrice: 97,
      },
    ];

    const result = calculatePortfolioSummary(holdings);
    // stock and etf both map to 'equities', gov_bond_it maps to 'fixed_income'
    expect(result.allocationByModule).toHaveProperty('equities');
    expect(result.allocationByModule).toHaveProperty('fixed_income');

    // equities = 1000 + 2000 = 3000, fixed_income = 9700, total = 12700
    expect(result.allocationByModule['equities']).toBeCloseTo(3000 / 12700, 10);
    expect(result.allocationByModule['fixed_income']).toBeCloseTo(
      9700 / 12700,
      10
    );
  });

  it('handles zero quantity holdings', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'AAPL',
        name: 'Apple',
        type: 'stock',
        quantity: 0,
        avgCostBasis: 100,
        currentPrice: 150,
      },
    ];

    const result = calculatePortfolioSummary(holdings);

    expect(result.totalValue).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.totalGain).toBe(0);
    expect(result.totalGainPct).toBe(0);
    expect(result.holdings[0].allocationPct).toBe(0);
  });

  it('handles zero cost basis correctly (gainPct is 0)', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'GIFT',
        name: 'Gift Stock',
        type: 'stock',
        quantity: 10,
        avgCostBasis: 0,
        currentPrice: 50,
      },
    ];

    const result = calculatePortfolioSummary(holdings);

    expect(result.holdings[0].gainPct).toBe(0); // 0 cost basis -> 0 gain pct
    expect(result.totalGainPct).toBe(0);
  });

  it('maps unknown asset types to "other" module', () => {
    const holdings: HoldingWithPrice[] = [
      {
        assetId: '1',
        symbol: 'WEIRD',
        name: 'Unknown Asset',
        type: 'exotic_derivative',
        quantity: 1,
        avgCostBasis: 100,
        currentPrice: 110,
      },
    ];

    const result = calculatePortfolioSummary(holdings);
    expect(result.allocationByModule).toHaveProperty('other');
    expect(result.allocationByModule['other']).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// calculateDailyReturn
// ---------------------------------------------------------------------------

describe('calculateDailyReturn', () => {
  it('calculates a positive daily return', () => {
    expect(calculateDailyReturn(100, 105)).toBeCloseTo(0.05, 10);
  });

  it('calculates a negative daily return', () => {
    expect(calculateDailyReturn(100, 90)).toBeCloseTo(-0.1, 10);
  });

  it('returns 0 for no change', () => {
    expect(calculateDailyReturn(100, 100)).toBe(0);
  });

  it('returns 0 when previous value is 0 (avoid division by zero)', () => {
    expect(calculateDailyReturn(0, 100)).toBe(0);
  });

  it('handles large values correctly', () => {
    expect(calculateDailyReturn(1_000_000, 1_010_000)).toBeCloseTo(0.01, 10);
  });

  it('handles very small changes', () => {
    expect(calculateDailyReturn(100, 100.001)).toBeCloseTo(0.00001, 10);
  });

  it('calculates a -100% return (value drops to 0)', () => {
    expect(calculateDailyReturn(100, 0)).toBe(-1);
  });

  it('calculates a return when value doubles', () => {
    expect(calculateDailyReturn(50, 100)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// calculateTimeWeightedReturn
// ---------------------------------------------------------------------------

describe('calculateTimeWeightedReturn', () => {
  it('returns 0 for empty period returns', () => {
    expect(calculateTimeWeightedReturn([])).toBe(0);
  });

  it('returns the single period return for a single-element array', () => {
    expect(calculateTimeWeightedReturn([0.05])).toBeCloseTo(0.05, 10);
  });

  it('compounds multiple positive returns', () => {
    // (1 + 0.10) * (1 + 0.10) - 1 = 0.21
    expect(calculateTimeWeightedReturn([0.1, 0.1])).toBeCloseTo(0.21, 10);
  });

  it('handles a mix of positive and negative returns', () => {
    // (1 + 0.10) * (1 + (-0.05)) - 1 = 1.1 * 0.95 - 1 = 0.045
    expect(calculateTimeWeightedReturn([0.1, -0.05])).toBeCloseTo(0.045, 10);
  });

  it('handles zero returns', () => {
    expect(calculateTimeWeightedReturn([0, 0, 0])).toBe(0);
  });

  it('handles all-negative returns', () => {
    // (1 + (-0.1)) * (1 + (-0.2)) - 1 = 0.9 * 0.8 - 1 = -0.28
    expect(calculateTimeWeightedReturn([-0.1, -0.2])).toBeCloseTo(-0.28, 10);
  });

  it('handles a -100% return (total loss)', () => {
    // (1 + 0.1) * (1 + (-1)) - 1 = 1.1 * 0 - 1 = -1
    expect(calculateTimeWeightedReturn([0.1, -1])).toBe(-1);
  });

  it('handles many small daily returns', () => {
    // 252 days of 0.04% daily return
    const dailyReturn = 0.0004;
    const returns = Array.from({ length: 252 }, () => dailyReturn);
    const result = calculateTimeWeightedReturn(returns);
    // Should be approximately: (1.0004)^252 - 1 ~ 0.1063
    expect(result).toBeCloseTo(Math.pow(1 + dailyReturn, 252) - 1, 6);
  });
});

// ---------------------------------------------------------------------------
// calculateIRR
// ---------------------------------------------------------------------------

describe('calculateIRR', () => {
  it('returns 0 for fewer than 2 cash flows', () => {
    expect(
      calculateIRR([{ amount: -1000, date: new Date('2024-01-01') }])
    ).toBe(0);
    expect(calculateIRR([])).toBe(0);
  });

  it('calculates IRR for a simple investment that doubles in 1 year', () => {
    const cashFlows = [
      { amount: -1000, date: new Date('2024-01-01') },
      { amount: 2000, date: new Date('2025-01-01') },
    ];
    const irr = calculateIRR(cashFlows);
    // Should be approximately 100% = 1.0
    expect(irr).toBeCloseTo(1.0, 1);
  });

  it('calculates IRR for a 10% annual return over 1 year', () => {
    const cashFlows = [
      { amount: -1000, date: new Date('2024-01-01') },
      { amount: 1100, date: new Date('2025-01-01') },
    ];
    const irr = calculateIRR(cashFlows);
    expect(irr).toBeCloseTo(0.1, 1);
  });

  it('calculates IRR with multiple cash flows', () => {
    const cashFlows = [
      { amount: -1000, date: new Date('2024-01-01') },
      { amount: -500, date: new Date('2024-07-01') },
      { amount: 1700, date: new Date('2025-01-01') },
    ];
    const irr = calculateIRR(cashFlows);
    // The IRR should be a finite number representing annualized return
    expect(Number.isFinite(irr)).toBe(true);
    expect(irr).toBeGreaterThan(-1);
  });

  it('calculates IRR for a losing investment', () => {
    const cashFlows = [
      { amount: -1000, date: new Date('2024-01-01') },
      { amount: 800, date: new Date('2025-01-01') },
    ];
    const irr = calculateIRR(cashFlows);
    // Should be approximately -20%
    expect(irr).toBeCloseTo(-0.2, 1);
  });

  it('handles investment with dividends along the way', () => {
    const cashFlows = [
      { amount: -10000, date: new Date('2024-01-01') },
      { amount: 200, date: new Date('2024-04-01') },
      { amount: 200, date: new Date('2024-07-01') },
      { amount: 200, date: new Date('2024-10-01') },
      { amount: 10500, date: new Date('2025-01-01') },
    ];
    const irr = calculateIRR(cashFlows);
    expect(Number.isFinite(irr)).toBe(true);
    expect(irr).toBeGreaterThan(0);
  });

  it('returns a finite number or NaN (never throws)', () => {
    const cashFlows = [
      { amount: -100, date: new Date('2024-01-01') },
      { amount: 100, date: new Date('2024-01-01') }, // same day
    ];
    const irr = calculateIRR(cashFlows);
    expect(typeof irr).toBe('number');
  });

  it('handles zero amount cash flows', () => {
    const cashFlows = [
      { amount: 0, date: new Date('2024-01-01') },
      { amount: 0, date: new Date('2025-01-01') },
    ];
    const irr = calculateIRR(cashFlows);
    expect(typeof irr).toBe('number');
  });
});
