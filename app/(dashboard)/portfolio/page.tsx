import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import Link from 'next/link';
import { CreatePortfolioButton } from '@/components/portfolio/create-portfolio-button';
import { Briefcase, TrendingUp, TrendingDown } from 'lucide-react';

interface Holding {
  id: string;
  quantity: number;
  avg_cost_basis: number;
  current_price?: number;
  asset_id: string;
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  holdings: Holding[];
}

function computePortfolioStats(holdings: Holding[]) {
  const totalValue = holdings.reduce(
    (sum, h) => sum + h.quantity * (h.current_price ?? h.avg_cost_basis),
    0
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.quantity * h.avg_cost_basis,
    0
  );
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? totalPnL / totalCost : 0;

  return { totalValue, totalCost, totalPnL, totalPnLPercent };
}

export default async function PortfolioPage() {
  const supabase = await createServerSupabaseClient();
  // Note: holdings join includes current_price which may not be in typed schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: portfolios, error } = await (supabase as any)
    .from('portfolios')
    .select('*, holdings(id, quantity, avg_cost_basis, current_price, asset_id)')
    .order('created_at', { ascending: false });

  const portfolioList = (portfolios as Portfolio[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portafoglio</h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi portafogli di investimento e monitora le performance.
          </p>
        </div>
        <CreatePortfolioButton />
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              Errore nel caricamento dei portafogli. Riprova piu' tardi.
            </p>
          </CardContent>
        </Card>
      )}

      {portfolioList.length === 0 && !error ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun portafoglio</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Crea il tuo primo portafoglio per iniziare a monitorare i tuoi
              investimenti, i guadagni e le performance di tutti i tuoi asset.
            </p>
            <CreatePortfolioButton variant="default" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {portfolioList.map((portfolio) => {
            const stats = computePortfolioStats(portfolio.holdings);
            const isPositive = stats.totalPnL >= 0;

            return (
              <Link key={portfolio.id} href={`/portfolio/${portfolio.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="truncate">{portfolio.name}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {portfolio.holdings.length} posizion{portfolio.holdings.length !== 1 ? 'i' : 'e'}
                      </span>
                    </CardTitle>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {portfolio.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Valore Totale</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(stats.totalValue)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">P&L Totale</p>
                        <div className="flex items-center gap-1">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={`font-semibold ${
                              isPositive ? 'text-emerald-500' : 'text-red-500'
                            }`}
                          >
                            {formatCurrency(stats.totalPnL)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Rendimento</p>
                        <span
                          className={`font-semibold ${
                            isPositive ? 'text-emerald-500' : 'text-red-500'
                          }`}
                        >
                          {formatPercent(stats.totalPnLPercent)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
