import { describe, it, expect } from 'vitest';
import { calculateValue, type ValueInput } from '@/lib/scoring/dimensions/value';

describe('calculateValue', () => {
  describe('score boundaries', () => {
    it('always returns score between 0 and 100', () => {
      const testCases: ValueInput[] = [
        // All null inputs
        { pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20 },
        // All excellent values
        { pe: 8, pb: 0.8, evEbitda: 5, dividendYield: 6, sectorMedianPE: 20 },
        // All poor values
        { pe: 50, pb: 10, evEbitda: 30, dividendYield: 0, sectorMedianPE: 20 },
        // Mixed values
        { pe: 15, pb: 2.5, evEbitda: 10, dividendYield: 2.5, sectorMedianPE: 18 },
        // Extreme values
        { pe: 1000, pb: 100, evEbitda: 500, dividendYield: 0, sectorMedianPE: 15 },
        // Zero P/E
        { pe: 0, pb: 1.5, evEbitda: 12, dividendYield: 3, sectorMedianPE: 20 },
      ];

      for (const input of testCases) {
        const result = calculateValue(input);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('P/E scoring', () => {
    it('returns peScore of 20 for null P/E (loss-making company)', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(20);
    });

    it('returns peScore of 20 for negative P/E', () => {
      const result = calculateValue({
        pe: -5, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(20);
    });

    it('returns peScore of 20 for zero P/E', () => {
      const result = calculateValue({
        pe: 0, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(20);
    });

    it('returns peScore of 50 when sectorMedianPE is zero or negative', () => {
      const result = calculateValue({
        pe: 15, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 0,
      });
      expect(result.components.peScore).toBe(50);

      const result2 = calculateValue({
        pe: 15, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: -5,
      });
      expect(result2.components.peScore).toBe(50);
    });

    it('returns peScore of 90 when P/E is significantly below sector median (<0.7x)', () => {
      // 10 / 20 = 0.5 ratio < 0.7
      const result = calculateValue({
        pe: 10, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(90);
    });

    it('returns peScore of 70 for moderately undervalued (0.7-0.9x sector median)', () => {
      // 16 / 20 = 0.8 ratio
      const result = calculateValue({
        pe: 16, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(70);
    });

    it('returns peScore of 50 for fairly valued (0.9-1.1x sector median)', () => {
      // 20 / 20 = 1.0 ratio
      const result = calculateValue({
        pe: 20, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(50);
    });

    it('returns peScore of 35 for moderately overvalued (1.1-1.5x sector median)', () => {
      // 24 / 20 = 1.2 ratio
      const result = calculateValue({
        pe: 24, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(35);
    });

    it('returns peScore of 15 for significantly overvalued (>1.5x sector median)', () => {
      // 40 / 20 = 2.0 ratio
      const result = calculateValue({
        pe: 40, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.peScore).toBe(15);
    });
  });

  describe('P/B scoring', () => {
    it('returns pbScore of 30 for null P/B', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.pbScore).toBe(30);
    });

    it('returns pbScore of 85 when P/B < 1 (trading below book value)', () => {
      const result = calculateValue({
        pe: null, pb: 0.8, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.pbScore).toBe(85);
    });

    it('returns pbScore of 65 when 1 <= P/B < 2', () => {
      const result = calculateValue({
        pe: null, pb: 1.5, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.pbScore).toBe(65);
    });

    it('returns pbScore of 15 when P/B >= 5 (very expensive)', () => {
      const result = calculateValue({
        pe: null, pb: 8, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.pbScore).toBe(15);
    });
  });

  describe('EV/EBITDA scoring', () => {
    it('returns evEbitdaScore of 30 for null EV/EBITDA', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.evEbitdaScore).toBe(30);
    });

    it('returns evEbitdaScore of 85 when EV/EBITDA < 8 (cheap)', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: 6, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.evEbitdaScore).toBe(85);
    });

    it('returns evEbitdaScore of 15 when EV/EBITDA >= 25 (expensive)', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: 30, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.evEbitdaScore).toBe(15);
    });
  });

  describe('dividend yield scoring', () => {
    it('returns dividendScore of 20 for null dividend yield', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20,
      });
      expect(result.components.dividendScore).toBe(20);
    });

    it('returns dividendScore of 20 for zero dividend yield', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: null, dividendYield: 0, sectorMedianPE: 20,
      });
      expect(result.components.dividendScore).toBe(20);
    });

    it('returns dividendScore of 85 for high yield > 5%', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: null, dividendYield: 6, sectorMedianPE: 20,
      });
      expect(result.components.dividendScore).toBe(85);
    });

    it('returns dividendScore of 25 for very low yield <= 1%', () => {
      const result = calculateValue({
        pe: null, pb: null, evEbitda: null, dividendYield: 0.5, sectorMedianPE: 20,
      });
      expect(result.components.dividendScore).toBe(25);
    });
  });

  describe('weight distribution', () => {
    it('produces weighted score matching manual calculation', () => {
      // Use exact boundary values so we know the sub-scores
      const input: ValueInput = {
        pe: 10,      // ratio 0.5 < 0.7 => peScore = 90
        pb: 0.5,     // < 1 => pbScore = 85
        evEbitda: 5,  // < 8 => evEbitdaScore = 85
        dividendYield: 6, // > 5 => dividendScore = 85
        sectorMedianPE: 20,
      };
      const result = calculateValue(input);

      expect(result.components.peScore).toBe(90);
      expect(result.components.pbScore).toBe(85);
      expect(result.components.evEbitdaScore).toBe(85);
      expect(result.components.dividendScore).toBe(85);

      const expected = 90 * 0.35 + 85 * 0.2 + 85 * 0.25 + 85 * 0.2;
      expect(result.score).toBeCloseTo(expected, 1);
    });
  });

  describe('realistic stock data', () => {
    it('scores MSFT-like fundamentals as fairly valued', () => {
      // MSFT typical metrics: PE ~33, PB ~12, EV/EBITDA ~23, Div yield ~0.8%
      const result = calculateValue({
        pe: 33,
        pb: 12,
        evEbitda: 23,
        dividendYield: 0.8,
        sectorMedianPE: 28,
      });
      // High PE relative to sector, expensive PB and EV/EBITDA, low dividend
      expect(result.score).toBeLessThan(40);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('scores a deep value stock highly', () => {
      // Classic value stock: low PE, low PB, low EV/EBITDA, decent dividend
      const result = calculateValue({
        pe: 8,
        pb: 0.9,
        evEbitda: 6,
        dividendYield: 4,
        sectorMedianPE: 15,
      });
      expect(result.score).toBeGreaterThan(70);
    });
  });

  describe('result structure', () => {
    it('returns properly typed ValueResult', () => {
      const result = calculateValue({
        pe: 15, pb: 2, evEbitda: 10, dividendYield: 3, sectorMedianPE: 18,
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result.components).toHaveProperty('peScore');
      expect(result.components).toHaveProperty('pbScore');
      expect(result.components).toHaveProperty('evEbitdaScore');
      expect(result.components).toHaveProperty('dividendScore');
    });
  });
});
