import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Bitcoin } from 'lucide-react';

const PriceChart = dynamic(
  () => import('@/components/charts/asset-price-chart').then((m) => ({ default: m.AssetPriceChart })),
  { loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" /> },
);

const FearGreedGauge = dynamic(
  () => import('@/components/charts/fear-greed-gauge').then((m) => ({ default: m.FearGreedGauge })),
  { loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted" /> },
);

const SparklineChart = dynamic(
  () => import('@/components/charts/sparkline-chart').then((m) => ({ default: m.SparklineChart })),
  { loading: () => <div className="h-8 animate-pulse rounded bg-muted" /> },
);

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  price_change_24h: number | null;
  market_cap: number | null;
  sparkline_7d: number[] | null;
}

interface DeFiProtocol {
  name: string;
  tvl: number;
  change_24h: number;
  chain: string;
}

export default async function CryptoPage() {
  const supabase = await createServerSupabaseClient();

  // Fetch top coins by market cap
  // Note: actual DB may have extended asset columns not in the typed schema
  const { data: topCoinsRaw } = await supabase
    .from('assets')
    .select('*')
    .eq('type', 'crypto')
    .order('name', { ascending: true })
    .limit(20);
  const topCoins = (topCoinsRaw ?? []) as unknown as CryptoAsset[];

  // Fetch Fear & Greed from market snapshots
  // Note: market_snapshots table is not in the typed Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cryptoSnapshotRaw } = await (supabase as any)
    .from('market_snapshots')
    .select('data')
    .eq('module', 'crypto')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const cryptoSnapshot = cryptoSnapshotRaw as { data: Record<string, unknown> } | null;
  const fearGreedIndex =
    (cryptoSnapshot?.data?.fear_greed as number | undefined) ?? null;
  const fearGreedClassification =
    (cryptoSnapshot?.data?.fear_greed_classification as string | undefined) ?? 'Unknown';

  // Fetch DeFi data
  // Note: defi_protocols table is not in the typed Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: defiDataRaw } = await (supabase as any)
    .from('defi_protocols')
    .select('name, tvl, change_24h, chain')
    .order('tvl', { ascending: false })
    .limit(10);
  const protocols = (defiDataRaw ?? []) as DeFiProtocol[];

  const coins = topCoins;

  const btc = coins.find((c) => c.symbol === 'BTC');
  const eth = coins.find((c) => c.symbol === 'ETH');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crypto</h1>
        <p className="text-muted-foreground">
          Criptovalute, protocolli DeFi e sentiment di mercato.
        </p>
      </div>

      {/* Fear & Greed + BTC/ETH Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Fear & Greed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Indice Paura & Avidita'</CardTitle>
          </CardHeader>
          <CardContent>
            {fearGreedIndex !== null ? (
              <FearGreedGauge value={fearGreedIndex} classification={fearGreedClassification} />
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground text-sm">
                  Nessun dato disponibile
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BTC Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-500" />
              Bitcoin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {btc ? (
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(btc.current_price ?? 0)}
                </p>
                <p
                  className={`text-sm ${
                    (btc.price_change_24h ?? 0) >= 0
                      ? 'text-emerald-500'
                      : 'text-red-500'
                  }`}
                >
                  {(btc.price_change_24h ?? 0) >= 0 ? '+' : ''}
                  {btc.price_change_24h?.toFixed(2) ?? '0.00'}%
                </p>
                {btc.market_cap && (
                  <p className="text-xs text-muted-foreground mt-1">
                    MCap: ${(btc.market_cap / 1e9).toFixed(0)}B
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nessun dato</p>
            )}
          </CardContent>
        </Card>

        {/* ETH Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-500">E</span>
              </div>
              Ethereum
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eth ? (
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(eth.current_price ?? 0)}
                </p>
                <p
                  className={`text-sm ${
                    (eth.price_change_24h ?? 0) >= 0
                      ? 'text-emerald-500'
                      : 'text-red-500'
                  }`}
                >
                  {(eth.price_change_24h ?? 0) >= 0 ? '+' : ''}
                  {eth.price_change_24h?.toFixed(2) ?? '0.00'}%
                </p>
                {eth.market_cap && (
                  <p className="text-xs text-muted-foreground mt-1">
                    MCap: ${(eth.market_cap / 1e9).toFixed(0)}B
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nessun dato</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BTC/ETH Price Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {btc && (
          <Card>
            <CardHeader>
              <CardTitle>Grafico Prezzo BTC</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart assetId={btc.id} />
            </CardContent>
          </Card>
        )}
        {eth && (
          <Card>
            <CardHeader>
              <CardTitle>Grafico Prezzo ETH</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart assetId={eth.id} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Coins Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Top Coin per Capitalizzazione</CardTitle>
        </CardHeader>
        <CardContent>
          {coins.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessun dato crypto disponibile. I dati di mercato appariranno quando
              la pipeline dati sara' attiva.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {coins.map((coin, index) => {
                const isPositive = (coin.price_change_24h ?? 0) >= 0;
                return (
                  <div
                    key={coin.id}
                    className="rounded-lg border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-sm">
                          {coin.symbol}
                        </span>
                      </div>
                      <span
                        className={`text-xs tabular-nums ${
                          isPositive ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {coin.price_change_24h?.toFixed(1) ?? '0.0'}%
                      </span>
                    </div>
                    <p className="font-bold tabular-nums text-sm">
                      {formatCurrency(coin.current_price ?? 0)}
                    </p>
                    {coin.sparkline_7d && coin.sparkline_7d.length > 0 && (
                      <div className="mt-2 h-8">
                        <SparklineChart
                          data={coin.sparkline_7d}
                          color={isPositive ? '#10b981' : '#ef4444'}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DeFi Protocols */}
      <Card>
        <CardHeader>
          <CardTitle>DeFi - Top Protocolli per TVL</CardTitle>
        </CardHeader>
        <CardContent>
          {protocols.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              I dati DeFi saranno disponibili quando la pipeline dati sara' configurata.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Protocollo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Chain
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      TVL
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Variazione 24h
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {protocols.map((protocol, index) => (
                    <tr
                      key={protocol.name}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {protocol.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {protocol.chain}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        ${(protocol.tvl / 1e9).toFixed(2)}B
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums ${
                          protocol.change_24h >= 0
                            ? 'text-emerald-500'
                            : 'text-red-500'
                        }`}
                      >
                        {protocol.change_24h >= 0 ? '+' : ''}
                        {protocol.change_24h.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
