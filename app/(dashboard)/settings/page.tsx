'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  DollarSign,
  Key,
  Calculator,
  Bell,
  LogOut,
  Loader2,
  Save,
  Check,
} from 'lucide-react';

interface UserProfile {
  email: string;
  created_at: string;
}

interface UserSettings {
  base_currency: string;
  anthropic_api_key: string;
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
  anthropic_api_key: '',
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

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile ?? null);
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch {
      setError('Failed to load settings');
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
        throw new Error('Failed to save settings');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      setError('Failed to sign out');
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
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and configuration.
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
          {saveSuccess ? 'Saved' : 'Save Changes'}
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
                Member Since
              </label>
              <p className="text-sm mt-1">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
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
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-xs">
            <label htmlFor="base-currency" className="text-sm font-medium">
              Base Currency
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
              All portfolio values and P&L will be displayed in this currency.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="anthropic-key" className="text-sm font-medium">
              Anthropic API Key
            </label>
            <input
              id="anthropic-key"
              type="password"
              value={settings.anthropic_api_key}
              onChange={(e) =>
                updateSetting('anthropic_api_key', e.target.value)
              }
              placeholder="sk-ant-..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Used for AI-powered analysis and report generation. Your key is
              encrypted and stored securely.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tax Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Tax Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="tax-rate" className="text-sm font-medium">
                Capital Gains Tax Rate (%)
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
                Italy default: 26% (imposta sostitutiva)
              </p>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="loss-carryforward"
                className="text-sm font-medium"
              >
                Loss Carryforward Amount
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
                Capital losses from previous years that can offset future gains
                (valid for 4 years in Italy).
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
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            label="Email Notifications"
            description="Receive alert notifications via email"
            checked={settings.notifications_email}
            onChange={(val) => updateSetting('notifications_email', val)}
          />
          <NotificationToggle
            label="Browser Notifications"
            description="Push notifications in your browser (requires permission)"
            checked={settings.notifications_browser}
            onChange={(val) => updateSetting('notifications_browser', val)}
          />
          <NotificationToggle
            label="Weekly Report Email"
            description="Receive the weekly portfolio summary report by email"
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
              <h3 className="font-medium">Sign Out</h3>
              <p className="text-sm text-muted-foreground">
                End your current session and return to the login page.
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
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
