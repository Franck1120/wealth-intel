'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/portfolio': 'Portafoglio',
  '/markets': 'Mercati',
  '/markets/equities': 'Azioni',
  '/markets/crypto': 'Crypto',
  '/markets/macro': 'Macro',
  '/markets/commodities': 'Materie Prime',
  '/markets/forex': 'Forex',
  '/opportunities': "Opportunita'",
  '/journal': 'Diario Decisioni',
  '/alerts': 'Avvisi',
  '/reports': 'Report',
  '/analytics': 'Analisi',
  '/settings': 'Impostazioni',
};

export function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Wealth Intel';

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cerca asset, ticker..."
            aria-label="Cerca asset o ticker"
            className="h-9 w-64 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Notifiche"
          aria-label="Notifiche"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
