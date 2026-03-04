import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const PriceChart = dynamic(
  () => import('@/components/charts/asset-price-chart').then((m) => ({ default: m.AssetPriceChart })),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);

interface ForexPair {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_24h: number | null;
}

const FOREX_PAIRS = ['EUR/USD', 'EUR/GBP', 'EUR/CHF', 'EUR/JPY'];

export default async function ForexPage() {
  const supabase = await createServerSupabaseClient();

  // Note: actual DB may have extended asset columns not in the typed schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pairsRaw } = await (supabase as any)
    .from('assets')
    .select('id, symbol, name, current_price, price_change_24h')
    .eq('asset_type', 'forex')
    .in('symbol', FOREX_PAIRS)
    .order('symbol', { ascending: true });

  const forexPairs = (pairsRaw ?? []) as ForexPair[];
  const selectedPair = forexPairs.length > 0 ? forexPairs[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Forex</h1>
        <p className="text-muted-foreground">
          Principali coppie valutarie e tassi di cambio.
        </p>
      </div>

      {forexPairs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun dato forex disponibile</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Le coppie forex appariranno qui quando la pipeline dati sara'
              configurata e scarichera' i tassi di cambio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pairs Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {forexPairs.map((pair) => {
              const isPositive = (pair.price_change_24h ?? 0) >= 0;

              return (
                <Card
                  key={pair.id}
                  className="hover:border-primary/50 transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium">{pair.symbol}</p>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>

                    <p className="text-2xl font-bold tabular-nums">
                      {pair.current_price?.toFixed(4) ?? '--'}
                    </p>

                    <p
                      className={`text-sm mt-1 tabular-nums ${
                        isPositive ? 'text-emerald-500' : 'text-red-500'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {pair.price_change_24h?.toFixed(3) ?? '0.000'}%
                    </p>

                    {pair.name && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {pair.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Price Chart */}
          {selectedPair && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Grafico {selectedPair.symbol}
                  {selectedPair.name && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {selectedPair.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PriceChart assetId={selectedPair.id} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
