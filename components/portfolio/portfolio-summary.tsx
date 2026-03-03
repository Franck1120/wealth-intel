'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

interface PortfolioSummaryProps {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  bestPerformer: { symbol: string; pnlPercent: number } | null;
  worstPerformer: { symbol: string; pnlPercent: number } | null;
}

export function PortfolioSummary({
  totalValue,
  totalCost,
  totalPnL,
  totalPnLPercent,
  dayChange,
  bestPerformer,
  worstPerformer,
}: PortfolioSummaryProps) {
  const isPnLPositive = totalPnL >= 0;
  const isDayChangePositive = dayChange >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* Total Value */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Value</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(totalValue)}
          </p>
        </CardContent>
      </Card>

      {/* Total Cost */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Total Cost</p>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(totalCost)}
          </p>
        </CardContent>
      </Card>

      {/* Total P&L */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            {isPnLPositive ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <p className="text-sm text-muted-foreground">Total P&L</p>
          </div>
          <p
            className={`text-2xl font-bold tabular-nums ${
              isPnLPositive ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {formatCurrency(totalPnL)}
          </p>
          <p
            className={`text-xs mt-1 ${
              isPnLPositive ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {formatPercent(totalPnLPercent)}
          </p>
        </CardContent>
      </Card>

      {/* Day Change */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Day Change</p>
          </div>
          <p
            className={`text-2xl font-bold tabular-nums ${
              isDayChangePositive ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {formatCurrency(dayChange)}
          </p>
        </CardContent>
      </Card>

      {/* Best Performer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <p className="text-sm text-muted-foreground">Best</p>
          </div>
          {bestPerformer ? (
            <>
              <p className="text-lg font-bold">{bestPerformer.symbol}</p>
              <p className="text-sm text-emerald-500">
                {formatPercent(bestPerformer.pnlPercent)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">--</p>
          )}
        </CardContent>
      </Card>

      {/* Worst Performer */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-muted-foreground">Worst</p>
          </div>
          {worstPerformer ? (
            <>
              <p className="text-lg font-bold">{worstPerformer.symbol}</p>
              <p className="text-sm text-red-500">
                {formatPercent(worstPerformer.pnlPercent)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">--</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
