/**
 * Commodities / Forex Scoring Adapter
 *
 * Defines the input shape, dimension weights, and commodity-specific
 * scoring functions for commodities and forex assets.
 * Replaces value/quality dimensions with mean reversion and seasonal patterns.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

import type { MomentumInput } from '@/lib/scoring/dimensions/momentum';
import type { GrowthInput } from '@/lib/scoring/dimensions/growth';
import type { RiskInput } from '@/lib/scoring/dimensions/risk';

export interface CommoditiesScoringInput {
  momentum: MomentumInput;
  /** Percentage distance from 200-day SMA (e.g., -10 = 10% below SMA200) */
  meanReversionDistance: number;
  /** Pre-calculated seasonal pattern score 0-100 (null if not available) */
  seasonalScore: number | null;
  risk: RiskInput;
  growth: GrowthInput;
}

/**
 * Dimension weights for commodities/forex scoring.
 * Momentum weighted highest due to trend-following nature of commodities.
 * Mean reversion captures cyclical commodity behavior.
 */
export const COMMODITIES_WEIGHTS = {
  momentum: 0.25,
  meanReversion: 0.20,
  seasonal: 0.15,
  growth: 0.20,
  risk: 0.20,
} as const;

/**
 * Redistributed weights when seasonal score is not available.
 * Seasonal weight is split between mean reversion (+0.08) and momentum (+0.07).
 */
export const COMMODITIES_WEIGHTS_NO_SEASONAL = {
  momentum: 0.32,
  meanReversion: 0.28,
  seasonal: 0,
  growth: 0.20,
  risk: 0.20,
} as const;

/**
 * Score mean reversion distance from 200-day SMA.
 * Price significantly below SMA200 = buy signal (mean reversion opportunity).
 * Price significantly above SMA200 = overbought (sell signal).
 *
 * @param distance - Percentage distance from SMA200 (negative = below, positive = above)
 */
export function scoreMeanReversion(distance: number): number {
  if (distance < -15) return 85;
  if (distance < -5) return 70;
  if (distance >= -5 && distance <= 5) return 50;
  if (distance <= 15) return 35;
  return 20;
}
