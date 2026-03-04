'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Search } from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(['buy', 'sell'], {
    message: 'Seleziona un tipo di transazione',
  }),
  symbol: z.string().min(1, 'Il simbolo e\' obbligatorio').max(20),
  quantity: z
    .number({ message: 'La quantita\' e\' obbligatoria' })
    .positive('La quantita\' deve essere positiva'),
  price: z
    .number({ message: 'Il prezzo e\' obbligatorio' })
    .positive('Il prezzo deve essere positivo'),
  fees: z.number().min(0, 'Le commissioni non possono essere negative').optional().default(0),
  date: z.string().min(1, 'La data e\' obbligatoria'),
  notes: z.string().max(500).optional(),
});

type TransactionFormInput = z.input<typeof transactionSchema>;
type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  portfolioId: string;
  onSuccess?: () => void;
}

export function TransactionForm({ portfolioId, onSuccess }: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [symbolSearchError, setSymbolSearchError] = useState<string | null>(null);
  const [symbolQuery, setSymbolQuery] = useState('');
  const [symbolSuggestions, setSymbolSuggestions] = useState<
    Array<{ symbol: string; name: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormInput, unknown, TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'buy',
      fees: 0,
      date: new Date().toISOString().split('T')[0],
    },
  });

  const transactionType = watch('type');
  const quantity = watch('quantity');
  const price = watch('price');
  const fees = watch('fees');
  const totalCost =
    (quantity ?? 0) * (price ?? 0) + (fees ?? 0);

  async function searchSymbol(query: string) {
    setSymbolQuery(query);
    if (query.length < 1) {
      setSymbolSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/assets/search?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSymbolSuggestions(data.results ?? []);
        setShowSuggestions(true);
      }
    } catch {
      setSymbolSearchError('Errore nella ricerca del simbolo.');
    }
  }

  function selectSymbol(symbol: string) {
    setValue('symbol', symbol);
    setSymbolQuery(symbol);
    setShowSuggestions(false);
  }

  async function onSubmit(data: TransactionFormData) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch('/api/portfolio/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          portfolio_id: portfolioId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Errore nell\'aggiunta della transazione');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/portfolio/${portfolioId}`);
        router.refresh();
      }
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Si e\' verificato un errore imprevisto'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Transaction Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Tipo <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue('type', 'buy')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              transactionType === 'buy'
                ? 'bg-emerald-500 text-white'
                : 'border border-input hover:bg-accent'
            }`}
          >
            Acquisto
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'sell')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              transactionType === 'sell'
                ? 'bg-red-500 text-white'
                : 'border border-input hover:bg-accent'
            }`}
          >
            Vendita
          </button>
        </div>
        {errors.type && (
          <p className="text-xs text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Symbol Search */}
      <div className="space-y-2 relative">
        <label htmlFor="symbol" className="text-sm font-medium">
          Simbolo <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="symbol"
            type="text"
            placeholder="Cerca un simbolo (es. AAPL, BTC)"
            value={symbolQuery}
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('symbol', {
              onChange: (e) => searchSymbol(e.target.value),
            })}
          />
        </div>
        {showSuggestions && symbolSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 rounded-md border bg-background shadow-lg max-h-48 overflow-y-auto">
            {symbolSuggestions.map((item) => (
              <button
                key={item.symbol}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                onClick={() => selectSymbol(item.symbol)}
              >
                <span className="font-medium">{item.symbol}</span>
                <span className="ml-2 text-muted-foreground">{item.name}</span>
              </button>
            ))}
          </div>
        )}
        {symbolSearchError && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {symbolSearchError}
            <button onClick={() => setSymbolSearchError(null)} className="ml-2 font-medium underline">Chiudi</button>
          </div>
        )}
        {errors.symbol && (
          <p className="text-xs text-destructive">{errors.symbol.message}</p>
        )}
      </div>

      {/* Quantity & Price Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="quantity" className="text-sm font-medium">
            Quantita' <span className="text-destructive">*</span>
          </label>
          <input
            id="quantity"
            type="number"
            step="any"
            placeholder="0.00"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('quantity', { valueAsNumber: true })}
          />
          {errors.quantity && (
            <p className="text-xs text-destructive">
              {errors.quantity.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="text-sm font-medium">
            Prezzo Unitario <span className="text-destructive">*</span>
          </label>
          <input
            id="price"
            type="number"
            step="any"
            placeholder="0.00"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && (
            <p className="text-xs text-destructive">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Fees */}
      <div className="space-y-2">
        <label htmlFor="fees" className="text-sm font-medium">
          Commissioni
        </label>
        <input
          id="fees"
          type="number"
          step="any"
          placeholder="0.00"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('fees', { valueAsNumber: true })}
        />
        {errors.fees && (
          <p className="text-xs text-destructive">{errors.fees.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium">
          Data <span className="text-destructive">*</span>
        </label>
        <input
          id="date"
          type="date"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('date')}
        />
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium">
          Note
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Opzionale: motivazione, tesi o contesto di questa operazione"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      {/* Total Cost Summary */}
      <div className="rounded-md bg-muted p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Totale {transactionType === 'buy' ? 'Costo' : 'Ricavo'}
          </span>
          <span className="text-lg font-bold tabular-nums">
            {isNaN(totalCost) ? '--' : `$${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
        </div>
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`inline-flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
            transactionType === 'buy'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {transactionType === 'buy' ? 'Acquista' : 'Vendi'}
        </button>
      </div>
    </form>
  );
}
