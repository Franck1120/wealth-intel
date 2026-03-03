import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { PerformanceChart } from '@/components/charts/performance-chart';
import { CorrelationHeatmap } from '@/components/charts/correlation-heatmap';
import { AllocationChart } from '@/components/charts/allocation-chart';
import {
  BarChart3,
  Shield,
  TrendingDown,
  Activity,
  PieChart,
  Calculator,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface RiskMetrics {
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  max_drawdown: number | null;
  volatility: number | null;
  beta: number | null;
  var_95: number | null;
}

interface PortfolioSnapshot {
  date: string;
  total_value: number;
}

interface AllocationItem {
  name: string;
  value: number;
  percentage: number;
}

interface TaxSummary {
  total_gains: number;
  total_losses: number;
  net_gain: number;
  tax_rate: number;
  estimated_tax: number;
  loss_carryforward: number;
}

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untypedSupabase = supabase as any;

  // Fetch portfolio performance history
  // Note: portfolio_snapshots table is not in the typed Database schema
  const { data: snapshots } = await untypedSupabase
    .from('portfolio_snapshots')
    .select('date, total_value')
    .order('date', { ascending: true });

  // Fetch risk metrics
  // Note: risk_metrics table is not in the typed Database schema
  const { data: riskData } = await untypedSupabase
    .from('risk_metrics')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch allocation data
  const { data: holdings } = await untypedSupabase
    .from('holdings')
    .select('quantity, avg_cost_basis, assets(symbol, current_price, asset_type)')
    .gt('quantity', 0);

  // Fetch correlation matrix
  // Note: correlation_matrix table is not in the typed Database schema
  const { data: correlations } = await untypedSupabase
    .from('correlation_matrix')
    .select('*')
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch tax summary
  // Note: tax_summaries table is not in the typed Database schema
  const { data: taxData } = await untypedSupabase
    .from('tax_summaries')
    .select('*')
    .order('year', { ascending: false })
    .limit(1)
    .single();

  const performanceData = ((snapshots as PortfolioSnapshot[] | null) ?? []).map((s) => ({
    date: s.date,
    value: s.total_value,
  }));
  const risk = (riskData as RiskMetrics | null) ?? {
    sharpe_ratio: null,
    sortino_ratio: null,
    max_drawdown: null,
    volatility: null,
    beta: null,
    var_95: null,
  };

  // Compute allocation from holdings
  const holdingsList = (holdings ?? []) as Array<{
    quantity: number;
    avg_cost_basis: number;
    assets: { symbol: string; current_price: number | null; asset_type: string };
  }>;

  const totalValue = holdingsList.reduce((sum, h) => {
    const price = h.assets.current_price ?? h.avg_cost_basis;
    return sum + h.quantity * price;
  }, 0);

  const allocationData: AllocationItem[] = holdingsList.map((h) => {
    const price = h.assets.current_price ?? h.avg_cost_basis;
    const value = h.quantity * price;
    return {
      name: h.assets.symbol,
      value,
      percentage: totalValue > 0 ? value / totalValue : 0,
    };
  });

  // Group by asset type for type allocation
  const typeAllocation = holdingsList.reduce<Record<string, number>>(
    (acc, h) => {
      const price = h.assets.current_price ?? h.avg_cost_basis;
      const value = h.quantity * price;
      acc[h.assets.asset_type] = (acc[h.assets.asset_type] ?? 0) + value;
      return acc;
    },
    {}
  );

  const typeAllocationData: AllocationItem[] = Object.entries(typeAllocation).map(
    ([type, value]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      percentage: totalValue > 0 ? value / totalValue : 0,
    })
  );

  const tax = taxData as TaxSummary | null;
  const correlationRow = correlations as Record<string, unknown> | null;
  const correlationMatrix = (correlationRow?.matrix as number[][] | undefined) ?? null;
  const correlationSymbols = (correlationRow?.labels as string[] | undefined) ?? null;

  const hasPerformanceData = performanceData.length > 0;
  const hasData = hasPerformanceData || allocationData.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Portfolio performance, risk metrics, and tax analysis.
        </p>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analytics data yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Analytics will populate once you have portfolio holdings and the
              system has collected enough historical data for analysis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Portfolio Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <PerformanceChart data={performanceData} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground text-sm">
                    Performance chart requires at least 2 data points.
                    Historical snapshots are recorded daily.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <RiskMetricCard
              label="Sharpe Ratio"
              value={risk.sharpe_ratio}
              format="decimal"
              icon={<Shield className="h-4 w-4" />}
              description="Risk-adjusted return"
            />
            <RiskMetricCard
              label="Sortino Ratio"
              value={risk.sortino_ratio}
              format="decimal"
              icon={<Shield className="h-4 w-4" />}
              description="Downside risk-adjusted"
            />
            <RiskMetricCard
              label="Max Drawdown"
              value={risk.max_drawdown}
              format="percent"
              icon={<TrendingDown className="h-4 w-4" />}
              description="Largest peak-to-trough"
              isNegativeGood={false}
            />
            <RiskMetricCard
              label="Volatility"
              value={risk.volatility}
              format="percent"
              icon={<Activity className="h-4 w-4" />}
              description="Annualized std dev"
            />
            <RiskMetricCard
              label="Beta"
              value={risk.beta}
              format="decimal"
              icon={<BarChart3 className="h-4 w-4" />}
              description="Market sensitivity"
            />
            <RiskMetricCard
              label="VaR (95%)"
              value={risk.var_95}
              format="currency"
              icon={<Shield className="h-4 w-4" />}
              description="Value at Risk"
              isNegativeGood={false}
            />
          </div>

          {/* Allocation & Correlation Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Asset Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Asset Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocationData.length > 0 ? (
                  <AllocationChart data={allocationData} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No holdings to display
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Type Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  By Asset Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeAllocationData.length > 0 ? (
                  <AllocationChart data={typeAllocationData} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No holdings to display
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Correlation Heatmap */}
          {correlationMatrix && correlationSymbols && (
            <Card>
              <CardHeader>
                <CardTitle>Correlation Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <CorrelationHeatmap
                  matrix={correlationMatrix}
                  symbols={correlationSymbols}
                />
              </CardContent>
            </Card>
          )}

          {/* Tax Summary (Italian) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Tax Summary (Italy)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tax ? (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total Gains
                    </p>
                    <p className="text-lg font-bold tabular-nums text-emerald-500">
                      {formatCurrency(tax.total_gains)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Total Losses
                    </p>
                    <p className="text-lg font-bold tabular-nums text-red-500">
                      {formatCurrency(tax.total_losses)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Net Gain
                    </p>
                    <p
                      className={`text-lg font-bold tabular-nums ${
                        tax.net_gain >= 0
                          ? 'text-emerald-500'
                          : 'text-red-500'
                      }`}
                    >
                      {formatCurrency(tax.net_gain)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Tax Rate
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {tax.tax_rate}%
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Estimated Tax
                    </p>
                    <p className="text-lg font-bold tabular-nums text-red-500">
                      {formatCurrency(tax.estimated_tax)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Loss Carryforward
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {formatCurrency(tax.loss_carryforward)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    Tax calculations will appear after you record buy/sell
                    transactions. Italian capital gains tax (26% imposta
                    sostitutiva) is calculated automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

/** Reusable risk metric card */
function RiskMetricCard({
  label,
  value,
  format,
  icon,
  description,
}: {
  label: string;
  value: number | null;
  format: 'decimal' | 'percent' | 'currency';
  icon: React.ReactNode;
  description: string;
  isNegativeGood?: boolean;
}) {
  function formatValue(val: number): string {
    switch (format) {
      case 'percent':
        return formatPercent(val);
      case 'currency':
        return formatCurrency(val);
      default:
        return val.toFixed(2);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground">{icon}</span>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
        <p className="text-xl font-bold tabular-nums">
          {value !== null ? formatValue(value) : '--'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
