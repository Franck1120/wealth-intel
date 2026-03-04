import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertsManager } from '@/components/alerts/alerts-manager';
import { Bell, BellRing } from 'lucide-react';

interface Alert {
  id: string;
  asset_symbol: string | null;
  indicator_name: string | null;
  condition: 'above' | 'below' | 'crosses_above' | 'crosses_below' | 'change_pct';
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  message: string | null;
}

export default async function AlertsPage() {
  const supabase = await createServerSupabaseClient();

  // Note: page expects extended alert columns (asset_symbol, indicator_name, message)
  // that may not be in the typed Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: alertsRaw } = await (supabase as any)
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  const alertList = (alertsRaw ?? []) as Alert[];

  const recentlyTriggered = alertList
    .filter((a) => a.triggered_at !== null)
    .sort(
      (a, b) =>
        new Date(b.triggered_at!).getTime() -
        new Date(a.triggered_at!).getTime()
    )
    .slice(0, 5);

  const activeAlerts = alertList.filter((a) => a.is_active);
  const inactiveAlerts = alertList.filter((a) => !a.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avvisi</h1>
          <p className="text-muted-foreground">
            Imposta avvisi di prezzo e ricevi notifiche quando le condizioni sono soddisfatte.
          </p>
        </div>
      </div>

      {/* Recently Triggered */}
      {recentlyTriggered.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="h-5 w-5 text-yellow-500" />
              Attivati di Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentlyTriggered.map((alert) => (
                <div
                  key={`triggered-${alert.id}`}
                  className="flex items-center justify-between rounded-md bg-yellow-500/5 p-3"
                >
                  <div>
                    <span className="font-medium text-sm">
                      {alert.asset_symbol ?? alert.indicator_name ?? 'Unknown'}
                    </span>
                    <span className="mx-2 text-muted-foreground text-sm">
                      {formatCondition(alert.condition)}{' '}
                      {alert.threshold.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    {alert.message && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {alert.message}
                      </p>
                    )}
                    <time className="text-xs text-muted-foreground">
                      {new Date(alert.triggered_at!).toLocaleString()}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Manager (client component handles create + toggle) */}
      <AlertsManager
        activeAlerts={activeAlerts}
        inactiveAlerts={inactiveAlerts}
      />

      {/* Empty State */}
      {alertList.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun avviso impostato</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Crea il tuo primo avviso per ricevere notifiche quando il prezzo
              di un asset o un indicatore macro raggiunge il tuo obiettivo.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatCondition(condition: string): string {
  const conditionMap: Record<string, string> = {
    above: 'supera',
    below: 'scende sotto',
    crosses_above: 'incrocia al rialzo',
    crosses_below: 'incrocia al ribasso',
    change_pct: 'varia di',
  };
  return conditionMap[condition] ?? condition;
}
