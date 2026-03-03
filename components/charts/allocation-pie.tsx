'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPercent, formatCurrency } from '@/lib/utils';

interface AllocationData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

interface AllocationPieProps {
  data: AllocationData[];
  title?: string;
  totalValue?: number;
  currency?: string;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  totalValue: number;
  currency: string;
}

function CenterLabel({ cx, cy, totalValue, currency }: CustomLabelProps) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" fill="var(--color-muted-foreground)" fontSize={12}>
        Total
      </tspan>
      <tspan x={cx} dy="1.4em" fill="var(--color-foreground)" fontSize={16} fontWeight={600}>
        {formatCurrency(totalValue, currency)}
      </tspan>
    </text>
  );
}

interface LegendPayloadEntry {
  value: string;
  color: string;
}

function renderLegend(props: { payload?: LegendPayloadEntry[] }, data: AllocationData[]) {
  const { payload } = props;
  if (!payload) return null;

  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {payload.map((entry, index) => {
        const item = data[index];
        return (
          <li key={entry.value} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">{entry.value}</span>
            <span className="ml-auto text-muted-foreground">
              {item ? formatPercent(item.percentage) : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function AllocationPie({
  data,
  title = 'Portfolio Allocation',
  totalValue,
  currency = 'EUR',
}: AllocationPieProps) {
  const total = totalValue ?? data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="40%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              stroke="var(--color-background)"
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
              <CenterLabel cx={0} cy={0} totalValue={total} currency={currency} />
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-foreground)',
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                formatCurrency(value ?? 0, currency),
                name ?? '',
              ]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={(props) =>
                renderLegend(props as { payload?: LegendPayloadEntry[] }, data)
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
