'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';

const createPortfolioSchema = z.object({
  name: z
    .string()
    .min(1, 'Portfolio name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
});

type CreatePortfolioForm = z.infer<typeof createPortfolioSchema>;

interface CreatePortfolioButtonProps {
  variant?: 'default' | 'outline';
}

export function CreatePortfolioButton({
  variant = 'outline',
}: CreatePortfolioButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePortfolioForm>({
    resolver: zodResolver(createPortfolioSchema),
  });

  async function onSubmit(data: CreatePortfolioForm) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to create portfolio');
      }

      reset();
      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
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
        Create Portfolio
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
          <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-1">Create New Portfolio</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Give your portfolio a name and optional description.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="portfolio-name"
                  className="text-sm font-medium leading-none"
                >
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="portfolio-name"
                  type="text"
                  placeholder="e.g., Long-term Growth, Crypto Allocation"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="portfolio-description"
                  className="text-sm font-medium leading-none"
                >
                  Description
                </label>
                <textarea
                  id="portfolio-description"
                  placeholder="Optional: describe the strategy or purpose of this portfolio"
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {serverError && (
                <div className="rounded-md bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{serverError}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
