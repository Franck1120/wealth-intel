# Stock & ETF Screener

## Task
I want a deep analysis of a specific stock, ETF, or security so that I can decide whether to buy, hold, or sell with exact entry, stop loss, and target prices. Success means: I have a clear verdict with a concrete action plan, not a wishy-washy "it could go either way."

## Your Input
$ARGUMENTS

The user will provide a ticker, company name, ETF, or ask for a screening.

## Context
Use web search to find REAL current data: price, recent earnings, fundamental metrics, news, analyst targets, insider activity.

**Key metrics to find:**
- Fundamentals: P/E (TTM + Forward), P/B, P/S, EV/EBITDA, Dividend Yield, Payout Ratio, ROE, ROA, Debt/Equity, FCF Margin, Revenue/EPS Growth YoY, Gross Margin
- Technicals: SMA 50, SMA 200, RSI 14, 52-week range, volume vs 90d average, key support/resistance
- Catalysts: next earnings date, upcoming events, insider buying/selling
- Analysts: target price (mean/high/low), buy/hold/sell distribution, recent revisions

**For Growth Stocks add:** Revenue Growth, PEG ratio, Rule of 40, TAM penetration
**For Value Stocks add:** P/E vs 5Y average, P/B (<1 = deep value), FCF Yield (>8% = value), Dividend Aristocrat status
**For ETFs add:** TER, AUM (<€100M = delisting risk), Top 10 holdings, tracking difference, Acc vs Dist, replication method. For thematic ETFs: "are you late to the party?"
**For IPO/SPAC add:** pre-money valuation vs quoted peers, lock-up period, prospectus red flags

Always compare with 3-5 direct peers. A P/E of 25 can be cheap or expensive depending on sector.

## Reference

```
═══════════════════════════════════════
📈 STOCK ANALYSIS: NVDA
═══════════════════════════════════════

💰 Prezzo: $875 | Mkt Cap: $2.15T
📊 Score: 82/100

🎯 VERDICT: BUY

📌 THESIS: Dominant AI infrastructure play with 80%+ data center GPU share and accelerating enterprise adoption.

FONDAMENTALI: Fair Value — P/E 35 justified by 90%+ revenue growth
TECNICI: Bullish — above SMA 50 & 200, RSI 62 (healthy momentum)
MOMENTUM: Forte — volume confirming breakout, institutions accumulating

─── FONDAMENTALI ───
| Metrica | Valore | vs Settore | Giudizio |
|---|---|---|---|
| P/E (TTM) | 65 | 28 | Premium, but growth justifies |
| P/E Forward | 35 | 22 | More reasonable on forward |
| P/S | 32 | 8 | High but revenue exploding |
| EV/EBITDA | 52 | 18 | Premium |
| ROE | 115% | 22% | Exceptional |
| Debt/Equity | 0.41 | 0.65 | Healthy |
| FCF Margin | 45% | 15% | Cash machine |
| Rev Growth YoY | 94% | 12% | Extraordinary |

─── TECNICI ───
SMA 50:     $820 (sopra +6.7%)
SMA 200:    $680 (sopra +28.7%)
RSI 14:     62 (healthy momentum, not overbought)
52w Range:  $470 - $950 (al 83%)
Volume:     45M vs avg 52M (slightly below, watch)

⚡ CATALYSTS:
1. GTC Conference — Mar 17 (new products, Blackwell Ultra)
2. Q1 earnings — May 28 (consensus: beat again)

⚠️ RISKS:
1. China export restrictions tightening — could hit 10-15% of revenue
2. Customer concentration (hyperscalers) — if MSFT/GOOGL slow capex

─── ANALISTI ───
Target medio: $1,050 (+20%) | Range: $700 - $1,400
Rating: 88% Buy / 10% Hold / 2% Sell

💰 TARGET PRICES:
- Bear: $680 (-22%) — se recession hits AI capex
- Base: $1,050 (+20%) — continued growth, new products
- Bull: $1,300 (+49%) — AI adoption accelerates beyond expectations

📋 ACTION PLAN:
- Entry: $860-880 (current zone, or limit at $830 on pullback)
- Stop loss: $750 (-14%)
- Take profit 1: $1,050 (+20%) — sell 50%
- Take profit 2: $1,250 (+43%) — sell rest
- Position size: 8% del portfolio
- Timeline: 6-12 mesi
```

## Brief
- Output: structured analysis as shown in reference
- Length: fits in one screen, data-dense
- Does NOT sound like: "the stock could go up or down depending on market conditions" — be decisive
- Success means: I have entry price, stop loss, targets, and position size. A clear YES or NO.

## Rules
1. Always compare with 3-5 direct peers — a number in isolation means nothing
2. Include macro context — a stock doesn't exist in a vacuum
3. For dividend stocks: verify sustainability with FCF coverage > 1.5x
4. For penny stocks (<$5): explicit WARNING about liquidity risk
5. Always end with a concrete action plan (entry, stop, target, size)
6. HOLD must have a specific reason — it's not the refuge of indecision
7. For ETFs: always ask "is TER justified vs cheaper alternatives?"

If you're about to break any of these rules, stop and tell me before continuing.

## Execution
Search for all data, then deliver the complete analysis in one shot.
