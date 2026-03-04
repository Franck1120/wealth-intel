import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const PERIOD_TO_DAYS: Record<string, number> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
};

/**
 * GET /api/assets/[id]/price-history?period=3m
 * Returns historical price data for the given asset.
 * Used by AssetPriceChart component.
 *
 * Query params:
 *   - period: '1w' | '1m' | '3m' | '6m' | '1y' (default: '3m')
 *   - days: number (alternative to period, overrides period if both provided)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Get asset info to resolve symbol
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: asset, error: assetError } = await (supabase as any)
    .from('assets')
    .select('symbol, type')
    .eq('id', id)
    .single();

  if (assetError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  // Determine date range from period or days param
  const url = new URL(request.url);
  const period = url.searchParams.get('period');
  const daysParam = url.searchParams.get('days');

  let days: number;

  if (daysParam) {
    days = parseInt(daysParam, 10);
    if (isNaN(days) || days < 1 || days > 365) {
      days = 90;
    }
  } else {
    days = PERIOD_TO_DAYS[period ?? '3m'] ?? 90;
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Fetch price history from cache
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prices, error: priceError } = await (supabase as any)
    .from('price_cache')
    .select('date, close')
    .eq('asset_symbol', asset.symbol)
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (priceError) {
    return NextResponse.json(
      { error: 'Failed to fetch price history', details: priceError.message },
      { status: 500 },
    );
  }

  const history = (prices ?? []).map((p: { date: string; close: number }) => ({
    date: p.date,
    price: p.close,
  }));

  return NextResponse.json({ data: history });
}
