'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface PriceChartProps {
  data: { date: string; price: number }[];
  symbol: string;
  currency?: string;
  height?: number;
}

export function PriceChart({ data, symbol, currency = 'EUR', height = 300 }: PriceChartProps) {
  const isPositive = data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const color = isPositive ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{symbol} Price</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              stroke="var(--color-border)"
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              stroke="var(--color-border)"
              tickFormatter={(v: number) => formatCurrency(v, currency)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-foreground)',
              }}
              formatter={(value: number | undefined) => [formatCurrency(value ?? 0, currency), 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              fill={`url(#gradient-${symbol})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
