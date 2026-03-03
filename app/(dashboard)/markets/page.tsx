import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import {
  BarChart3,
  Bitcoin,
  Landmark,
  DollarSign,
  Gem,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface MarketModule {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  stats: Array<{ label: string; value: string; change?: number }>;
}

interface MarketSnapshot {
  module: string;
  data: Record<string, unknown>;
}

async function getMarketSnapshots() {
  const supabase = await createServerSupabaseClient();

  // Fetch cached market data for quick stats
  // Note: market_snapshots table is not in the typed Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: snapshotsRaw } = await (supabase as any)
    .from('market_snapshots')
    .select('module, data')
    .order('created_at', { ascending: false })
    .limit(6);

  const snapshots = (snapshotsRaw ?? []) as MarketSnapshot[];

  const snapshotMap = new Map<string, Record<string, unknown>>();
  for (const s of snapshots) {
    if (!snapshotMap.has(s.module)) {
      snapshotMap.set(s.module, s.data);
    }
  }

  return snapshotMap;
}

export default async function MarketsPage() {
  const snapshots = await getMarketSnapshots();

  const equities = snapshots.get('equities') as Record<string, number> | undefined;
  const crypto = snapshots.get('crypto') as Record<string, number> | undefined;
  const macro = snapshots.get('macro') as Record<string, number> | undefined;
  const commodities = snapshots.get('commodities') as Record<string, number> | undefined;
  const forex = snapshots.get('forex') as Record<string, number> | undefined;

  const modules: MarketModule[] = [
    {
      title: 'Equities',
      description: 'Stocks, ETFs, and equity indices',
      href: '/markets/equities',
      icon: <BarChart3 className="h-6 w-6" />,
      stats: [
        {
          label: 'S&P 500',
          value: equities?.sp500 ? formatCurrency(equities.sp500) : '--',
          change: equities?.sp500_change as number | undefined,
        },
        {
          label: 'NASDAQ',
          value: equities?.nasdaq ? formatCurrency(equities.nasdaq) : '--',
          change: equities?.nasdaq_change as number | undefined,
        },
      ],
    },
    {
      title: 'Crypto',
      description: 'Cryptocurrencies and DeFi protocols',
      href: '/markets/crypto',
      icon: <Bitcoin className="h-6 w-6" />,
      stats: [
        {
          label: 'BTC',
          value: crypto?.btc_price ? formatCurrency(crypto.btc_price) : '--',
          change: crypto?.btc_change as number | undefined,
        },
        {
          label: 'ETH',
          value: crypto?.eth_price ? formatCurrency(crypto.eth_price) : '--',
          change: crypto?.eth_change as number | undefined,
        },
        {
          label: 'Fear & Greed',
          value: crypto?.fear_greed?.toString() ?? '--',
        },
      ],
    },
    {
      title: 'Macro',
      description: 'Economic indicators and central bank policy',
      href: '/markets/macro',
      icon: <Landmark className="h-6 w-6" />,
      stats: [
        {
          label: 'Fed Rate',
          value: macro?.fed_rate ? `${macro.fed_rate}%` : '--',
        },
        {
          label: 'CPI',
          value: macro?.cpi ? `${macro.cpi}%` : '--',
        },
        {
          label: 'VIX',
          value: macro?.vix?.toString() ?? '--',
        },
      ],
    },
    {
      title: 'Commodities',
      description: 'Gold, silver, oil, and natural gas',
      href: '/markets/commodities',
      icon: <Gem className="h-6 w-6" />,
      stats: [
        {
          label: 'Gold',
          value: commodities?.gold ? formatCurrency(commodities.gold) : '--',
          change: commodities?.gold_change as number | undefined,
        },
        {
          label: 'Oil (WTI)',
          value: commodities?.oil ? formatCurrency(commodities.oil) : '--',
          change: commodities?.oil_change as number | undefined,
        },
      ],
    },
    {
      title: 'Forex',
      description: 'Major currency pairs and exchange rates',
      href: '/markets/forex',
      icon: <DollarSign className="h-6 w-6" />,
      stats: [
        {
          label: 'EUR/USD',
          value: forex?.eur_usd?.toFixed(4) ?? '--',
          change: forex?.eur_usd_change as number | undefined,
        },
        {
          label: 'EUR/GBP',
          value: forex?.eur_gbp?.toFixed(4) ?? '--',
          change: forex?.eur_gbp_change as number | undefined,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
        <p className="text-muted-foreground">
          Real-time market data across all asset classes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-primary/10 text-primary">
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {module.stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {stat.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {stat.value}
                        </span>
                        {stat.change !== undefined && stat.change !== null && (
                          <span
                            className={`text-xs tabular-nums ${
                              stat.change >= 0
                                ? 'text-emerald-500'
                                : 'text-red-500'
                            }`}
                          >
                            {stat.change >= 0 ? '+' : ''}
                            {stat.change.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
