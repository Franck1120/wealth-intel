import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { FileText, TrendingUp, TrendingDown, Bell, BarChart3 } from 'lucide-react';

interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  created_at: string;
  summary: {
    portfolio_value: number;
    portfolio_change: number;
    portfolio_change_pct: number;
  };
  top_movers: Array<{
    symbol: string;
    name: string;
    change_pct: number;
  }>;
  alerts_triggered: number;
  score_changes: Array<{
    symbol: string;
    old_score: number;
    new_score: number;
  }>;
  macro_highlights: string[];
  narrative: string;
}

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();

  // Note: page expects extended weekly_reports columns (week_end, summary,
  // top_movers, etc.) that may not be in the typed Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reportsRaw } = await (supabase as any)
    .from('weekly_reports')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(20);

  const reportList = (reportsRaw ?? []) as WeeklyReport[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Settimanali</h1>
        <p className="text-muted-foreground">
          Riepiloghi settimanali automatici del tuo portafoglio e attivita' di mercato.
        </p>
      </div>

      {reportList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun report disponibile</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              I report settimanali vengono generati automaticamente ogni domenica.
              Il tuo primo report apparira' dopo l'esecuzione dell'analisi settimanale.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reportList.map((report) => {
            const isPositive = report.summary.portfolio_change >= 0;
            const weekLabel = `${formatWeekDate(report.week_start)} - ${formatWeekDate(report.week_end)}`;

            return (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Settimana del {weekLabel}
                    </CardTitle>
                    <time className="text-xs text-muted-foreground">
                      Generato il{' '}
                      {new Date(report.created_at).toLocaleDateString()}
                    </time>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Summary Stats Row */}
                  <div className="grid gap-4 md:grid-cols-4 mb-4">
                    {/* Portfolio Value */}
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Valore Portafoglio
                      </p>
                      <p className="text-lg font-bold tabular-nums">
                        {formatCurrency(report.summary.portfolio_value)}
                      </p>
                    </div>

                    {/* Week Change */}
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Variazione Settimanale
                      </p>
                      <p
                        className={`text-lg font-bold tabular-nums ${
                          isPositive ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {formatCurrency(report.summary.portfolio_change)}
                        <span className="text-sm ml-1">
                          ({formatPercent(report.summary.portfolio_change_pct)})
                        </span>
                      </p>
                    </div>

                    {/* Alerts Triggered */}
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Avvisi Attivati
                      </p>
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-bold tabular-nums">
                          {report.alerts_triggered}
                        </p>
                      </div>
                    </div>

                    {/* Score Changes */}
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Variazioni Punteggio
                      </p>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-lg font-bold tabular-nums">
                          {report.score_changes.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Movers */}
                  {report.top_movers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Migliori/Peggiori</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.top_movers.map((mover) => {
                          const moverPositive = mover.change_pct >= 0;
                          return (
                            <div
                              key={mover.symbol}
                              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1"
                            >
                              {moverPositive ? (
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span className="text-xs font-medium">
                                {mover.symbol}
                              </span>
                              <span
                                className={`text-xs tabular-nums ${
                                  moverPositive
                                    ? 'text-emerald-500'
                                    : 'text-red-500'
                                }`}
                              >
                                {moverPositive ? '+' : ''}
                                {mover.change_pct.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Score Changes */}
                  {report.score_changes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">
                        Variazioni Punteggio
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {report.score_changes.map((sc) => {
                          const improved = sc.new_score > sc.old_score;
                          return (
                            <div
                              key={sc.symbol}
                              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1"
                            >
                              <span className="text-xs font-medium">
                                {sc.symbol}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {sc.old_score}
                              </span>
                              <span className="text-xs">→</span>
                              <span
                                className={`text-xs font-medium ${
                                  improved
                                    ? 'text-emerald-500'
                                    : 'text-red-500'
                                }`}
                              >
                                {sc.new_score}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Macro Highlights */}
                  {report.macro_highlights.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">
                        Highlights Macro
                      </h4>
                      <ul className="space-y-1">
                        {report.macro_highlights.map((highlight, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="text-primary mt-1">-</span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Narrative */}
                  {report.narrative && (
                    <div className="rounded-md bg-muted p-4">
                      <h4 className="text-sm font-medium mb-2">
                        Analisi Settimanale
                      </h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {report.narrative}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatWeekDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    month: 'short',
    day: 'numeric',
  });
}
