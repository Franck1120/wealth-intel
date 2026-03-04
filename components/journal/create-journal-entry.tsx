'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';

const JOURNAL_ACTIONS = [
  'buy',
  'sell',
  'hold',
  'skip',
] as const;

const EMOTIONS = [
  'calm',
  'excited',
  'fearful',
  'fomo',
  'confident',
] as const;

const ACTION_LABELS: Record<string, string> = {
  buy: 'Acquisto',
  sell: 'Vendita',
  hold: 'Mantenimento',
  skip: 'Saltato',
};

const EMOTION_LABELS: Record<string, string> = {
  calm: 'Calmo',
  excited: 'Entusiasta',
  fearful: 'Timoroso',
  fomo: 'FOMO',
  confident: 'Sicuro',
};

const createJournalEntrySchema = z.object({
  action: z.enum(JOURNAL_ACTIONS, {
    message: 'Seleziona un tipo di azione',
  }),
  reasoning: z
    .string()
    .min(10, 'Il ragionamento deve avere almeno 10 caratteri')
    .max(2000, 'Il ragionamento non deve superare i 2000 caratteri'),
  emotion: z.enum(EMOTIONS).optional(),
  conviction: z
    .number()
    .int()
    .min(1, 'La convinzione deve essere tra 1 e 10')
    .max(10, 'La convinzione deve essere tra 1 e 10')
    .optional(),
});

type CreateJournalEntryForm = z.infer<typeof createJournalEntrySchema>;

interface CreateJournalEntryProps {
  variant?: 'default' | 'outline';
  label?: string;
}

export function CreateJournalEntry({
  variant = 'default',
  label = 'Nuova Voce',
}: CreateJournalEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateJournalEntryForm>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      action: 'buy',
    },
  });

  async function onSubmit(data: CreateJournalEntryForm) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error
            ? typeof body.error === 'string'
              ? body.error
              : 'Dati non validi. Controlla i campi e riprova.'
            : 'Impossibile creare la voce del diario'
        );
      }

      reset();
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'Si è verificato un errore imprevisto'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    reset();
    setServerError(null);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          variant === 'default'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
        }`}
      >
        <Plus className="h-4 w-4" />
        {label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-1">
              Nuova Voce nel Diario
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Registra la tua decisione di investimento, il ragionamento e lo
              stato emotivo.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Action */}
              <div className="space-y-2">
                <label
                  htmlFor="journal-action"
                  className="text-sm font-medium leading-none"
                >
                  Azione <span className="text-destructive">*</span>
                </label>
                <select
                  id="journal-action"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('action')}
                >
                  {JOURNAL_ACTIONS.map((action) => (
                    <option key={action} value={action}>
                      {ACTION_LABELS[action] ?? action}
                    </option>
                  ))}
                </select>
                {errors.action && (
                  <p className="text-xs text-destructive">
                    {errors.action.message}
                  </p>
                )}
              </div>

              {/* Reasoning */}
              <div className="space-y-2">
                <label
                  htmlFor="journal-reasoning"
                  className="text-sm font-medium leading-none"
                >
                  Ragionamento <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="journal-reasoning"
                  rows={4}
                  placeholder="Descrivi il ragionamento dietro questa decisione..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  {...register('reasoning')}
                />
                {errors.reasoning && (
                  <p className="text-xs text-destructive">
                    {errors.reasoning.message}
                  </p>
                )}
              </div>

              {/* Conviction */}
              <div className="space-y-2">
                <label
                  htmlFor="journal-conviction"
                  className="text-sm font-medium leading-none"
                >
                  Convinzione (1-10)
                </label>
                <input
                  id="journal-conviction"
                  type="number"
                  min={1}
                  max={10}
                  step={1}
                  placeholder="es. 7"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('conviction', { valueAsNumber: true })}
                />
                {errors.conviction && (
                  <p className="text-xs text-destructive">
                    {errors.conviction.message}
                  </p>
                )}
              </div>

              {/* Emotion */}
              <div className="space-y-2">
                <label
                  htmlFor="journal-emotion"
                  className="text-sm font-medium leading-none"
                >
                  Stato Emotivo
                </label>
                <select
                  id="journal-emotion"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('emotion')}
                >
                  <option value="">-- Seleziona --</option>
                  {EMOTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {EMOTION_LABELS[emotion] ?? emotion}
                    </option>
                  ))}
                </select>
                {errors.emotion && (
                  <p className="text-xs text-destructive">
                    {errors.emotion.message}
                  </p>
                )}
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{serverError}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Salva Voce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
