'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { TransactionForm } from './transaction-form';

interface AddTransactionButtonProps {
  portfolioId: string;
  variant?: 'default' | 'outline';
  label?: string;
}

export function AddTransactionButton({
  portfolioId,
  variant = 'default',
  label = 'Aggiungi Transazione',
}: AddTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  function handleClose() {
    setIsOpen(false);
  }

  function handleSuccess() {
    setIsOpen(false);
    router.refresh();
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
              Aggiungi Transazione
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Registra un acquisto o una vendita nel portafoglio.
            </p>

            <TransactionForm
              portfolioId={portfolioId}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      )}
    </>
  );
}
