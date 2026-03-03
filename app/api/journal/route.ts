import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { journalEntrySchema } from '@/lib/validators';

/**
 * GET /api/journal?asset_id=<uuid>&action=buy
 * List decision journal entries, ordered by decided_at DESC.
 *
 * Optional filters:
 * - asset_id: filter by specific asset
 * - action: filter by action type (buy, sell, hold, watch, pass)
 * - limit: pagination limit (default 50, max 200)
 * - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const assetId = request.nextUrl.searchParams.get('asset_id');
  const action = request.nextUrl.searchParams.get('action');
  const limit = Math.min(
    Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get('limit') ?? '', 10) || 50,
    ),
    200,
  );
  const offset = Math.max(
    0,
    parseInt(request.nextUrl.searchParams.get('offset') ?? '', 10) || 0,
  );

  let query = supabase
    .from('decision_journal')
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
      { count: 'exact' },
    )
    .order('decided_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (assetId) {
    query = query.eq('asset_id', assetId);
  }

  if (action) {
    query = query.eq('action', action);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      total: count ?? 0,
      limit,
      offset,
      has_more: (count ?? 0) > offset + limit,
    },
  });
}

/**
 * POST /api/journal
 * Create a new decision journal entry.
 *
 * The journal captures the reasoning behind investment decisions
 * for future review and learning.
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
  const parsed = journalEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('decision_journal')
    .insert({
      ...parsed.data,
      user_id: user.id,
      decided_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/journal
 * Update a journal entry. Requires `id` in the body.
 *
 * Commonly used for:
 * - Recording outcome after a decision plays out
 * - Adding outcome_notes for post-decision review
 * - Updating emotional_state or lessons learned
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
      { error: 'Journal entry id is required' },
      { status: 400 },
    );
  }

  // Validate allowed update fields (must match decision_journal.Update in DB schema)
  const allowedFields = [
    'asset_id',
    'opportunity_id',
    'action',
    'reasoning',
    'emotion',
    'conviction',
    'outcome',
    'outcome_notes',
    'reviewed_at',
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

  // If outcome is being set, record the review timestamp
  if ('outcome' in sanitized) {
    sanitized['reviewed_at'] = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('decision_journal')
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
 * DELETE /api/journal?id=<uuid>
 * Delete a journal entry.
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
      { error: 'Journal entry id is required' },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('decision_journal')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
