-- ============================================================
-- 002_rls_policies.sql
-- Wealth Intelligence System - Row Level Security policies
-- ============================================================

-- ===================== ENABLE RLS =====================

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE macro_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_sentiment ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- ===================== PORTFOLIOS =====================
-- Users can only CRUD their own portfolios

CREATE POLICY "portfolios_select_own"
  ON portfolios FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "portfolios_insert_own"
  ON portfolios FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "portfolios_update_own"
  ON portfolios FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "portfolios_delete_own"
  ON portfolios FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ===================== HOLDINGS =====================
-- Users can only CRUD holdings in their own portfolios

CREATE POLICY "holdings_select_own"
  ON holdings FOR SELECT
  TO authenticated
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "holdings_insert_own"
  ON holdings FOR INSERT
  TO authenticated
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "holdings_update_own"
  ON holdings FOR UPDATE
  TO authenticated
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "holdings_delete_own"
  ON holdings FOR DELETE
  TO authenticated
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

-- ===================== TRANSACTIONS =====================
-- Users can only CRUD transactions in their own portfolios

CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  TO authenticated
  USING (
    portfolio_id IN (
      SELECT id FROM portfolios WHERE user_id = auth.uid()
    )
  );

-- ===================== ASSETS =====================
-- Any authenticated user can read; only service_role can insert/update

CREATE POLICY "assets_select_authenticated"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "assets_insert_service"
  ON assets FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "assets_update_service"
  ON assets FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===================== PRICE CACHE =====================
-- Any authenticated user can read

CREATE POLICY "price_cache_select_authenticated"
  ON price_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "price_cache_insert_service"
  ON price_cache FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "price_cache_update_service"
  ON price_cache FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===================== MACRO INDICATORS =====================
-- Any authenticated user can read

CREATE POLICY "macro_indicators_select_authenticated"
  ON macro_indicators FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "macro_indicators_insert_service"
  ON macro_indicators FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "macro_indicators_update_service"
  ON macro_indicators FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===================== MARKET SENTIMENT =====================
-- Any authenticated user can read

CREATE POLICY "market_sentiment_select_authenticated"
  ON market_sentiment FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "market_sentiment_insert_service"
  ON market_sentiment FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "market_sentiment_update_service"
  ON market_sentiment FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===================== ASSET SCORES =====================
-- Any authenticated user can read

CREATE POLICY "asset_scores_select_authenticated"
  ON asset_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "asset_scores_insert_service"
  ON asset_scores FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "asset_scores_update_service"
  ON asset_scores FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===================== OPPORTUNITIES =====================
-- Users can only CRUD their own opportunities

CREATE POLICY "opportunities_select_own"
  ON opportunities FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "opportunities_insert_own"
  ON opportunities FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "opportunities_update_own"
  ON opportunities FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "opportunities_delete_own"
  ON opportunities FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ===================== DECISION JOURNAL =====================
-- Users can only CRUD their own journal entries

CREATE POLICY "decision_journal_select_own"
  ON decision_journal FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "decision_journal_insert_own"
  ON decision_journal FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "decision_journal_update_own"
  ON decision_journal FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "decision_journal_delete_own"
  ON decision_journal FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ===================== ALERTS =====================
-- Users can only CRUD their own alerts

CREATE POLICY "alerts_select_own"
  ON alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "alerts_insert_own"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "alerts_update_own"
  ON alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "alerts_delete_own"
  ON alerts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ===================== WEEKLY REPORTS =====================
-- Users can only read their own reports

CREATE POLICY "weekly_reports_select_own"
  ON weekly_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "weekly_reports_insert_service"
  ON weekly_reports FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "weekly_reports_update_service"
  ON weekly_reports FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
