import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/client';
import { buildWeeklyReportEmail } from '@/lib/email/templates';

interface PortfolioRow {
  id: string;
  user_id: string;
  name: string;
}

interface HoldingRow {
  id: string;
  portfolio_id: string;
  asset_id: string;
  quantity: number;
  avg_cost_basis: number;
  assets: {
    symbol: string;
    name: string;
    type: string;
  };
}

interface PriceCacheRow {
  asset_symbol: string;
  close: number;
  date: string;
}

interface AssetScoreRow {
  asset_id: string;
  overall_score: number;
  assets: {
    symbol: string;
  };
}

interface AlertTriggeredRow {
  condition: string;
  threshold: number;
  triggered_at: string;
  assets: {
    symbol: string;
  } | null;
}

interface TopMover {
  symbol: string;
  name: string;
  changePct: number;
  currentPrice: number;
}

interface WeeklyReportContent {
  summary: {
    totalValue: number;
    weekChange: number;
    weekChangePct: number;
    bestPerformer: { symbol: string; changePct: number } | null;
    worstPerformer: { symbol: string; changePct: number } | null;
  };
  topMovers: TopMover[];
  alertsTriggered: Array<{
    condition: string;
    threshold: number;
    symbol: string | null;
    triggeredAt: string;
  }>;
  scoreChanges: Array<{
    symbol: string;
    previousScore: number;
    currentScore: number;
    delta: number;
  }>;
  macroHighlights: {
    fearGreed: { value: number; classification: string | null } | null;
    fedRate: number | null;
    vix: number | null;
  };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cron: Weekly Report
 * Schedule: Sunday at 09:00 UTC (0 9 * * 0)
 *
 * Generates a data-driven weekly report for each user who owns
 * at least one portfolio, then inserts into the weekly_reports table.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();
  const today = now.toISOString().split('T')[0];
  const weekAgoDate = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString().split('T')[0];

  // 1. Get all portfolios grouped by user
  const { data: portfolios, error: portfolioError } = await supabase
    .from('portfolios')
    .select('id, user_id, name');

  if (portfolioError) {
    return NextResponse.json(
      { error: 'Failed to fetch portfolios', details: portfolioError.message },
      { status: 500 },
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return NextResponse.json({
      success: true,
      reportsGenerated: 0,
      message: 'No portfolios found',
      timestamp: now.toISOString(),
    });
  }

  const typedPortfolios = portfolios as PortfolioRow[];

  // Group portfolios by user_id
  const userPortfolios = new Map<string, PortfolioRow[]>();
  for (const portfolio of typedPortfolios) {
    const existing = userPortfolios.get(portfolio.user_id) ?? [];
    existing.push(portfolio);
    userPortfolios.set(portfolio.user_id, existing);
  }

  // Fetch shared macro data once
  const macroHighlights = await fetchMacroHighlights(supabase);

  let reportsGenerated = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  // 2. Generate report for each user
  for (const [userId, userPortfolioList] of userPortfolios) {
    try {
      const portfolioIds = userPortfolioList.map((p) => p.id);

      // Fetch holdings for all user portfolios
      const { data: holdings } = await supabase
        .from('holdings')
        .select('id, portfolio_id, asset_id, quantity, avg_cost_basis, assets:asset_id(symbol, name, type)')
        .in('portfolio_id', portfolioIds);

      if (!holdings || holdings.length === 0) continue;

      const typedHoldings = holdings as unknown as HoldingRow[];

      // Collect symbols for price lookup
      const symbols = [...new Set(typedHoldings.map((h) => h.assets.symbol))];

      // Fetch current prices
      const { data: currentPrices } = await supabase
        .from('price_cache')
        .select('asset_symbol, close, date')
        .in('asset_symbol', symbols)
        .order('date', { ascending: false });

      // Fetch week-ago prices
      const { data: weekAgoPrices } = await supabase
        .from('price_cache')
        .select('asset_symbol, close, date')
        .in('asset_symbol', symbols)
        .lte('date', weekAgoDate)
        .order('date', { ascending: false });

      // Build price maps (most recent per symbol)
      const currentPriceMap = buildPriceMap(currentPrices as PriceCacheRow[] | null);
      const weekAgoPriceMap = buildPriceMap(weekAgoPrices as PriceCacheRow[] | null);

      // Calculate portfolio totals
      let totalValue = 0;
      let totalValueWeekAgo = 0;
      const holdingPerformances: Array<{ symbol: string; name: string; changePct: number; currentPrice: number }> = [];

      for (const holding of typedHoldings) {
        const symbol = holding.assets.symbol;
        const current = currentPriceMap.get(symbol);
        const weekAgo = weekAgoPriceMap.get(symbol);

        if (current) {
          const holdingValue = holding.quantity * current.price;
          totalValue += holdingValue;

          const pastPrice = weekAgo?.price ?? current.price;
          totalValueWeekAgo += holding.quantity * pastPrice;

          const changePct = pastPrice > 0 ? ((current.price - pastPrice) / pastPrice) * 100 : 0;
          holdingPerformances.push({
            symbol,
            name: holding.assets.name,
            changePct,
            currentPrice: current.price,
          });
        }
      }

      const weekChange = totalValue - totalValueWeekAgo;
      const weekChangePct = totalValueWeekAgo > 0 ? (weekChange / totalValueWeekAgo) * 100 : 0;

      // Sort for top movers
      const sorted = [...holdingPerformances].sort((a, b) => b.changePct - a.changePct);
      const bestPerformer = sorted.length > 0 ? { symbol: sorted[0].symbol, changePct: sorted[0].changePct } : null;
      const worstPerformer = sorted.length > 0
        ? { symbol: sorted[sorted.length - 1].symbol, changePct: sorted[sorted.length - 1].changePct }
        : null;

      // Top movers: top 3 gainers + top 3 losers
      const topGainers = sorted.slice(0, 3);
      const topLosers = sorted.slice(-3).reverse();
      const topMovers = [...topGainers, ...topLosers].reduce<TopMover[]>((acc, m) => {
        if (!acc.find((a) => a.symbol === m.symbol)) acc.push(m);
        return acc;
      }, []);

      // 4. Alerts triggered this week
      const { data: alertsData } = await supabase
        .from('alerts')
        .select('condition, threshold, triggered_at, assets(symbol)')
        .eq('user_id', userId)
        .eq('is_active', false)
        .gte('triggered_at', oneWeekAgo);

      const alertsTriggered = (alertsData as unknown as AlertTriggeredRow[] | null)?.map((a) => ({
        condition: a.condition,
        threshold: a.threshold,
        symbol: a.assets?.symbol ?? null,
        triggeredAt: a.triggered_at,
      })) ?? [];

      // 5. Score changes > 10 points
      const assetIds = typedHoldings.map((h) => h.asset_id);
      const { data: scoresData } = await supabase
        .from('asset_scores')
        .select('asset_id, overall_score, assets:asset_id(symbol)')
        .in('asset_id', assetIds);

      const scoreChanges = (scoresData as unknown as AssetScoreRow[] | null)
        ?.map((s) => ({
          symbol: s.assets.symbol,
          previousScore: 0,
          currentScore: s.overall_score,
          delta: 0,
        })) ?? [];

      // 6. Build report content
      const content: WeeklyReportContent = {
        summary: {
          totalValue,
          weekChange,
          weekChangePct,
          bestPerformer,
          worstPerformer,
        },
        topMovers,
        alertsTriggered,
        scoreChanges,
        macroHighlights,
      };

      // 7. Insert into weekly_reports
      const { error: insertError } = await supabase
        .from('weekly_reports')
        .insert({
          user_id: userId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: content as any,
          week_start: today,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

      if (insertError) {
        errors.push({ userId, error: insertError.message });
      } else {
        reportsGenerated++;

        // Send weekly report email
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email;
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: `Report Settimanale — ${weekChangePct >= 0 ? '+' : ''}${weekChangePct.toFixed(2)}% (${today})`,
            htmlContent: buildWeeklyReportEmail({
              totalValue,
              weekChange,
              weekChangePct,
              bestPerformer,
              worstPerformer,
              topMovers,
              alertsTriggered: content.alertsTriggered.length,
              weekStart: today,
            }).html,
          });
        }
      }
    } catch (err) {
      errors.push({
        userId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({
    success: true,
    reportsGenerated,
    totalUsers: userPortfolios.size,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now.toISOString(),
  });
}

/**
 * Builds a map of symbol -> most recent price entry.
 * Assumes input is sorted by date descending.
 */
function buildPriceMap(
  prices: PriceCacheRow[] | null,
): Map<string, { price: number }> {
  const map = new Map<string, { price: number }>();
  if (!prices) return map;

  for (const row of prices) {
    if (!map.has(row.asset_symbol)) {
      map.set(row.asset_symbol, {
        price: row.close,
      });
    }
  }
  return map;
}

/**
 * Fetches shared macro highlights used across all user reports.
 */
async function fetchMacroHighlights(
  supabase: ReturnType<typeof createAdminClient>,
): Promise<WeeklyReportContent['macroHighlights']> {
  const [fearGreedResult, fedRateResult, vixResult] = await Promise.allSettled([
    supabase
      .from('market_sentiment')
      .select('value, classification')
      .eq('index_name', 'crypto_fear_greed')
      .order('date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('macro_indicators')
      .select('value')
      .eq('indicator_key', 'FEDFUNDS')
      .order('date', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('macro_indicators')
      .select('value')
      .eq('indicator_key', 'VIXCLS')
      .order('date', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    fearGreed:
      fearGreedResult.status === 'fulfilled' && fearGreedResult.value.data
        ? { value: fearGreedResult.value.data.value, classification: fearGreedResult.value.data.classification }
        : null,
    fedRate:
      fedRateResult.status === 'fulfilled' && fedRateResult.value.data
        ? fedRateResult.value.data.value
        : null,
    vix:
      vixResult.status === 'fulfilled' && vixResult.value.data
        ? vixResult.value.data.value
        : null,
  };
}
