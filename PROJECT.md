# WEALTH-INTEL — Project Audit

> **Wealth Intelligence System**
> Unified investment dashboard con dati di mercato reali, scoring quantitativo e portfolio tracking.
> Sostituisce 11 Gemini Gems + 2 Custom GPTs con un'unica app Next.js.

---

## Metadata

| Field | Value |
|-------|-------|
| **Nome progetto** | wealth-intel |
| **Path** | `C:\Users\vault01\wealth-intel` |
| **Versione** | 0.1.0 |
| **Autore** | vault01 |
| **Creato** | 2026-03-03 |
| **Stato** | Fase 1-2 completate, Fase 3-4 parziali |

---

## Tech Stack

| Layer | Tool | Versione |
|-------|------|----------|
| Framework | Next.js (App Router, RSC, Turbopack) | 16.1.6 |
| Language | TypeScript strict | 5.x |
| Runtime | React | 19.2.3 |
| Database | Supabase (Postgres + Auth + RLS) | @supabase/ssr 0.9, supabase-js 2.98 |
| Styling | Tailwind CSS 4 + oklch dark theme | 4.x |
| Charts | Recharts | 3.7 |
| Forms | React Hook Form + Zod | RHF 7.71 + Zod 4.3 |
| Icons | Lucide React | 0.576 |
| Date | date-fns | 4.1 |
| Data APIs | yahoo-finance2, CoinGecko, FRED, DeFi Llama, ECB, Fear&Greed | - |
| Testing | Vitest + @testing-library/react | 4.0 |
| Hosting | Vercel | - |

---

## Codebase Stats

| Metrica | Valore |
|---------|--------|
| **File sorgente totali** | 107 |
| **Linee di codice totali** | ~17.000 |
| **Pagine** | 16 |
| **API Routes** | 16 |
| **Cron Jobs** | 5 |
| **Componenti UI** | 28 |
| **Moduli lib** | 31 |
| **Migrazioni SQL** | 3 |

### Breakdown per directory

| Directory | File | LOC |
|-----------|------|-----|
| `app/` | 37 | 7.621 |
| `lib/` | 31 | 5.324 |
| `components/` | 28 | 3.174 |
| `supabase/` | 3 | 616 |
| Config + root | 8 | 227 |

---

## Architettura — 8 Moduli

| # | Modulo | Data Source | Automazione |
|---|--------|-------------|-------------|
| 1 | **Equities** (stocks, ETF, IPO, dividendi) | yahoo-finance2 | Auto |
| 2 | **Crypto** (BTC, ETH, altcoin, DeFi, staking) | CoinGecko + DeFi Llama | Auto |
| 3 | **Macro** (tassi, inflazione, GDP, bond, sentiment) | FRED + ECB + Fear&Greed | Auto |
| 4 | **Real Estate** (REIT, diretto, crowdfunding) | yahoo-finance2 (REIT) + manuale | Semi-auto |
| 5 | **Commodities** (oro, argento, energy, agricoltura) | yahoo-finance2 | Auto |
| 6 | **Forex** (major, minor, carry trade) | yahoo-finance2 | Auto |
| 7 | **Alternative** (P2P, PE, collectibles, arte) | Manuale | Manuale |
| 8 | **Business** (SaaS, e-commerce, side hustle) | Manuale | Manuale |

---

## Database Schema (12 tabelle)

| Tabella | Descrizione | RLS |
|---------|-------------|-----|
| `portfolios` | Portfoli dell'utente | user_id |
| `assets` | Master asset (stock, crypto, ETF, ecc.) | public read |
| `holdings` | Posizioni attuali (qty + avg cost basis) | via portfolio |
| `transactions` | Storico buy/sell/dividend/staking | via portfolio |
| `price_cache` | Cache prezzi (aggiornato da cron ogni 4h) | public read |
| `macro_indicators` | FRED, ECB, indicatori macro | public read |
| `market_sentiment` | Fear & Greed, VIX | public read |
| `asset_scores` | Score quantitativo (5 dimensioni, 0-100) | public read |
| `opportunities` | Pipeline opportunità (Kanban) | user_id |
| `decision_journal` | Diario decisioni (anti-bias, emotion tracking) | user_id |
| `alerts` | Alert configurabili (price, macro) | user_id |
| `weekly_reports` | Report settimanali generati | user_id |

---

## Scoring Engine — 100% Quantitativo

```
Overall = (Quant × 0.85) + (Sentiment × 0.15)

Quant Score (5 dimensioni, 0-100):
├── Momentum (20%)  → RSI 14d, SMA 50/200, 52w range
├── Value (20%)     → P/E, P/B, EV/EBITDA vs sector
├── Quality (20%)   → ROE, debt/equity, FCF margin
├── Growth (20%)    → Revenue/earnings YoY
└── Risk (20%)      → Volatility, beta, max drawdown

Adapter crypto:  Value/Quality → Market Cap Rank + TVL/MCap
Adapter commodity: Value/Quality → Mean Reversion + Seasonal
```

---

## Cron Jobs (Vercel)

| Job | Schedule | Route |
|-----|----------|-------|
| refresh-prices | Ogni 4h | `/api/cron/refresh-prices` |
| refresh-macro | Daily 06:00 UTC | `/api/cron/refresh-macro` |
| check-alerts | Ogni ora | `/api/cron/check-alerts` |
| batch-score | Lunedi 03:00 UTC | `/api/cron/batch-score` |
| weekly-report | Domenica 09:00 UTC | `/api/cron/weekly-report` |

---

## Calcoli Implementati

| Modulo | Funzioni |
|--------|----------|
| `lib/calculations/portfolio.ts` | P&L, allocation, TWR, IRR (Newton-Raphson) |
| `lib/calculations/risk.ts` | Sharpe, Sortino, VaR 95%, Max Drawdown, Beta, Volatility |
| `lib/calculations/correlation.ts` | Pearson correlation, matrice cross-asset, diversifiers |
| `lib/calculations/tax-it.ts` | Capital gain IT (26% standard, 12.5% BTP/EU), FIFO, zainetto fiscale 4 anni |

---

## Pagine UI (16)

| Pagina | Route | Tipo |
|--------|-------|------|
| Dashboard overview | `/` | Server |
| Login | `/login` | Client |
| Portfolio list | `/portfolio` | Server |
| Portfolio detail | `/portfolio/[id]` | Server |
| Markets overview | `/markets` | Server |
| Equities screener | `/markets/equities` | Server |
| Crypto dashboard | `/markets/crypto` | Server |
| Macro indicators | `/markets/macro` | Server |
| Commodities | `/markets/commodities` | Server |
| Forex | `/markets/forex` | Server |
| Opportunities Kanban | `/opportunities` | Client |
| Decision journal | `/journal` | Server |
| Alerts | `/alerts` | Server |
| Reports archive | `/reports` | Server |
| Analytics (risk, tax) | `/analytics` | Server |
| Settings | `/settings` | Client |

---

## Check di Build

| Check | Stato | Note |
|-------|-------|------|
| `tsc --noEmit` | **PASS** | Zero errori |
| `next build` | **PASS** | 33 route compilate, tutte dynamic |
| `eslint` | **PASS** | Zero errori, zero warning |
| `vitest run` | **PASS** | 11 file, 369 test, 3.6s |
| `git commit` | **PENDING** | Tutto untracked, nessun commit |

---

## Variabili d'Ambiente

### Required

| Var | Fonte | Costo |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard | Free tier |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard | Free tier |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | Free tier |
| `FRED_API_KEY` | fred.stlouisfed.org | Gratis |
| `COINGECKO_API_KEY` | coingecko.com | Demo gratis (30 req/min) |
| `CRON_SECRET` | Generare UUID/random | - |

### Optional

| Var | Fonte | Costo |
|-----|-------|-------|
| `ANTHROPIC_API_KEY` | Anthropic | ~$2-5/mese (Haiku) |
| `UPSTASH_REDIS_REST_URL` | Upstash | Free tier |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Free tier |
| `RESEND_API_KEY` | Resend | Free (100 email/day) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry | Free tier |

---

## Cosa Funziona (Implementato)

- [x] Struttura Next.js 16 App Router completa
- [x] Supabase client/server/admin con proxy safe-build
- [x] Auth (magic link) + middleware protezione route
- [x] 12 tabelle DB + RLS policies + indexes + functions (SQL pronte)
- [x] 7 data providers (Yahoo, CoinGecko, FRED, ECB, DeFi Llama, Fear&Greed, unified interface)
- [x] Scoring engine quantitativo (5 dimensioni + 3 adapter per equities/crypto/commodities)
- [x] Calcoli: portfolio P&L, risk metrics (Sharpe, Sortino, VaR, drawdown), correlazione, tax IT
- [x] 16 API routes CRUD (portfolio, holdings, transactions, opportunities, journal, alerts, prices, macro, sentiment, defi, score)
- [x] 5 Vercel cron jobs (prices 4h, macro daily, alerts hourly, score weekly, report weekly)
- [x] 16 pagine dashboard con dark theme oklch
- [x] 12 chart components (price, allocation pie/donut, fear&greed gauge, performance, correlation heatmap, macro sparklines)
- [x] Opportunities Kanban (7 colonne: discovered → exited/rejected)
- [x] Decision journal con emotion tracking + conviction 1-10
- [x] Alert system (price_above/below, pct_change, macro_threshold) one-shot
- [x] Weekly report data-driven (template con numeri, non AI)
- [x] AI module predisposto (`lib/ai/`) — attivabile con ANTHROPIC_API_KEY
- [x] Rate limiting (Upstash con fallback in-memory)
- [x] Logger con Sentry opzionale
- [x] Zod validators per tutti gli input
- [x] Italian tax calculator (26% / 12.5% BTP, FIFO, zainetto 4 anni)
- [x] vercel.json con 5 cron configurati
- [x] TypeScript strict: zero errori
- [x] Next.js build: successo

---

## Cosa Manca

### Critico (pre-deploy)

- [x] ~~**ESLint clean**~~ — Risolto: zero errori, zero warning
- [x] ~~**Unit test**~~ — 11 file, 369 test (scoring 6 file/143 test, calculations 4 file/159 test, validators 1 file/67 test)
- [ ] **Git commit iniziale** — Tutto il codice non e' committato
- [ ] **Supabase project** — Creare progetto, applicare 3 migrazioni SQL, configurare Auth
- [ ] **Env vars reali** — Ottenere API key (FRED, CoinGecko), generare CRON_SECRET

### Fase 3 (Automation)

- [ ] **Email notifications** — Resend + React Email templates per alert triggered
- [ ] **Email weekly digest** — Template per report settimanale via email

### Fase 4 (Polish)

- [ ] **Playwright E2E tests** — Flow completo: login → portfolio → transazione → alert
- [ ] **PWA** — manifest.json, service worker, icone
- [ ] **Landing page pubblica** — Per portfolio: screenshot, tech stack, features
- [ ] **Mobile polish** — Bottom nav responsive, sidebar collapse finali
- [ ] **Next.js 16 proxy** — Migrare middleware.ts a proxy (deprecation warning)

### Nice-to-have

- [ ] **Husky + lint-staged + Prettier** — Pre-commit hooks
- [ ] **Sentry** — Installare `@sentry/nextjs`, configurare
- [ ] **GitHub repo** — Push remoto, README pubblico

---

## Deploy Checklist

1. [ ] Creare progetto Supabase (supabase.com)
2. [ ] Applicare migrazioni SQL (001 → 003) nel SQL Editor
3. [ ] Copiare Supabase URL + anon key + service role key
4. [ ] Richiedere FRED API key (fred.stlouisfed.org)
5. [ ] Richiedere CoinGecko Demo API key (coingecko.com)
6. [ ] Generare CRON_SECRET (`openssl rand -hex 32`)
7. [ ] Creare `.env.local` con tutte le chiavi
8. [ ] Fix ESLint (zero errori)
9. [ ] Scrivere test core (scoring, calcoli, validators)
10. [ ] Commit iniziale + push su GitHub
11. [ ] Deploy su Vercel
12. [ ] Configurare env vars su Vercel
13. [ ] Verificare cron jobs attivi
14. [ ] Smoke test: creare portfolio, aggiungere transazione, verificare dati

---

## Fasi del Piano

| Fase | Descrizione | Stato |
|------|-------------|-------|
| **Fase 1** | Foundation + Portfolio Tracker | **Completata** |
| **Fase 2** | Intelligence Layer (scoring, macro, opportunities) | **Completata** |
| **Fase 3** | Automation + Alerts (email, journal, weekly report) | **Parziale** (alert + journal + report fatto, email manca) |
| **Fase 4** | Analytics + Polish (risk, tax, PWA, E2E, landing) | **Parziale** (analytics + tax fatto, PWA/E2E/landing mancano) |
