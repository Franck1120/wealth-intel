/**
 * Portfolio P&L and Performance Calculations
 *
 * Pure TypeScript math for portfolio analytics.
 * No external dependencies.
 */

export interface HoldingWithPrice {
  assetId: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  avgCostBasis: number;
  currentPrice: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPct: number;
  holdings: HoldingPerformance[];
  allocationByType: Record<string, number>;
  allocationByModule: Record<string, number>;
}

export interface HoldingPerformance {
  assetId: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  avgCostBasis: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  gain: number;
  gainPct: number;
  allocationPct: number;
}

/**
 * Calculate full portfolio summary with per-holding performance and allocations.
 *
 * @param holdings - Array of holdings with current prices
 * @returns Complete portfolio summary with allocations by type and module
 */
export function calculatePortfolioSummary(
  holdings: HoldingWithPrice[]
): PortfolioSummary {
  if (holdings.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalGain: 0,
      totalGainPct: 0,
      holdings: [],
      allocationByType: {},
      allocationByModule: {},
    };
  }

  // Calculate each holding's performance
  const holdingPerformances: HoldingPerformance[] = holdings.map((h) => {
    const marketValue = h.quantity * h.currentPrice;
    const costBasis = h.quantity * h.avgCostBasis;
    const gain = marketValue - costBasis;
    const gainPct = costBasis === 0 ? 0 : gain / costBasis;

    return {
      assetId: h.assetId,
      symbol: h.symbol,
      name: h.name,
      type: h.type,
      quantity: h.quantity,
      avgCostBasis: h.avgCostBasis,
      currentPrice: h.currentPrice,
      marketValue,
      costBasis,
      gain,
      gainPct,
      allocationPct: 0, // filled in below
    };
  });

  // Sum totals
  const totalValue = holdingPerformances.reduce(
    (sum, h) => sum + h.marketValue,
    0
  );
  const totalCost = holdingPerformances.reduce(
    (sum, h) => sum + h.costBasis,
    0
  );
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost === 0 ? 0 : totalGain / totalCost;

  // Calculate allocation percentages per holding
  for (const h of holdingPerformances) {
    h.allocationPct = totalValue === 0 ? 0 : h.marketValue / totalValue;
  }

  // Allocation by type (e.g., 'stock', 'etf', 'crypto', 'bond')
  const allocationByType: Record<string, number> = {};
  for (const h of holdingPerformances) {
    const key = h.type.toLowerCase();
    allocationByType[key] = (allocationByType[key] ?? 0) + h.marketValue;
  }
  // Convert to percentages
  for (const key of Object.keys(allocationByType)) {
    allocationByType[key] =
      totalValue === 0 ? 0 : allocationByType[key] / totalValue;
  }

  // Allocation by module — derive module from asset type
  // Module mapping: stocks/etf -> 'equities', crypto -> 'crypto',
  // bond/gov_bond -> 'fixed_income', commodity -> 'commodities', other -> 'other'
  const typeToModule: Record<string, string> = {
    stock: "equities",
    etf: "equities",
    crypto: "crypto",
    bond: "fixed_income",
    gov_bond: "fixed_income",
    gov_bond_it: "fixed_income",
    gov_bond_eu: "fixed_income",
    commodity: "commodities",
    forex: "forex",
    reit: "real_estate",
  };

  const allocationByModule: Record<string, number> = {};
  for (const h of holdingPerformances) {
    const assetModule = typeToModule[h.type.toLowerCase()] ?? "other";
    allocationByModule[assetModule] =
      (allocationByModule[assetModule] ?? 0) + h.marketValue;
  }
  for (const key of Object.keys(allocationByModule)) {
    allocationByModule[key] =
      totalValue === 0 ? 0 : allocationByModule[key] / totalValue;
  }

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPct,
    holdings: holdingPerformances,
    allocationByType,
    allocationByModule,
  };
}

/**
 * Calculate simple daily return between two portfolio values.
 *
 * @param previousValue - Portfolio value at previous close
 * @param currentValue - Portfolio value at current close
 * @returns Daily return as decimal (e.g., 0.01 = 1%)
 */
export function calculateDailyReturn(
  previousValue: number,
  currentValue: number
): number {
  if (previousValue === 0) return 0;
  return (currentValue - previousValue) / previousValue;
}

/**
 * Calculate Time-Weighted Return (TWR) from a series of period returns.
 *
 * TWR removes the impact of cash flows and measures pure investment performance.
 * Formula: TWR = product of (1 + r_i) - 1
 *
 * @param periodReturns - Array of period returns as decimals
 * @returns Cumulative TWR as decimal
 */
export function calculateTimeWeightedReturn(
  periodReturns: number[]
): number {
  if (periodReturns.length === 0) return 0;
  return periodReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
}

/**
 * Calculate Internal Rate of Return (IRR) using Newton-Raphson method.
 *
 * The IRR is the discount rate that makes the Net Present Value (NPV) of all
 * cash flows equal to zero. This is the money-weighted return that accounts
 * for the timing and size of cash flows.
 *
 * @param cashFlows - Array of cash flows with dates. Negative = outflow (buy),
 *                    positive = inflow (sell/dividend). The last entry should
 *                    be the current portfolio value (positive).
 * @param tolerance - Convergence tolerance (default 0.0001)
 * @returns Annualized IRR as decimal (e.g., 0.12 = 12%). Returns NaN if no convergence.
 */
export function calculateIRR(
  cashFlows: { amount: number; date: Date }[],
  tolerance: number = 0.0001
): number {
  if (cashFlows.length < 2) return 0;

  const MAX_ITERATIONS = 100;
  const DAYS_PER_YEAR = 365.25;

  // Reference date is the first cash flow date
  const t0 = cashFlows[0].date.getTime();

  // Calculate year fractions from the first cash flow
  const yearFractions = cashFlows.map(
    (cf) => (cf.date.getTime() - t0) / (DAYS_PER_YEAR * 24 * 60 * 60 * 1000)
  );

  /**
   * NPV as a function of rate r:
   * NPV(r) = sum of CF_i / (1 + r)^t_i
   */
  function npv(r: number): number {
    let sum = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const base = 1 + r;
      // Guard against negative base with fractional exponent
      if (base <= 0) return Number.MAX_SAFE_INTEGER;
      sum += cashFlows[i].amount / Math.pow(base, yearFractions[i]);
    }
    return sum;
  }

  /**
   * Derivative of NPV with respect to r:
   * dNPV/dr = sum of -t_i * CF_i / (1 + r)^(t_i + 1)
   */
  function npvDerivative(r: number): number {
    let sum = 0;
    for (let i = 0; i < cashFlows.length; i++) {
      const base = 1 + r;
      if (base <= 0) return -Number.MAX_SAFE_INTEGER;
      sum +=
        (-yearFractions[i] * cashFlows[i].amount) /
        Math.pow(base, yearFractions[i] + 1);
    }
    return sum;
  }

  // Initial guess: simple return over the period
  const totalInflows = cashFlows
    .filter((cf) => cf.amount > 0)
    .reduce((s, cf) => s + cf.amount, 0);
  const totalOutflows = Math.abs(
    cashFlows
      .filter((cf) => cf.amount < 0)
      .reduce((s, cf) => s + cf.amount, 0)
  );
  const totalYears =
    yearFractions[yearFractions.length - 1] || 1;

  let rate: number;
  if (totalOutflows === 0) {
    rate = 0.1; // fallback guess
  } else {
    const simpleReturn = (totalInflows - totalOutflows) / totalOutflows;
    // Annualize the simple return as starting guess
    rate =
      totalYears > 0
        ? Math.pow(1 + simpleReturn, 1 / totalYears) - 1
        : simpleReturn;
  }

  // Clamp initial guess to reasonable range
  rate = Math.max(-0.99, Math.min(rate, 10));

  // Newton-Raphson iteration
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const currentNpv = npv(rate);
    const currentDerivative = npvDerivative(rate);

    if (Math.abs(currentNpv) < tolerance) {
      return rate;
    }

    if (Math.abs(currentDerivative) < 1e-12) {
      // Derivative too small — nudge the rate to escape flat region
      rate += 0.01;
      continue;
    }

    const newRate = rate - currentNpv / currentDerivative;

    // Clamp to prevent divergence
    const clampedRate = Math.max(-0.99, Math.min(newRate, 100));

    if (Math.abs(clampedRate - rate) < tolerance) {
      return clampedRate;
    }

    rate = clampedRate;
  }

  // Did not converge — return NaN
  return NaN;
}
