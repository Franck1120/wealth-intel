# Macro Radar

## Task
I want a complete macroeconomic briefing with real, current data so that I can determine the market regime and adjust my portfolio accordingly. Success means: I know exactly what regime we're in, what changed, and what to do this week.

## Your Input
$ARGUMENTS

If no specific topic is given, provide the full macro picture.

## Context
Use web search to find ALL of these data points — they must be real and current, never invented:

**USA:** Fed Funds Rate, CPI YoY, Core PCE, GDP Growth, Unemployment, 10Y Treasury, 2Y Treasury, Yield Curve (10Y-2Y), VIX, ISM Manufacturing, ISM Services
**Europe:** BCE Rate, Eurozone CPI, EURIBOR 3M, EUR/USD, BTP-Bund Spread
**Sentiment:** Fear & Greed Index, Put/Call Ratio, AAII Sentiment (Bull/Bear %)

Market regimes and what they mean:
- **Risk-On**: growth strong, VIX < 20, credit easy, spreads tightening → overweight equity
- **Risk-Off**: recession/fear, VIX > 25, flight to safety → overweight bonds/gold/cash
- **Transition**: mixed signals, regime change in progress → reduce risk, increase cash
- **Stagflation**: low growth + high inflation → commodities, TIPS, reduce equity+bonds

The user is an Italian investor — BTP spread, EURIBOR for mortgages, and Italian taxation (12.5% on gov bonds, 26% on everything else) always matter.

## Reference

Here's what perfect output looks like:

```
═══════════════════════════════════════
🌍 MACRO RADAR — 4 Mar 2026
═══════════════════════════════════════

🚦 REGIME: RISK-ON (con cautela)
📊 CONFIDENCE: 70%

─── USA ───
Fed Funds Rate:     4.50% (→ stabile, prossimo taglio atteso giugno)
CPI YoY:           2.8%  (↓ in calo, trend positivo)
Core PCE:          2.6%
GDP Growth:        2.1%
Unemployment:      4.1%
10Y Treasury:      4.25%
2Y Treasury:       4.10%
Yield Curve (10-2): +15 bps NORMAL (disinversione recente = segnale positivo)
VIX:               16.5  NORMAL
ISM Manufacturing: 51.2  EXPANSION (primo mese sopra 50 da 6 mesi)
ISM Services:      53.8  EXPANSION

─── EUROPA ───
BCE Rate:          3.00%
Eurozone CPI:      2.4%
EURIBOR 3M:        2.85%
EUR/USD:           1.0820
BTP-Bund Spread:   128 bps CALMO

─── SENTIMENT ───
Fear & Greed:      62/100 GREED (non estremo, spazio per salire)
Put/Call Ratio:    0.82 (leggermente bullish)
AAII Sentiment:    Bull 42% / Bear 28% (moderatamente ottimista)

═══ IMPLICAZIONI PER ASSET CLASS ═══

| Asset Class | Outlook | Azione |
|---|---|---|
| Azioni USA | Bullish | Mantenere 55-60% equity |
| Azioni EU | Neutral-Bullish | Leggero sovrappeso su value EU |
| Bond Gov (BTP) | Neutral | Bloccare yield con BTP 5Y al 3.2% netto |
| Oro | Neutral | Mantenere 5-8% come hedge |
| Crypto | Bullish | BTC sopra SMA 200, mantenere 5% |
| Cash | Ridurre | Da 15% a 10%, deploy in equity EU |

═══ TOP 3 RISCHI ═══

🔴 Tariffe USA-Cina escalation — Prob: 35% — Impatto: alto — Q2 2026
🟡 Inflazione sticky sopra 2.5% — Prob: 40% — Impatto: medio — Prossimi 3 mesi
🟡 Earnings deludenti tech Q1 — Prob: 25% — Impatto: medio — Aprile

═══ EVENTI CHIAVE PROSSIMI 7-14 GIORNI ═══

📅 7 Mar — Jobs Report USA (impatto: alto)
📅 12 Mar — CPI USA febbraio (impatto: alto)
📅 13 Mar — BCE decisione tassi (impatto: alto)

═══ ALLOCATION SUGGERITA ═══

Equity:      55% (EM: 8%)
Bond:        20% (duration: medium, BTP focus)
Commodities: 8% (oro: 6%)
Crypto:      5%
Cash:        10%
Alternative: 2%

vs mese scorso: +5% equity, -5% cash — deploy cash su value EU e BTP

═══ 3 AZIONI CONCRETE QUESTA SETTIMANA ═══

1. Comprare VWCE per €2,000 — DCA mensile, regime supporta equity
2. BTP 5Y al 3.2% netto — bloccare yield prima del taglio BCE
3. Aspettare Jobs Report venerdì prima di aumentare esposizione ciclica
```

## Brief
- Output: single briefing, structured with sections as shown in reference
- Length: 1 page, dense with data, zero filler
- Does NOT sound like: a textbook, a news article, or "on one hand... on the other hand" hedging
- Success means: after reading, I know the regime, the risks, and exactly what to do this week

## Rules
1. Every data point must come from web search — one invented number invalidates everything
2. Always include the Italian context (BTP spread, EURIBOR, Italian taxation)
3. Distinguish facts from your interpretation — label opinions clearly
4. If the regime is changing, flag it with URGENCY — regime changes are where the most money is made and lost
5. "Do nothing this week" is a valid and often best recommendation
6. No catastrophism, no euphoria — cold, rational analysis
7. Every action must have a specific ticker/instrument, not vague "increase equity exposure"

If you're about to break any of these rules, stop and tell me before continuing.

## Execution
Search for all data points, then produce the full briefing in one shot. No intermediate questions — I want the complete picture immediately.
