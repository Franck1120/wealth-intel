import { describe, it, expect } from 'vitest';
import { calculateQuality, type QualityInput } from '@/lib/scoring/dimensions/quality';

describe('calculateQuality', () => {
  describe('score boundaries', () => {
    it('always returns score between 0 and 100', () => {
      const testCases: QualityInput[] = [
        // All null
        { roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null },
        // All excellent
        { roe: 25, debtToEquity: 0.2, fcfMargin: 20, currentRatio: 3 },
        // All poor
        { roe: 2, debtToEquity: 3, fcfMargin: -5, currentRatio: 0.3 },
        // Mixed
        { roe: 12, debtToEquity: 0.8, fcfMargin: 8, currentRatio: 1.2 },
        // Extreme high values
        { roe: 100, debtToEquity: 0, fcfMargin: 50, currentRatio: 10 },
        // Extreme low / negative values
        { roe: -10, debtToEquity: 10, fcfMargin: -20, currentRatio: 0.1 },
      ];

      for (const input of testCases) {
        const result = calculateQuality(input);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('ROE scoring', () => {
    it('returns roeScore of 30 for null ROE', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.roeScore).toBe(30);
    });

    it('returns roeScore of 90 for ROE > 20% (excellent profitability)', () => {
      const result = calculateQuality({
        roe: 25, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.roeScore).toBe(90);
    });

    it('returns roeScore of 75 for ROE between 15-20%', () => {
      const result = calculateQuality({
        roe: 18, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.roeScore).toBe(75);
    });

    it('returns roeScore of 60 for ROE between 10-15%', () => {
      const result = calculateQuality({
        roe: 12, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.roeScore).toBe(60);
    });

    it('returns roeScore of 40 for ROE between 5-10%', () => {
      const result = calculateQuality({
        roe: 7, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.roeScore).toBe(40);
    });

    it('returns roeScore of 20 for ROE <= 5% (poor profitability)', () => {
      const result = calculateQuality({
        roe: 3, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.roeScore).toBe(20);
    });
  });

  describe('debt-to-equity scoring', () => {
    it('returns debtScore of 30 for null D/E', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.debtScore).toBe(30);
    });

    it('returns debtScore of 90 for D/E < 0.3 (very low leverage)', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: 0.1, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.debtScore).toBe(90);
    });

    it('returns debtScore of 75 for D/E between 0.3-0.7', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: 0.5, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.debtScore).toBe(75);
    });

    it('returns debtScore of 15 for D/E >= 2 (highly leveraged)', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: 3.5, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.debtScore).toBe(15);
    });
  });

  describe('FCF margin scoring', () => {
    it('returns fcfScore of 30 for null FCF margin', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.fcfScore).toBe(30);
    });

    it('returns fcfScore of 90 for FCF margin > 15%', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: 20, currentRatio: null,
      });
      expect(result.components.fcfScore).toBe(90);
    });

    it('returns fcfScore of 15 for negative FCF margin', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: -5, currentRatio: null,
      });
      expect(result.components.fcfScore).toBe(15);
    });
  });

  describe('liquidity scoring', () => {
    it('returns liquidityScore of 30 for null current ratio', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null,
      });
      expect(result.components.liquidityScore).toBe(30);
    });

    it('returns liquidityScore of 85 for current ratio > 2 (very liquid)', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: null, currentRatio: 3,
      });
      expect(result.components.liquidityScore).toBe(85);
    });

    it('returns liquidityScore of 50 for current ratio between 1-1.5', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: null, currentRatio: 1.2,
      });
      expect(result.components.liquidityScore).toBe(50);
    });

    it('returns liquidityScore of 15 for current ratio <= 0.5 (illiquid)', () => {
      const result = calculateQuality({
        roe: null, debtToEquity: null, fcfMargin: null, currentRatio: 0.3,
      });
      expect(result.components.liquidityScore).toBe(15);
    });
  });

  describe('weight distribution', () => {
    it('produces weighted score matching manual calculation', () => {
      const input: QualityInput = {
        roe: 25,            // roeScore = 90
        debtToEquity: 0.1,  // debtScore = 90
        fcfMargin: 20,      // fcfScore = 90
        currentRatio: 3,    // liquidityScore = 85
      };
      const result = calculateQuality(input);

      expect(result.components.roeScore).toBe(90);
      expect(result.components.debtScore).toBe(90);
      expect(result.components.fcfScore).toBe(90);
      expect(result.components.liquidityScore).toBe(85);

      // 90*0.3 + 90*0.25 + 90*0.3 + 85*0.15 = 27 + 22.5 + 27 + 12.75 = 89.25
      const expected = 90 * 0.3 + 90 * 0.25 + 90 * 0.3 + 85 * 0.15;
      expect(result.score).toBeCloseTo(expected, 1);
    });

    it('verifies weights sum to 1.0', () => {
      const totalWeight = 0.3 + 0.25 + 0.3 + 0.15;
      expect(totalWeight).toBeCloseTo(1.0, 10);
    });
  });

  describe('realistic stock data', () => {
    it('scores AAPL-like quality metrics highly', () => {
      // AAPL typical: ROE ~150%, D/E ~2.0, FCF margin ~26%, CR ~1.0
      const result = calculateQuality({
        roe: 150,
        debtToEquity: 2.0,
        fcfMargin: 26,
        currentRatio: 1.0,
      });
      // High ROE and FCF, moderate debt, borderline liquidity
      expect(result.score).toBeGreaterThan(40);
    });

    it('scores a distressed company low', () => {
      // Distressed: negative ROE, high debt, negative FCF, low liquidity
      const result = calculateQuality({
        roe: -5,
        debtToEquity: 5,
        fcfMargin: -10,
        currentRatio: 0.4,
      });
      expect(result.score).toBeLessThan(25);
    });
  });

  describe('result structure', () => {
    it('returns properly typed QualityResult', () => {
      const result = calculateQuality({
        roe: 15, debtToEquity: 0.8, fcfMargin: 10, currentRatio: 1.5,
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result.components).toHaveProperty('roeScore');
      expect(result.components).toHaveProperty('debtScore');
      expect(result.components).toHaveProperty('fcfScore');
      expect(result.components).toHaveProperty('liquidityScore');
    });
  });
});
