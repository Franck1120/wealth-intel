-- Migration 005: Fixes & Audit
-- Fixes upsert crash, adds missing CASCADE, indexes, and service_role DELETE policies.

-- =============================================================================
-- a) UNIQUE constraint on asset_scores.asset_id (fixes upsert crash)
-- =============================================================================
ALTER TABLE asset_scores ADD CONSTRAINT asset_scores_asset_id_key UNIQUE (asset_id);

-- =============================================================================
-- b) Add ON DELETE CASCADE to all user_id foreign keys that were missing it
-- =============================================================================

-- portfolios
ALTER TABLE portfolios DROP CONSTRAINT IF EXISTS portfolios_user_id_fkey;
ALTER TABLE portfolios ADD CONSTRAINT portfolios_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- opportunities
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_user_id_fkey;
ALTER TABLE opportunities ADD CONSTRAINT opportunities_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- decision_journal
ALTER TABLE decision_journal DROP CONSTRAINT IF EXISTS decision_journal_user_id_fkey;
ALTER TABLE decision_journal ADD CONSTRAINT decision_journal_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- alerts
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_user_id_fkey;
ALTER TABLE alerts ADD CONSTRAINT alerts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- weekly_reports
ALTER TABLE weekly_reports DROP CONSTRAINT IF EXISTS weekly_reports_user_id_fkey;
ALTER TABLE weekly_reports ADD CONSTRAINT weekly_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =============================================================================
-- c) Missing indexes
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_portfolios_user ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_journal_user ON decision_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_user ON weekly_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON weekly_reports(user_id, week_start DESC);

-- =============================================================================
-- d) DELETE policies for service_role on shared tables (cleanup capability)
-- =============================================================================
CREATE POLICY "Service role can delete shared data" ON assets FOR DELETE TO service_role USING (true);
CREATE POLICY "Service role can delete price cache" ON price_cache FOR DELETE TO service_role USING (true);
CREATE POLICY "Service role can delete macro indicators" ON macro_indicators FOR DELETE TO service_role USING (true);
CREATE POLICY "Service role can delete market sentiment" ON market_sentiment FOR DELETE TO service_role USING (true);
CREATE POLICY "Service role can delete asset scores" ON asset_scores FOR DELETE TO service_role USING (true);
