import { describe, it, expect } from 'vitest';
import {
  getTaxRate,
  determineTaxCategory,
  calculateCapitalGainsTax,
  calculateAnnualTaxSummary,
  type TaxableTransaction,
  type AssetTaxCategory,
} from '@/lib/calculations/tax-it';

// ---------------------------------------------------------------------------
// getTaxRate
// ---------------------------------------------------------------------------

describe('getTaxRate', () => {
  it('returns 26% (0.26) for standard category', () => {
    expect(getTaxRate('standard')).toBe(0.26);
  });

  it('returns 12.5% (0.125) for Italian government bonds', () => {
    expect(getTaxRate('gov_bonds_it')).toBe(0.125);
  });

  it('returns 12.5% (0.125) for EU government bonds', () => {
    expect(getTaxRate('gov_bonds_eu')).toBe(0.125);
  });

  it('returns 26% (0.26) for non-EU government bonds', () => {
    expect(getTaxRate('gov_bonds_other')).toBe(0.26);
  });

  it('returns standard rate for unknown category via default', () => {
    // TypeScript would prevent this, but test the runtime behavior
    expect(getTaxRate('unknown_type' as AssetTaxCategory)).toBe(0.26);
  });
});

// ---------------------------------------------------------------------------
// determineTaxCategory
// ---------------------------------------------------------------------------

describe('determineTaxCategory', () => {
  it('returns "standard" for stocks', () => {
    expect(determineTaxCategory('stock')).toBe('standard');
  });

  it('returns "standard" for ETFs', () => {
    expect(determineTaxCategory('etf')).toBe('standard');
  });

  it('returns "standard" for crypto', () => {
    expect(determineTaxCategory('crypto')).toBe('standard');
  });

  it('returns "standard" for forex', () => {
    expect(determineTaxCategory('forex')).toBe('standard');
  });

  it('returns "standard" for corporate bonds', () => {
    expect(determineTaxCategory('bond')).toBe('standard');
  });

  it('returns "gov_bonds_it" for Italian government bonds (BTP)', () => {
    expect(determineTaxCategory('btp', 'IT')).toBe('gov_bonds_it');
    expect(determineTaxCategory('gov_bond', 'IT')).toBe('gov_bonds_it');
  });

  it('returns "gov_bonds_it" for BOT, CCT, CTZ issued by Italy', () => {
    expect(determineTaxCategory('bot', 'IT')).toBe('gov_bonds_it');
    expect(determineTaxCategory('cct', 'IT')).toBe('gov_bonds_it');
    expect(determineTaxCategory('ctz', 'IT')).toBe('gov_bonds_it');
  });

  it('returns "gov_bonds_eu" for EU white-list country government bonds', () => {
    expect(determineTaxCategory('gov_bond', 'DE')).toBe('gov_bonds_eu');
    expect(determineTaxCategory('gov_bond', 'FR')).toBe('gov_bonds_eu');
    expect(determineTaxCategory('gov_bond', 'ES')).toBe('gov_bonds_eu');
    expect(determineTaxCategory('gov_bond', 'NL')).toBe('gov_bonds_eu');
  });

  it('returns "gov_bonds_eu" for supranational organizations', () => {
    expect(determineTaxCategory('gov_bond', 'EIB')).toBe('gov_bonds_eu');
    expect(determineTaxCategory('gov_bond', 'EBRD')).toBe('gov_bonds_eu');
    expect(determineTaxCategory('gov_bond', 'WORLD_BANK')).toBe('gov_bonds_eu');
  });

  it('returns "gov_bonds_other" for non-EU government bonds (US, JP)', () => {
    expect(determineTaxCategory('gov_bond', 'US')).toBe('gov_bonds_other');
    expect(determineTaxCategory('gov_bond', 'JP')).toBe('gov_bonds_other');
    expect(determineTaxCategory('gov_bond', 'BR')).toBe('gov_bonds_other');
  });

  it('returns "gov_bonds_other" when no country is specified for gov bonds', () => {
    expect(determineTaxCategory('gov_bond')).toBe('gov_bonds_other');
  });

  it('handles case-insensitive asset types', () => {
    expect(determineTaxCategory('GOV_BOND', 'IT')).toBe('gov_bonds_it');
    expect(determineTaxCategory('Gov_Bond', 'DE')).toBe('gov_bonds_eu');
  });

  it('handles alternative naming: government_bond', () => {
    expect(determineTaxCategory('government_bond', 'IT')).toBe('gov_bonds_it');
    expect(determineTaxCategory('government-bond', 'FR')).toBe('gov_bonds_eu');
  });

  it('handles case-insensitive country codes', () => {
    expect(determineTaxCategory('gov_bond', 'it')).toBe('gov_bonds_it');
    expect(determineTaxCategory('gov_bond', 'de')).toBe('gov_bonds_eu');
  });
});

// ---------------------------------------------------------------------------
// calculateCapitalGainsTax — FIFO method
// ---------------------------------------------------------------------------

describe('calculateCapitalGainsTax', () => {
  it('returns zero tax for no transactions', () => {
    const result = calculateCapitalGainsTax([]);
    expect(result.grossGain).toBe(0);
    expect(result.taxDue).toBe(0);
    expect(result.netGain).toBe(0);
    expect(result.taxLossCarryforward).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  it('returns zero tax for buy-only transactions (no sells)', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 5,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);
    expect(result.grossGain).toBe(0);
    expect(result.taxDue).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  it('calculates 26% tax on standard asset gain (stock)', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-15'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // Gain: 100 * (15 - 10) = 500
    expect(result.grossGain).toBe(500);
    expect(result.taxRate).toBeCloseTo(0.26, 10);
    expect(result.taxDue).toBeCloseTo(130, 10); // 500 * 0.26
    expect(result.netGain).toBeCloseTo(370, 10); // 500 - 130
  });

  it('calculates 12.5% tax on BTP government bond gain', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 1000,
        pricePerUnit: 95,
        fees: 0,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'gov_bonds_it',
      },
      {
        type: 'sell',
        quantity: 1000,
        pricePerUnit: 100,
        fees: 0,
        executedAt: new Date('2024-12-15'),
        assetTaxCategory: 'gov_bonds_it',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // Gain: 1000 * (100 - 95) = 5000
    expect(result.grossGain).toBe(5000);
    expect(result.taxRate).toBeCloseTo(0.125, 10);
    expect(result.taxDue).toBeCloseTo(625, 10); // 5000 * 0.125
  });

  it('applies FIFO method correctly (first bought = first sold)', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 50,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'buy',
        quantity: 50,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-03-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 50,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // FIFO: sell 50 units matched against first buy at 10
    // Gain: 50 * (15 - 10) = 250
    expect(result.details).toHaveLength(1);
    expect(result.details[0].buyPrice).toBe(10);
    expect(result.details[0].sellPrice).toBe(15);
    expect(result.details[0].gain).toBe(250);
  });

  it('handles partial lot matching in FIFO', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 30,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'buy',
        quantity: 70,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-02-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 50,
        pricePerUnit: 25,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // FIFO: 30 from lot 1 (cost 10) + 20 from lot 2 (cost 20)
    expect(result.details).toHaveLength(2);
    expect(result.details[0].quantity).toBe(30);
    expect(result.details[0].buyPrice).toBe(10);
    expect(result.details[1].quantity).toBe(20);
    expect(result.details[1].buyPrice).toBe(20);

    // Gains: 30*(25-10) + 20*(25-20) = 450 + 100 = 550
    expect(result.grossGain).toBe(550);
  });

  it('includes fees in cost basis and deducts from proceeds', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 10, // 0.10 per unit added to cost
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 10, // 0.10 per unit deducted from proceeds
        executedAt: new Date('2024-06-15'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // Effective buy price: 10 + 10/100 = 10.10
    // Effective sell price: 15 - 10/100 = 14.90
    // Gain: 100 * (14.90 - 10.10) = 480
    expect(result.details[0].buyPrice).toBeCloseTo(10.10, 10);
    expect(result.details[0].sellPrice).toBeCloseTo(14.90, 10);
    expect(result.grossGain).toBeCloseTo(480, 10);
  });

  it('generates zero tax on losses', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-15'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // Loss: 100 * (15 - 20) = -500
    expect(result.grossGain).toBe(-500);
    expect(result.taxDue).toBe(0);
    expect(result.taxLossCarryforward).toBe(500);
  });

  it('carries forward unused losses (zainetto fiscale)', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-06-15'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // Loss of 1000 should be carried forward
    expect(result.taxLossCarryforward).toBe(1000);
  });

  it('offsets existing loss carryforward against gains', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-15'),
        assetTaxCategory: 'standard',
      },
    ];

    // 300 of prior losses available
    const result = calculateCapitalGainsTax(transactions, 300);

    // Gain: 500, existing loss: 300
    // Taxable gain reduced from 500 to 200
    // Tax should be reduced proportionally
    expect(result.taxDue).toBeLessThan(130); // less than 500 * 0.26
    expect(result.taxLossCarryforward).toBe(0); // all losses used up
  });

  it('carries forward excess losses after offsetting partial gains', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-15'),
        assetTaxCategory: 'standard',
      },
    ];

    // 800 of prior losses (more than the 500 gain)
    const result = calculateCapitalGainsTax(transactions, 800);

    // Gain: 500, existing loss: 800 => remaining loss: 300
    expect(result.taxDue).toBe(0);
    expect(result.taxLossCarryforward).toBe(300);
  });

  it('handles selling more than bought (short sale scenario)', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 50,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-15'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-15'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateCapitalGainsTax(transactions);

    // Should not throw. 50 matched from FIFO, 50 unmatched (short)
    expect(result.details).toHaveLength(2);
    // First detail: 50 matched at cost 10
    expect(result.details[0].quantity).toBe(50);
    expect(result.details[0].buyPrice).toBe(10);
    // Second detail: 50 unmatched, cost = 0
    expect(result.details[1].quantity).toBe(50);
    expect(result.details[1].buyPrice).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateAnnualTaxSummary
// ---------------------------------------------------------------------------

describe('calculateAnnualTaxSummary', () => {
  it('returns zeros for no transactions in the target year', () => {
    const result = calculateAnnualTaxSummary([], 2024);
    expect(result.totalGains).toBe(0);
    expect(result.totalLosses).toBe(0);
    expect(result.taxDue).toBe(0);
  });

  it('only counts sells within the target year', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2023-06-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 50,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-03-01'), // in 2024
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 50,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2025-01-15'), // in 2025, not 2024
        assetTaxCategory: 'standard',
      },
    ];

    const result2024 = calculateAnnualTaxSummary(transactions, 2024);
    // Only the sell in 2024 counts: 50 * (15 - 10) = 250
    expect(result2024.totalGains).toBe(250);

    const result2025 = calculateAnnualTaxSummary(transactions, 2025);
    // The sell in 2025: 50 * (20 - 10) = 500
    expect(result2025.totalGains).toBe(500);
  });

  it('provides per-category breakdown', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'buy',
        quantity: 1000,
        pricePerUnit: 95,
        fees: 0,
        executedAt: new Date('2024-02-01'),
        assetTaxCategory: 'gov_bonds_it',
      },
      {
        type: 'sell',
        quantity: 1000,
        pricePerUnit: 100,
        fees: 0,
        executedAt: new Date('2024-09-01'),
        assetTaxCategory: 'gov_bonds_it',
      },
    ];

    const result = calculateAnnualTaxSummary(transactions, 2024);

    // Standard: gain = 100 * 5 = 500, tax = 500 * 0.26 = 130
    expect(result.byCategory.standard.gains).toBe(500);
    expect(result.byCategory.standard.tax).toBeCloseTo(130, 10);

    // Gov bonds IT: gain = 1000 * 5 = 5000, tax = 5000 * 0.125 = 625
    expect(result.byCategory.gov_bonds_it.gains).toBe(5000);
    expect(result.byCategory.gov_bonds_it.tax).toBeCloseTo(625, 10);
  });

  it('applies prior loss carryforward to reduce tax', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
    ];

    const withoutCarry = calculateAnnualTaxSummary(transactions, 2024, 0);
    const withCarry = calculateAnnualTaxSummary(transactions, 2024, 500);

    // With carryforward, tax should be lower
    expect(withCarry.taxDue).toBeLessThan(withoutCarry.taxDue);
    expect(withCarry.lossCarryforward).toBe(0); // used all 500 against 1000 gain
  });

  it('carries forward excess losses to future years', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateAnnualTaxSummary(transactions, 2024);

    // Loss: 100 * (10 - 20) = -1000
    expect(result.totalLosses).toBe(1000);
    expect(result.taxDue).toBe(0);
    expect(result.lossCarryforward).toBe(1000);
  });

  it('calculates effective tax rate correctly', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 15,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateAnnualTaxSummary(transactions, 2024);

    // Pure standard rate, no loss offset
    // effectiveTaxRate = taxDue / netGain (where netGain = max(0, gains - losses))
    expect(result.effectiveTaxRate).toBeGreaterThan(0);
  });

  it('effective tax rate is 0 when there is no net gain', () => {
    const transactions: TaxableTransaction[] = [
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateAnnualTaxSummary(transactions, 2024);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it('handles mixed gains and losses in the same year', () => {
    const transactions: TaxableTransaction[] = [
      // Winner
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 10,
        fees: 0,
        executedAt: new Date('2024-01-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 20,
        fees: 0,
        executedAt: new Date('2024-03-01'),
        assetTaxCategory: 'standard',
      },
      // Loser
      {
        type: 'buy',
        quantity: 100,
        pricePerUnit: 30,
        fees: 0,
        executedAt: new Date('2024-04-01'),
        assetTaxCategory: 'standard',
      },
      {
        type: 'sell',
        quantity: 100,
        pricePerUnit: 25,
        fees: 0,
        executedAt: new Date('2024-06-01'),
        assetTaxCategory: 'standard',
      },
    ];

    const result = calculateAnnualTaxSummary(transactions, 2024);

    // Gain: 100*(20-10) = 1000, Loss: 100*(25-30) = -500
    expect(result.totalGains).toBe(1000);
    expect(result.totalLosses).toBe(500);
    // Tax should be reduced because losses offset gains
    expect(result.taxDue).toBeLessThan(1000 * 0.26);
  });
});
