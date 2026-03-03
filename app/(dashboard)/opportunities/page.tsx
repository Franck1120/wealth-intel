'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Loader2,
  ChevronDown,
  Lightbulb,
  Search,
  CheckCircle2,
  Eye,
  TrendingUp,
  LogOut,
  XCircle,
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'discovered', label: 'Discovered', icon: Lightbulb, color: 'text-blue-500' },
  { id: 'researching', label: 'Researching', icon: Search, color: 'text-purple-500' },
  { id: 'validated', label: 'Validated', icon: CheckCircle2, color: 'text-emerald-500' },
  { id: 'watching', label: 'Watching', icon: Eye, color: 'text-yellow-500' },
  { id: 'invested', label: 'Invested', icon: TrendingUp, color: 'text-green-600' },
  { id: 'exited', label: 'Exited', icon: LogOut, color: 'text-gray-500' },
  { id: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-red-500' },
] as const;

type OpportunityStatus = (typeof KANBAN_COLUMNS)[number]['id'];

interface Opportunity {
  id: string;
  title: string;
  module: string;
  status: OpportunityStatus;
  score: number | null;
  thesis: string | null;
  created_at: string;
}

const MODULE_BADGES: Record<string, { label: string; className: string }> = {
  equities: { label: 'Equities', className: 'bg-blue-500/10 text-blue-500' },
  crypto: { label: 'Crypto', className: 'bg-orange-500/10 text-orange-500' },
  commodities: { label: 'Commodities', className: 'bg-yellow-500/10 text-yellow-500' },
  forex: { label: 'Forex', className: 'bg-green-500/10 text-green-500' },
  macro: { label: 'Macro', className: 'bg-purple-500/10 text-purple-500' },
  defi: { label: 'DeFi', className: 'bg-pink-500/10 text-pink-500' },
  other: { label: 'Other', className: 'bg-gray-500/10 text-gray-500' },
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      const response = await fetch('/api/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities ?? []);
      }
    } catch {
      // Silently fail - empty state will show
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  async function moveOpportunity(id: string, newStatus: OpportunityStatus) {
    setMovingId(id);
    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOpportunities((prev) =>
          prev.map((opp) =>
            opp.id === id ? { ...opp, status: newStatus } : opp
          )
        );
      }
    } catch {
      // Silently fail
    } finally {
      setMovingId(null);
    }
  }

  async function addOpportunity(formData: {
    title: string;
    module: string;
    thesis: string;
  }) {
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'discovered' }),
      });

      if (response.ok) {
        await fetchOpportunities();
        setIsAddFormOpen(false);
      }
    } catch {
      // Silently fail
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">
            Track and manage investment opportunities through your pipeline.
          </p>
        </div>
        <button
          onClick={() => setIsAddFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Opportunity
        </button>
      </div>

      {/* Add Opportunity Form Modal */}
      {isAddFormOpen && (
        <AddOpportunityModal
          onSubmit={addOpportunity}
          onClose={() => setIsAddFormOpen(false)}
        />
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const Icon = column.icon;
          const columnOpps = opportunities.filter(
            (opp) => opp.status === column.id
          );

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72"
            >
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <Icon className={`h-4 w-4 ${column.color}`} />
                <h3 className="text-sm font-semibold">{column.label}</h3>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  {columnOpps.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="space-y-2 min-h-[200px]">
                {columnOpps.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No opportunities
                    </p>
                  </div>
                ) : (
                  columnOpps.map((opp) => (
                    <OpportunityCard
                      key={opp.id}
                      opportunity={opp}
                      currentStatus={column.id}
                      isMoving={movingId === opp.id}
                      onMove={(newStatus) =>
                        moveOpportunity(opp.id, newStatus)
                      }
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Individual opportunity card */
function OpportunityCard({
  opportunity,
  currentStatus,
  isMoving,
  onMove,
}: {
  opportunity: Opportunity;
  currentStatus: OpportunityStatus;
  isMoving: boolean;
  onMove: (status: OpportunityStatus) => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const badge = MODULE_BADGES[opportunity.module] ?? MODULE_BADGES.other;

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium leading-tight line-clamp-2">
          {opportunity.title}
        </h4>
        {opportunity.score !== null && (
          <span
            className={`flex-shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-bold ${
              opportunity.score >= 7
                ? 'bg-emerald-500/10 text-emerald-500'
                : opportunity.score >= 4
                  ? 'bg-yellow-500/10 text-yellow-500'
                  : 'bg-red-500/10 text-red-500'
            }`}
          >
            {opportunity.score}
          </span>
        )}
      </div>

      {/* Module Badge */}
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
      >
        {badge.label}
      </span>

      {/* Thesis Excerpt */}
      {opportunity.thesis && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {opportunity.thesis}
        </p>
      )}

      {/* Move Status Dropdown */}
      <div className="mt-3 relative">
        <button
          onClick={() => setShowStatusMenu(!showStatusMenu)}
          disabled={isMoving}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {isMoving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          Move to...
        </button>

        {showStatusMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowStatusMenu(false)}
            />
            <div className="absolute bottom-full left-0 mb-1 z-20 w-44 rounded-md border bg-background shadow-lg py-1">
              {KANBAN_COLUMNS.filter((col) => col.id !== currentStatus).map(
                (col) => {
                  const Icon = col.icon;
                  return (
                    <button
                      key={col.id}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                      onClick={() => {
                        onMove(col.id);
                        setShowStatusMenu(false);
                      }}
                    >
                      <Icon className={`h-3 w-3 ${col.color}`} />
                      {col.label}
                    </button>
                  );
                }
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Modal for adding a new opportunity */
function AddOpportunityModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: { title: string; module: string; thesis: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [module, setModule] = useState('equities');
  const [thesis, setThesis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onSubmit({ title: title.trim(), module, thesis: thesis.trim() });
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-50 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Add New Opportunity</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., NVIDIA post-earnings dip"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Module</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Object.entries(MODULE_BADGES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Thesis</label>
            <textarea
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="Brief investment thesis or rationale..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
