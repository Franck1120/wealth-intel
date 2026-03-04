'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  DollarSign,
  Calculator,
  Bell,
  LogOut,
  Loader2,
  Save,
  Check,
  Trash2,
} from 'lucide-react';

interface UserProfile {
  email: string;
  created_at: string;
}

interface UserSettings {
  base_currency: string;
  tax_rate: number;
  loss_carryforward: number;
  notifications_email: boolean;
  notifications_browser: boolean;
  notifications_weekly_report: boolean;
}

const CURRENCIES = [
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'JPY', label: 'Japanese Yen (JPY)' },
];

const DEFAULT_SETTINGS: UserSettings = {
  base_currency: 'EUR',
  tax_rate: 26,
  loss_carryforward: 0,
  notifications_email: true,
  notifications_browser: false,
  notifications_weekly_report: true,
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile ?? null);
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch {
      setError('Errore nel caricamento delle impostazioni');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Errore nel salvataggio delle impostazioni');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel salvataggio');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    if (!confirm('Sei sicuro di voler uscire?')) return;
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      setError('Errore durante il logout');
    }
  }

  async function handleDeleteAccount() {
    const confirmed = confirm(
      'Sei sicuro di voler eliminare il tuo account? Tutti i tuoi dati verranno cancellati permanentemente. Questa azione e\' irreversibile.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/account', { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Impossibile eliminare l\'account');
      }
      window.location.href = '/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione');
      setIsDeleting(false);
    }
  }

  function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Impostazioni</h1>
          <p className="text-muted-foreground">
            Gestisci le preferenze del tuo account e la configurazione.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saveSuccess ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveSuccess ? 'Salvato' : 'Salva Modifiche'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-sm mt-1">{profile?.email ?? '--'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Membro Dal
              </label>
              <p className="text-sm mt-1">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('it-IT', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '--'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valuta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <label htmlFor="base-currency" className="text-sm font-medium">
              Valuta Base
            </label>
            <select
              id="base-currency"
              value={settings.base_currency}
              onChange={(e) => updateSetting('base_currency', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Tutti i valori del portafoglio e il P&L saranno visualizzati in questa valuta.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configurazione Fiscale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="tax-rate" className="text-sm font-medium">
                Aliquota Capital Gain (%)
              </label>
              <input
                id="tax-rate"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={settings.tax_rate}
                onChange={(e) =>
                  updateSetting('tax_rate', parseFloat(e.target.value) || 0)
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Default Italia: 26% (imposta sostitutiva)
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="loss-carryforward"
                className="text-sm font-medium"
              >
                Importo Minusvalenze Pregresse
              </label>
              <input
                id="loss-carryforward"
                type="number"
                min={0}
                step={0.01}
                value={settings.loss_carryforward}
                onChange={(e) =>
                  updateSetting(
                    'loss_carryforward',
                    parseFloat(e.target.value) || 0
                  )
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                Minusvalenze degli anni precedenti che possono compensare guadagni
                futuri (valide per 4 anni in Italia).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifiche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            label="Notifiche Email"
            description="Ricevi notifiche degli avvisi via email"
            checked={settings.notifications_email}
            onChange={(val) => updateSetting('notifications_email', val)}
          />
          <NotificationToggle
            label="Notifiche Browser"
            description="Notifiche push nel tuo browser (richiede autorizzazione)"
            checked={settings.notifications_browser}
            onChange={(val) => updateSetting('notifications_browser', val)}
          />
          <NotificationToggle
            label="Email Report Settimanale"
            description="Ricevi il report settimanale del portafoglio via email"
            checked={settings.notifications_weekly_report}
            onChange={(val) =>
              updateSetting('notifications_weekly_report', val)
            }
          />
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Esci</h3>
              <p className="text-sm text-muted-foreground">
                Termina la sessione corrente e torna alla pagina di login.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Esci
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Elimina Account */}
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-destructive">Elimina Account</h3>
              <p className="text-sm text-muted-foreground">
                Elimina permanentemente il tuo account e tutti i dati associati.
                Questa azione e&apos; irreversibile.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Elimina Account
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Toggle switch component for notifications */
function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
