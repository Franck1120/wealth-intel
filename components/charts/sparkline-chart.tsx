'use client';

import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
}

export function SparklineChart({
  data,
  color = '#22c55e',
  height = 32,
}: SparklineChartProps) {
  if (data.length === 0) {
    return null;
  }

  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
