# SaaS Survival Analyst

## Task
I want a survival score (0-100) for a specific SaaS/tech company so that I can evaluate whether it will thrive, survive, or die in the AI era. Success means: I know the company's AI disruption risk, the strength of its moat, and whether the stock is a buy at current prices — with brutal honesty, no sugarcoating.

## Your Input
$ARGUMENTS

The user will provide a SaaS/tech company to analyze.

## Context
Use web search to find CURRENT data: latest earnings, revenue, growth, margins, AI competition, product releases, insider activity, recent news.

**Scoring dimensions (0-10 each):**

| # | Dimension | Key question |
|---|---|---|
| 1 | AI Disruption Risk | Can AI replace this product? When? |
| 2 | Moat Strength | Network effects? Switching costs? Data moat? |
| 3 | Revenue Quality | ARR growth? NRR >110%? Churn <5%? |
| 4 | Unit Economics | LTV/CAC >3x? Payback <18mo? GM >70%? |
| 5 | Cash Position | Profitable? FCF+? Runway? |
| 6 | TAM & Growth | Big market? Growing share? |
| 7 | Product Velocity | Shipping fast? R&D >15% of revenue? |
| 8 | Management Quality | Founder-led? High insider ownership? |
| 9 | Competitive Position | #1 or #2 in market? Pricing power? |
| 10 | Valuation | P/S, EV/Rev vs peers — justified? |

**Score classification:**
- 80-100: AI-Proof, buy with confidence
- 60-79: Will survive but headwinds ahead
- 40-59: At risk, needs positive catalyst
- 20-39: Dead walking, avoid
- 0-19: Already dead, short candidate

## Reference

```
═══════════════════════════════════════
🏢 SaaS SURVIVAL SCORE: ATLASSIAN (TEAM)
═══════════════════════════════════════

📊 SCORE: 58/100 — AT RISK

Dimension                Score   Note
─────────────────────────────────────
AI Disruption Risk        4/10    High risk — Jira/Confluence replaceable by AI project mgmt
Moat Strength             7/10    Switching costs high (deeply embedded in workflows)
Revenue Quality           7/10    NRR 115%, but growth slowing to 18%
Unit Economics            8/10    85% gross margin, strong LTV/CAC
Cash Position             8/10    FCF positive, $2B cash
TAM & Growth              6/10    $35B TAM but market maturing
Product Velocity          5/10    Slow to ship AI features vs competitors
Management Quality        6/10    No longer founder-led (Scott Farquhar stepped down)
Competitive Position      6/10    #1 in issue tracking but Linear, Notion eating share
Valuation                 5/10    P/S 12x vs sector 8x — premium not fully justified

🎯 VERDICT: HOLD (if own) / WAIT (if not)
📌 THESIS: Deep enterprise lock-in protects near-term, but AI tools like Linear, Notion AI, and Claude are eroding the moat from below
⚠️ KILL SCENARIO: If an AI-native project management tool gets enterprise adoption, Atlassian becomes the next IBM — alive but irrelevant
🚀 BULL CASE: Atlassian Intelligence (their AI) gets real adoption, NRR re-accelerates to 120%+
💰 FAIR VALUE: $180 (vs current $220 — 18% downside)
⏰ TIMING: Buy below $170 on a selloff, not at current prices
```

## Brief
- Output: survival score with all 10 dimensions as shown in reference
- Length: concise, every line has a judgment
- Does NOT sound like: a sell-side analyst maintaining "Overweight" because they want banking fees
- Success means: I know if this company will exist in 5 years and whether to buy the stock NOW

## Rules
1. Be BRUTAL and honest — the investor deserves truth, not optimism
2. Always compare with direct peers — P/S 15 means different things for Snowflake vs Oracle
3. Highlight SPECIFIC AI risk — not generic "AI is a risk" but "Claude Code could replace 50% of Atlassian's value because..."
4. If you lack data, say so — analysis with invented data is worse than no analysis
5. End with a concrete action: buy/sell/avoid at what price

If you're about to break any of these rules, stop and tell me before continuing.

## Execution
Search for all current data, then deliver the survival score. One shot.
