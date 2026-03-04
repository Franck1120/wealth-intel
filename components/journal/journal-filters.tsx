'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface JournalFiltersProps {
  currentAction?: string;
  currentFrom?: string;
  currentTo?: string;
}

const ACTION_OPTIONS = [
  { value: '', label: 'Tutte le Azioni' },
  { value: 'buy', label: 'Acquisto' },
  { value: 'sell', label: 'Vendita' },
  { value: 'hold', label: 'Mantieni' },
  { value: 'skip', label: 'Salta' },
];

export function JournalFilters({
  currentAction,
  currentFrom,
  currentTo,
}: JournalFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/journal?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Action Filter */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Azione
        </label>
        <select
          value={currentAction ?? ''}
          onChange={(e) => updateFilter('action', e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date From */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Da
        </label>
        <input
          type="date"
          value={currentFrom ?? ''}
          onChange={(e) => updateFilter('from', e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Date To */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">A</label>
        <input
          type="date"
          value={currentTo ?? ''}
          onChange={(e) => updateFilter('to', e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Clear Filters */}
      {(currentAction || currentFrom || currentTo) && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-transparent">Cancella</label>
          <button
            onClick={() => router.push('/journal')}
            className="flex h-9 items-center rounded-md border border-input px-3 text-sm hover:bg-accent transition-colors"
          >
            Cancella Filtri
          </button>
        </div>
      )}
    </div>
  );
}
