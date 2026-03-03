import { describe, it, expect } from 'vitest';
import { calculateRisk, type RiskInput } from '@/lib/scoring/dimensions/risk';

/**
 * Helper: generate daily returns with specified volatility.
 * @param days - Number of return observations
 * @param dailyVol - Daily standard deviation (e.g., 0.01 = 1%)
 */
function generateReturns(days: number, dailyVol: number, seed = 42): number[] {
  const returns: number[] = [];
  let s = seed;
  for (let i = 0; i < days; i++) {
    // Box-Muller-like deterministic pseudo-normal
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const u1 = (s % 10000) / 10000;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const u2 = (s % 10000) / 10000;
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
    returns.push(z * dailyVol);
  }
  return returns;
}

describe('calculateRisk', () => {
  describe('score boundaries', () => {
    it('always returns score between 0 and 100', () => {
      const testCases: RiskInput[] = [
        // All null / empty
        { dailyReturns: [], beta: null, maxDrawdown1Y: null },
        // Low risk stock
        { dailyReturns: generateReturns(60, 0.005), beta: 0.7, maxDrawdown1Y: -0.05 },
        // High risk crypto
        { dailyReturns: generateReturns(60, 0.05), beta: 2.5, maxDrawdown1Y: -0.60 },
        // Medium risk
        { dailyReturns: generateReturns(60, 0.015), beta: 1.0, maxDrawdown1Y: -0.15 },
        // Very low returns (near zero vol)
        { dailyReturns: Array(60).fill(0.001), beta: 0.3, maxDrawdown1Y: -0.02 },
      ];

      for (const input of testCases) {
        const result = calculateRisk(input);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('volatility scoring', () => {
    it('returns volatilityScore of 50 when insufficient data (< 10 returns)', () => {
      const result = calculateRisk({
        dailyReturns: [0.01, -0.02, 0.005],
        beta: null,
        maxDrawdown1Y: null,
      });
      expect(result.components.volatilityScore).toBe(50);
    });

    it('returns volatilityScore of 90 for very low volatility (< 15% annualized)', () => {
      // Daily vol ~0.005 => annualized ~0.005 * sqrt(252) ~= 7.9%
      const returns = Array(30).fill(0.005); // constant returns => zero std dev
      // Zero std dev => 0% annualized volatility
      const result = calculateRisk({
        dailyReturns: returns,
        beta: null,
        maxDrawdown1Y: null,
      });
      // 0% vol < 15% => score 90
      expect(result.components.volatilityScore).toBe(90);
    });

    it('returns volatilityScore of 15 for extreme volatility (> 60% annualized)', () => {
      // Daily vol of ~0.05 => annualized ~79%
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.05, 123),
        beta: null,
        maxDrawdown1Y: null,
      });
      expect(result.components.volatilityScore).toBe(15);
    });

    it('uses only last 30 days for volatility calculation', () => {
      // First 200 days: very volatile, last 30 days: calm
      const noisyReturns = generateReturns(200, 0.05, 99);
      const calmReturns = Array(30).fill(0.002);
      const allReturns = [...noisyReturns, ...calmReturns];

      const result = calculateRisk({
        dailyReturns: allReturns,
        beta: null,
        maxDrawdown1Y: null,
      });
      // Should use only last 30 calm days, giving low vol score
      expect(result.components.volatilityScore).toBe(90);
    });
  });

  describe('beta scoring', () => {
    it('returns betaScore of 50 for null beta', () => {
      const result = calculateRisk({
        dailyReturns: [],
        beta: null,
        maxDrawdown1Y: null,
      });
      expect(result.components.betaScore).toBe(50);
    });

    it('returns betaScore of 80 for very low beta (< 0.5)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: 0.3,
        maxDrawdown1Y: null,
      });
      expect(result.components.betaScore).toBe(80);
    });

    it('returns betaScore of 70 for market-like beta (0.8-1.2)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: 1.0,
        maxDrawdown1Y: null,
      });
      expect(result.components.betaScore).toBe(70);
    });

    it('returns betaScore of 55 for moderate beta (0.5-0.8)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: 0.6,
        maxDrawdown1Y: null,
      });
      expect(result.components.betaScore).toBe(55);
    });

    it('returns betaScore of 55 for elevated beta (1.2-1.5)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: 1.3,
        maxDrawdown1Y: null,
      });
      expect(result.components.betaScore).toBe(55);
    });

    it('returns betaScore of 30 for high beta (> 1.5)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: 2.0,
        maxDrawdown1Y: null,
      });
      expect(result.components.betaScore).toBe(30);
    });

    it('uses absolute value of beta (handles negative beta)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: -0.3,
        maxDrawdown1Y: null,
      });
      // |beta| = 0.3 < 0.5 => 80
      expect(result.components.betaScore).toBe(80);
    });
  });

  describe('drawdown scoring', () => {
    it('returns drawdownScore of 40 for null drawdown', () => {
      const result = calculateRisk({
        dailyReturns: [],
        beta: null,
        maxDrawdown1Y: null,
      });
      expect(result.components.drawdownScore).toBe(40);
    });

    it('returns drawdownScore of 85 for small drawdown (> -10%)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: null,
        maxDrawdown1Y: -0.05, // -5%
      });
      expect(result.components.drawdownScore).toBe(85);
    });

    it('returns drawdownScore of 65 for moderate drawdown (-10% to -20%)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: null,
        maxDrawdown1Y: -0.15, // -15%
      });
      expect(result.components.drawdownScore).toBe(65);
    });

    it('returns drawdownScore of 10 for catastrophic drawdown (<= -50%)', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: null,
        maxDrawdown1Y: -0.70, // -70%
      });
      expect(result.components.drawdownScore).toBe(10);
    });
  });

  describe('weight distribution', () => {
    it('produces weighted score matching manual calculation', () => {
      // Use constant returns for predictable volatility score
      const input: RiskInput = {
        dailyReturns: Array(30).fill(0.001), // zero std dev => vol=0 => volScore=90
        beta: 0.3,        // betaScore = 80
        maxDrawdown1Y: -0.05, // drawdownScore = 85
      };
      const result = calculateRisk(input);

      expect(result.components.volatilityScore).toBe(90);
      expect(result.components.betaScore).toBe(80);
      expect(result.components.drawdownScore).toBe(85);

      // 90*0.4 + 80*0.25 + 85*0.35 = 36 + 20 + 29.75 = 85.75
      const expected = 90 * 0.4 + 80 * 0.25 + 85 * 0.35;
      expect(result.score).toBeCloseTo(expected, 1);
    });

    it('verifies weights sum to 1.0', () => {
      const totalWeight = 0.4 + 0.25 + 0.35;
      expect(totalWeight).toBeCloseTo(1.0, 10);
    });
  });

  describe('realistic data', () => {
    it('scores a low-volatility bond ETF as low risk (high score)', () => {
      // AGG-like: ~4% annualized vol, beta ~0.05, max drawdown ~-5%
      // Daily vol = 0.04 / sqrt(252) ~= 0.0025
      const returns = generateReturns(60, 0.0025, 77);
      const result = calculateRisk({
        dailyReturns: returns,
        beta: 0.05,
        maxDrawdown1Y: -0.05,
      });
      expect(result.score).toBeGreaterThan(75);
    });

    it('scores a volatile meme stock as high risk (low score)', () => {
      // GME-like: ~80% annualized vol, beta ~2.0, max drawdown ~-65%
      const returns = generateReturns(60, 0.05, 55);
      const result = calculateRisk({
        dailyReturns: returns,
        beta: 2.0,
        maxDrawdown1Y: -0.65,
      });
      expect(result.score).toBeLessThan(30);
    });
  });

  describe('result structure', () => {
    it('returns properly typed RiskResult', () => {
      const result = calculateRisk({
        dailyReturns: generateReturns(30, 0.01),
        beta: 1.0,
        maxDrawdown1Y: -0.15,
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result.components).toHaveProperty('volatilityScore');
      expect(result.components).toHaveProperty('betaScore');
      expect(result.components).toHaveProperty('drawdownScore');
    });
  });
});
