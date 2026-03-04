'use client';

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
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
  '#14b8a6',
  '#f97316',
];

interface AllocationChartProps {
  data: AllocationData[];
}

interface LegendPayloadEntry {
  value: string;
  color: string;
}

function renderLegend(
  props: { payload?: LegendPayloadEntry[] },
  data: AllocationData[]
) {
  const { payload } = props;
  if (!payload) return null;

  return (
    <ul className="flex flex-col gap-1.5 text-sm">
      {payload.map((entry, index) => {
        const item = data[index];
        return (
          <li key={entry.value} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground truncate">{entry.value}</span>
            <span className="ml-auto text-muted-foreground tabular-nums">
              {item ? formatPercent(item.percentage) : ''}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function AllocationChart({ data }: AllocationChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-muted-foreground">Nessun dato di allocazione</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="40%"
          cy="50%"
          innerRadius={65}
          outerRadius={105}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          stroke="var(--color-background)"
          strokeWidth={2}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-foreground)',
          }}
          formatter={(value: number | undefined, name: string | undefined) => [
            formatCurrency(value ?? 0),
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
  );
}
