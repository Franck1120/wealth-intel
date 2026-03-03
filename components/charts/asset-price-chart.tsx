'use client';

import { useState, useEffect } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PriceDataPoint {
  date: string;
  price: number;
}

interface AssetPriceChartProps {
  assetId: string;
  height?: number;
}

/**
 * Client-side price chart that fetches historical price data by asset ID.
 * Used in portfolio detail and market pages where we pass an asset ID
 * rather than pre-fetched data.
 */
export function AssetPriceChart({ assetId, height = 250 }: AssetPriceChartProps) {
  const [data, setData] = useState<PriceDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPriceHistory() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/assets/${assetId}/price-history?period=3m`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch price data');
        }
        const result = await response.json();
        setData(result.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load chart'
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (assetId) {
      fetchPriceHistory();
    }
  }, [assetId]);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height }}
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">
          {error ?? 'No price history available'}
        </p>
      </div>
    );
  }

  const isPositive =
    data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient
            id={`gradient-${assetId}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
          stroke="var(--color-border)"
          tickFormatter={(value: string) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }}
          stroke="var(--color-border)"
          tickFormatter={(v: number) => formatCurrency(v)}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-foreground)',
          }}
          formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Price']}
          labelFormatter={(label: unknown) =>
            new Date(String(label)).toLocaleDateString()
          }
        />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          fill={`url(#gradient-${assetId})`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
