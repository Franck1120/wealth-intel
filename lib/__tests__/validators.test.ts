import { describe, it, expect } from 'vitest';
import {
  portfolioSchema,
  assetSchema,
  holdingSchema,
  transactionSchema,
  opportunitySchema,
  journalEntrySchema,
  alertSchema,
  assetScoreRequestSchema,
} from '@/lib/validators';

// ---------------------------------------------------------------------------
// Helper: valid UUID for tests
// ---------------------------------------------------------------------------
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

// ---------------------------------------------------------------------------
// portfolioSchema
// ---------------------------------------------------------------------------

describe('portfolioSchema', () => {
  it('accepts valid portfolio with required fields', () => {
    const result = portfolioSchema.safeParse({ name: 'My Portfolio' });
    expect(result.success).toBe(true);
  });

  it('accepts portfolio with all optional fields', () => {
    const result = portfolioSchema.safeParse({
      name: 'My Portfolio',
      description: 'A test portfolio',
      base_currency: 'USD',
    });
    expect(result.success).toBe(true);
  });

  it('defaults base_currency to EUR', () => {
    const result = portfolioSchema.parse({ name: 'Test' });
    expect(result.base_currency).toBe('EUR');
  });

  it('rejects empty name', () => {
    const result = portfolioSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing name', () => {
    const result = portfolioSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-string name', () => {
    const result = portfolioSchema.safeParse({ name: 123 });
    expect(result.success).toBe(false);
  });

  it('accepts very long name', () => {
    const result = portfolioSchema.safeParse({ name: 'A'.repeat(1000) });
    expect(result.success).toBe(true);
  });

  it('accepts portfolio with description omitted', () => {
    const result = portfolioSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// assetSchema
// ---------------------------------------------------------------------------

describe('assetSchema', () => {
  it('accepts valid asset with required fields', () => {
    const result = assetSchema.safeParse({
      symbol: 'aapl',
      name: 'Apple Inc.',
      type: 'stock',
      module: 'equities',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.symbol).toBe('AAPL'); // uppercased
    }
  });

  it('uppercases the symbol', () => {
    const result = assetSchema.parse({
      symbol: 'btc',
      name: 'Bitcoin',
      type: 'crypto',
      module: 'crypto',
    });
    expect(result.symbol).toBe('BTC');
  });

  it('rejects empty symbol', () => {
    const result = assetSchema.safeParse({
      symbol: '',
      name: 'Apple',
      type: 'stock',
      module: 'equities',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = assetSchema.safeParse({
      symbol: 'AAPL',
      name: '',
      type: 'stock',
      module: 'equities',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid asset type', () => {
    const result = assetSchema.safeParse({
      symbol: 'AAPL',
      name: 'Apple',
      type: 'invalid_type',
      module: 'equities',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid module', () => {
    const result = assetSchema.safeParse({
      symbol: 'AAPL',
      name: 'Apple',
      type: 'stock',
      module: 'invalid_module',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid asset types', () => {
    const types = ['stock', 'etf', 'crypto', 'commodity', 'forex', 'reit', 'bond', 'alternative', 'business'];
    for (const type of types) {
      const result = assetSchema.safeParse({
        symbol: 'TEST',
        name: 'Test Asset',
        type,
        module: 'equities',
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts all valid modules', () => {
    const modules = ['equities', 'crypto', 'macro', 'real_estate', 'commodities', 'forex', 'alternative', 'business'];
    for (const mod of modules) {
      const result = assetSchema.safeParse({
        symbol: 'TEST',
        name: 'Test Asset',
        type: 'stock',
        module: mod,
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts optional exchange field', () => {
    const result = assetSchema.safeParse({
      symbol: 'AAPL',
      name: 'Apple',
      type: 'stock',
      module: 'equities',
      exchange: 'NASDAQ',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional metadata record', () => {
    const result = assetSchema.safeParse({
      symbol: 'AAPL',
      name: 'Apple',
      type: 'stock',
      module: 'equities',
      metadata: { sector: 'Technology', marketCap: 3000000000000 },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// holdingSchema
// ---------------------------------------------------------------------------

describe('holdingSchema', () => {
  it('accepts valid holding', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      quantity: 100,
      avg_cost_basis: 150.5,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero quantity', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      quantity: 0,
      avg_cost_basis: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      quantity: -10,
      avg_cost_basis: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero avg_cost_basis', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      quantity: 10,
      avg_cost_basis: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative avg_cost_basis', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      quantity: 10,
      avg_cost_basis: -50,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for portfolio_id', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: 'not-a-uuid',
      asset_id: VALID_UUID,
      quantity: 10,
      avg_cost_basis: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID for asset_id', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: '123',
      quantity: 10,
      avg_cost_basis: 100,
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional notes field', () => {
    const result = holdingSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      quantity: 10,
      avg_cost_basis: 100,
      notes: 'Long-term hold',
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// transactionSchema
// ---------------------------------------------------------------------------

describe('transactionSchema', () => {
  it('accepts valid transaction with required fields', () => {
    const result = transactionSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'buy',
      quantity: 50,
      price: 150.25,
      executed_at: '2024-06-15T10:30:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('defaults fees to 0', () => {
    const result = transactionSchema.parse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'buy',
      quantity: 50,
      price: 150,
      executed_at: '2024-06-15T10:30:00Z',
    });
    expect(result.fees).toBe(0);
  });

  it('defaults currency to EUR', () => {
    const result = transactionSchema.parse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'sell',
      quantity: 10,
      price: 100,
      executed_at: '2024-06-15T10:30:00Z',
    });
    expect(result.currency).toBe('EUR');
  });

  it('accepts all valid transaction types', () => {
    const types = ['buy', 'sell', 'dividend', 'staking_reward', 'interest', 'fee'];
    for (const type of types) {
      const result = transactionSchema.safeParse({
        portfolio_id: VALID_UUID,
        asset_id: VALID_UUID,
        type,
        quantity: 10,
        price: 100,
        executed_at: '2024-06-15T10:30:00Z',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid transaction type', () => {
    const result = transactionSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'swap',
      quantity: 10,
      price: 100,
      executed_at: '2024-06-15T10:30:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = transactionSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'buy',
      quantity: 0,
      price: 100,
      executed_at: '2024-06-15T10:30:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative price', () => {
    const result = transactionSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'buy',
      quantity: 10,
      price: -50,
      executed_at: '2024-06-15T10:30:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative fees', () => {
    const result = transactionSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'buy',
      quantity: 10,
      price: 100,
      fees: -5,
      executed_at: '2024-06-15T10:30:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime string', () => {
    const result = transactionSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'buy',
      quantity: 10,
      price: 100,
      executed_at: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing executed_at', () => {
    const result = transactionSchema.safeParse({
      portfolio_id: VALID_UUID,
      asset_id: VALID_UUID,
      type: 'buy',
      quantity: 10,
      price: 100,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// opportunitySchema
// ---------------------------------------------------------------------------

describe('opportunitySchema', () => {
  it('accepts valid opportunity with required fields', () => {
    const result = opportunitySchema.safeParse({
      title: 'Invest in NVIDIA',
      module: 'equities',
    });
    expect(result.success).toBe(true);
  });

  it('defaults status to discovered', () => {
    const result = opportunitySchema.parse({
      title: 'Buy Bitcoin dip',
      module: 'crypto',
    });
    expect(result.status).toBe('discovered');
  });

  it('rejects empty title', () => {
    const result = opportunitySchema.safeParse({
      title: '',
      module: 'equities',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid module', () => {
    const result = opportunitySchema.safeParse({
      title: 'Test',
      module: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    const statuses = ['discovered', 'researching', 'validated', 'watching', 'invested', 'exited', 'rejected'];
    for (const status of statuses) {
      const result = opportunitySchema.safeParse({
        title: 'Test Opportunity',
        module: 'equities',
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid status', () => {
    const result = opportunitySchema.safeParse({
      title: 'Test',
      module: 'equities',
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero target_price', () => {
    const result = opportunitySchema.safeParse({
      title: 'Test',
      module: 'equities',
      target_price: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative stop_loss', () => {
    const result = opportunitySchema.safeParse({
      title: 'Test',
      module: 'equities',
      stop_loss: -10,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// journalEntrySchema
// ---------------------------------------------------------------------------

describe('journalEntrySchema', () => {
  it('accepts valid journal entry with required fields', () => {
    const result = journalEntrySchema.safeParse({
      action: 'buy',
      reasoning: 'Strong technical setup with breakout above resistance',
    });
    expect(result.success).toBe(true);
  });

  it('accepts all valid actions', () => {
    const actions = ['buy', 'sell', 'hold', 'skip'];
    for (const action of actions) {
      const result = journalEntrySchema.safeParse({
        action,
        reasoning: 'Sufficient reasoning text here',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects reasoning shorter than 10 characters', () => {
    const result = journalEntrySchema.safeParse({
      action: 'buy',
      reasoning: 'Short',
    });
    expect(result.success).toBe(false);
  });

  it('accepts reasoning exactly 10 characters', () => {
    const result = journalEntrySchema.safeParse({
      action: 'buy',
      reasoning: '1234567890',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty reasoning', () => {
    const result = journalEntrySchema.safeParse({
      action: 'buy',
      reasoning: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid emotions', () => {
    const emotions = ['calm', 'excited', 'fearful', 'fomo', 'confident'];
    for (const emotion of emotions) {
      const result = journalEntrySchema.safeParse({
        action: 'buy',
        reasoning: 'This is a good reason',
        emotion,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid emotion', () => {
    const result = journalEntrySchema.safeParse({
      action: 'buy',
      reasoning: 'This is a good reason',
      emotion: 'angry',
    });
    expect(result.success).toBe(false);
  });

  it('validates conviction range (1-10)', () => {
    expect(
      journalEntrySchema.safeParse({
        action: 'buy',
        reasoning: 'Good reasoning here',
        conviction: 1,
      }).success
    ).toBe(true);

    expect(
      journalEntrySchema.safeParse({
        action: 'buy',
        reasoning: 'Good reasoning here',
        conviction: 10,
      }).success
    ).toBe(true);

    expect(
      journalEntrySchema.safeParse({
        action: 'buy',
        reasoning: 'Good reasoning here',
        conviction: 0,
      }).success
    ).toBe(false);

    expect(
      journalEntrySchema.safeParse({
        action: 'buy',
        reasoning: 'Good reasoning here',
        conviction: 11,
      }).success
    ).toBe(false);
  });

  it('rejects non-integer conviction', () => {
    const result = journalEntrySchema.safeParse({
      action: 'buy',
      reasoning: 'Good reasoning here',
      conviction: 5.5,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// alertSchema
// ---------------------------------------------------------------------------

describe('alertSchema', () => {
  it('accepts valid alert with required fields', () => {
    const result = alertSchema.safeParse({
      condition: 'price_above',
      threshold: 200,
    });
    expect(result.success).toBe(true);
  });

  it('defaults is_active to true', () => {
    const result = alertSchema.parse({
      condition: 'price_below',
      threshold: 50,
    });
    expect(result.is_active).toBe(true);
  });

  it('accepts all valid conditions', () => {
    const conditions = ['price_above', 'price_below', 'pct_change', 'macro_threshold'];
    for (const condition of conditions) {
      const result = alertSchema.safeParse({
        condition,
        threshold: 100,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid condition', () => {
    const result = alertSchema.safeParse({
      condition: 'volume_spike',
      threshold: 100,
    });
    expect(result.success).toBe(false);
  });

  it('accepts negative threshold (for pct_change)', () => {
    const result = alertSchema.safeParse({
      condition: 'pct_change',
      threshold: -5,
    });
    expect(result.success).toBe(true);
  });

  it('accepts zero threshold', () => {
    const result = alertSchema.safeParse({
      condition: 'pct_change',
      threshold: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing threshold', () => {
    const result = alertSchema.safeParse({
      condition: 'price_above',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional asset_id as valid UUID', () => {
    const result = alertSchema.safeParse({
      asset_id: VALID_UUID,
      condition: 'price_above',
      threshold: 200,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// assetScoreRequestSchema
// ---------------------------------------------------------------------------

describe('assetScoreRequestSchema', () => {
  it('accepts valid score request', () => {
    const result = assetScoreRequestSchema.safeParse({
      assetId: VALID_UUID,
      symbol: 'AAPL',
      type: 'stock',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    const result = assetScoreRequestSchema.safeParse({
      assetId: 'not-uuid',
      symbol: 'AAPL',
      type: 'stock',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty symbol', () => {
    const result = assetScoreRequestSchema.safeParse({
      assetId: VALID_UUID,
      symbol: '',
      type: 'stock',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type (only stock, etf, crypto, commodity allowed)', () => {
    const result = assetScoreRequestSchema.safeParse({
      assetId: VALID_UUID,
      symbol: 'AAPL',
      type: 'bond',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid types', () => {
    const types = ['stock', 'etf', 'crypto', 'commodity'];
    for (const type of types) {
      const result = assetScoreRequestSchema.safeParse({
        assetId: VALID_UUID,
        symbol: 'TEST',
        type,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects missing required fields', () => {
    expect(assetScoreRequestSchema.safeParse({}).success).toBe(false);
    expect(
      assetScoreRequestSchema.safeParse({ assetId: VALID_UUID }).success
    ).toBe(false);
    expect(
      assetScoreRequestSchema.safeParse({
        assetId: VALID_UUID,
        symbol: 'AAPL',
      }).success
    ).toBe(false);
  });
});
