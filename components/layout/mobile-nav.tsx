'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, TrendingUp, Target, BookOpen } from 'lucide-react';

const MOBILE_NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/portfolio', icon: Wallet },
  { label: 'Markets', href: '/markets', icon: TrendingUp },
  { label: 'Opportunita', href: '/opportunities', icon: Target },
  { label: 'Journal', href: '/journal', icon: BookOpen },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 block border-t border-border bg-card md:hidden">
      <ul className="flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
