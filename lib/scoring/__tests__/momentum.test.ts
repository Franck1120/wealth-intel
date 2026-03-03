import { describe, it, expect } from 'vitest';
import { calculateMomentum, type MomentumInput } from '@/lib/scoring/dimensions/momentum';

/**
 * Helper: generate monotonically increasing prices to simulate uptrend.
 * Starting from `start`, increasing by `step` each day.
 */
function generateUptrend(days: number, start = 100, step = 0.5): number[] {
  return Array.from({ length: days }, (_, i) => start + i * step);
}

/**
 * Helper: generate monotonically decreasing prices to simulate downtrend.
 */
function generateDowntrend(days: number, start = 200, step = 0.5): number[] {
  return Array.from({ length: days }, (_, i) => start - i * step);
}

/**
 * Helper: generate flat prices (no movement).
 */
function generateFlat(days: number, price = 100): number[] {
  return Array.from({ length: days }, () => price);
}

/**
 * Helper: generate random-walk prices with small perturbations.
 */
function generateRandomWalk(days: number, start = 100, seed = 42): number[] {
  const prices: number[] = [start];
  // Simple deterministic pseudo-random
  let s = seed;
  for (let i = 1; i < days; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const delta = ((s % 200) - 100) / 100; // -1 to +1
    prices.push(Math.max(1, prices[i - 1] + delta));
  }
  return prices;
}

describe('calculateMomentum', () => {
  describe('insufficient data handling', () => {
    it('returns default score of 50 when prices array is empty', () => {
      const input: MomentumInput = { prices: [], volumes: [] };
      const result = calculateMomentum(input);

      expect(result.score).toBe(50);
      expect(result.components.rsi14).toBe(50);
      expect(result.components.smaCrossover).toBe(0);
      expect(result.components.priceVs52wRange).toBe(0.5);
    });

    it('returns default score of 50 when prices have fewer than 15 data points', () => {
      const input: MomentumInput = {
        prices: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113],
        volumes: Array(14).fill(1000000),
      };
      expect(input.prices.length).toBe(14);

      const result = calculateMomentum(input);
      expect(result.score).toBe(50);
    });

    it('calculates RSI with exactly 15 data points (minimum required)', () => {
      const input: MomentumInput = {
        prices: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114],
        volumes: Array(15).fill(1000000),
      };
      const result = calculateMomentum(input);

      // Should not return default -- RSI should be computed
      expect(result.score).not.toBe(50);
      // RSI of steady uptrend should be high (all gains, no losses)
      expect(result.components.rsi14).toBe(100);
    });
  });

  describe('score boundaries', () => {
    it('always returns score between 0 and 100', () => {
      const testCases: MomentumInput[] = [
        // Strong uptrend
        { prices: generateUptrend(300, 10, 2), volumes: Array(300).fill(1e6) },
        // Strong downtrend
        { prices: generateDowntrend(300, 500, 1), volumes: Array(300).fill(1e6) },
        // Flat prices
        { prices: generateFlat(300, 50), volumes: Array(300).fill(1e6) },
        // Random walk
        { prices: generateRandomWalk(300), volumes: Array(300).fill(1e6) },
      ];

      for (const input of testCases) {
        const result = calculateMomentum(input);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });

    it('returns RSI component between 0 and 100', () => {
      const input: MomentumInput = {
        prices: generateUptrend(250),
        volumes: Array(250).fill(1e6),
      };
      const result = calculateMomentum(input);
      expect(result.components.rsi14).toBeGreaterThanOrEqual(0);
      expect(result.components.rsi14).toBeLessThanOrEqual(100);
    });

    it('returns smaCrossover between -1 and 1', () => {
      const input: MomentumInput = {
        prices: generateUptrend(250),
        volumes: Array(250).fill(1e6),
      };
      const result = calculateMomentum(input);
      expect(result.components.smaCrossover).toBeGreaterThanOrEqual(-1);
      expect(result.components.smaCrossover).toBeLessThanOrEqual(1);
    });

    it('returns priceVs52wRange between 0 and 1', () => {
      const input: MomentumInput = {
        prices: generateUptrend(300),
        volumes: Array(300).fill(1e6),
      };
      const result = calculateMomentum(input);
      expect(result.components.priceVs52wRange).toBeGreaterThanOrEqual(0);
      expect(result.components.priceVs52wRange).toBeLessThanOrEqual(1);
    });
  });

  describe('RSI calculation', () => {
    it('returns RSI of 100 for pure uptrend (all gains, zero losses)', () => {
      const input: MomentumInput = {
        prices: generateUptrend(30, 100, 1),
        volumes: Array(30).fill(1e6),
      };
      const result = calculateMomentum(input);
      expect(result.components.rsi14).toBe(100);
    });

    it('returns RSI of 0 for pure downtrend (all losses, zero gains)', () => {
      const input: MomentumInput = {
        prices: generateDowntrend(30, 100, 1),
        volumes: Array(30).fill(1e6),
      };
      const result = calculateMomentum(input);
      expect(result.components.rsi14).toBe(0);
    });

    it('returns RSI near 50 for alternating up/down movement', () => {
      // Zigzag pattern: up 1, down 1, up 1, down 1...
      const prices: number[] = [];
      for (let i = 0; i < 30; i++) {
        prices.push(100 + (i % 2 === 0 ? 0 : 1));
      }
      const input: MomentumInput = { prices, volumes: Array(30).fill(1e6) };
      const result = calculateMomentum(input);
      // RSI should be near 50 for symmetric oscillation
      expect(result.components.rsi14).toBeGreaterThan(30);
      expect(result.components.rsi14).toBeLessThan(70);
    });
  });

  describe('SMA crossover', () => {
    it('returns neutral crossover signal when insufficient data for SMA200', () => {
      // Only 100 data points -- enough for SMA50 but not SMA200
      const input: MomentumInput = {
        prices: generateUptrend(100),
        volumes: Array(100).fill(1e6),
      };
      const result = calculateMomentum(input);
      // SMA200 is null, so crossover defaults to signal=0
      expect(result.components.smaCrossover).toBe(0);
    });

    it('returns positive crossover for strong uptrend with 250+ data points', () => {
      // Long uptrend: SMA50 should be above SMA200
      const input: MomentumInput = {
        prices: generateUptrend(260, 10, 1),
        volumes: Array(260).fill(1e6),
      };
      const result = calculateMomentum(input);
      expect(result.components.smaCrossover).toBeGreaterThan(0);
    });
  });

  describe('52-week range position', () => {
    it('returns position near 1.0 when price is at 52-week high', () => {
      const prices = generateUptrend(252);
      const input: MomentumInput = { prices, volumes: Array(252).fill(1e6) };
      const result = calculateMomentum(input);
      expect(result.components.priceVs52wRange).toBeCloseTo(1.0, 1);
    });

    it('returns position near 0.0 when price is at 52-week low', () => {
      const prices = generateDowntrend(252, 300, 1);
      const input: MomentumInput = { prices, volumes: Array(252).fill(1e6) };
      const result = calculateMomentum(input);
      expect(result.components.priceVs52wRange).toBeCloseTo(0.0, 1);
    });

    it('returns position of 0.5 when all prices are equal', () => {
      const input: MomentumInput = {
        prices: generateFlat(252, 50),
        volumes: Array(252).fill(1e6),
      };
      const result = calculateMomentum(input);
      // high === low, so defaults to position 0.5
      expect(result.components.priceVs52wRange).toBe(0.5);
    });
  });

  describe('realistic stock data', () => {
    it('scores AAPL-like uptrend with moderate momentum', () => {
      // Simulate ~252 days of AAPL-like price action: $150 -> $190 with noise
      const prices: number[] = [150];
      let s = 12345;
      for (let i = 1; i < 252; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const noise = ((s % 400) - 200) / 200; // -1 to +1
        const trend = 0.16; // slight upward bias per day
        prices.push(Math.max(1, prices[i - 1] + trend + noise));
      }
      const input: MomentumInput = { prices, volumes: Array(252).fill(5e7) };
      const result = calculateMomentum(input);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      // Should have a defined structure
      expect(result.components).toHaveProperty('rsi14');
      expect(result.components).toHaveProperty('smaCrossover');
      expect(result.components).toHaveProperty('priceVs52wRange');
    });
  });

  describe('result structure', () => {
    it('returns a properly structured MomentumResult', () => {
      const input: MomentumInput = {
        prices: generateUptrend(20),
        volumes: Array(20).fill(1e6),
      };
      const result = calculateMomentum(input);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result.components).toHaveProperty('rsi14');
      expect(result.components).toHaveProperty('smaCrossover');
      expect(result.components).toHaveProperty('priceVs52wRange');
      expect(typeof result.score).toBe('number');
      expect(typeof result.components.rsi14).toBe('number');
      expect(typeof result.components.smaCrossover).toBe('number');
      expect(typeof result.components.priceVs52wRange).toBe('number');
    });

    it('rounds all output values to 2 decimal places', () => {
      const input: MomentumInput = {
        prices: generateRandomWalk(260),
        volumes: Array(260).fill(1e6),
      };
      const result = calculateMomentum(input);

      // Check rounding: multiply by 100, should be integer
      expect(Math.round(result.score * 100)).toBe(result.score * 100);
      expect(Math.round(result.components.rsi14 * 100)).toBe(result.components.rsi14 * 100);
      expect(Math.round(result.components.smaCrossover * 100)).toBe(result.components.smaCrossover * 100);
      expect(Math.round(result.components.priceVs52wRange * 100)).toBe(result.components.priceVs52wRange * 100);
    });
  });
});
