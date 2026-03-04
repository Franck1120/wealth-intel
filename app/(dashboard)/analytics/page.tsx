import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  Shield,
  TrendingDown,
  Activity,
  PieChart,
  Calculator,
} from 'lucide-react';

const PerformanceChart = dynamic(
  () => import('@/components/charts/performance-chart').then((m) => ({ default: m.PerformanceChart })),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);

const AllocationChart = dynamic(
  () => import('@/components/charts/allocation-chart').then((m) => ({ default: m.AllocationChart })),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);

const CorrelationHeatmap = dynamic(
  () => import('@/components/charts/correlation-heatmap').then((m) => ({ default: m.CorrelationHeatmap })),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);

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

  // Fetch all analytics data in parallel for better performance
  const [
    { data: snapshots },
    { data: riskData },
    { data: holdings },
    { data: correlations },
    { data: taxData },
  ] = await Promise.all([
    // Portfolio performance history
    // Note: portfolio_snapshots table is not in the typed Database schema
    untypedSupabase
      .from('portfolio_snapshots')
      .select('date, total_value')
      .order('date', { ascending: true }),
    // Risk metrics
    // Note: risk_metrics table is not in the typed Database schema
    untypedSupabase
      .from('risk_metrics')
      .select('*')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single(),
    // Allocation data
    untypedSupabase
      .from('holdings')
      .select('quantity, avg_cost_basis, assets(symbol, current_price, asset_type)')
      .gt('quantity', 0),
    // Correlation matrix
    // Note: correlation_matrix table is not in the typed Database schema
    untypedSupabase
      .from('correlation_matrix')
      .select('*')
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single(),
    // Tax summary
    // Note: tax_summaries table is not in the typed Database schema
    untypedSupabase
      .from('tax_summaries')
      .select('*')
      .order('year', { ascending: false })
      .limit(1)
      .single(),
  ]);

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
        <h1 className="text-2xl font-bold tracking-tight">Analisi</h1>
        <p className="text-muted-foreground">
          Performance del portafoglio, metriche di rischio e analisi fiscale.
        </p>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun dato di analisi</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Le analisi appariranno quando avrai posizioni in portafoglio e il
              sistema avra' raccolto abbastanza dati storici.
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
                Performance Portafoglio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <PerformanceChart data={performanceData} />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground text-sm">
                    Il grafico delle performance richiede almeno 2 punti dati.
                    Gli snapshot storici vengono registrati giornalmente.
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
              description="Rendimento aggiustato per il rischio"
            />
            <RiskMetricCard
              label="Sortino Ratio"
              value={risk.sortino_ratio}
              format="decimal"
              icon={<Shield className="h-4 w-4" />}
              description="Aggiustato per rischio ribassista"
            />
            <RiskMetricCard
              label="Max Drawdown"
              value={risk.max_drawdown}
              format="percent"
              icon={<TrendingDown className="h-4 w-4" />}
              description="Massimo calo da picco a minimo"
              isNegativeGood={false}
            />
            <RiskMetricCard
              label="Volatilita'"
              value={risk.volatility}
              format="percent"
              icon={<Activity className="h-4 w-4" />}
              description="Deviazione standard annualizzata"
            />
            <RiskMetricCard
              label="Beta"
              value={risk.beta}
              format="decimal"
              icon={<BarChart3 className="h-4 w-4" />}
              description="Sensibilita' al mercato"
            />
            <RiskMetricCard
              label="VaR (95%)"
              value={risk.var_95}
              format="currency"
              icon={<Shield className="h-4 w-4" />}
              description="Valore a Rischio"
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
                  Allocazione Asset
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocationData.length > 0 ? (
                  <AllocationChart data={allocationData} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nessuna posizione da visualizzare
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Type Allocation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Per Tipo di Asset
                </CardTitle>
              </CardHeader>
              <CardContent>
                {typeAllocationData.length > 0 ? (
                  <AllocationChart data={typeAllocationData} />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nessuna posizione da visualizzare
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Correlation Heatmap */}
          {correlationMatrix && correlationSymbols && (
            <Card>
              <CardHeader>
                <CardTitle>Matrice di Correlazione</CardTitle>
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
                Riepilogo Fiscale (Italia)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tax ? (
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Guadagni Totali
                    </p>
                    <p className="text-lg font-bold tabular-nums text-emerald-500">
                      {formatCurrency(tax.total_gains)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Perdite Totali
                    </p>
                    <p className="text-lg font-bold tabular-nums text-red-500">
                      {formatCurrency(tax.total_losses)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Guadagno Netto
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
                      Aliquota Fiscale
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {tax.tax_rate}%
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Imposta Stimata
                    </p>
                    <p className="text-lg font-bold tabular-nums text-red-500">
                      {formatCurrency(tax.estimated_tax)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                      Minusvalenze Pregresse
                    </p>
                    <p className="text-lg font-bold tabular-nums">
                      {formatCurrency(tax.loss_carryforward)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">
                    I calcoli fiscali appariranno dopo aver registrato transazioni
                    di acquisto/vendita. L'imposta sostitutiva italiana (26%)
                    viene calcolata automaticamente.
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
