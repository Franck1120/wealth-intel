import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { holdingSchema } from '@/lib/validators';

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/**
 * GET /api/portfolio/holdings?portfolio_id=<uuid>
 * List holdings for a portfolio, joined with asset info and latest cached price.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portfolioId = request.nextUrl.searchParams.get('portfolio_id');

  if (!portfolioId) {
    return NextResponse.json(
      { error: 'portfolio_id query param is required' },
      { status: 400 },
    );
  }

  // Fetch holdings joined with asset details
  // Note: join references columns (asset_type, currency) not in typed schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: holdings, error } = await (supabase as any)
    .from('holdings')
    .select(
      `
      *,
      assets:asset_id (
        id,
        symbol,
        name,
        asset_type,
        exchange,
        currency
      )
    `,
    )
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!holdings || holdings.length === 0) {
    return NextResponse.json([]);
  }

  // Fetch latest cached prices for all held assets
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const holdingsList = holdings as any[];
  const assetSymbols = holdingsList
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((h: any) => h.assets?.symbol as string)
    .filter(Boolean);

  const fourHoursAgo = new Date(Date.now() - FOUR_HOURS_MS).toISOString();

  const { data: prices } = await supabase
    .from('price_cache')
    .select('asset_symbol, close, volume, fetched_at')
    .in('asset_symbol', assetSymbols)
    .gte('fetched_at', fourHoursAgo);

  const priceMap = new Map(
    (prices ?? []).map((p) => [p.asset_symbol, p]),
  );

  // Enrich holdings with latest price data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = holdingsList.map((holding: any) => {
    const asset = holding.assets as Record<string, unknown> | null;
    const symbol = asset?.symbol as string | undefined;
    const latestPrice = symbol ? priceMap.get(symbol) : null;
    const currentPrice = latestPrice?.close ?? null;
    const marketValue =
      currentPrice !== null ? holding.quantity * (currentPrice as number) : null;
    const unrealizedPl =
      marketValue !== null
        ? marketValue - holding.quantity * holding.avg_cost_basis
        : null;
    const unrealizedPlPct =
      holding.avg_cost_basis > 0 && currentPrice !== null
        ? (((currentPrice as number) - holding.avg_cost_basis) /
            holding.avg_cost_basis) *
          100
        : null;

    return {
      ...holding,
      latest_price: latestPrice ?? null,
      market_value: marketValue,
      unrealized_pl: unrealizedPl,
      unrealized_pl_pct: unrealizedPlPct,
    };
  });

  return NextResponse.json(enriched);
}

/**
 * POST /api/portfolio/holdings
 * Create or upsert a holding. On conflict (portfolio_id + asset_id),
 * update quantity and avg_cost_basis.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = holdingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { portfolio_id, asset_id, quantity, avg_cost_basis, notes } =
    parsed.data;

  // Verify portfolio ownership via RLS
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .select('id')
    .eq('id', portfolio_id)
    .single();

  if (portfolioError || !portfolio) {
    return NextResponse.json(
      { error: 'Portfolio not found or access denied' },
      { status: 404 },
    );
  }

  // Check for existing holding
  const { data: existing } = await supabase
    .from('holdings')
    .select('id, quantity, avg_cost_basis, notes')
    .eq('portfolio_id', portfolio_id)
    .eq('asset_id', asset_id)
    .maybeSingle();

  if (existing) {
    // Upsert: recalculate weighted average cost basis
    const oldQty = existing.quantity as number;
    const oldAvg = existing.avg_cost_basis as number;
    const newTotalQty = oldQty + quantity;
    const newAvgCost =
      newTotalQty > 0
        ? (oldQty * oldAvg + quantity * avg_cost_basis) / newTotalQty
        : avg_cost_basis;

    const { data, error } = await supabase
      .from('holdings')
      .update({
        quantity: newTotalQty,
        avg_cost_basis: newAvgCost,
        notes: notes ?? existing.notes,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Create new holding
  const { data, error } = await supabase
    .from('holdings')
    .insert({
      portfolio_id,
      asset_id,
      quantity,
      avg_cost_basis,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/portfolio/holdings
 * Update holding quantity and/or notes. Requires `id` in body.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const { id, ...updates } = body;

  if (!id || typeof id !== 'string') {
    return NextResponse.json(
      { error: 'Holding id is required' },
      { status: 400 },
    );
  }

  // Only allow updating quantity, avg_cost_basis, and notes
  const allowedFields = ['quantity', 'avg_cost_basis', 'notes'] as const;
  const sanitized: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (field in updates) {
      sanitized[field] = updates[field];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('holdings')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(sanitized as any)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/portfolio/holdings?id=<uuid>
 * Remove a holding by id.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Holding id is required' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('holdings').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
