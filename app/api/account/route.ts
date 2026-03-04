import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

/**
 * DELETE /api/account
 * Elimina l'account utente e tutti i dati associati.
 * Le constraint CASCADE nel database gestiscono la pulizia di tutti i dati correlati.
 */
export async function DELETE() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      { error: 'Impossibile eliminare l\'account', details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
