/**
 * Equities Scoring Adapter
 *
 * Defines the input shape and dimension weights for equities/ETF scoring.
 * Equities use all five dimensions with equal weighting.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

import type { MomentumInput } from '@/lib/scoring/dimensions/momentum';
import type { ValueInput } from '@/lib/scoring/dimensions/value';
import type { QualityInput } from '@/lib/scoring/dimensions/quality';
import type { GrowthInput } from '@/lib/scoring/dimensions/growth';
import type { RiskInput } from '@/lib/scoring/dimensions/risk';

export interface EquitiesScoringInput {
  momentum: MomentumInput;
  value: ValueInput;
  quality: QualityInput;
  growth: GrowthInput;
  risk: RiskInput;
}

/**
 * Dimension weights for equities scoring.
 * Equal weighting across all five dimensions reflects a balanced
 * approach to equity analysis without bias toward any single factor.
 */
export const EQUITIES_WEIGHTS = {
  momentum: 0.20,
  value: 0.20,
  quality: 0.20,
  growth: 0.20,
  risk: 0.20,
} as const;
