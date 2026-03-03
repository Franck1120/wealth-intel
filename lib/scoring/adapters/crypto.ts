/**
 * Crypto Scoring Adapter
 *
 * Defines the input shape, dimension weights, and crypto-specific
 * scoring functions for cryptocurrency assets.
 * Replaces value/quality dimensions with market cap rank and TVL/MCap ratio.
 *
 * 100% quantitative -- pure math, zero AI dependency.
 */

import type { MomentumInput } from '@/lib/scoring/dimensions/momentum';
import type { GrowthInput } from '@/lib/scoring/dimensions/growth';
import type { RiskInput } from '@/lib/scoring/dimensions/risk';

export interface CryptoScoringInput {
  momentum: MomentumInput;
  /** 1-based market cap rank (1 = largest) */
  marketCapRank: number;
  /** TVL / Market Cap ratio (DeFi only, null for non-DeFi tokens) */
  tvlToMcapRatio: number | null;
  risk: RiskInput;
  /** Use price growth as proxy for earnings/revenue growth */
  growth: GrowthInput;
}

/**
 * Dimension weights for crypto scoring.
 * Momentum is weighted higher due to crypto's trend-following nature.
 * TVL/MCap only applies to DeFi; weight is redistributed when null.
 */
export const CRYPTO_WEIGHTS = {
  momentum: 0.25,
  marketCapRank: 0.20,
  tvlMcap: 0.15,
  growth: 0.20,
  risk: 0.20,
} as const;

/**
 * Redistributed weights when TVL/MCap is not applicable (non-DeFi tokens).
 * TVL weight is split between momentum (+0.08) and risk (+0.07).
 */
export const CRYPTO_WEIGHTS_NO_TVL = {
  momentum: 0.33,
  marketCapRank: 0.20,
  tvlMcap: 0,
  growth: 0.20,
  risk: 0.27,
} as const;

/**
 * Score market cap rank.
 * Higher rank (lower number) = more established/liquid = higher score.
 */
export function scoreMarketCapRank(rank: number): number {
  if (rank <= 10) return 90;
  if (rank <= 30) return 75;
  if (rank <= 100) return 60;
  if (rank <= 300) return 40;
  if (rank <= 500) return 25;
  return 10;
}

/**
 * Score TVL-to-Market-Cap ratio (DeFi protocols only).
 * Higher TVL relative to market cap suggests the protocol captures
 * real economic value rather than pure speculation.
 *
 * Returns null for non-DeFi tokens (weight should be redistributed).
 */
export function scoreTVLToMcap(ratio: number | null): number | null {
  if (ratio === null) return null;

  if (ratio > 1.0) return 90;
  if (ratio > 0.5) return 70;
  if (ratio > 0.2) return 50;
  if (ratio > 0.1) return 35;
  return 20;
}
