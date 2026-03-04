# Wealth Intelligence System

## Project Overview
Unified investment dashboard with real market data, quantitative scoring, and portfolio tracking.
Replaces 11 Gemini Gems + 2 Custom GPTs with a single Next.js 15 app.

## Tech Stack
- **Framework**: Next.js 15 (App Router, RSC)
- **Language**: TypeScript 5 strict
- **Database**: Supabase (Postgres + Auth + RLS)
- **Styling**: Tailwind CSS 4 + custom dark theme
- **Charts**: Recharts 3
- **Forms**: React Hook Form + Zod
- **Data APIs**: yahoo-finance2, CoinGecko, FRED, DeFi Llama, Fear&Greed, ECB
- **Testing**: Vitest + Playwright
- **Hosting**: Vercel

## Architecture
- 8 modules: Equities, Crypto, Macro, Real Estate, Commodities, Forex, Alternative, Business
- 100% quantitative scoring (zero AI dependency by default)
- AI module (lib/ai/) is optional — activates only with ANTHROPIC_API_KEY
- 5 Vercel Cron jobs: refresh-prices (4h), refresh-macro (1d), check-alerts (1h), batch-score (1w), weekly-report (Sun)

## Key Directories
- `app/` — Next.js pages and API routes
- `lib/data-providers/` — Yahoo, CoinGecko, FRED, DeFi Llama, ECB, Fear&Greed wrappers
- `lib/scoring/` — Quantitative scoring engine (5 dimensions + adapters)
- `lib/calculations/` — Portfolio P&L, risk metrics, correlation, Italian tax calculator
- `lib/ai/` — Optional Claude API integration (disabled by default)
- `lib/email/` — Brevo transactional email (alerts + weekly reports)
- `components/` — UI components, charts, layout
- `supabase/migrations/` — Database schema (4 migration files)

## Conventions
- Use `@/` path alias for all imports
- Server Components by default, 'use client' only when needed
- All API routes validate input with Zod schemas from lib/validators.ts
- Cron routes verify CRON_SECRET from Authorization header
- Italian locale for currency/number formatting
- Dark theme by default (oklch color system)

## Commands
- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm test` — Run Vitest tests
- `npm run lint` — ESLint
- `npm run type-check` — TypeScript check
