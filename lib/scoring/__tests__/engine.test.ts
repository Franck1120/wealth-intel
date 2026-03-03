import { describe, it, expect } from 'vitest';
import { scoreEquity, scoreCrypto, scoreCommodity, type ScoringResult } from '@/lib/scoring/engine';
import type { EquitiesScoringInput } from '@/lib/scoring/adapters/equities';
import type { CryptoScoringInput } from '@/lib/scoring/adapters/crypto';
import type { CommoditiesScoringInput } from '@/lib/scoring/adapters/commodities';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Generate a simple uptrend price series */
function generateUptrend(days: number, start = 100, step = 0.5): number[] {
  return Array.from({ length: days }, (_, i) => start + i * step);
}

/** Generate a simple downtrend price series */
function generateDowntrend(days: number, start = 200, step = 0.5): number[] {
  return Array.from({ length: days }, (_, i) => start - i * step);
}

/** Generate deterministic daily returns with controlled volatility */
function generateReturns(days: number, dailyVol: number, seed = 42): number[] {
  const returns: number[] = [];
  let s = seed;
  for (let i = 0; i < days; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const u1 = (s % 10000) / 10000;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const u2 = (s % 10000) / 10000;
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
    returns.push(z * dailyVol);
  }
  return returns;
}

// ---------------------------------------------------------------------------
// Realistic mock data factories
// ---------------------------------------------------------------------------

function makeMSFTEquityInput(): EquitiesScoringInput {
  return {
    momentum: {
      prices: generateUptrend(260, 330, 0.25),
      volumes: Array(260).fill(25e6),
    },
    value: {
      pe: 35,
      pb: 12,
      evEbitda: 24,
      dividendYield: 0.8,
      sectorMedianPE: 28,
    },
    quality: {
      roe: 38,
      debtToEquity: 0.45,
      fcfMargin: 30,
      currentRatio: 1.8,
    },
    growth: {
      revenueGrowthYoY: 16,
      earningsGrowthYoY: 22,
      revenueGrowth3Y: 14,
    },
    risk: {
      dailyReturns: generateReturns(60, 0.015, 101),
      beta: 0.9,
      maxDrawdown1Y: -0.12,
    },
  };
}

function makeBTCCryptoInput(): CryptoScoringInput {
  return {
    momentum: {
      prices: generateUptrend(260, 30000, 100),
      volumes: Array(260).fill(30e9),
    },
    marketCapRank: 1,
    tvlToMcapRatio: null, // BTC is not a DeFi protocol
    growth: {
      revenueGrowthYoY: null,
      earningsGrowthYoY: null,
      revenueGrowth3Y: null,
    },
    risk: {
      dailyReturns: generateReturns(60, 0.035, 202),
      beta: 1.5,
      maxDrawdown1Y: -0.35,
    },
  };
}

function makeAAVECryptoInput(): CryptoScoringInput {
  return {
    momentum: {
      prices: generateUptrend(260, 80, 0.5),
      volumes: Array(260).fill(200e6),
    },
    marketCapRank: 45,
    tvlToMcapRatio: 0.8, // DeFi protocol with significant TVL
    growth: {
      revenueGrowthYoY: 40,
      earningsGrowthYoY: null,
      revenueGrowth3Y: 25,
    },
    risk: {
      dailyReturns: generateReturns(60, 0.04, 303),
      beta: 1.8,
      maxDrawdown1Y: -0.45,
    },
  };
}

function makeGoldCommodityInput(): CommoditiesScoringInput {
  return {
    momentum: {
      prices: generateUptrend(260, 1800, 2),
      volumes: Array(260).fill(180e6),
    },
    meanReversionDistance: -3, // 3% below SMA200
    seasonalScore: 65,
    growth: {
      revenueGrowthYoY: 8,
      earningsGrowthYoY: null,
      revenueGrowth3Y: 5,
    },
    risk: {
      dailyReturns: generateReturns(60, 0.01, 404),
      beta: 0.1,
      maxDrawdown1Y: -0.08,
    },
  };
}

function makeOilCommodityInput(): CommoditiesScoringInput {
  return {
    momentum: {
      prices: generateDowntrend(260, 90, 0.1),
      volumes: Array(260).fill(100e6),
    },
    meanReversionDistance: -18, // 18% below SMA200 (deep discount)
    seasonalScore: null, // No seasonal data
    growth: {
      revenueGrowthYoY: -5,
      earningsGrowthYoY: -10,
      revenueGrowth3Y: -2,
    },
    risk: {
      dailyReturns: generateReturns(60, 0.025, 505),
      beta: 1.3,
      maxDrawdown1Y: -0.30,
    },
  };
}

// ---------------------------------------------------------------------------
// Shared assertion helper
// ---------------------------------------------------------------------------

function assertValidScoringResult(result: ScoringResult): void {
  expect(result.overallScore).toBeGreaterThanOrEqual(0);
  expect(result.overallScore).toBeLessThanOrEqual(100);
  expect(result.quantScore).toBeGreaterThanOrEqual(0);
  expect(result.quantScore).toBeLessThanOrEqual(100);
  expect(result.sentimentScore).toBeGreaterThanOrEqual(0);
  expect(result.sentimentScore).toBeLessThanOrEqual(100);

  for (const dim of ['momentum', 'value', 'quality', 'growth', 'risk'] as const) {
    expect(result.dimensions[dim]).toBeGreaterThanOrEqual(0);
    expect(result.dimensions[dim]).toBeLessThanOrEqual(100);
  }
}

// ===========================================================================
// Tests
// ===========================================================================

describe('Scoring Engine', () => {
  // -------------------------------------------------------------------------
  // 0.85/0.15 quant/sentiment weighting
  // -------------------------------------------------------------------------
  describe('quant/sentiment weighting (0.85/0.15)', () => {
    it('blends quantScore * 0.85 + sentimentScore * 0.15', () => {
      const input = makeMSFTEquityInput();
      const result = scoreEquity(input, 60);

      const expectedOverall = result.quantScore * 0.85 + 60 * 0.15;
      expect(result.overallScore).toBeCloseTo(expectedOverall, 1);
    });

    it('sentiment=0 means overallScore = quantScore * 0.85', () => {
      const input = makeMSFTEquityInput();
      const result = scoreEquity(input, 0);

      expect(result.sentimentScore).toBe(0);
      expect(result.overallScore).toBeCloseTo(result.quantScore * 0.85, 1);
    });

    it('sentiment=100 adds maximum 15 points to overall', () => {
      const input = makeMSFTEquityInput();
      const result = scoreEquity(input, 100);

      expect(result.sentimentScore).toBe(100);
      const expectedOverall = result.quantScore * 0.85 + 100 * 0.15;
      expect(result.overallScore).toBeCloseTo(expectedOverall, 1);
    });

    it('clamps sentiment below 0 to 0', () => {
      const input = makeMSFTEquityInput();
      const result = scoreEquity(input, -50);

      expect(result.sentimentScore).toBe(0);
    });

    it('clamps sentiment above 100 to 100', () => {
      const input = makeMSFTEquityInput();
      const result = scoreEquity(input, 200);

      expect(result.sentimentScore).toBe(100);
    });

    it('produces identical quant scores regardless of sentiment', () => {
      const input = makeMSFTEquityInput();
      const r1 = scoreEquity(input, 0);
      const r2 = scoreEquity(input, 50);
      const r3 = scoreEquity(input, 100);

      expect(r1.quantScore).toBe(r2.quantScore);
      expect(r2.quantScore).toBe(r3.quantScore);
    });
  });

  // -------------------------------------------------------------------------
  // Equities adapter
  // -------------------------------------------------------------------------
  describe('scoreEquity', () => {
    it('returns valid ScoringResult for MSFT-like input', () => {
      const result = scoreEquity(makeMSFTEquityInput(), 55);
      assertValidScoringResult(result);
    });

    it('uses equal 0.20 weighting across all 5 dimensions', () => {
      const input = makeMSFTEquityInput();
      const result = scoreEquity(input, 50);

      const manualQuant =
        result.dimensions.momentum * 0.2 +
        result.dimensions.value * 0.2 +
        result.dimensions.quality * 0.2 +
        result.dimensions.growth * 0.2 +
        result.dimensions.risk * 0.2;

      expect(result.quantScore).toBeCloseTo(manualQuant, 1);
    });

    it('returns full details for all 5 dimensions', () => {
      const result = scoreEquity(makeMSFTEquityInput(), 50);

      expect(result.details.momentum).toHaveProperty('components');
      expect(result.details.value).toHaveProperty('components');
      expect(result.details.quality).toHaveProperty('components');
      expect(result.details.growth).toHaveProperty('components');
      expect(result.details.risk).toHaveProperty('components');
    });

    it('handles all-null fundamentals gracefully', () => {
      const input: EquitiesScoringInput = {
        momentum: { prices: generateUptrend(20), volumes: Array(20).fill(1e6) },
        value: { pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20 },
        quality: { roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null },
        growth: { revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null },
        risk: { dailyReturns: [], beta: null, maxDrawdown1Y: null },
      };
      const result = scoreEquity(input, 50);
      assertValidScoringResult(result);
    });

    it('handles minimum data (few prices, no fundamentals)', () => {
      const input: EquitiesScoringInput = {
        momentum: { prices: [100, 101, 102], volumes: [1e6, 1e6, 1e6] },
        value: { pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 0 },
        quality: { roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null },
        growth: { revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null },
        risk: { dailyReturns: [], beta: null, maxDrawdown1Y: null },
      };
      const result = scoreEquity(input, 50);
      assertValidScoringResult(result);
    });

    it('scores a high-quality growth stock higher than a declining value trap', () => {
      const growthInput = makeMSFTEquityInput();
      const valueTrap: EquitiesScoringInput = {
        momentum: { prices: generateDowntrend(260, 100, 0.2), volumes: Array(260).fill(5e6) },
        value: { pe: 50, pb: 8, evEbitda: 30, dividendYield: 0, sectorMedianPE: 15 },
        quality: { roe: -5, debtToEquity: 4, fcfMargin: -10, currentRatio: 0.4 },
        growth: { revenueGrowthYoY: -15, earningsGrowthYoY: -30, revenueGrowth3Y: -8 },
        risk: { dailyReturns: generateReturns(60, 0.04, 999), beta: 2.0, maxDrawdown1Y: -0.55 },
      };

      const growthResult = scoreEquity(growthInput, 60);
      const valueTrapResult = scoreEquity(valueTrap, 30);

      expect(growthResult.overallScore).toBeGreaterThan(valueTrapResult.overallScore);
    });
  });

  // -------------------------------------------------------------------------
  // Crypto adapter
  // -------------------------------------------------------------------------
  describe('scoreCrypto', () => {
    it('returns valid ScoringResult for BTC-like input (non-DeFi)', () => {
      const result = scoreCrypto(makeBTCCryptoInput(), 65);
      assertValidScoringResult(result);
    });

    it('returns valid ScoringResult for AAVE-like input (DeFi)', () => {
      const result = scoreCrypto(makeAAVECryptoInput(), 55);
      assertValidScoringResult(result);
    });

    it('uses non-DeFi weights when tvlToMcapRatio is null', () => {
      const input = makeBTCCryptoInput();
      expect(input.tvlToMcapRatio).toBeNull();

      const result = scoreCrypto(input, 50);

      // Non-DeFi weights: momentum 0.33, marketCapRank 0.20, tvl 0, growth 0.20, risk 0.27
      const manualQuant =
        result.dimensions.momentum * 0.33 +
        result.dimensions.value * 0.20 + // marketCapScore stored in value
        0 + // tvl weight is 0
        result.dimensions.growth * 0.20 +
        result.dimensions.risk * 0.27;

      expect(result.quantScore).toBeCloseTo(manualQuant, 1);
    });

    it('uses DeFi weights when tvlToMcapRatio is provided', () => {
      const input = makeAAVECryptoInput();
      expect(input.tvlToMcapRatio).not.toBeNull();

      const result = scoreCrypto(input, 50);

      // DeFi weights: momentum 0.25, marketCapRank 0.20, tvlMcap 0.15, growth 0.20, risk 0.20
      const manualQuant =
        result.dimensions.momentum * 0.25 +
        result.dimensions.value * 0.20 + // marketCapScore
        result.dimensions.quality * 0.15 + // tvlScore
        result.dimensions.growth * 0.20 +
        result.dimensions.risk * 0.20;

      expect(result.quantScore).toBeCloseTo(manualQuant, 1);
    });

    it('sets quality dimension to 0 for non-DeFi tokens', () => {
      const result = scoreCrypto(makeBTCCryptoInput(), 50);
      expect(result.dimensions.quality).toBe(0);
    });

    it('scores top-ranked crypto (rank 1) market cap dimension at 90', () => {
      const result = scoreCrypto(makeBTCCryptoInput(), 50);
      expect(result.dimensions.value).toBe(90); // marketCapRank 1 => score 90
    });

    it('scores mid-ranked crypto lower on market cap dimension', () => {
      const input = makeAAVECryptoInput();
      input.marketCapRank = 200;
      const result = scoreCrypto(input, 50);
      expect(result.dimensions.value).toBe(40); // rank 200 => 40
    });

    it('handles BTC vs altcoin scoring comparison', () => {
      const btcResult = scoreCrypto(makeBTCCryptoInput(), 60);
      const altcoinInput: CryptoScoringInput = {
        momentum: { prices: generateDowntrend(260, 5, 0.01), volumes: Array(260).fill(1e6) },
        marketCapRank: 800,
        tvlToMcapRatio: null,
        growth: { revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null },
        risk: { dailyReturns: generateReturns(60, 0.08, 777), beta: 3.0, maxDrawdown1Y: -0.80 },
      };
      const altcoinResult = scoreCrypto(altcoinInput, 30);

      expect(btcResult.overallScore).toBeGreaterThan(altcoinResult.overallScore);
    });
  });

  // -------------------------------------------------------------------------
  // Commodities adapter
  // -------------------------------------------------------------------------
  describe('scoreCommodity', () => {
    it('returns valid ScoringResult for gold-like input (with seasonal)', () => {
      const result = scoreCommodity(makeGoldCommodityInput(), 55);
      assertValidScoringResult(result);
    });

    it('returns valid ScoringResult for oil-like input (no seasonal)', () => {
      const result = scoreCommodity(makeOilCommodityInput(), 40);
      assertValidScoringResult(result);
    });

    it('uses full weights when seasonalScore is provided', () => {
      const input = makeGoldCommodityInput();
      expect(input.seasonalScore).not.toBeNull();

      const result = scoreCommodity(input, 50);

      // With seasonal: momentum 0.25, meanReversion 0.20, seasonal 0.15, growth 0.20, risk 0.20
      const manualQuant =
        result.dimensions.momentum * 0.25 +
        result.dimensions.value * 0.20 + // meanReversionScore
        result.dimensions.quality * 0.15 + // seasonalScore
        result.dimensions.growth * 0.20 +
        result.dimensions.risk * 0.20;

      expect(result.quantScore).toBeCloseTo(manualQuant, 1);
    });

    it('uses no-seasonal weights when seasonalScore is null', () => {
      const input = makeOilCommodityInput();
      expect(input.seasonalScore).toBeNull();

      const result = scoreCommodity(input, 50);

      // No seasonal: momentum 0.32, meanReversion 0.28, seasonal 0, growth 0.20, risk 0.20
      const manualQuant =
        result.dimensions.momentum * 0.32 +
        result.dimensions.value * 0.28 + // meanReversionScore
        0 + // seasonal weight is 0
        result.dimensions.growth * 0.20 +
        result.dimensions.risk * 0.20;

      expect(result.quantScore).toBeCloseTo(manualQuant, 1);
    });

    it('sets quality dimension to 0 when seasonalScore is null', () => {
      const result = scoreCommodity(makeOilCommodityInput(), 50);
      expect(result.dimensions.quality).toBe(0);
    });

    it('scores mean reversion correctly for asset below SMA200', () => {
      // meanReversionDistance = -18 => < -15 => score 85
      const result = scoreCommodity(makeOilCommodityInput(), 50);
      expect(result.dimensions.value).toBe(85); // deep discount from SMA200
    });

    it('scores mean reversion correctly for asset near SMA200', () => {
      const input = makeGoldCommodityInput();
      input.meanReversionDistance = 0; // exactly at SMA200
      const result = scoreCommodity(input, 50);
      expect(result.dimensions.value).toBe(50); // at SMA200 => neutral 50
    });

    it('clamps seasonal score to 0-100 range', () => {
      const input = makeGoldCommodityInput();
      input.seasonalScore = 150; // above 100
      const result = scoreCommodity(input, 50);
      // Quality dimension should be clamped to 100
      expect(result.dimensions.quality).toBeLessThanOrEqual(100);
    });
  });

  // -------------------------------------------------------------------------
  // Cross-adapter comparisons
  // -------------------------------------------------------------------------
  describe('cross-adapter behavior', () => {
    it('all adapters return the same ScoringResult shape', () => {
      const eqResult = scoreEquity(makeMSFTEquityInput(), 50);
      const crResult = scoreCrypto(makeBTCCryptoInput(), 50);
      const coResult = scoreCommodity(makeGoldCommodityInput(), 50);

      const shapeKeys = ['overallScore', 'quantScore', 'sentimentScore', 'dimensions', 'details'];
      for (const key of shapeKeys) {
        expect(eqResult).toHaveProperty(key);
        expect(crResult).toHaveProperty(key);
        expect(coResult).toHaveProperty(key);
      }
    });

    it('all adapters respect 0.85/0.15 blending formula', () => {
      const eqResult = scoreEquity(makeMSFTEquityInput(), 70);
      const crResult = scoreCrypto(makeBTCCryptoInput(), 70);
      const coResult = scoreCommodity(makeGoldCommodityInput(), 70);

      for (const r of [eqResult, crResult, coResult]) {
        const expected = r.quantScore * 0.85 + 70 * 0.15;
        expect(r.overallScore).toBeCloseTo(expected, 1);
      }
    });

    it('all adapters produce overallScore in [0, 100]', () => {
      const results = [
        scoreEquity(makeMSFTEquityInput(), 0),
        scoreEquity(makeMSFTEquityInput(), 100),
        scoreCrypto(makeBTCCryptoInput(), 0),
        scoreCrypto(makeBTCCryptoInput(), 100),
        scoreCommodity(makeGoldCommodityInput(), 0),
        scoreCommodity(makeGoldCommodityInput(), 100),
      ];

      for (const r of results) {
        expect(r.overallScore).toBeGreaterThanOrEqual(0);
        expect(r.overallScore).toBeLessThanOrEqual(100);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles empty price arrays in all adapters', () => {
      const emptyMomentum = { prices: [] as number[], volumes: [] as number[] };
      const emptyRisk = { dailyReturns: [] as number[], beta: null, maxDrawdown1Y: null };
      const emptyGrowth = { revenueGrowthYoY: null, earningsGrowthYoY: null, revenueGrowth3Y: null };

      const eqResult = scoreEquity({
        momentum: emptyMomentum,
        value: { pe: null, pb: null, evEbitda: null, dividendYield: null, sectorMedianPE: 20 },
        quality: { roe: null, debtToEquity: null, fcfMargin: null, currentRatio: null },
        growth: emptyGrowth,
        risk: emptyRisk,
      }, 50);
      assertValidScoringResult(eqResult);

      const crResult = scoreCrypto({
        momentum: emptyMomentum,
        marketCapRank: 1,
        tvlToMcapRatio: null,
        growth: emptyGrowth,
        risk: emptyRisk,
      }, 50);
      assertValidScoringResult(crResult);

      const coResult = scoreCommodity({
        momentum: emptyMomentum,
        meanReversionDistance: 0,
        seasonalScore: null,
        growth: emptyGrowth,
        risk: emptyRisk,
      }, 50);
      assertValidScoringResult(coResult);
    });

    it('handles extreme sentiment values (negative and very high)', () => {
      const input = makeMSFTEquityInput();

      const r1 = scoreEquity(input, -100);
      expect(r1.sentimentScore).toBe(0);
      assertValidScoringResult(r1);

      const r2 = scoreEquity(input, 999);
      expect(r2.sentimentScore).toBe(100);
      assertValidScoringResult(r2);
    });
  });
});
