'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FearGreedGaugeProps {
  value: number;
  classification: string;
  label?: string;
}

/** Maps a 0-100 value to a color on the fear-greed spectrum. */
function getColor(value: number): string {
  if (value < 25) return '#ef4444';
  if (value < 45) return '#f97316';
  if (value < 55) return '#eab308';
  if (value < 75) return '#84cc16';
  return '#22c55e';
}

/**
 * Semicircular gauge for the Fear & Greed Index.
 * Renders a 180-degree arc using SVG with a needle indicator,
 * numeric value in the center, and classification text below.
 */
export function FearGreedGauge({
  value,
  classification,
  label = 'Fear & Greed Index',
}: FearGreedGaugeProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  // SVG arc geometry
  const cx = 150;
  const cy = 130;
  const radius = 100;
  const strokeWidth = 20;

  // Convert value (0-100) to angle (180-0 degrees, left to right)
  const angle = 180 - (clampedValue / 100) * 180;
  const needleAngleRad = (angle * Math.PI) / 180;
  const needleLength = radius - strokeWidth / 2 - 5;
  const needleX = cx + needleLength * Math.cos(needleAngleRad);
  const needleY = cy - needleLength * Math.sin(needleAngleRad);

  const color = getColor(clampedValue);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <svg viewBox="0 0 300 170" width="100%" className="max-w-[300px]">
          <defs>
            <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="25%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="75%" stopColor="#84cc16" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Background arc (track) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="var(--color-muted)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Colored arc (gradient fill) */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Needle center dot */}
          <circle cx={cx} cy={cy} r={6} fill={color} />
          <circle cx={cx} cy={cy} r={3} fill="var(--color-background)" />

          {/* Value text */}
          <text
            x={cx}
            y={cy - 30}
            textAnchor="middle"
            fill={color}
            fontSize={36}
            fontWeight={700}
          >
            {clampedValue}
          </text>

          {/* Classification text */}
          <text
            x={cx}
            y={cy + 25}
            textAnchor="middle"
            fill="var(--color-muted-foreground)"
            fontSize={14}
            fontWeight={500}
          >
            {classification}
          </text>

          {/* Scale labels */}
          <text
            x={cx - radius - 5}
            y={cy + 20}
            textAnchor="middle"
            fill="var(--color-muted-foreground)"
            fontSize={11}
          >
            0
          </text>
          <text
            x={cx + radius + 5}
            y={cy + 20}
            textAnchor="middle"
            fill="var(--color-muted-foreground)"
            fontSize={11}
          >
            100
          </text>
        </svg>
      </CardContent>
    </Card>
  );
}
