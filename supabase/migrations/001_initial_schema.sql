-- ============================================================
-- 001_initial_schema.sql
-- Wealth Intelligence System - Core table definitions
-- ============================================================

-- ===================== TRIGGER FUNCTION =====================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================== CORE =====================

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  module TEXT NOT NULL,
  exchange TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(symbol, type)
);

CREATE TABLE holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  quantity DECIMAL NOT NULL,
  avg_cost_basis DECIMAL NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(portfolio_id, asset_id)
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id),
  type TEXT NOT NULL,
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  fees DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  executed_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== DATA CACHE =====================

CREATE TABLE price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  date DATE NOT NULL,
  open DECIMAL,
  high DECIMAL,
  low DECIMAL,
  close DECIMAL NOT NULL,
  volume BIGINT,
  source TEXT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_symbol, asset_type, date, source)
);

CREATE TABLE macro_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_key TEXT NOT NULL,
  value DECIMAL NOT NULL,
  date DATE NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE(indicator_key, date, source)
);

CREATE TABLE market_sentiment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  index_name TEXT NOT NULL,
  value DECIMAL NOT NULL,
  classification TEXT,
  date DATE NOT NULL,
  UNIQUE(index_name, date)
);

-- ===================== INTELLIGENCE =====================

CREATE TABLE asset_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  dimensions JSONB NOT NULL,
  ai_analysis TEXT,
  ai_model TEXT,
  scored_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  module TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'discovered',
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  thesis TEXT,
  risks TEXT,
  target_price DECIMAL,
  stop_loss DECIMAL,
  ai_validation JSONB,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE decision_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  asset_id UUID REFERENCES assets(id),
  opportunity_id UUID REFERENCES opportunities(id),
  action TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  emotion TEXT,
  conviction INTEGER CHECK (conviction BETWEEN 1 AND 10),
  outcome TEXT,
  outcome_notes TEXT,
  decided_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  asset_id UUID REFERENCES assets(id),
  indicator_key TEXT,
  condition TEXT NOT NULL,
  threshold DECIMAL NOT NULL,
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content JSONB NOT NULL,
  highlights JSONB,
  portfolio_snapshot JSONB,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===================== TRIGGERS =====================

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_holdings_updated_at
  BEFORE UPDATE ON holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
