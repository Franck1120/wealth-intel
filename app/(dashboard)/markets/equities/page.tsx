import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { EquitySearchBar } from '@/components/markets/equity-search-bar';
import { AssetPriceChart as PriceChart } from '@/components/charts/asset-price-chart';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface WatchlistEquity {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_24h: number | null;
  volume: number | null;
  pe_ratio: number | null;
  score: number | null;
}

export default async function EquitiesPage() {
  const supabase = await createServerSupabaseClient();

  // Note: watchlist table is not in the typed Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: watchlist } = await (supabase as any)
    .from('watchlist')
    .select(
      `
      assets(
        id, symbol, name, current_price, price_change_24h,
        volume, pe_ratio, score
      )
    `
    )
    .eq('module', 'equities')
    .order('created_at', { ascending: false });

  const equities: WatchlistEquity[] = (watchlist ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((w: any) => (w as unknown as { assets: WatchlistEquity }).assets)
    .filter(Boolean);

  const selectedEquity = equities.length > 0 ? equities[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equities</h1>
        <p className="text-muted-foreground">
          Track stocks, ETFs, and equity indices.
        </p>
      </div>

      {/* Search Bar */}
      <EquitySearchBar />

      {/* Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle>Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          {equities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                Your equity watchlist is empty.
              </p>
              <p className="text-sm text-muted-foreground">
                Search for stocks above and add them to your watchlist.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      P/E
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {equities.map((eq) => {
                    const isPositive = (eq.price_change_24h ?? 0) >= 0;
                    return (
                      <tr
                        key={eq.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium">{eq.symbol}</span>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {eq.name}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {eq.current_price
                            ? formatCurrency(eq.current_price)
                            : '--'}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            isPositive ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {isPositive ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {eq.price_change_24h !== null
                              ? `${eq.price_change_24h >= 0 ? '+' : ''}${eq.price_change_24h.toFixed(2)}%`
                              : '--'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {eq.volume
                            ? eq.volume.toLocaleString()
                            : '--'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {eq.pe_ratio?.toFixed(1) ?? '--'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {eq.score !== null ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                eq.score >= 7
                                  ? 'bg-emerald-500/10 text-emerald-500'
                                  : eq.score >= 4
                                    ? 'bg-yellow-500/10 text-yellow-500'
                                    : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {eq.score}/10
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              --
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Chart */}
      {selectedEquity && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedEquity.symbol} Price Chart
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {selectedEquity.name}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart assetId={selectedEquity.id} />
          </CardContent>
        </Card>
      )}

      {/* Score Breakdown placeholder */}
      {selectedEquity?.score !== null && selectedEquity?.score !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown - {selectedEquity.symbol}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Fundamental', value: '--' },
                { label: 'Technical', value: '--' },
                { label: 'Sentiment', value: '--' },
                { label: 'Macro Alignment', value: '--' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-md border p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground mb-1">
                    {metric.label}
                  </p>
                  <p className="text-lg font-bold">{metric.value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Detailed score breakdowns will be available once the scoring engine
              processes this asset.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
