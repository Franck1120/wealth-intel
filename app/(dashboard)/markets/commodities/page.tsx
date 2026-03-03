import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { AssetPriceChart as PriceChart } from '@/components/charts/asset-price-chart';
import { TrendingUp, TrendingDown, Gem } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Commodity {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_24h: number | null;
  score: number | null;
}

const COMMODITY_SYMBOLS = ['GOLD', 'SILVER', 'OIL', 'NATGAS'];

export default async function CommoditiesPage() {
  const supabase = await createServerSupabaseClient();

  // Note: actual DB may have extended asset columns not in the typed schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: commoditiesRaw } = await (supabase as any)
    .from('assets')
    .select('id, symbol, name, current_price, price_change_24h, score')
    .eq('asset_type', 'commodity')
    .in('symbol', COMMODITY_SYMBOLS)
    .order('name', { ascending: true });

  const commodityList = (commoditiesRaw ?? []) as Commodity[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Commodities</h1>
        <p className="text-muted-foreground">
          Track precious metals, energy, and raw materials.
        </p>
      </div>

      {commodityList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gem className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No commodity data yet
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Commodity prices will appear here once the data pipeline is
              configured and running.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Price Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {commodityList.map((commodity) => {
              const isPositive = (commodity.price_change_24h ?? 0) >= 0;

              return (
                <Card key={commodity.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {commodity.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {commodity.symbol}
                        </p>
                      </div>
                      {isPositive ? (
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>

                    <p className="text-2xl font-bold tabular-nums">
                      {commodity.current_price
                        ? formatCurrency(commodity.current_price)
                        : '--'}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`text-sm tabular-nums ${
                          isPositive ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {commodity.price_change_24h?.toFixed(2) ?? '0.00'}%
                      </span>

                      {commodity.score !== null && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            commodity.score >= 7
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : commodity.score >= 4
                                ? 'bg-yellow-500/10 text-yellow-500'
                                : 'bg-red-500/10 text-red-500'
                          }`}
                        >
                          Score: {commodity.score}/10
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Price Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {commodityList.map((commodity) => (
              <Card key={commodity.id}>
                <CardHeader>
                  <CardTitle>
                    {commodity.name} Price
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {commodity.symbol}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PriceChart assetId={commodity.id} />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
