# Earnings Decoder

## Task
I want to decode an earnings report and conference call to find the REAL signals hidden in corporate-speak so that I can decide whether to buy the dip, sell the pop, or hold. Success means: I see through the PR language to what's actually happening with the business, and I have a post-earnings action plan.

## Your Input
$ARGUMENTS

The user may provide: a ticker (search for latest earnings), a link to a transcript, or text to analyze.

## Context
Use web search to find: latest earnings report, conference call transcript, guidance, consensus estimates, analyst reactions.

**Corporate-speak decoder (universal patterns):**
| They say | They mean |
|---|---|
| "cautiously optimistic" | Worried but can't say it |
| "investing for the future" | Margins declining, hope it pays off |
| "headwinds" | Things are going badly |
| "normalization" | Growth slowed significantly |
| "strategic review" | Possible sale/spinoff |
| "right-sizing" | Layoffs |
| "robust pipeline" | Nothing shipping soon |
| "exploring options" | Desperate |

**What matters most (in order):**
1. GUIDANCE > beat/miss — the market looks forward 6-12 months
2. Revenue QUALITY > quantity — recurring > one-time, organic > acquired
3. The GAP between numbers and narrative — if numbers are good but tone is cautious, something's wrong
4. What they DIDN'T say — omissions are intentional

## Reference

```
═══════════════════════════════════════
📄 EARNINGS DECODER: MSFT — Q2 FY2026
═══════════════════════════════════════

📅 Report: 28 Jan 2026 | Pre: $428 | Post: $445 (+4.0%)

─── NUMERI vs ATTESE ───
| Metrica | Actual | Consensus | Beat/Miss | YoY |
|---|---|---|---|---|
| Revenue | $69.6B | $68.8B | ✅ +1.2% | +13% |
| EPS | $3.23 | $3.11 | ✅ +3.9% | +15% |
| Gross Margin | 71.2% | 70.5% | ✅ | +120 bps |
| Cloud (Azure) | $30.2B | $29.5B | ✅ +2.4% | +29% |
| FCF | $18.5B | | | +22% |

─── GUIDANCE ───
| Metrica | Guidance | Consensus | vs |
|---|---|---|---|
| Revenue Q3 | $70-71B | $70.2B | In-line to slightly above |
| Azure growth | 28-30% | 29% | In-line |

Guidance tone: Conservative (Satya always sandbags — actual will be higher)

─── CONFERENCE CALL — SEGNALI ───

🟢 BULLISH:
1. "AI revenue run rate exceeded $15B annualized" → AI monetization accelerating faster than expected
2. "Copilot seats grew 60% sequentially" → Enterprise AI adoption inflecting

🔴 BEARISH:
1. "We're seeing some optimization in non-AI cloud workloads" → Traditional cloud slowing, masked by AI growth
2. No mention of gaming margin improvement → Xbox/Activision integration struggling

🟡 WATCH:
1. "Capex will increase meaningfully in H2" → More spending = margin pressure short-term, but AI bet

─── SEGMENT BREAKDOWN ───
| Segment | Revenue | Growth | Trend |
|---|---|---|---|
| Intelligent Cloud | $30.2B | +29% | ↑ AI-driven acceleration |
| Productivity (Office) | $22.1B | +8% | → Steady, Copilot upside |
| Personal Computing | $17.3B | +3% | ↓ PC market flat |

─── CORPORATE-SPEAK DECODER ───
| Said | Really means |
|---|---|
| "AI is our biggest platform shift since cloud" | All-in bet, no plan B |
| "optimizing our cost structure" | Layoffs coming in non-AI divisions |

═══════════════════════════════════════
📊 EARNINGS SCORE: 78/100
═══════════════════════════════════════

| Dimension | Score | Note |
|---|---|---|
| Revenue Quality | 9/10 | Recurring, high-margin cloud + AI |
| Profitability | 8/10 | Margins expanding despite capex |
| Growth Sustainability | 8/10 | AI is the growth engine, not slowing |
| Guidance Signal | 7/10 | Conservative as usual (good sign) |
| Management Confidence | 8/10 | $10B buyback, insider holding |
| Balance Sheet | 9/10 | $75B cash, low leverage |
| Competitive Position | 8/10 | Azure #2 but AI closing gap with AWS |
| Innovation Pipeline | 8/10 | Copilot, AI agents, Phi models |
| Capital Allocation | 7/10 | Capex heavy but strategic |
| Shareholder Returns | 6/10 | Buyback + dividend, but capex eating FCF |

🎯 VERDICT: HOLD (already own) / BUY on pullback to $420
📌 KEY TAKEAWAY: AI monetization is real and accelerating — the non-AI business is boring but the AI business justifies the premium
💰 NEW TARGET: $500 (was $470)
📋 NEXT CATALYST: Q3 earnings May 2026
```

## Brief
- Output: complete earnings decode as shown in reference
- Length: thorough but structured — tables, not paragraphs
- Does NOT sound like: a sell-side analyst note ("we maintain our Overweight rating") — be honest, not promotional
- Success means: I understand what happened, what it means, and what to do

## Rules
1. Always find the GAP between numbers and narrative — that's where surprises hide
2. Revenue quality matters more than quantity — recurring beats one-time, organic beats acquired
3. Guidance is more important than the quarterly beat/miss
4. Buyback announced after weak earnings = red flag (EPS cosmetics)
5. Read between the lines: what they DIDN'T mention is often most important
6. Compare with previous 2-3 quarters to see the trend
7. If no transcript available, analyze with available numerical data — partial analysis > no analysis

If you're about to break any of these rules, stop and tell me before continuing.

## Execution
Search for the earnings data, then deliver the complete decode. One shot, no questions.
