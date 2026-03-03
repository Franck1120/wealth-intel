import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { alertSchema } from '@/lib/validators';

/**
 * GET /api/alerts?is_active=true
 * List user's alerts. Optionally filter by active status.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isActive = request.nextUrl.searchParams.get('is_active');

  let query = supabase
    .from('alerts')
    .select(
      `
      *,
      assets:asset_id (
        id,
        symbol,
        name,
        type
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/alerts
 * Create a new alert.
 *
 * Alert types:
 * - price_above: trigger when price goes above threshold
 * - price_below: trigger when price drops below threshold
 * - pct_change: trigger on percentage change (positive or negative)
 * - score_change: trigger when asset score changes significantly
 * - portfolio_drawdown: trigger on portfolio drawdown percentage
 * - macro_threshold: trigger when macro indicator crosses threshold
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
  const parsed = alertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('alerts')
    .insert({
      ...parsed.data,
      user_id: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/alerts
 * Update an alert. Requires `id` in the body.
 *
 * Common updates:
 * - Toggle is_active (enable/disable)
 * - Update threshold value
 * - Update alert_type or conditions
 * - Acknowledge a triggered alert
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
      { error: 'Alert id is required' },
      { status: 400 },
    );
  }

  // Validate allowed update fields (must match alerts.Update in DB schema)
  const allowedFields = [
    'asset_id',
    'indicator_key',
    'condition',
    'threshold',
    'is_active',
    'triggered_at',
  ] as const;

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
    .from('alerts')
    .update(sanitized)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/alerts?id=<uuid>
 * Delete an alert.
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
      { error: 'Alert id is required' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('alerts').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
