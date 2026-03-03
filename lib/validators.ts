import { z } from 'zod';

// Reusable primitives
const uuid = z.string().uuid();
const positiveNumber = z.number().positive();
const nonNegativeNumber = z.number().nonnegative();

// Enum values matching Database types
const ASSET_TYPES = ['stock', 'etf', 'crypto', 'commodity', 'forex', 'reit', 'bond', 'alternative', 'business'] as const;
const MODULES = ['equities', 'crypto', 'macro', 'real_estate', 'commodities', 'forex', 'alternative', 'business'] as const;
const TRANSACTION_TYPES = ['buy', 'sell', 'dividend', 'staking_reward', 'interest', 'fee'] as const;
const OPPORTUNITY_STATUSES = ['discovered', 'researching', 'validated', 'watching', 'invested', 'exited', 'rejected'] as const;
const JOURNAL_ACTIONS = ['buy', 'sell', 'hold', 'skip'] as const;
const EMOTIONS = ['calm', 'excited', 'fearful', 'fomo', 'confident'] as const;
const ALERT_CONDITIONS = ['price_above', 'price_below', 'pct_change', 'macro_threshold'] as const;

/** Portfolio creation/update validation */
export const portfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
  base_currency: z.string().default('EUR'),
});

/** Asset creation/update validation */
export const assetSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  name: z.string().min(1, 'Asset name is required'),
  type: z.enum(ASSET_TYPES),
  module: z.enum(MODULES),
  exchange: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/** Holding creation/update validation */
export const holdingSchema = z.object({
  portfolio_id: uuid,
  asset_id: uuid,
  quantity: positiveNumber,
  avg_cost_basis: positiveNumber,
  notes: z.string().optional(),
});

/** Transaction creation validation */
export const transactionSchema = z.object({
  portfolio_id: uuid,
  asset_id: uuid,
  type: z.enum(TRANSACTION_TYPES),
  quantity: positiveNumber,
  price: positiveNumber,
  fees: nonNegativeNumber.default(0),
  currency: z.string().default('EUR'),
  executed_at: z.string().datetime('Must be a valid ISO datetime'),
  notes: z.string().optional(),
});

/** Opportunity creation/update validation */
export const opportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  module: z.enum(MODULES),
  category: z.string().optional(),
  status: z.enum(OPPORTUNITY_STATUSES).default('discovered'),
  thesis: z.string().optional(),
  risks: z.string().optional(),
  target_price: positiveNumber.optional(),
  stop_loss: positiveNumber.optional(),
  source: z.string().optional(),
});

/** Decision journal entry validation */
export const journalEntrySchema = z.object({
  asset_id: uuid.optional(),
  opportunity_id: uuid.optional(),
  action: z.enum(JOURNAL_ACTIONS),
  reasoning: z.string().min(10, 'Reasoning must be at least 10 characters'),
  emotion: z.enum(EMOTIONS).optional(),
  conviction: z.number().int().min(1).max(10).optional(),
});

/** Alert creation/update validation */
export const alertSchema = z.object({
  asset_id: uuid.optional(),
  indicator_key: z.string().optional(),
  condition: z.enum(ALERT_CONDITIONS),
  threshold: z.number(),
  is_active: z.boolean().default(true),
});

/** Asset score request validation */
export const assetScoreRequestSchema = z.object({
  assetId: uuid,
  symbol: z.string().min(1, 'Symbol is required'),
  type: z.enum(['stock', 'etf', 'crypto', 'commodity'] as const),
});

// Inferred types from schemas
export type PortfolioInput = z.infer<typeof portfolioSchema>;
export type AssetInput = z.infer<typeof assetSchema>;
export type HoldingInput = z.infer<typeof holdingSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type OpportunityInput = z.infer<typeof opportunitySchema>;
export type JournalEntryInput = z.infer<typeof journalEntrySchema>;
export type AlertInput = z.infer<typeof alertSchema>;
export type AssetScoreRequestInput = z.infer<typeof assetScoreRequestSchema>;
