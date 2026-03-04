import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const settingsUpdateSchema = z.object({
  base_currency: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  loss_carryforward: z.number().min(0).optional(),
  notifications_email: z.boolean().optional(),
  notifications_browser: z.boolean().optional(),
  notifications_weekly_report: z.boolean().optional(),
});

/**
 * GET /api/settings
 * Returns user profile info + settings (creates defaults if missing).
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try to fetch existing settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return NextResponse.json({
    profile: {
      email: user.email,
      created_at: user.created_at,
    },
    settings: settings ?? {
      base_currency: 'EUR',
      tax_rate: 26,
      loss_carryforward: 0,
      notifications_email: true,
      notifications_browser: false,
      notifications_weekly_report: true,
    },
  });
}

/**
 * PUT /api/settings
 * Upsert user settings.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = settingsUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, ...parsed.data },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
