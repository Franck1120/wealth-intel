import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary';
import { HoldingsTable } from '@/components/portfolio/holdings-table';
import { AllocationChart } from '@/components/charts/allocation-chart';
import { AssetPriceChart as PriceChart } from '@/components/charts/asset-price-chart';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface HoldingWithAsset {
  id: string;
  quantity: number;
  avg_cost_basis: number;
  asset_id: string;
  assets: {
    id: string;
    symbol: string;
    name: string;
    asset_type: string;
    current_price: number | null;
    price_change_24h: number | null;
  };
}

interface PortfolioDetail {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  holdings: HoldingWithAsset[];
}

function enrichHoldings(holdings: HoldingWithAsset[]) {
  return holdings.map((h) => {
    const currentPrice = h.assets.current_price ?? h.avg_cost_basis;
    const marketValue = h.quantity * currentPrice;
    const costBasis = h.quantity * h.avg_cost_basis;
    const pnl = marketValue - costBasis;
    const pnlPercent = costBasis > 0 ? pnl / costBasis : 0;

    return {
      id: h.id,
      assetId: h.assets.id,
      symbol: h.assets.symbol,
      name: h.assets.name,
      assetType: h.assets.asset_type,
      quantity: h.quantity,
      avgCost: h.avg_cost_basis,
      currentPrice,
      priceChange24h: h.assets.price_change_24h ?? 0,
      marketValue,
      costBasis,
      pnl,
      pnlPercent,
    };
  });
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Note: join references columns (asset_type, current_price, price_change_24h)
  // that may not be in the typed Database schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: portfolio, error } = await (supabase as any)
    .from('portfolios')
    .select(
      `
      *,
      holdings(
        id, quantity, avg_cost_basis, asset_id,
        assets(id, symbol, name, asset_type, current_price, price_change_24h)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error || !portfolio) {
    notFound();
  }

  const typedPortfolio = portfolio as unknown as PortfolioDetail;
  const holdings = enrichHoldings(typedPortfolio.holdings);
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? totalPnL / totalCost : 0;

  const bestPerformer = holdings.length > 0
    ? holdings.reduce((best, h) => (h.pnlPercent > best.pnlPercent ? h : best))
    : null;
  const worstPerformer = holdings.length > 0
    ? holdings.reduce((worst, h) => (h.pnlPercent < worst.pnlPercent ? h : worst))
    : null;

  const holdingsWithAllocation = holdings.map((h) => ({
    ...h,
    allocation: totalValue > 0 ? h.marketValue / totalValue : 0,
  }));

  const dayChange = holdings.reduce(
    (sum, h) => sum + h.quantity * h.priceChange24h,
    0
  );

  const allocationData = holdingsWithAllocation.map((h) => ({
    name: h.symbol,
    value: h.marketValue,
    percentage: h.allocation,
  }));

  const defaultChartAsset =
    holdingsWithAllocation.length > 0
      ? holdingsWithAllocation.reduce((largest, h) =>
          h.marketValue > largest.marketValue ? h : largest
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {typedPortfolio.name}
            </h1>
            {typedPortfolio.description && (
              <p className="text-muted-foreground">
                {typedPortfolio.description}
              </p>
            )}
          </div>
        </div>
        <Link
          href={`/portfolio/${id}/transaction`}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Add Transaction
        </Link>
      </div>

      {/* Summary Cards */}
      <PortfolioSummary
        totalValue={totalValue}
        totalCost={totalCost}
        totalPnL={totalPnL}
        totalPnLPercent={totalPnLPercent}
        dayChange={dayChange}
        bestPerformer={
          bestPerformer
            ? { symbol: bestPerformer.symbol, pnlPercent: bestPerformer.pnlPercent }
            : null
        }
        worstPerformer={
          worstPerformer
            ? { symbol: worstPerformer.symbol, pnlPercent: worstPerformer.pnlPercent }
            : null
        }
      />

      {/* Holdings Table */}
      {holdingsWithAllocation.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <HoldingsTable holdings={holdingsWithAllocation} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No holdings yet. Add your first transaction to get started.
            </p>
            <Link
              href={`/portfolio/${id}/transaction`}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Add Transaction
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      {holdingsWithAllocation.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Allocation Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationChart data={allocationData} />
            </CardContent>
          </Card>

          {/* Price Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                Price Chart
                {defaultChartAsset && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {defaultChartAsset.symbol}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {defaultChartAsset ? (
                <PriceChart assetId={defaultChartAsset.assetId} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  No data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
