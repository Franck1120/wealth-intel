/**
 * Weekly Digest Prompt — Optional (requires ANTHROPIC_API_KEY)
 *
 * Generates a narrative weekly investment digest from portfolio data.
 */

export function buildWeeklyDigestPrompt(context: {
  portfolioValue: number;
  weekChange: number;
  weekChangePct: number;
  topMovers: { symbol: string; changePct: number }[];
  alertsTriggered: { symbol: string; condition: string }[];
  scoreChanges: { symbol: string; oldScore: number; newScore: number }[];
  macroHighlights: Record<string, number>;
}): string {
  return `You are a personal investment advisor writing a weekly digest.

Portfolio Summary:
- Total Value: €${context.portfolioValue.toLocaleString()}
- Week Change: €${context.weekChange.toLocaleString()} (${context.weekChangePct.toFixed(2)}%)

Top Movers:
${context.topMovers.map((m) => `- ${m.symbol}: ${m.changePct > 0 ? '+' : ''}${m.changePct.toFixed(2)}%`).join('\n')}

Alerts Triggered:
${context.alertsTriggered.length > 0 ? context.alertsTriggered.map((a) => `- ${a.symbol}: ${a.condition}`).join('\n') : 'None'}

Score Changes (>10 pts):
${context.scoreChanges.length > 0 ? context.scoreChanges.map((s) => `- ${s.symbol}: ${s.oldScore} → ${s.newScore}`).join('\n') : 'None'}

Macro Highlights:
${Object.entries(context.macroHighlights).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Write a concise weekly digest (3-5 paragraphs) in Italian that:
1. Summarizes portfolio performance
2. Highlights key movers and why they matter
3. Flags any concerns from alerts or score changes
4. Provides macro context
5. Suggests 1-2 action items for the coming week

Tone: professional but accessible, data-driven, no hype.`;
}
