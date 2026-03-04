import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/** Fields allowed for PATCH updates (must match opportunities table schema). */
const ALLOWED_UPDATE_FIELDS = [
  'title',
  'module',
  'category',
  'status',
  'score',
  'thesis',
  'risks',
  'target_price',
  'stop_loss',
  'ai_validation',
  'source',
] as const;

/**
 * PATCH /api/opportunities/[id]
 * Update an individual opportunity by ID.
 * Commonly used for status transitions in the Kanban view.
 */
export async function PATCH(
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
  const body = (await request.json()) as Record<string, unknown>;

  // Sanitize: only allow known fields
  const sanitized: Record<string, unknown> = {};

  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (field in body) {
      sanitized[field] = body[field];
    }
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 },
    );
  }

  // Verify ownership and update
  const { data, error } = await supabase
    .from('opportunities')
    .update(sanitized)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    // PostgREST returns PGRST116 when .single() finds no rows
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/opportunities/[id]
 * Delete an individual opportunity by ID.
 * Verifies ownership before deletion.
 */
export async function DELETE(
  _request: NextRequest,
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

  // Verify the opportunity exists and belongs to the user before deleting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing, error: fetchError } = await (supabase as any)
    .from('opportunities')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json(
      { error: 'Opportunity not found' },
      { status: 404 },
    );
  }

  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
