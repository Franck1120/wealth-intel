'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Period = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const PERIODS: Period[] = ['1W', '1M', '3M', '6M', '1Y', 'ALL'];

const PERIOD_DAYS: Record<Period, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  ALL: Infinity,
};

interface PerformanceDataPoint {
  date: string;
  value: number;
  benchmark?: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  currency?: string;
  height?: number;
}

export function PerformanceChart({
  data,
  currency = 'EUR',
  height = 350,
}: PerformanceChartProps) {
  const [period, setPeriod] = useState<Period>('1Y');

  const filteredData =
    period === 'ALL'
      ? data
      : data.slice(-PERIOD_DAYS[period]);

  const hasBenchmark = data.some((d) => d.benchmark !== undefined);

  const isPositive =
    filteredData.length >= 2 &&
    filteredData[filteredData.length - 1].value >= filteredData[0].value;
  const portfolioColor = isPositive ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Portfolio Performance</CardTitle>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              className={cn('h-7 px-2 text-xs', period === p && 'pointer-events-none')}
              onClick={() => setPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="gradient-portfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={portfolioColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={portfolioColor} stopOpacity={0} />
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
              formatter={(value: number | undefined, name: string | undefined) => [
                formatCurrency(value ?? 0, currency),
                name === 'value' ? 'Portfolio' : 'Benchmark',
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={portfolioColor}
              fill="url(#gradient-portfolio)"
              strokeWidth={2}
              name="value"
            />
            {hasBenchmark && (
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="var(--color-muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="benchmark"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
