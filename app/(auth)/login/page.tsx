'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Controlla la tua email per il link di accesso!');
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Wealth Intel</h1>
          <p className="mt-2 text-muted-foreground">Investment Intelligence Dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="tu@email.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'Invio in corso...' : 'Accedi con Magic Link'}
          </button>
          {message && (
            <p
              className={`text-sm text-center ${message.includes('Controlla') ? 'text-success' : 'text-danger'}`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
