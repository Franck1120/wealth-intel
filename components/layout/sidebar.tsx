'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Target,
  BookOpen,
  Bell,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Portafoglio', href: '/portfolio', icon: Wallet },
  {
    label: 'Mercati',
    href: '/markets',
    icon: TrendingUp,
    children: [
      { label: 'Azioni', href: '/markets/equities' },
      { label: 'Crypto', href: '/markets/crypto' },
      { label: 'Macro', href: '/markets/macro' },
      { label: 'Materie Prime', href: '/markets/commodities' },
      { label: 'Forex', href: '/markets/forex' },
    ],
  },
  { label: "Opportunita'", href: '/opportunities', icon: Target },
  { label: 'Diario Decisioni', href: '/journal', icon: BookOpen },
  { label: 'Avvisi', href: '/alerts', icon: Bell },
  { label: 'Report', href: '/reports', icon: FileText },
  { label: 'Analisi', href: '/analytics', icon: BarChart3 },
  { label: 'Impostazioni', href: '/settings', icon: Settings },
];

function NavLink({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  return (
    <li>
      <div className="relative">
        <Link
          href={hasChildren ? '#' : item.href}
          onClick={
            hasChildren
              ? (e) => {
                  e.preventDefault();
                  setExpanded(!expanded);
                }
              : undefined
          }
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
            isActive
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          } ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">{item.label}</span>
              {hasChildren &&
                (expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </>
          )}
        </Link>
      </div>
      {hasChildren && expanded && !collapsed && (
        <ul className="ml-6 mt-1 space-y-1 border-l border-border pl-3">
          {item.children!.map((child) => {
            const isChildActive = pathname === child.href;
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={`block rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
                    isChildActive
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const supabase = createClient();

  async function handleSignOut() {
    if (!confirm('Sei sicuro di voler uscire?')) return;
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo / Title */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">W</span>
            </div>
            <span className="text-lg font-bold text-foreground">Wealth Intel</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Espandi sidebar' : 'Comprimi sidebar'}
        >
          {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
          ))}
        </ul>
      </nav>

      {/* User Menu / Sign Out */}
      <div className="border-t border-border p-3">
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Esci' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Esci</span>}
        </button>
      </div>
    </aside>
  );
}
