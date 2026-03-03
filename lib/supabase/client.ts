import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build/prerender, env vars may not exist — return a no-op proxy
    // that won't crash. Actual usage only happens client-side at runtime.
    return new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
      get: () => () => ({ data: null, error: { message: 'Supabase not configured' } }),
    });
  }

  return createBrowserClient<Database>(url, key);
}
