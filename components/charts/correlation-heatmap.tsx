'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CorrelationHeatmapProps {
  symbols: string[];
  matrix: number[][];
}

/**
 * Maps a correlation value (-1 to +1) to a CSS color.
 * -1 = deep red, 0 = neutral gray, +1 = deep green.
 */
function getCorrelationColor(value: number): string {
  const clamped = Math.max(-1, Math.min(1, value));

  if (clamped > 0) {
    // Positive: interpolate from neutral to green
    const intensity = Math.round(clamped * 100);
    return `oklch(${0.45 + clamped * 0.2} ${clamped * 0.2} 145 / ${30 + intensity * 0.7}%)`;
  }
  if (clamped < 0) {
    // Negative: interpolate from neutral to red
    const absClamped = Math.abs(clamped);
    const intensity = Math.round(absClamped * 100);
    return `oklch(${0.45 + absClamped * 0.1} ${absClamped * 0.2} 25 / ${30 + intensity * 0.7}%)`;
  }
  return 'var(--color-muted)';
}

/**
 * Formats a correlation value to display with sign and 2 decimal places.
 */
function formatCorrelation(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function CorrelationHeatmap({ symbols, matrix }: CorrelationHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const size = symbols.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cross-Asset Correlations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="inline-grid gap-[2px]"
            style={{
              gridTemplateColumns: `80px repeat(${size}, minmax(50px, 1fr))`,
              gridTemplateRows: `32px repeat(${size}, minmax(50px, 1fr))`,
            }}
          >
            {/* Top-left empty corner */}
            <div />

            {/* Column headers */}
            {symbols.map((symbol) => (
              <div
                key={`col-${symbol}`}
                className="flex items-end justify-center pb-1 text-xs font-medium text-muted-foreground"
              >
                <span className="-rotate-45 origin-center whitespace-nowrap">{symbol}</span>
              </div>
            ))}

            {/* Rows */}
            {symbols.map((rowSymbol, rowIndex) => (
              <>
                {/* Row header */}
                <div
                  key={`row-${rowSymbol}`}
                  className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground"
                >
                  {rowSymbol}
                </div>

                {/* Cells */}
                {symbols.map((_, colIndex) => {
                  const value = matrix[rowIndex][colIndex];
                  const isHovered =
                    hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;
                  const isDiagonal = rowIndex === colIndex;

                  return (
                    <div
                      key={`cell-${rowIndex}-${colIndex}`}
                      className={cn(
                        'relative flex items-center justify-center rounded-sm text-xs font-mono cursor-default transition-all',
                        isHovered && 'ring-2 ring-ring z-10',
                        isDiagonal && 'opacity-60'
                      )}
                      style={{ backgroundColor: getCorrelationColor(value) }}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={`${symbols[rowIndex]} / ${symbols[colIndex]}: ${formatCorrelation(value)}`}
                    >
                      <span className="text-foreground text-[11px] font-semibold">
                        {formatCorrelation(value)}
                      </span>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        {/* Tooltip-style detail for hovered cell */}
        {hoveredCell && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {symbols[hoveredCell.row]} / {symbols[hoveredCell.col]}
            </span>
            <span>=</span>
            <span
              className={cn(
                'font-semibold',
                matrix[hoveredCell.row][hoveredCell.col] > 0 && 'text-success',
                matrix[hoveredCell.row][hoveredCell.col] < 0 && 'text-danger'
              )}
            >
              {formatCorrelation(matrix[hoveredCell.row][hoveredCell.col])}
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>-1.00</span>
          <div
            className="h-3 w-32 rounded-full"
            style={{
              background:
                'linear-gradient(to right, oklch(0.55 0.2 25), var(--color-muted), oklch(0.65 0.2 145))',
            }}
          />
          <span>+1.00</span>
        </div>
      </CardContent>
    </Card>
  );
}
