interface AlertEmailData {
  alerts: Array<{
    symbol: string | null;
    condition: string;
    threshold: number;
    currentValue: number;
  }>;
}

interface WeeklyReportEmailData {
  totalValue: number;
  weekChange: number;
  weekChangePct: number;
  bestPerformer: { symbol: string; changePct: number } | null;
  worstPerformer: { symbol: string; changePct: number } | null;
  topMovers: Array<{ symbol: string; changePct: number }>;
  alertsTriggered: number;
  weekStart: string;
}

const CONDITION_LABELS: Record<string, string> = {
  price_above: 'Prezzo sopra',
  price_below: 'Prezzo sotto',
  pct_change: 'Variazione %',
  macro_threshold: 'Soglia macro',
};

function formatEur(value: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatPct(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wealth-intel.vercel.app';

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#141414;border-radius:12px;border:1px solid #262626;">
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:20px;color:#fafafa;">Wealth Intel</h1>
              <p style="margin:0 0 24px;font-size:13px;color:#737373;">${title}</p>
              ${body}
              <hr style="border:none;border-top:1px solid #262626;margin:24px 0;">
              <p style="margin:0;font-size:11px;color:#525252;text-align:center;">
                Puoi gestire le notifiche nelle Impostazioni dell'app.
              </p>
              <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                Per gestire le notifiche, vai alle <a href="${BASE_URL}/settings" style="color: #3b82f6;">Impostazioni</a> del tuo account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildAlertEmail(data: AlertEmailData): { subject: string; html: string } {
  const count = data.alerts.length;
  const subject = count === 1
    ? `Alert: ${data.alerts[0].symbol ?? 'Macro'} ha raggiunto la soglia`
    : `${count} alert scattati`;

  const rows = data.alerts.map((a) => `
    <tr>
      <td style="padding:8px 12px;color:#fafafa;font-weight:600;border-bottom:1px solid #262626;">
        ${a.symbol ?? 'Macro'}
      </td>
      <td style="padding:8px 12px;color:#a3a3a3;border-bottom:1px solid #262626;">
        ${CONDITION_LABELS[a.condition] ?? a.condition}
      </td>
      <td style="padding:8px 12px;color:#a3a3a3;border-bottom:1px solid #262626;text-align:right;">
        ${a.threshold}
      </td>
      <td style="padding:8px 12px;color:#22c55e;font-weight:600;border-bottom:1px solid #262626;text-align:right;">
        ${a.currentValue.toFixed(2)}
      </td>
    </tr>
  `).join('');

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #262626;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background-color:#1a1a1a;">
          <th style="padding:8px 12px;text-align:left;color:#737373;font-size:12px;font-weight:500;">Asset</th>
          <th style="padding:8px 12px;text-align:left;color:#737373;font-size:12px;font-weight:500;">Condizione</th>
          <th style="padding:8px 12px;text-align:right;color:#737373;font-size:12px;font-weight:500;">Soglia</th>
          <th style="padding:8px 12px;text-align:right;color:#737373;font-size:12px;font-weight:500;">Valore</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return { subject, html: layout(subject, body) };
}

export function buildWeeklyReportEmail(data: WeeklyReportEmailData): { subject: string; html: string } {
  const subject = `Report Settimanale — ${formatPct(data.weekChangePct)} (${data.weekStart})`;

  const changeColor = data.weekChange >= 0 ? '#22c55e' : '#ef4444';

  const moverRows = data.topMovers.map((m) => {
    const color = m.changePct >= 0 ? '#22c55e' : '#ef4444';
    return `
      <tr>
        <td style="padding:6px 12px;color:#fafafa;font-weight:600;border-bottom:1px solid #262626;">${m.symbol}</td>
        <td style="padding:6px 12px;color:${color};font-weight:600;text-align:right;border-bottom:1px solid #262626;">${formatPct(m.changePct)}</td>
      </tr>
    `;
  }).join('');

  const body = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:16px;background-color:#1a1a1a;border-radius:8px;border:1px solid #262626;">
          <p style="margin:0 0 4px;font-size:12px;color:#737373;">Valore Portfolio</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:#fafafa;">${formatEur(data.totalValue)}</p>
          <p style="margin:4px 0 0;font-size:14px;color:${changeColor};font-weight:600;">
            ${formatEur(data.weekChange)} (${formatPct(data.weekChangePct)}) questa settimana
          </p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td width="50%" style="padding:12px;background-color:#1a1a1a;border-radius:8px 0 0 8px;border:1px solid #262626;border-right:none;">
          <p style="margin:0 0 4px;font-size:12px;color:#737373;">Migliore</p>
          <p style="margin:0;font-size:16px;color:#22c55e;font-weight:600;">
            ${data.bestPerformer ? `${data.bestPerformer.symbol} ${formatPct(data.bestPerformer.changePct)}` : '—'}
          </p>
        </td>
        <td width="50%" style="padding:12px;background-color:#1a1a1a;border-radius:0 8px 8px 0;border:1px solid #262626;">
          <p style="margin:0 0 4px;font-size:12px;color:#737373;">Peggiore</p>
          <p style="margin:0;font-size:16px;color:#ef4444;font-weight:600;">
            ${data.worstPerformer ? `${data.worstPerformer.symbol} ${formatPct(data.worstPerformer.changePct)}` : '—'}
          </p>
        </td>
      </tr>
    </table>

    ${data.topMovers.length > 0 ? `
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#fafafa;">Top Movers</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #262626;border-radius:8px;overflow:hidden;margin-bottom:20px;">
      <tbody>${moverRows}</tbody>
    </table>
    ` : ''}

    ${data.alertsTriggered > 0 ? `
    <p style="margin:0;padding:12px;background-color:#1a1a1a;border-radius:8px;border:1px solid #262626;font-size:13px;color:#f59e0b;">
      ${data.alertsTriggered} alert scattati questa settimana
    </p>
    ` : ''}
  `;

  return { subject, html: layout(subject, body) };
}
