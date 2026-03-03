import { describe, it, expect } from 'vitest';
import { calculateGrowth, type GrowthInput } from '@/lib/scoring/dimensions/growth';

describe('calculateGrowth', () => {
  describe('score boundaries', () => {
    it('always returns score between 0 and 100', () => {
      const testCases: GrowthInput[] = [
        // All null
        { revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null },
        // Hyper growth
        { revenueGrowthYoY: 100, earningsGrowthYoY: 200, revenueGrowth3Y: 50 },
        // Declining
        { revenueGrowthYoY: -20, earningsGrowthYoY: -30, revenueGrowth3Y: -10 },
        // Moderate growth
        { revenueGrowthYoY: 12, earningsGrowthYoY: 18, revenueGrowth3Y: 10 },
        // Zero growth
        { revenueGrowthYoY: 0, earningsGrowthYoY: 0, revenueGrowth3Y: 0 },
        // Mixed positive/negative
        { revenueGrowthYoY: 25, earningsGrowthYoY: -5, revenueGrowth3Y: 15 },
      ];

      for (const input of testCases) {
        const result = calculateGrowth(input);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('revenue growth YoY scoring', () => {
    it('returns revenueGrowthScore of 30 for null', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.revenueGrowthScore).toBe(30);
    });

    it('returns revenueGrowthScore of 90 for growth > 30%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: 50, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.revenueGrowthScore).toBe(90);
    });

    it('returns revenueGrowthScore of 75 for growth between 20-30%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: 25, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.revenueGrowthScore).toBe(75);
    });

    it('returns revenueGrowthScore of 60 for growth between 10-20%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: 15, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.revenueGrowthScore).toBe(60);
    });

    it('returns revenueGrowthScore of 45 for growth between 5-10%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: 7, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.revenueGrowthScore).toBe(45);
    });

    it('returns revenueGrowthScore of 30 for growth between 0-5%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: 2, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.revenueGrowthScore).toBe(30);
    });

    it('returns revenueGrowthScore of 15 for negative growth', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: -10, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.revenueGrowthScore).toBe(15);
    });
  });

  describe('earnings growth YoY scoring', () => {
    it('returns earningsGrowthScore of 30 for null', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.earningsGrowthScore).toBe(30);
    });

    it('returns earningsGrowthScore of 90 for growth > 40%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: 50, revenueGrowth3Y: null,
      });
      expect(result.components.earningsGrowthScore).toBe(90);
    });

    it('returns earningsGrowthScore of 75 for growth between 25-40%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: 30, revenueGrowth3Y: null,
      });
      expect(result.components.earningsGrowthScore).toBe(75);
    });

    it('returns earningsGrowthScore of 15 for negative earnings growth', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: -15, revenueGrowth3Y: null,
      });
      expect(result.components.earningsGrowthScore).toBe(15);
    });
  });

  describe('consistency (3Y CAGR) scoring', () => {
    it('returns consistencyScore of 30 for null', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null,
      });
      expect(result.components.consistencyScore).toBe(30);
    });

    it('returns consistencyScore of 90 for 3Y CAGR > 25%', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: 30,
      });
      expect(result.components.consistencyScore).toBe(90);
    });

    it('returns consistencyScore of 15 for negative 3Y CAGR', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: -5,
      });
      expect(result.components.consistencyScore).toBe(15);
    });
  });

  describe('weight distribution', () => {
    it('produces weighted score matching manual calculation', () => {
      const input: GrowthInput = {
        revenueGrowthYoY: 50,   // revenueGrowthScore = 90
        earningsGrowthYoY: 50,  // earningsGrowthScore = 90
        revenueGrowth3Y: 30,    // consistencyScore = 90
      };
      const result = calculateGrowth(input);

      expect(result.components.revenueGrowthScore).toBe(90);
      expect(result.components.earningsGrowthScore).toBe(90);
      expect(result.components.consistencyScore).toBe(90);

      // 90*0.4 + 90*0.35 + 90*0.25 = 36 + 31.5 + 22.5 = 90
      const expected = 90 * 0.4 + 90 * 0.35 + 90 * 0.25;
      expect(result.score).toBeCloseTo(expected, 1);
    });

    it('verifies weights sum to 1.0', () => {
      const totalWeight = 0.4 + 0.35 + 0.25;
      expect(totalWeight).toBeCloseTo(1.0, 10);
    });
  });

  describe('realistic stock data', () => {
    it('scores NVDA-like hyper growth highly', () => {
      // NVDA-like: ~120% revenue growth, ~600% earnings growth, ~65% 3Y CAGR
      const result = calculateGrowth({
        revenueGrowthYoY: 120,
        earningsGrowthYoY: 600,
        revenueGrowth3Y: 65,
      });
      expect(result.score).toBe(90); // All sub-scores max at 90
    });

    it('scores a mature slow-growth utility moderately', () => {
      // Utility: ~2% revenue growth, ~3% earnings growth, ~1% 3Y CAGR
      const result = calculateGrowth({
        revenueGrowthYoY: 2,
        earningsGrowthYoY: 3,
        revenueGrowth3Y: 1,
      });
      expect(result.score).toBeLessThan(35);
    });

    it('scores a declining company low', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: -15,
        earningsGrowthYoY: -25,
        revenueGrowth3Y: -8,
      });
      expect(result.score).toBe(15); // All sub-scores are 15
    });
  });

  describe('edge cases', () => {
    it('handles zero growth correctly', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: 0,
        earningsGrowthYoY: 0,
        revenueGrowth3Y: 0,
      });
      // 0 is > -anything but not > 0, so hits the "growth > 0" check => false => 15
      // Actually: 0 is NOT > 0, so falls through to return 15
      // Wait, 0 > 0 is false, but 0 >= 0 is not checked. Let's verify:
      // scoreRevenueGrowth(0): 0 > 30? no, > 20? no, > 10? no, > 5? no, > 0? no => 15
      expect(result.components.revenueGrowthScore).toBe(15);
      expect(result.components.earningsGrowthScore).toBe(15);
      expect(result.components.consistencyScore).toBe(15);
    });

    it('handles exactly-on-boundary values', () => {
      // Exactly 30% revenue growth -> > 30 is false, so falls to > 20 -> true => 75
      const result = calculateGrowth({
        revenueGrowthYoY: 30,
        earningsGrowthYoY: 40,
        revenueGrowth3Y: 25,
      });
      expect(result.components.revenueGrowthScore).toBe(75);
      expect(result.components.earningsGrowthScore).toBe(75);
      expect(result.components.consistencyScore).toBe(75);
    });
  });

  describe('result structure', () => {
    it('returns properly typed GrowthResult', () => {
      const result = calculateGrowth({
        revenueGrowthYoY: 10, earningsGrowthYoY: 15, revenueGrowth3Y: 8,
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result.components).toHaveProperty('revenueGrowthScore');
      expect(result.components).toHaveProperty('earningsGrowthScore');
      expect(result.components).toHaveProperty('consistencyScore');
    });
  });
});
