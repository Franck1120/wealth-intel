'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MacroIndicator {
  id: string;
  name: string;
  code: string;
  value: number;
  previous_value: number | null;
  unit: string;
  updated_at: string;
  source: string;
}

interface MacroIndicatorChartProps {
  indicators: MacroIndicator[];
}

export function MacroIndicatorChart({ indicators }: MacroIndicatorChartProps) {
  const [selectedCode, setSelectedCode] = useState<string>(
    indicators[0]?.code ?? ''
  );

  const selectedIndicator = indicators.find((i) => i.code === selectedCode);

  // Build a simple 2-point dataset from current and previous values
  // Full historical data would come from a time series table in production
  const chartData =
    selectedIndicator && selectedIndicator.previous_value !== null
      ? [
          {
            period: 'Previous',
            value: selectedIndicator.previous_value,
          },
          {
            period: 'Current',
            value: selectedIndicator.value,
          },
        ]
      : selectedIndicator
        ? [{ period: 'Current', value: selectedIndicator.value }]
        : [];

  return (
    <div className="space-y-4">
      {/* Indicator Selector */}
      <div className="flex flex-wrap gap-2">
        {indicators.map((ind) => (
          <button
            key={ind.code}
            onClick={() => setSelectedCode(ind.code)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedCode === ind.code
                ? 'bg-primary text-primary-foreground'
                : 'border border-input hover:bg-accent'
            }`}
          >
            {ind.name}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="macro-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              stroke="var(--color-border)"
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              stroke="var(--color-border)"
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-foreground)',
              }}
              formatter={(value: number | undefined) => [
                `${(value ?? 0).toFixed(2)}${selectedIndicator?.unit === '%' ? '%' : ''}`,
                selectedIndicator?.name ?? 'Value',
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fill="url(#macro-gradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-sm text-muted-foreground">
            Not enough data points for chart. Full historical data will be
            available after multiple data pipeline runs.
          </p>
        </div>
      )}
    </div>
  );
}
