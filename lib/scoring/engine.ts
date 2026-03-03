/**
 * Scoring Engine
 *
 * Main orchestrator for the Wealth Intelligence scoring system.
 * Combines dimension scores with asset-class-specific weights
 * and an external sentiment score to produce a final overall score.
 *
 * Formula: Overall = (QuantScore * 0.85) + (SentimentScore * 0.15)
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

import { calculateMomentum } from './dimensions/momentum';
import { calculateValue } from './dimensions/value';
import { calculateQuality } from './dimensions/quality';
import { calculateGrowth } from './dimensions/growth';
import { calculateRisk } from './dimensions/risk';
import type { MomentumResult } from './dimensions/momentum';
import type { ValueResult } from './dimensions/value';
import type { QualityResult } from './dimensions/quality';
import type { GrowthResult } from './dimensions/growth';
import type { RiskResult } from './dimensions/risk';
import type { EquitiesScoringInput } from './adapters/equities';
import { EQUITIES_WEIGHTS } from './adapters/equities';
import type { CryptoScoringInput } from './adapters/crypto';
import { CRYPTO_WEIGHTS, CRYPTO_WEIGHTS_NO_TVL, scoreMarketCapRank, scoreTVLToMcap } from './adapters/crypto';
import type { CommoditiesScoringInput } from './adapters/commodities';
import { COMMODITIES_WEIGHTS, COMMODITIES_WEIGHTS_NO_SEASONAL, scoreMeanReversion } from './adapters/commodities';

/** Blend weights for quant vs. sentiment */
const QUANT_WEIGHT = 0.85;
const SENTIMENT_WEIGHT = 0.15;

export interface ScoringResult {
  /** Final blended score: (quantScore * 0.85) + (sentimentScore * 0.15) */
  overallScore: number;
  /** Pure quantitative score from dimension analysis */
  quantScore: number;
  /** External sentiment score (Fear & Greed + volume trend + price momentum) */
  sentimentScore: number;
  /** Individual dimension scores (0-100 each) */
  dimensions: {
    momentum: number;
    value: number;
    quality: number;
    growth: number;
    risk: number;
  };
  /** Detailed component breakdowns per dimension */
  details: {
    momentum: MomentumResult;
    value: ValueResult;
    quality: QualityResult;
    growth: GrowthResult;
    risk: RiskResult;
  };
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round to two decimal places.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Score an equity or ETF across all five dimensions.
 *
 * @param input - Full equity scoring input (momentum, value, quality, growth, risk)
 * @param sentimentScore - External sentiment score 0-100
 * @returns ScoringResult with overall, quant, sentiment, and dimension breakdowns
 */
export function scoreEquity(
  input: EquitiesScoringInput,
  sentimentScore: number,
): ScoringResult {
  const clampedSentiment = clamp(sentimentScore, 0, 100);

  const momentumResult = calculateMomentum(input.momentum);
  const valueResult = calculateValue(input.value);
  const qualityResult = calculateQuality(input.quality);
  const growthResult = calculateGrowth(input.growth);
  const riskResult = calculateRisk(input.risk);

  const quantScore = round2(
    momentumResult.score * EQUITIES_WEIGHTS.momentum +
    valueResult.score * EQUITIES_WEIGHTS.value +
    qualityResult.score * EQUITIES_WEIGHTS.quality +
    growthResult.score * EQUITIES_WEIGHTS.growth +
    riskResult.score * EQUITIES_WEIGHTS.risk,
  );

  const overallScore = round2(
    quantScore * QUANT_WEIGHT + clampedSentiment * SENTIMENT_WEIGHT,
  );

  return {
    overallScore: clamp(overallScore, 0, 100),
    quantScore: clamp(quantScore, 0, 100),
    sentimentScore: clampedSentiment,
    dimensions: {
      momentum: momentumResult.score,
      value: valueResult.score,
      quality: qualityResult.score,
      growth: growthResult.score,
      risk: riskResult.score,
    },
    details: {
      momentum: momentumResult,
      value: valueResult,
      quality: qualityResult,
      growth: growthResult,
      risk: riskResult,
    },
  };
}

/**
 * Placeholder value/quality results for non-equity asset classes.
 * These dimensions are replaced by asset-specific metrics.
 */
function makeNullValueResult(): ValueResult {
  return {
    score: 0,
    components: { peScore: 0, pbScore: 0, evEbitdaScore: 0, dividendScore: 0 },
  };
}

function makeNullQualityResult(): QualityResult {
  return {
    score: 0,
    components: { roeScore: 0, debtScore: 0, fcfScore: 0, liquidityScore: 0 },
  };
}

/**
 * Score a cryptocurrency asset.
 * Replaces value/quality with market cap rank and TVL/MCap ratio.
 * For non-DeFi tokens (tvlToMcapRatio = null), TVL weight is redistributed.
 *
 * @param input - Crypto scoring input
 * @param sentimentScore - External sentiment score 0-100
 * @returns ScoringResult with overall, quant, sentiment, and dimension breakdowns
 */
export function scoreCrypto(
  input: CryptoScoringInput,
  sentimentScore: number,
): ScoringResult {
  const clampedSentiment = clamp(sentimentScore, 0, 100);

  const momentumResult = calculateMomentum(input.momentum);
  const growthResult = calculateGrowth(input.growth);
  const riskResult = calculateRisk(input.risk);

  const marketCapScore = scoreMarketCapRank(input.marketCapRank);
  const tvlScore = scoreTVLToMcap(input.tvlToMcapRatio);
  const isDeFi = tvlScore !== null;

  const weights = isDeFi ? CRYPTO_WEIGHTS : CRYPTO_WEIGHTS_NO_TVL;

  const quantScore = round2(
    momentumResult.score * weights.momentum +
    marketCapScore * weights.marketCapRank +
    (isDeFi ? tvlScore * weights.tvlMcap : 0) +
    growthResult.score * weights.growth +
    riskResult.score * weights.risk,
  );

  const overallScore = round2(
    quantScore * QUANT_WEIGHT + clampedSentiment * SENTIMENT_WEIGHT,
  );

  return {
    overallScore: clamp(overallScore, 0, 100),
    quantScore: clamp(quantScore, 0, 100),
    sentimentScore: clampedSentiment,
    dimensions: {
      momentum: momentumResult.score,
      value: marketCapScore,
      quality: isDeFi ? tvlScore : 0,
      growth: growthResult.score,
      risk: riskResult.score,
    },
    details: {
      momentum: momentumResult,
      value: makeNullValueResult(),
      quality: makeNullQualityResult(),
      growth: growthResult,
      risk: riskResult,
    },
  };
}

/**
 * Score a commodity or forex asset.
 * Replaces value/quality with mean reversion and seasonal pattern score.
 * For assets without seasonal data, seasonal weight is redistributed.
 *
 * @param input - Commodities/forex scoring input
 * @param sentimentScore - External sentiment score 0-100
 * @returns ScoringResult with overall, quant, sentiment, and dimension breakdowns
 */
export function scoreCommodity(
  input: CommoditiesScoringInput,
  sentimentScore: number,
): ScoringResult {
  const clampedSentiment = clamp(sentimentScore, 0, 100);

  const momentumResult = calculateMomentum(input.momentum);
  const growthResult = calculateGrowth(input.growth);
  const riskResult = calculateRisk(input.risk);

  const meanReversionScore = scoreMeanReversion(input.meanReversionDistance);
  const hasSeasonal = input.seasonalScore !== null;
  const seasonalValue = hasSeasonal ? clamp(input.seasonalScore!, 0, 100) : 0;

  const weights = hasSeasonal ? COMMODITIES_WEIGHTS : COMMODITIES_WEIGHTS_NO_SEASONAL;

  const quantScore = round2(
    momentumResult.score * weights.momentum +
    meanReversionScore * weights.meanReversion +
    (hasSeasonal ? seasonalValue * weights.seasonal : 0) +
    growthResult.score * weights.growth +
    riskResult.score * weights.risk,
  );

  const overallScore = round2(
    quantScore * QUANT_WEIGHT + clampedSentiment * SENTIMENT_WEIGHT,
  );

  return {
    overallScore: clamp(overallScore, 0, 100),
    quantScore: clamp(quantScore, 0, 100),
    sentimentScore: clampedSentiment,
    dimensions: {
      momentum: momentumResult.score,
      value: meanReversionScore,
      quality: hasSeasonal ? seasonalValue : 0,
      growth: growthResult.score,
      risk: riskResult.score,
    },
    details: {
      momentum: momentumResult,
      value: makeNullValueResult(),
      quality: makeNullQualityResult(),
      growth: growthResult,
      risk: riskResult,
    },
  };
}
