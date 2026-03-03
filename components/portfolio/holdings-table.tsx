'use client';

import { useState } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface Holding {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  assetType: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  allocation: number;
}

type SortField =
  | 'symbol'
  | 'quantity'
  | 'avgCost'
  | 'currentPrice'
  | 'marketValue'
  | 'pnl'
  | 'pnlPercent'
  | 'allocation';

type SortDirection = 'asc' | 'desc';

interface HoldingsTableProps {
  holdings: Holding[];
}

interface SortableHeaderProps {
  field: SortField;
  label: string;
  align?: 'left' | 'right';
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

function SortableHeader({
  field,
  label,
  align = 'right',
  sortField,
  sortDirection,
  onSort,
}: SortableHeaderProps) {
  function renderSortIcon() {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  }

  return (
    <th
      className={`px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center">
        {label}
        {renderSortIcon()}
      </span>
    </th>
  );
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const [sortField, setSortField] = useState<SortField>('marketValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }

  const sortedHoldings = [...holdings].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return multiplier * aVal.localeCompare(bVal);
    }
    return multiplier * ((aVal as number) - (bVal as number));
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <SortableHeader field="symbol" label="Asset" align="left" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader field="quantity" label="Quantity" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader field="avgCost" label="Avg Cost" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader field="currentPrice" label="Price" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader field="marketValue" label="Market Value" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader field="pnl" label="P&L" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader field="pnlPercent" label="P&L %" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
            <SortableHeader field="allocation" label="Allocation" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sortedHoldings.map((holding) => {
            const isPositive = holding.pnl >= 0;
            const pnlColorClass = isPositive
              ? 'text-emerald-500'
              : 'text-red-500';

            return (
              <tr
                key={holding.id}
                className="hover:bg-muted/50 transition-colors"
              >
                {/* Asset */}
                <td className="px-4 py-3 text-left">
                  <div>
                    <span className="font-medium">{holding.symbol}</span>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {holding.name}
                    </p>
                  </div>
                </td>

                {/* Quantity */}
                <td className="px-4 py-3 text-right tabular-nums">
                  {holding.quantity.toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}
                </td>

                {/* Avg Cost */}
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(holding.avgCost)}
                </td>

                {/* Current Price */}
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatCurrency(holding.currentPrice)}
                </td>

                {/* Market Value */}
                <td className="px-4 py-3 text-right tabular-nums font-medium">
                  {formatCurrency(holding.marketValue)}
                </td>

                {/* P&L */}
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${pnlColorClass}`}>
                  <span className="inline-flex items-center gap-1">
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {formatCurrency(holding.pnl)}
                  </span>
                </td>

                {/* P&L % */}
                <td className={`px-4 py-3 text-right tabular-nums font-medium ${pnlColorClass}`}>
                  {formatPercent(holding.pnlPercent)}
                </td>

                {/* Allocation */}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary rounded-full h-1.5"
                        style={{
                          width: `${Math.min(holding.allocation * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="tabular-nums text-xs w-10 text-right">
                      {formatPercent(holding.allocation)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Totals Footer */}
        <tfoot className="border-t-2 font-medium">
          <tr>
            <td className="px-4 py-3 text-left">Total</td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right tabular-nums">
              {formatCurrency(
                holdings.reduce((sum, h) => sum + h.marketValue, 0)
              )}
            </td>
            <td
              className={`px-4 py-3 text-right tabular-nums ${
                holdings.reduce((sum, h) => sum + h.pnl, 0) >= 0
                  ? 'text-emerald-500'
                  : 'text-red-500'
              }`}
            >
              {formatCurrency(holdings.reduce((sum, h) => sum + h.pnl, 0))}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right tabular-nums">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
