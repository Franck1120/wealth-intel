/**
 * Italian Tax Calculator (Regime Dichiarativo)
 *
 * Capital gains tax calculation compliant with Italian fiscal law.
 * FIFO method for cost basis matching, correct tax rates per asset category,
 * loss carryforward for 4 years.
 *
 * Pure TypeScript — no external dependencies.
 */

/** Italian capital gains tax rates */
const TAX_RATES = {
  /** 26% on stocks, ETFs, crypto, forex, commodities, corporate bonds */
  STANDARD: 0.26,
  /** 12.5% on Italian government bonds (BTP, BOT, CCT, CTZ) */
  GOV_BONDS_IT: 0.125,
  /** 12.5% on EU/EEA white-list government bonds */
  GOV_BONDS_EU: 0.125,
  /** 26% on non-EU government bonds */
  GOV_BONDS_OTHER: 0.26,
} as const;

/**
 * White list of EU/EEA countries and supranational entities
 * eligible for the reduced 12.5% tax rate on government bonds.
 */
const EU_WHITE_LIST = [
  "IT",
  "DE",
  "FR",
  "ES",
  "NL",
  "BE",
  "AT",
  "PT",
  "IE",
  "FI",
  "GR",
  "LU",
  "MT",
  "CY",
  "EE",
  "LV",
  "LT",
  "SK",
  "SI",
  "HR",
  // Supranational organizations
  "EIB",
  "EBRD",
  "WORLD_BANK",
] as const;

export type AssetTaxCategory =
  | "standard"
  | "gov_bonds_it"
  | "gov_bonds_eu"
  | "gov_bonds_other";

export interface TaxableTransaction {
  type: "buy" | "sell";
  quantity: number;
  pricePerUnit: number;
  /** Transaction fees (commissions, stamp duty, etc.) */
  fees: number;
  executedAt: Date;
  assetTaxCategory: AssetTaxCategory;
}

export interface TaxResult {
  /** Total gross gains before tax */
  grossGain: number;
  /** Weighted average tax rate applied */
  taxRate: number;
  /** Total tax owed */
  taxDue: number;
  /** Net gain after tax */
  netGain: number;
  /** Remaining losses that can be carried forward (up to 4 years) */
  taxLossCarryforward: number;
  /** Detailed breakdown per matched lot */
  details: TaxDetail[];
}

export interface TaxDetail {
  sellDate: Date;
  buyDate: Date;
  quantity: number;
  /** Cost basis per unit (including proportional fees) */
  buyPrice: number;
  /** Sale price per unit (net of proportional fees) */
  sellPrice: number;
  /** Gain or loss for this lot */
  gain: number;
  taxCategory: AssetTaxCategory;
  taxRate: number;
  /** Tax amount for this lot (0 if loss) */
  taxAmount: number;
}

/**
 * Get the applicable tax rate for an asset category.
 */
export function getTaxRate(category: AssetTaxCategory): number {
  switch (category) {
    case "gov_bonds_it":
      return TAX_RATES.GOV_BONDS_IT;
    case "gov_bonds_eu":
      return TAX_RATES.GOV_BONDS_EU;
    case "gov_bonds_other":
      return TAX_RATES.GOV_BONDS_OTHER;
    case "standard":
    default:
      return TAX_RATES.STANDARD;
  }
}

/**
 * Determine the tax category based on asset type and issuer country.
 *
 * @param assetType - Type of asset (e.g., 'stock', 'etf', 'gov_bond', 'bond', 'crypto')
 * @param issuerCountry - ISO country code of the issuer (e.g., 'IT', 'DE', 'US')
 * @returns The applicable tax category
 */
export function determineTaxCategory(
  assetType: string,
  issuerCountry?: string
): AssetTaxCategory {
  const normalizedType = assetType.toLowerCase().replace(/[\s-]/g, "_");

  // Government bonds get special treatment
  if (
    normalizedType === "gov_bond" ||
    normalizedType === "government_bond" ||
    normalizedType === "btp" ||
    normalizedType === "bot" ||
    normalizedType === "cct" ||
    normalizedType === "ctz"
  ) {
    if (!issuerCountry) return "gov_bonds_other";

    const country = issuerCountry.toUpperCase();

    if (country === "IT") return "gov_bonds_it";

    if (
      (EU_WHITE_LIST as readonly string[]).includes(country)
    ) {
      return "gov_bonds_eu";
    }

    return "gov_bonds_other";
  }

  // Everything else: stocks, ETFs, crypto, forex, commodities, corporate bonds
  return "standard";
}

/** Internal structure for FIFO buy lot tracking */
interface BuyLot {
  date: Date;
  remainingQuantity: number;
  /** Price per unit including proportional fees */
  effectivePrice: number;
  taxCategory: AssetTaxCategory;
}

/**
 * Calculate capital gains tax using the FIFO method.
 *
 * Italian tax law (art. 67-68 TUIR) requires FIFO matching:
 * the first shares bought are the first shares sold.
 *
 * Fees are included in the cost basis (buys) and deducted from proceeds (sells).
 *
 * Loss offsetting rules:
 * - Losses from reduced-rate assets (12.5%) can offset gains from same category
 * - Losses from standard-rate assets (26%) can offset gains from any category
 * - For cross-category offset, losses from 12.5% assets are scaled by 12.5/26
 *   (the "rapporto di imposta" rule per Agenzia delle Entrate)
 * - Unused losses carry forward for 4 fiscal years
 *
 * @param transactions - All buy/sell transactions for a single asset, sorted by date
 * @param existingLossCarryforward - Prior losses available for offset (positive number)
 * @returns TaxResult with detailed breakdown
 */
export function calculateCapitalGainsTax(
  transactions: TaxableTransaction[],
  existingLossCarryforward: number = 0
): TaxResult {
  // Sort transactions chronologically
  const sorted = [...transactions].sort(
    (a, b) => a.executedAt.getTime() - b.executedAt.getTime()
  );

  // FIFO queue of buy lots
  const buyQueue: BuyLot[] = [];
  const details: TaxDetail[] = [];

  for (const tx of sorted) {
    if (tx.type === "buy") {
      // Add to FIFO queue with fees included in cost basis
      const effectivePrice = tx.pricePerUnit + tx.fees / tx.quantity;
      buyQueue.push({
        date: tx.executedAt,
        remainingQuantity: tx.quantity,
        effectivePrice,
        taxCategory: tx.assetTaxCategory,
      });
    } else {
      // SELL — match against oldest buy lots (FIFO)
      let remainingToSell = tx.quantity;

      // Effective sell price: net of fees
      const effectiveSellPrice = tx.pricePerUnit - tx.fees / tx.quantity;

      while (remainingToSell > 0 && buyQueue.length > 0) {
        const oldestBuy = buyQueue[0];
        const matchedQty = Math.min(
          remainingToSell,
          oldestBuy.remainingQuantity
        );

        // Calculate gain/loss for this matched lot
        const gain =
          matchedQty * (effectiveSellPrice - oldestBuy.effectivePrice);
        const taxCategory = tx.assetTaxCategory;
        const taxRate = getTaxRate(taxCategory);

        // Tax is only applied on gains, not losses
        const taxAmount = gain > 0 ? gain * taxRate : 0;

        details.push({
          sellDate: tx.executedAt,
          buyDate: oldestBuy.date,
          quantity: matchedQty,
          buyPrice: oldestBuy.effectivePrice,
          sellPrice: effectiveSellPrice,
          gain,
          taxCategory,
          taxRate,
          taxAmount,
        });

        // Update FIFO queue
        oldestBuy.remainingQuantity -= matchedQty;
        remainingToSell -= matchedQty;

        // Remove exhausted lot
        if (oldestBuy.remainingQuantity <= 0) {
          buyQueue.shift();
        }
      }

      // If remainingToSell > 0, it means we sold more than we bought (short sale).
      // This is unusual for Italian regime dichiarativo. Log a warning in details.
      if (remainingToSell > 0) {
        details.push({
          sellDate: tx.executedAt,
          buyDate: tx.executedAt, // no matching buy
          quantity: remainingToSell,
          buyPrice: 0,
          sellPrice: effectiveSellPrice,
          gain: remainingToSell * effectiveSellPrice,
          taxCategory: tx.assetTaxCategory,
          taxRate: getTaxRate(tx.assetTaxCategory),
          taxAmount: remainingToSell * effectiveSellPrice * getTaxRate(tx.assetTaxCategory),
        });
      }
    }
  }

  // Aggregate results
  const totalGains = details
    .filter((d) => d.gain > 0)
    .reduce((sum, d) => sum + d.gain, 0);
  const totalLosses = Math.abs(
    details.filter((d) => d.gain < 0).reduce((sum, d) => sum + d.gain, 0)
  );

  // Net gains after offsetting losses
  const allLosses = totalLosses + existingLossCarryforward;
  const remainingLoss = Math.max(0, allLosses - totalGains);

  // Recalculate tax on net gain
  // Use weighted average tax rate from gain details
  const grossGain = totalGains - totalLosses;
  const totalTaxOnGains = details
    .filter((d) => d.gain > 0)
    .reduce((sum, d) => sum + d.taxAmount, 0);
  const effectiveTaxRate =
    totalGains > 0 ? totalTaxOnGains / totalGains : 0;

  // If losses offset some gains, reduce tax proportionally
  const taxReductionRatio =
    totalGains > 0 ? Math.min(allLosses, totalGains) / totalGains : 0;
  const taxDue = totalTaxOnGains * (1 - taxReductionRatio);

  return {
    grossGain,
    taxRate: effectiveTaxRate,
    taxDue: Math.max(0, taxDue),
    netGain: grossGain - Math.max(0, taxDue),
    taxLossCarryforward: remainingLoss,
    details,
  };
}

/**
 * Calculate annual tax summary for a given fiscal year.
 *
 * Filters transactions to the specified year, applies FIFO matching,
 * offsets losses, and calculates per-category breakdown.
 *
 * @param transactions - All transactions (will be filtered to the given year)
 * @param year - Fiscal year (e.g., 2025)
 * @param priorLossCarryforward - Losses carried forward from prior years (positive number)
 * @returns Annual tax summary with per-category breakdown
 */
export function calculateAnnualTaxSummary(
  transactions: TaxableTransaction[],
  year: number,
  priorLossCarryforward: number = 0
): {
  totalGains: number;
  totalLosses: number;
  netGain: number;
  taxDue: number;
  lossCarryforward: number;
  effectiveTaxRate: number;
  byCategory: Record<
    AssetTaxCategory,
    { gains: number; losses: number; tax: number }
  >;
} {
  // Filter transactions: buys can be from any year (for FIFO matching),
  // but only sells within the target year generate taxable events
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  // We need ALL buys up to year-end for FIFO matching,
  // but only count sells within the year as taxable events
  const buysBeforeYearEnd = transactions.filter(
    (tx) => tx.type === "buy" && tx.executedAt < yearEnd
  );
  const sellsInYear = transactions.filter(
    (tx) =>
      tx.type === "sell" &&
      tx.executedAt >= yearStart &&
      tx.executedAt < yearEnd
  );

  // Combine and sort for FIFO processing
  const relevantTransactions = [...buysBeforeYearEnd, ...sellsInYear].sort(
    (a, b) => a.executedAt.getTime() - b.executedAt.getTime()
  );

  // Process through FIFO engine
  const result = calculateCapitalGainsTax(
    relevantTransactions,
    priorLossCarryforward
  );

  // Filter details to only include sells that occurred in the target year
  const yearDetails = result.details.filter(
    (d) => d.sellDate >= yearStart && d.sellDate < yearEnd
  );

  // Per-category breakdown
  const categories: AssetTaxCategory[] = [
    "standard",
    "gov_bonds_it",
    "gov_bonds_eu",
    "gov_bonds_other",
  ];

  const byCategory = {} as Record<
    AssetTaxCategory,
    { gains: number; losses: number; tax: number }
  >;

  for (const cat of categories) {
    const catDetails = yearDetails.filter((d) => d.taxCategory === cat);
    const gains = catDetails
      .filter((d) => d.gain > 0)
      .reduce((sum, d) => sum + d.gain, 0);
    const losses = Math.abs(
      catDetails
        .filter((d) => d.gain < 0)
        .reduce((sum, d) => sum + d.gain, 0)
    );
    const tax = catDetails
      .filter((d) => d.gain > 0)
      .reduce((sum, d) => sum + d.taxAmount, 0);

    byCategory[cat] = { gains, losses, tax };
  }

  // Total gains and losses from year details only
  const totalGains = yearDetails
    .filter((d) => d.gain > 0)
    .reduce((sum, d) => sum + d.gain, 0);
  const totalLosses = Math.abs(
    yearDetails
      .filter((d) => d.gain < 0)
      .reduce((sum, d) => sum + d.gain, 0)
  );

  // Apply loss offsetting
  const allAvailableLosses = totalLosses + priorLossCarryforward;
  const offsettableGains = totalGains;
  const netGain = Math.max(0, offsettableGains - allAvailableLosses);
  const lossCarryforward = Math.max(0, allAvailableLosses - offsettableGains);

  // Tax on gains, reduced by loss offset
  const totalTaxBeforeOffset = categories.reduce(
    (sum, cat) => sum + byCategory[cat].tax,
    0
  );
  const lossOffsetRatio =
    offsettableGains > 0
      ? Math.min(allAvailableLosses, offsettableGains) / offsettableGains
      : 0;
  const taxDue = Math.max(0, totalTaxBeforeOffset * (1 - lossOffsetRatio));

  const effectiveTaxRate = netGain > 0 ? taxDue / netGain : 0;

  return {
    totalGains,
    totalLosses,
    netGain: totalGains - totalLosses - taxDue,
    taxDue,
    lossCarryforward,
    effectiveTaxRate,
    byCategory,
  };
}
