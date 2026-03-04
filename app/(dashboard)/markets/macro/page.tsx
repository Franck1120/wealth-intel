import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';

const MacroIndicatorChart = dynamic(
  () => import('@/components/charts/macro-indicator-chart').then((m) => ({ default: m.MacroIndicatorChart })),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);

interface MacroIndicator {
  id: string;
  name: string;
  code: string;
  value: number;
  previous_value: number | null;
  unit: string;
  updated_at: string;
  source: string;
}

export default async function MacroPage() {
  const supabase = await createServerSupabaseClient();

  // Note: actual DB schema for macro_indicators may differ from typed schema;
  // the page expects extended columns (name, code, previous_value, unit, updated_at)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: indicatorsRaw } = await (supabase as any)
    .from('macro_indicators')
    .select('*')
    .order('name', { ascending: true });

  const indicatorList = (indicatorsRaw ?? []) as MacroIndicator[];

  // Group indicators by category
  const keyIndicators = [
    'fed_funds_rate',
    'cpi_yoy',
    'gdp_growth',
    'unemployment',
    'treasury_10y',
    'vix',
  ];
  const euribor = ['euribor_1m', 'euribor_3m', 'euribor_6m', 'euribor_12m'];

  const keyData = keyIndicators
    .map((code) => indicatorList.find((i) => i.code === code))
    .filter(Boolean) as MacroIndicator[];

  const euriborData = euribor
    .map((code) => indicatorList.find((i) => i.code === code))
    .filter(Boolean) as MacroIndicator[];

  function getChangeDirection(current: number, previous: number | null) {
    if (previous === null) return 'neutral';
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  }

  function formatIndicatorValue(value: number, unit: string): string {
    if (unit === '%') return `${value.toFixed(2)}%`;
    if (unit === 'index') return value.toFixed(1);
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Indicatori Macro
        </h1>
        <p className="text-muted-foreground">
          Principali indicatori economici e dati sulla politica delle banche centrali.
        </p>
      </div>

      {/* Key Indicators Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keyData.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessun dato macro disponibile</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Gli indicatori macro appariranno qui quando la pipeline dati
                avra' scaricato i dati economici piu' recenti dalle fonti ufficiali.
              </p>
            </CardContent>
          </Card>
        ) : (
          keyData.map((indicator) => {
            const direction = getChangeDirection(
              indicator.value,
              indicator.previous_value
            );
            const change =
              indicator.previous_value !== null
                ? indicator.value - indicator.previous_value
                : null;

            return (
              <Card key={indicator.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      {indicator.name}
                    </p>
                    {direction === 'up' && (
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    )}
                    {direction === 'down' && (
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-3xl font-bold tabular-nums">
                    {formatIndicatorValue(indicator.value, indicator.unit)}
                  </p>
                  {change !== null && (
                    <p
                      className={`text-sm mt-1 ${
                        change > 0
                          ? 'text-emerald-500'
                          : change < 0
                            ? 'text-red-500'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {change > 0 ? '+' : ''}
                      {change.toFixed(2)}
                      {indicator.unit === '%' ? 'pp' : ''} vs precedente
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Fonte: {indicator.source} | Aggiornato:{' '}
                    {new Date(indicator.updated_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* EURIBOR Section */}
      {euriborData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Tassi EURIBOR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {euriborData.map((rate) => (
                <div key={rate.id} className="rounded-md border p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    {rate.name}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {rate.value.toFixed(3)}%
                  </p>
                  {rate.previous_value !== null && (
                    <p
                      className={`text-xs mt-1 ${
                        rate.value > rate.previous_value
                          ? 'text-red-500'
                          : rate.value < rate.previous_value
                            ? 'text-emerald-500'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {rate.value > rate.previous_value ? '+' : ''}
                      {(rate.value - rate.previous_value).toFixed(3)}pp
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Trend Storici
          </CardTitle>
        </CardHeader>
        <CardContent>
          {indicatorList.length > 0 ? (
            <MacroIndicatorChart indicators={indicatorList} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                I dati storici dei grafici saranno disponibili dopo la prima
                esecuzione della pipeline dati.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Indicators Table */}
      {indicatorList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tutti gli Indicatori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Indicatore
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Attuale
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Precedente
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Variazione
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Fonte
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Aggiornato
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {indicatorList.map((ind) => {
                    const change =
                      ind.previous_value !== null
                        ? ind.value - ind.previous_value
                        : null;

                    return (
                      <tr
                        key={ind.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">{ind.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatIndicatorValue(ind.value, ind.unit)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {ind.previous_value !== null
                            ? formatIndicatorValue(ind.previous_value, ind.unit)
                            : '--'}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            change !== null
                              ? change > 0
                                ? 'text-emerald-500'
                                : change < 0
                                  ? 'text-red-500'
                                  : 'text-muted-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {change !== null
                            ? `${change > 0 ? '+' : ''}${change.toFixed(2)}`
                            : '--'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {ind.source}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(ind.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
