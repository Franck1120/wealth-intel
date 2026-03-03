import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { opportunitySchema } from '@/lib/validators';

/**
 * GET /api/opportunities?status=watching
 * List opportunities in the pipeline. Optionally filter by status.
 * Valid statuses: watching, analyzing, ready, executed, passed
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status');

  let query = supabase
    .from('opportunities')
    .select('*')
    .order('updated_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/opportunities
 * Create a new opportunity in the pipeline.
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
  const parsed = opportunitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('opportunities')
    .insert({
      ...parsed.data,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/**
 * PATCH /api/opportunities
 * Update an opportunity. Requires `id` in the body.
 * Commonly used for status changes in the Kanban view.
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
      { error: 'Opportunity id is required' },
      { status: 400 },
    );
  }

  // Validate allowed update fields (must match opportunities.Update in DB schema)
  const allowedFields = [
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
    .from('opportunities')
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
 * DELETE /api/opportunities?id=<uuid>
 * Delete an opportunity from the pipeline.
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
      { error: 'Opportunity id is required' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('opportunities').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
