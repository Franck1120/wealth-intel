-- ============================================================
-- 004_user_settings_and_watchlist.sql
-- User settings persistence + watchlist for tracked assets
-- ============================================================

-- ===================== USER SETTINGS =====================

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  base_currency TEXT DEFAULT 'EUR',
  tax_rate DECIMAL DEFAULT 26,
  loss_carryforward DECIMAL DEFAULT 0,
  notifications_email BOOLEAN DEFAULT true,
  notifications_browser BOOLEAN DEFAULT false,
  notifications_weekly_report BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own"
  ON user_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert_own"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update_own"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can read settings (for cron email checks)
CREATE POLICY "user_settings_select_service"
  ON user_settings FOR SELECT
  TO service_role
  USING (true);

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===================== WATCHLIST =====================

CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  module TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, asset_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "watchlist_select_own"
  ON watchlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "watchlist_insert_own"
  ON watchlist FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "watchlist_delete_own"
  ON watchlist FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_watchlist_user
  ON watchlist(user_id);
