# Real Estate Intel

## Task
I want real estate investment analysis — REITs, direct property, Airbnb, crowdfunding, or farmland — so that I can evaluate the opportunity with NET numbers (after taxes, maintenance, vacancy, management). Success means: I see the real yield after ALL costs, compared with the effort required, and compared with just buying VWCE.

## Your Input
$ARGUMENTS

The user may ask about: a specific REIT, an Italian property to buy, Airbnb vs long-term rental, crowdfunding platforms, farmland/timber.

## Context
Use web search to find: property prices, current mortgage rates, REIT performance, rental yields by area, crowdfunding platform data.

**Italian taxation (critical):**
- Cedolare secca: 21% flat tax on rental income (replaces IRPEF)
- IMU: ~0.76-1.06% of cadastral value annually
- Capital gains: 26% if sold within 5 years, exempt if primary residence
- Notary + taxes on purchase: ~8-10% of purchase price (imposta registro, agenzia, notaio)

**Crowdfunding platforms:** Walliance, Rendity, EstateGuru, Reinvest24 — check LTV, duration, historical default rate
**Farmland:** AcreTrader, FarmFundr — ~10% historical total return, inflation hedge, very illiquid

## Reference

For REIT:
```
═══════════════════════════════════════
🏠 REIT ANALYSIS: O (Realty Income)
═══════════════════════════════════════

💰 Price: $56 | Mkt Cap: $48B
📊 Dividend Yield: 5.5% | Payout: 76% of AFFO

─── FUNDAMENTALS ───
FFO/Share:         $4.15 (growth YoY: +5%)
AFFO/Share:        $4.05
P/FFO:             13.5 (vs sector avg 16 — discount)
NAV/Share:         $62 (trading at 10% discount)
Occupancy:         98.7%
Avg Lease:         9.2 years
Debt/EBITDA:       5.4x
Type:              Retail/Industrial Net Lease

─── DIVIDEND ───
Yield:             5.5% (monthly payer)
Div Growth 5Y:     3.2% CAGR
Payout AFFO:       76% (sustainable)
Streak:            30+ years of increases

🎯 VERDICT: BUY
📌 TARGET: $65 (+16%) | Yield: 5.5% + growth
💰 Total return expected: ~12%/year (yield + growth + re-rating)
```

For Italian property:
```
─── ANALISI IMMOBILE: Bilocale Milano Navigli ───
Prezzo acquisto:   €250,000
Ristrutturazione:  €20,000
Notaio + tasse:    €22,000 (registro 9% + notaio + agenzia 3%)
TOTALE INVESTITO:  €292,000

─── AFFITTO LUNGO ───
Affitto lordo:     €1,100/mese
Condominio:        €150/mese (a carico proprietario)
IMU:               €1,800/anno
Cedolare secca:    €2,772/anno (21% di €13,200)
Assicurazione:     €300/anno
Manutenzione (5%): €660/anno
Vacancy (1 mese):  -€1,100/anno
NETTO ANNUO:       €7,218
YIELD NETTO:       2.5%

─── AIRBNB ───
Tariffa media:     €120/notte
Occupancy (65%):   237 notti
Revenue lordo:     €28,440
Gestione (25%):    €7,110
Tasse (21%):       €4,479
Pulizie+utilities: €3,000
NETTO AIRBNB:      €13,851
YIELD NETTO:       4.7%

─── CONFRONTO ───
| Scenario | Yield netto | Effort | Rischio |
|---|---|---|---|
| Affitto lungo | 2.5% | Basso | Basso |
| Airbnb | 4.7% | Alto (part-time job) | Medio |
| VWCE con €292K | ~8%/anno = €23,360 | Zero | Medio |

⚠️ VWCE batte entrambi gli scenari con ZERO sbattimento.
L'immobile ha senso solo se: leva (mutuo), rivalutazione attesa, o preferenza personale.
```

## Brief
- Output: structured analysis with NET numbers as shown in reference
- Length: detailed enough to make a decision, not a real estate brochure
- Does NOT sound like: a real estate agent trying to sell — show ALL costs, including hidden ones
- Success means: I see the NET yield after everything, and I see the comparison with VWCE

## Rules
1. For Italy: ALWAYS include specific taxation (cedolare secca, IMU, capital gains)
2. For REITs: compare with peers in the same sub-sector
3. For rentals: ALWAYS calculate NET yield (after taxes, condo, maintenance, vacancy) — gross yield is a lie
4. For Airbnb: use conservative occupancy 60-70% max, check local regulations (Milan, Rome, Florence have limits)
5. ALWAYS compare with opportunity cost: that €200K in VWCE would earn ~€16K/year with zero effort
6. Time cost is real — managing a short-term rental is a part-time job

If you're about to break any of these rules, stop and tell me before continuing.

## Execution
Search for current data, then deliver the analysis. For property evaluation, ask about the city/zone if not specified.
