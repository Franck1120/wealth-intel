# Money Maker — Find Concrete Trades

## Task
I want to find concrete, actionable trades with statistical edge so that I can make money this week/month. Success means: I have a portfolio of trades with exact entry, stop, targets, position sizes, and a clear explanation of WHY each trade has an edge. If there's no edge, tell me "do nothing" — that's better than forcing mediocre trades.

## Your Input
$ARGUMENTS

If capital is specified (e.g., "ho 20K"), calibrate to that. Default: €20,000.

## Context
Use web search INTENSIVELY to find current data. Then systematically scan these 5 sources of alpha:

**A) Extreme Sentiment (Contrarian)**
Search: Fear & Greed index, AAII sentiment, VIX, put/call ratio, crypto fear index.
- Fear & Greed < 20 = BUY (historically +22% over next 12 months)
- Fear & Greed > 80 = SELL/HEDGE
- VIX > 30 = contrarian opportunity
- VIX < 15 = complacency, buy protection

**B) Confirmed Momentum**
Search: sectors breaking out, ETFs with momentum, stocks above SMA 200 with rising volume.
- Above SMA 50 AND SMA 200 = confirmed trend
- Rising volume + breakout = real strength
- RSI 50-70 = healthy momentum (not overbought)

**C) Risk/Reward Asymmetry**
Search: oversold stocks (-30%+ from high) with intact fundamentals and imminent catalyst.
- Min 3:1 risk/reward
- Concrete catalyst within 3 months
- Solid technical support below

**D) Passive Income**
Search: dividend aristocrats, BTP with positive real yield, crypto staking.
- Dividend yield > 3% with payout ratio < 60%
- BTP net yield (after 12.5% tax) > inflation = real money
- ETH/SOL staking 3-6%

**E) Event-Driven**
Search: this week's earnings, IPOs, FDA decisions, FOMC, macro data.
- Pre-earnings on companies that consistently beat
- Post-earnings dip on intact fundamentals
- Policy changes = first mover advantage

## Reference

```
═══════════════════════════════════════════════════
💰 MONEY MAKER — 4 Mar 2026
═══════════════════════════════════════════════════

📊 REGIME: Risk-On | Fear&Greed: 62/100
💶 Capitale riferimento: €20,000

═══ TRADE ATTIVI — COSA COMPRARE ORA ═══

🥇 TRADE #1: BTP Valore 2030 — Conviction: ████████░░ ALTA
   Tipo:     Income + Capital Gain
   Asset:    BTP Valore Mar2030 @ 99.50
   Allocare: €3,000 (15% del capitale)
   Entry:    99.50 (ORA)
   Stop:     97.00 (-2.5%)
   Target 1: 102.00 (+2.5%) — mantieni, incassa cedole
   Target 2: 104.00 (+4.5%) — vendi se tassi scendono aggressivamente
   Timeline: 12+ mesi
   Edge:     Yield 3.4% netto con tassazione 12.5% — batte cash e la maggior parte dei bond corporate al netto delle tasse
   Rischio:  Se BCE non taglia tassi a giugno, price resta flat (ma cedola protegge)

🥈 TRADE #2: SOL Long — Conviction: ██████░░░░ MEDIA
   Tipo:     Momentum + Catalyst
   Asset:    SOL @ $148
   Allocare: €1,500 (7.5% del capitale)
   Entry:    $140-150 (DCA in 2 tranche)
   Stop:     $110 (-25%)
   Target 1: $200 (+35%) — prendi profitto 50%
   Target 2: $280 (+90%) — prendi profitto resto
   Timeline: 3-6 mesi
   Edge:     DeFi TVL #2 dopo ETH, Firedancer upgrade H2 2026, staking yield 7%
   Rischio:  BTC correction dragging everything down — correlation 0.85

🥉 TRADE #3: ASML Earnings Play — Conviction: █████░░░░░ MEDIA
   Tipo:     Event-Driven
   Asset:    ASML @ €720
   Allocare: €1,500 (7.5% del capitale)
   Entry:    €710-730 (pre-earnings positioning)
   Stop:     €650 (-10%)
   Target 1: €820 (+13%) — post-earnings rally
   Target 2: €900 (+25%) — AI capex cycle
   Timeline: 4-8 settimane
   Edge:     Monopoly on EUV lithography, AI chip demand = ASML demand, beat last 6 quarters
   Rischio:  China restrictions on chip equipment, already priced in?

═══ INCOME PASSIVO ═══

💸 RENDITA #1: ETH Staking (Lido)
   Tipo:     Staking via stETH
   Yield:    3.5% annuo netto
   Allocare: €1,000
   Paga:     €2.90/mese (€35/anno)
   Rischio:  MEDIO (smart contract risk, ETH volatility)

💸 RENDITA #2: BTP Italia 2028
   Tipo:     Cedola indicizzata inflazione
   Yield:    ~3.2% netto (dopo 12.5% tasse)
   Allocare: €2,000
   Paga:     €5.30/mese (€64/anno)
   Rischio:  BASSO

═══ CORE — BASE SICURA ═══

🏦 VWCE (ETF globale): 50% — €10,000 — rendimento atteso 7-10%/anno
   Cash/Deposito:      5% — €1,000 — liquidità per opportunità
   Totale sicuro:      €11,000 (55% del capitale)

═══ RENDIMENTO ATTESO ═══

| Componente | Capitale | Rendimento | Guadagno atteso |
|---|---|---|---|
| Trade attivi | €6,000 | +18% (se target 1 hit) | €1,080 |
| Income passivo | €3,000 | 3.3%/anno | €99 |
| Core VWCE | €10,000 | ~8%/anno | €800 |
| Cash | €1,000 | ~3% deposito | €30 |
| TOTALE | €20,000 | | €2,009 (+10%) |

vs solo VWCE: €20,000 × 8% = €1,600
Edge atteso: +€409 (+2%)

═══ NON COMPRARE / EVITARE ═══

❌ NVIDIA sopra $900 — RSI 68, troppo stretched, aspetta pullback a $800
❌ Meme coin qualsiasi — Fear&Greed 62 non è estremo, no edge contrarian
❌ Bond corporate HY — spread troppo stretti, risk/reward sfavorevole

═══ PROSSIMO CHECK ═══

📅 Prossimo /money-maker tra: 14 giorni (18 Mar)
📌 Catalyst: BCE 13 marzo — se taglia, BTP trade accelera
📌 Se VIX > 25: aumenta cash a 15%, taglia SOL trade
📌 Se BTC > $100K: aggiungi 2% a SOL, alza stop a $130
```

## Brief
- Output: complete trade portfolio as shown in reference, with EXACT numbers
- Length: comprehensive but every line must carry value
- Does NOT sound like: a financial advisor disclaimer ("past performance...") or vague "consider buying some stocks"
- Success means: I can open my broker and execute every trade listed with exact prices

## Rules
1. Never more than 10% on a single trade — even if conviction is maximum
2. Always stop loss — "hoping it recovers" is not a strategy
3. Minimum 2:1 risk/reward — risk €500, target must be at least €1,000
4. Core VWCE at least 40% — the base that beats 90% of professional investors
5. Cash at least 5% — dry powder for when everyone else is selling
6. If there's no edge: output "NESSUN TRADE QUESTA SETTIMANA. Resta in VWCE + Cash." — this is BETTER than forcing mediocre trades
7. Review every 2 weeks — max 2x /money-maker per month
8. After 3 consecutive stop losses: stop trading for 2 weeks
9. Expected annual return must be REALISTIC (10-25%, not 100%)
10. Every trade must have a ONE-SENTENCE edge explanation — if you can't explain it simply, the edge doesn't exist

If you're about to break any of these rules, stop and tell me before continuing.

## Execution
Run intensive web searches for all 5 alpha sources, then produce the complete trade portfolio. One shot, no questions.
