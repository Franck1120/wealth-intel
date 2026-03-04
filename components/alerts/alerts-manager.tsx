'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bell,
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';

interface Alert {
  id: string;
  asset_symbol: string | null;
  indicator_name: string | null;
  condition: string;
  threshold: number;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  message: string | null;
}

interface AlertsManagerProps {
  activeAlerts: Alert[];
  inactiveAlerts: Alert[];
}

const CONDITION_OPTIONS = [
  { value: 'above', label: 'Supera' },
  { value: 'below', label: 'Scende sotto' },
  { value: 'crosses_above', label: 'Incrocia al rialzo' },
  { value: 'crosses_below', label: 'Incrocia al ribasso' },
  { value: 'change_pct', label: 'Varia di (%)' },
];

function formatCondition(condition: string): string {
  const found = CONDITION_OPTIONS.find((c) => c.value === condition);
  return found?.label ?? condition;
}

export function AlertsManager({
  activeAlerts: initialActive,
  inactiveAlerts: initialInactive,
}: AlertsManagerProps) {
  const [activeAlerts, setActiveAlerts] = useState(initialActive);
  const [inactiveAlerts, setInactiveAlerts] = useState(initialInactive);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function toggleAlert(id: string, currentlyActive: boolean) {
    setTogglingId(id);
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentlyActive }),
      });

      if (response.ok) {
        if (currentlyActive) {
          const alert = activeAlerts.find((a) => a.id === id);
          if (alert) {
            setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
            setInactiveAlerts((prev) => [
              { ...alert, is_active: false },
              ...prev,
            ]);
          }
        } else {
          const alert = inactiveAlerts.find((a) => a.id === id);
          if (alert) {
            setInactiveAlerts((prev) => prev.filter((a) => a.id !== id));
            setActiveAlerts((prev) => [
              { ...alert, is_active: true },
              ...prev,
            ]);
          }
        }
      }
    } catch {
      setError('Errore nell\'aggiornamento dell\'alert.');
    } finally {
      setTogglingId(null);
    }
  }

  async function deleteAlert(id: string) {
    if (!confirm('Sei sicuro di voler eliminare questo alert?')) return;
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
        setInactiveAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      setError('Errore nell\'eliminazione dell\'alert.');
    }
  }

  async function createAlert(data: {
    asset_symbol?: string;
    indicator_name?: string;
    condition: string;
    threshold: number;
  }) {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.refresh();
        setIsFormOpen(false);
      }
    } catch {
      setError('Errore nella creazione dell\'alert.');
    }
  }

  function AlertRow({ alert, isActive }: { alert: Alert; isActive: boolean }) {
    const isToggling = togglingId === alert.id;

    return (
      <div className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {alert.asset_symbol ?? alert.indicator_name ?? 'Unknown'}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatCondition(alert.condition)}
            </span>
            <span className="font-medium text-sm tabular-nums">
              {alert.threshold.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              Creato il {new Date(alert.created_at).toLocaleDateString('it-IT')}
            </span>
            {alert.triggered_at && (
              <span className="text-xs text-yellow-500">
                Attivato il{' '}
                {new Date(alert.triggered_at).toLocaleDateString('it-IT')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={() => toggleAlert(alert.id, isActive)}
            disabled={isToggling}
            className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-50"
            title={isActive ? 'Disattiva' : 'Attiva'}
          >
            {isToggling ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isActive ? (
              <ToggleRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => deleteAlert(alert.id)}
            className="p-1 hover:bg-destructive/10 rounded transition-colors"
            title="Elimina avviso"
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium underline">Chiudi</button>
        </div>
      )}

      {/* Create Alert Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Crea Avviso
        </button>
      </div>

      {/* Create Alert Modal */}
      {isFormOpen && (
        <CreateAlertModal
          onSubmit={createAlert}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-500" />
              Avvisi Attivi ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} isActive={true} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Inactive Alerts */}
      {inactiveAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <Bell className="h-5 w-5" />
              Avvisi Inattivi ({inactiveAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {inactiveAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} isActive={false} />
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}

/** Modal for creating a new alert */
function CreateAlertModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: {
    asset_symbol?: string;
    indicator_name?: string;
    condition: string;
    threshold: number;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [targetType, setTargetType] = useState<'asset' | 'indicator'>('asset');
  const [assetSymbol, setAssetSymbol] = useState('');
  const [indicatorName, setIndicatorName] = useState('');
  const [condition, setCondition] = useState('above');
  const [threshold, setThreshold] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!threshold) return;

    setIsSubmitting(true);
    await onSubmit({
      asset_symbol: targetType === 'asset' ? assetSymbol : undefined,
      indicator_name: targetType === 'indicator' ? indicatorName : undefined,
      condition,
      threshold: parseFloat(threshold),
    });
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Crea Avviso</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Obiettivo Avviso</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTargetType('asset')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  targetType === 'asset'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input hover:bg-accent'
                }`}
              >
                Asset / Prezzo
              </button>
              <button
                type="button"
                onClick={() => setTargetType('indicator')}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  targetType === 'indicator'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input hover:bg-accent'
                }`}
              >
                Indicatore Macro
              </button>
            </div>
          </div>

          {/* Target Input */}
          {targetType === 'asset' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Simbolo</label>
              <input
                type="text"
                value={assetSymbol}
                onChange={(e) => setAssetSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, BTC, GOLD"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Indicatore</label>
              <select
                value={indicatorName}
                onChange={(e) => setIndicatorName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">Seleziona un indicatore</option>
                <option value="fed_funds_rate">Fed Funds Rate</option>
                <option value="cpi_yoy">CPI (Year over Year)</option>
                <option value="vix">VIX</option>
                <option value="treasury_10y">10Y Treasury</option>
                <option value="unemployment">Unemployment Rate</option>
                <option value="fear_greed">Crypto Fear & Greed</option>
              </select>
            </div>
          )}

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Condizione</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CONDITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Valore Soglia</label>
            <input
              type="number"
              step="any"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="0.00"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Crea Avviso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
