# Portfolio Risk Check

## Task
I want a complete risk analysis of my portfolio so that I can find hidden bombs — excessive concentration, underestimated correlations, tail risks — before they blow up. Success means: I know my real risk exposure, what would happen in 6 stress scenarios, and exactly what to change to improve the portfolio.

## Your Input
$ARGUMENTS

The user will provide their portfolio composition. If they don't, ask for it — you can't analyze what you can't see.

## Context
Use web search for current data on individual holdings.

**Position sizing rules:**
- No single stock > 10% — it can go to zero
- No single sector > 25% — sectors can crash for years
- No single geography > 40% (unless conscious home bias)
- Total crypto < 10% — volatility is 3-5x equity
- Total alternative < 15%
- Cash 5-15% — optionality to buy when everyone sells

**Minimum diversification:**
- 3+ asset classes, 2+ geographies, 15-20+ positions (or diversified ETFs)

**Rebalancing:** trigger at >5% deviation, quarterly minimum, prefer adding new cash to underweight (avoids tax)

**DCA/PAC framework:**
- Lump sum beats DCA ~68% of the time (markets go up)
- DCA reduces emotional regret — better for beginners or scared investors
- DCA is MANDATORY when income is monthly (salary → investment)
- NEVER stop DCA in a crash — that's exactly when it works best

**Italian platforms:** Directa (low cost, regime amministrato), Fineco (free PAC on select ETFs), DEGIRO (cheapest, dichiarativo), IBKR (cheapest overall, fractional shares, dichiarativo)

**Italian tax:**
- 26% capital gain standard, **12.5% on BTP/EU gov bonds** (huge advantage)
- ETF UCITS: taxed only at sale (no annual drag)
- Tax loss harvesting: losses offset gains within 4 years (zainetto fiscale)

## Reference

```
═══════════════════════════════════════
📊 PORTFOLIO RISK ANALYSIS
═══════════════════════════════════════

─── COMPOSITION ───
| Asset | Weight | Type | S&P Corr |
|---|---|---|---|
| VWCE | 45% | Equity Global | 0.95 |
| BTP Italia 2028 | 20% | Bond Gov IT | 0.10 |
| BTC | 8% | Crypto | 0.45 |
| SGLD (Gold) | 7% | Commodity | -0.10 |
| SOL | 3% | Crypto | 0.50 |
| AAPL | 5% | Equity US | 0.85 |
| Cash | 12% | Cash | 0 |

─── ALLOCATION ───
Equity:       50% [target: 40-70%] ✅
Bond:         20% [target: 10-30%] ✅
Crypto:       11% [target: 0-10%] ⚠️ SLIGHTLY HIGH
Commodities:  7% [target: 5-15%] ✅
Cash:         12% [target: 5-15%] ✅

─── RISK METRICS ───
Volatility (annual):     12.5%
Sharpe Ratio:            0.85
Max Drawdown estimate:   -22%
VaR 95% (monthly):       -6.8%
Beta vs MSCI World:      0.72

─── CONCENTRATION ───
Top 1: VWCE 45% ✅ (diversified ETF, OK)
Top 3: VWCE+BTP+Cash 77% ✅
Top sector: Tech ~28% (via VWCE + AAPL) ⚠️
Single point of failure: BTC+SOL 11% — a crypto winter = -50% on 11% = -5.5% portfolio

─── STRESS TEST ───
| Scenario | Impact |
|---|---|
| S&P500 -20% | -12% |
| BTC -50% | -5.5% |
| Rates +200bps | -4% (BTP duration hit) |
| EUR/USD -10% | -3% (VWCE partial USD) |
| Inflation +3% | -2% (BTP Italia protects) |
| Recession | -15% |

═══ ⚠️ RED FLAGS ═══
1. Crypto at 11% — slightly above 10% max → trim SOL by 1%
2. Tech concentration ~28% via VWCE + AAPL → consider if AAPL adds value over VWCE (it's already 5% of VWCE)
3. No emerging market exposure beyond what's in VWCE

═══ 📋 ACTIONS ═══
1. TRIM SOL to 2% (sell €200 worth) → move to cash for rebalancing
2. CONSIDER selling AAPL — it's 5% of VWCE already, you're double-counting
3. Next DCA: add to BTP Italia (underweight vs optimal bond allocation)

═══ 🎯 OPTIMIZED PORTFOLIO ═══
| Asset | Current | Suggested | Action |
|---|---|---|---|
| VWCE | 45% | 50% | +5% with next DCA |
| BTP Italia | 20% | 22% | +2% |
| BTC | 8% | 7% | -1% trim |
| SGLD | 7% | 7% | Hold |
| SOL | 3% | 2% | -1% trim |
| AAPL | 5% | 0% | Sell (already in VWCE) |
| Cash | 12% | 12% | Hold |

Expected return: 7.8%/year | Volatility: 11% | Sharpe: 0.92
vs current: return similar, risk lower, Sharpe improved
```

## Brief
- Output: complete risk analysis as shown in reference
- Length: thorough — this protects the portfolio
- Does NOT sound like: "your portfolio looks great!" — find the problems
- Success means: I know my real risks, my stress test results, and what to rebalance

## Rules
1. Never optimize for return without considering risk
2. Diversification is the only free lunch — but make sure it's REAL (not 5 tech stocks "diversified")
3. Cash is not "losing money" — it's optionality
4. If the portfolio keeps you up at night, it's too risky
5. Rebalancing ≠ active trading — it's systematic discipline
6. Always compare with simple 60/40 (VWCE + AGGH) — if your complex portfolio doesn't beat 60/40, you're paying for complexity

If you're about to break any of these rules, stop and tell me before continuing.

## Execution
If the user provides their portfolio, analyze immediately. If not, ask for it (asset, weight, type). Then deliver the complete analysis.
