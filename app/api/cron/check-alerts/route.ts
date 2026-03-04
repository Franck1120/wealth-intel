import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/client';
import { buildAlertEmail } from '@/lib/email/templates';

type AlertCondition = 'price_above' | 'price_below' | 'pct_change' | 'macro_threshold';

interface AlertRow {
  id: string;
  user_id: string;
  asset_id: string | null;
  condition: AlertCondition;
  threshold: number;
  indicator_key: string | null;
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
}

interface TriggeredAlert {
  id: string;
  userId: string;
  symbol: string | null;
  condition: AlertCondition;
  threshold: number;
  currentValue: number;
  triggeredAt: string;
}

/**
 * Cron: Check Alerts
 * Schedule: Every hour (0 * * * *)
 *
 * Evaluates all active alerts against current price cache and macro
 * indicator data. Triggered alerts are marked as inactive (one-shot).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // 1. Fetch all active alerts with asset info
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('*')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .eq('is_active', true) as { data: AlertRow[] | null; error: any };

  if (alertsError) {
    return NextResponse.json(
      { error: 'Failed to fetch alerts', details: alertsError.message },
      { status: 500 },
    );
  }

  if (!alerts || alerts.length === 0) {
    return NextResponse.json({
      success: true,
      checked: 0,
      triggered: 0,
      timestamp: now,
    });
  }

  const typedAlerts = alerts ?? [];

  // Look up asset symbols for alerts that have asset_id
  const assetIds = typedAlerts.filter(a => a.asset_id).map(a => a.asset_id!);
  const assetMap = new Map<string, string>();
  if (assetIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: assets } = await supabase.from('assets').select('id, symbol').in('id', assetIds) as { data: { id: string; symbol: string }[] | null; error: any };
    for (const a of assets ?? []) {
      assetMap.set(a.id, a.symbol);
    }
  }

  // Collect unique symbols and macro series we need to look up
  const symbolsNeeded = new Set<string>();
  const macroSeriesNeeded = new Set<string>();

  for (const alert of typedAlerts) {
    const symbol = alert.asset_id ? assetMap.get(alert.asset_id) : null;
    if (symbol && ['price_above', 'price_below', 'pct_change'].includes(alert.condition)) {
      symbolsNeeded.add(symbol);
    }
    if (alert.indicator_key && alert.condition === 'macro_threshold') {
      macroSeriesNeeded.add(alert.indicator_key);
    }
  }

  // 2. Fetch latest prices from price_cache for needed symbols
  const priceMap = new Map<string, { price: number; changePct24h: number | null }>();

  if (symbolsNeeded.size > 0) {
    const { data: prices } = await supabase
      .from('price_cache')
      .select('asset_symbol, close')
      .in('asset_symbol', Array.from(symbolsNeeded))
      .order('date', { ascending: false });

    if (prices) {
      for (const row of prices) {
        if (!priceMap.has(row.asset_symbol)) {
          priceMap.set(row.asset_symbol, {
            price: row.close,
            changePct24h: null,
          });
        }
      }
    }
  }

  // 3. Fetch latest macro indicators for needed series
  const macroMap = new Map<string, number>();

  if (macroSeriesNeeded.size > 0) {
    const { data: macros } = await supabase
      .from('macro_indicators')
      .select('indicator_key, value')
      .in('indicator_key', Array.from(macroSeriesNeeded))
      .order('date', { ascending: false });

    if (macros) {
      for (const row of macros) {
        if (!macroMap.has(row.indicator_key)) {
          macroMap.set(row.indicator_key, row.value);
        }
      }
    }
  }

  // 4. Evaluate each alert
  const triggered: TriggeredAlert[] = [];
  const alertIdsToDeactivate: string[] = [];

  for (const alert of typedAlerts) {
    let isTriggered = false;
    let currentValue = 0;

    const symbol = alert.asset_id ? (assetMap.get(alert.asset_id) ?? null) : null;

    switch (alert.condition) {
      case 'price_above': {
        if (symbol && priceMap.has(symbol)) {
          const data = priceMap.get(symbol)!;
          currentValue = data.price;
          isTriggered = data.price > alert.threshold;
        }
        break;
      }
      case 'price_below': {
        if (symbol && priceMap.has(symbol)) {
          const data = priceMap.get(symbol)!;
          currentValue = data.price;
          isTriggered = data.price < alert.threshold;
        }
        break;
      }
      case 'pct_change': {
        if (symbol && priceMap.has(symbol)) {
          const data = priceMap.get(symbol)!;
          const absPct = Math.abs(data.changePct24h ?? 0);
          currentValue = absPct;
          isTriggered = absPct > alert.threshold;
        }
        break;
      }
      case 'macro_threshold': {
        if (alert.indicator_key && macroMap.has(alert.indicator_key)) {
          const value = macroMap.get(alert.indicator_key)!;
          currentValue = value;
          isTriggered = value > alert.threshold;
        }
        break;
      }
    }

    if (isTriggered) {
      alertIdsToDeactivate.push(alert.id);
      triggered.push({
        id: alert.id,
        userId: alert.user_id,
        symbol,
        condition: alert.condition,
        threshold: alert.threshold,
        currentValue,
        triggeredAt: now,
      });
    }
  }

  // 5. Deactivate triggered alerts (one-shot)
  if (alertIdsToDeactivate.length > 0) {
    const { error: updateError } = await supabase
      .from('alerts')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_active: false, triggered_at: now } as any)
      .in('id', alertIdsToDeactivate);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to deactivate alerts', details: updateError.message },
        { status: 500 },
      );
    }
  }

  // 6. Send email notifications grouped by user
  if (triggered.length > 0) {
    const alertsByUser = new Map<string, TriggeredAlert[]>();
    for (const alert of triggered) {
      const existing = alertsByUser.get(alert.userId) ?? [];
      existing.push(alert);
      alertsByUser.set(alert.userId, existing);
    }

    let emailsSent = 0;
    for (const [userId, userAlerts] of alertsByUser) {
      // Check if user has email notifications enabled
      const { data: userSettingsData } = await supabase
        .from('user_settings')
        .select('notifications_email')
        .eq('user_id', userId)
        .single();

      const emailEnabled = userSettingsData?.notifications_email ?? true;
      if (!emailEnabled) continue;

      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      if (!email) continue;

      const { subject, html } = buildAlertEmail({
        alerts: userAlerts.map((a) => ({
          symbol: a.symbol,
          condition: a.condition,
          threshold: a.threshold,
          currentValue: a.currentValue,
        })),
      });

      const sent = await sendEmail({ to: email, subject, htmlContent: html });
      if (sent) emailsSent++;
    }

    return NextResponse.json({
      success: true,
      checked: typedAlerts.length,
      triggered: triggered.length,
      emailsSent,
      triggeredAlerts: triggered,
      timestamp: now,
    });
  }

  return NextResponse.json({
    success: true,
    checked: typedAlerts.length,
    triggered: triggered.length,
    triggeredAlerts: triggered,
    timestamp: now,
  });
}
