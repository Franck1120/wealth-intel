-- ============================================================
-- 003_indexes_and_functions.sql
-- Wealth Intelligence System - Performance indexes & helpers
-- ============================================================

-- ===================== INDEXES =====================

CREATE INDEX idx_price_cache_symbol_date
  ON price_cache(asset_symbol, date DESC);

CREATE INDEX idx_transactions_portfolio
  ON transactions(portfolio_id, executed_at DESC);

CREATE INDEX idx_holdings_portfolio
  ON holdings(portfolio_id);

CREATE INDEX idx_opportunities_status
  ON opportunities(user_id, status);

CREATE INDEX idx_alerts_active
  ON alerts(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX idx_macro_key_date
  ON macro_indicators(indicator_key, date DESC);

CREATE INDEX idx_scores_asset
  ON asset_scores(asset_id, scored_at DESC);

-- ===================== HELPER FUNCTIONS =====================

/**
 * calculate_portfolio_value(p_portfolio_id UUID)
 *
 * Calculates the total current market value of a portfolio by joining
 * holdings with the latest available closing price for each asset.
 * Returns a single DECIMAL representing the sum of (quantity * latest_close)
 * for all holdings in the portfolio.
 *
 * Falls back to avg_cost_basis when no price data is available,
 * ensuring the function always returns a meaningful value.
 */
CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_portfolio_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_value DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(h.quantity * COALESCE(latest_price.close, h.avg_cost_basis)), 0)
  INTO total_value
  FROM holdings h
  LEFT JOIN LATERAL (
    SELECT pc.close
    FROM price_cache pc
    JOIN assets a ON a.symbol = pc.asset_symbol AND a.type = pc.asset_type
    WHERE a.id = h.asset_id
    ORDER BY pc.date DESC
    LIMIT 1
  ) latest_price ON true
  WHERE h.portfolio_id = p_portfolio_id;

  RETURN total_value;
END;
$$;

/**
 * get_portfolio_summary(p_portfolio_id UUID)
 *
 * Returns a JSONB summary of a portfolio including:
 *   - total_value: current market value
 *   - total_cost: sum of (quantity * avg_cost_basis)
 *   - total_gain: unrealized profit/loss
 *   - gain_pct: percentage return
 *   - holdings_count: number of distinct holdings
 *   - calculated_at: timestamp of calculation
 */
CREATE OR REPLACE FUNCTION get_portfolio_summary(p_portfolio_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_value DECIMAL;
  v_total_cost DECIMAL;
  v_holdings_count INTEGER;
BEGIN
  -- Get current market value
  v_total_value := calculate_portfolio_value(p_portfolio_id);

  -- Get total cost basis and holdings count
  SELECT
    COALESCE(SUM(h.quantity * h.avg_cost_basis), 0),
    COUNT(*)
  INTO v_total_cost, v_holdings_count
  FROM holdings h
  WHERE h.portfolio_id = p_portfolio_id;

  RETURN jsonb_build_object(
    'total_value', v_total_value,
    'total_cost', v_total_cost,
    'total_gain', v_total_value - v_total_cost,
    'gain_pct', CASE
      WHEN v_total_cost > 0 THEN ROUND(((v_total_value - v_total_cost) / v_total_cost) * 100, 2)
      ELSE 0
    END,
    'holdings_count', v_holdings_count,
    'calculated_at', now()
  );
END;
$$;
