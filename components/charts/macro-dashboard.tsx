'use client';

import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatNumber, formatPercent } from '@/lib/utils';

interface MacroIndicator {
  key: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  history: number[];
}

interface MacroDashboardProps {
  indicators: MacroIndicator[];
}

function Sparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
  const chartData = data.map((value, index) => ({ index, value }));
  const color = isPositive ? 'var(--color-success)' : 'var(--color-danger)';

  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function IndicatorCard({ indicator }: { indicator: MacroIndicator }) {
  const change = indicator.value - indicator.previousValue;
  const changePercent =
    indicator.previousValue !== 0 ? (change / Math.abs(indicator.previousValue)) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card/50 p-4">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-medium text-muted-foreground truncate">
          {indicator.name}
        </span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-foreground">
            {formatNumber(indicator.value)}
          </span>
          <span className="text-xs text-muted-foreground">{indicator.unit}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              isPositive ? 'text-success' : 'text-danger'
            )}
          >
            {isPositive ? '\u25B2' : '\u25BC'} {formatPercent(changePercent)}
          </span>
          <span className="text-xs text-muted-foreground">
            vs {formatNumber(indicator.previousValue)}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0">
        <Sparkline data={indicator.history} isPositive={isPositive} />
      </div>
    </div>
  );
}

export function MacroDashboard({ indicators }: MacroDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Macro Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {indicators.map((indicator) => (
            <IndicatorCard key={indicator.key} indicator={indicator} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
