'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

export function EquitySearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const router = useRouter();

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 1) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/assets/search?q=${encodeURIComponent(searchQuery)}&type=equity`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.results ?? []);
        setShowResults(true);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSearching(false);
    }
  }, []);

  async function addToWatchlist(symbol: string) {
    setAddingSymbol(symbol);
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, module: 'equities' }),
      });

      if (response.ok) {
        router.refresh();
        setShowResults(false);
        setQuery('');
      }
    } catch {
      // Silently fail
    } finally {
      setAddingSymbol(null);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            search(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder="Search stocks, ETFs, indices..."
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowResults(false)}
          />
          <div className="absolute z-20 w-full mt-1 rounded-md border bg-background shadow-lg max-h-64 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.symbol}
                className="flex items-center justify-between px-3 py-2 hover:bg-accent transition-colors"
              >
                <div>
                  <span className="font-medium text-sm">{result.symbol}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {result.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {result.exchange}
                  </span>
                </div>
                <button
                  onClick={() => addToWatchlist(result.symbol)}
                  disabled={addingSymbol === result.symbol}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  {addingSymbol === result.symbol ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Add
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {showResults && results.length === 0 && query.length >= 1 && !isSearching && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowResults(false)}
          />
          <div className="absolute z-20 w-full mt-1 rounded-md border bg-background shadow-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No results found for &quot;{query}&quot;
            </p>
          </div>
        </>
      )}
    </div>
  );
}
