import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const watchlistAddSchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  module: z.string().min(1),
});

/**
 * GET /api/watchlist?module=equities
 * List user's watchlist items with asset details.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const moduleFilter = request.nextUrl.searchParams.get('module');

  let query = supabase
    .from('watchlist')
    .select('*, assets:asset_id(id, symbol, name, type, module)')
    .order('created_at', { ascending: false });

  if (moduleFilter) {
    query = query.eq('module', moduleFilter);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/watchlist
 * Add an asset to watchlist. Creates the asset if it doesn't exist.
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
  const parsed = watchlistAddSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { symbol, module } = parsed.data;

  // Find or create the asset
  let { data: asset } = await supabase
    .from('assets')
    .select('id')
    .eq('symbol', symbol)
    .single();

  if (!asset) {
    // Create a basic asset entry (will be enriched by cron jobs)
    const typeMap: Record<string, string> = {
      equities: 'stock',
      crypto: 'crypto',
      commodities: 'commodity',
      forex: 'forex',
      real_estate: 'reit',
    };

    const { data: newAsset, error: createError } = await supabase
      .from('assets')
      .insert({
        symbol,
        name: symbol,
        type: typeMap[module] ?? 'stock',
        module,
      })
      .select('id')
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    asset = newAsset;
  }

  if (!asset) {
    return NextResponse.json({ error: 'Failed to resolve asset' }, { status: 500 });
  }

  // Add to watchlist
  const { data, error } = await supabase
    .from('watchlist')
    .upsert(
      { user_id: user.id, asset_id: asset.id, module },
      { onConflict: 'user_id,asset_id' },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * DELETE /api/watchlist?id=<uuid>
 * Remove an asset from watchlist.
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
    return NextResponse.json({ error: 'Watchlist item id is required' }, { status: 400 });
  }

  const { error } = await supabase.from('watchlist').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
