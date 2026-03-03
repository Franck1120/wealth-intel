import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { JournalFilters } from '@/components/journal/journal-filters';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface JournalEntry {
  id: string;
  action: 'buy' | 'sell' | 'hold' | 'skip';
  asset_symbol: string;
  asset_name: string | null;
  reasoning: string;
  emotion: string | null;
  conviction: number;
  outcome: string | null;
  outcome_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface PageProps {
  searchParams: Promise<{
    action?: string;
    from?: string;
    to?: string;
  }>;
}

const ACTION_BADGES: Record<string, { label: string; className: string }> = {
  buy: { label: 'BUY', className: 'bg-emerald-500/10 text-emerald-500' },
  sell: { label: 'SELL', className: 'bg-red-500/10 text-red-500' },
  hold: { label: 'HOLD', className: 'bg-blue-500/10 text-blue-500' },
  skip: { label: 'SKIP', className: 'bg-gray-500/10 text-gray-500' },
};

const EMOTION_BADGES: Record<string, { label: string; className: string }> = {
  confident: { label: 'Confident', className: 'bg-emerald-500/10 text-emerald-500' },
  fearful: { label: 'Fearful', className: 'bg-red-500/10 text-red-500' },
  greedy: { label: 'Greedy', className: 'bg-yellow-500/10 text-yellow-500' },
  fomo: { label: 'FOMO', className: 'bg-orange-500/10 text-orange-500' },
  uncertain: { label: 'Uncertain', className: 'bg-purple-500/10 text-purple-500' },
  neutral: { label: 'Neutral', className: 'bg-gray-500/10 text-gray-500' },
};

export default async function JournalPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  // Note: page expects extended decision_journal columns (asset_symbol, asset_name)
  // that may not be in the typed Database schema; use untyped query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('decision_journal')
    .select('*')
    .order('decided_at', { ascending: false });

  if (params.action) {
    query = query.eq('action', params.action);
  }
  if (params.from) {
    query = query.gte('decided_at', params.from);
  }
  if (params.to) {
    query = query.lte('decided_at', params.to);
  }

  const { data: entries } = await query.limit(50);
  const journalEntries = (entries ?? []) as JournalEntry[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Decision Journal
          </h1>
          <p className="text-muted-foreground">
            Track every investment decision, rationale, and emotional state.
          </p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          New Entry
        </Link>
      </div>

      {/* Filters */}
      <JournalFilters
        currentAction={params.action}
        currentFrom={params.from}
        currentTo={params.to}
      />

      {/* Timeline */}
      {journalEntries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Your journal is empty
            </h3>
            <p className="text-muted-foreground text-center max-w-sm mb-6">
              Start documenting your investment decisions to build a record
              of your thought process and improve over time.
            </p>
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create First Entry
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {journalEntries.map((entry) => {
            const actionBadge = ACTION_BADGES[entry.action] ?? ACTION_BADGES.hold;
            const emotionBadge = entry.emotion
              ? EMOTION_BADGES[entry.emotion] ?? EMOTION_BADGES.neutral
              : null;

            return (
              <Card key={entry.id} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-3 top-6 h-6 w-6 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>

                <CardContent className="pt-6 pl-8">
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Date */}
                      <time className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>

                      {/* Action Badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${actionBadge.className}`}
                      >
                        {actionBadge.label}
                      </span>

                      {/* Asset Symbol */}
                      <span className="font-semibold text-sm">
                        {entry.asset_symbol}
                      </span>

                      {/* Emotion Badge */}
                      {emotionBadge && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${emotionBadge.className}`}
                        >
                          {emotionBadge.label}
                        </span>
                      )}
                    </div>

                    {/* Conviction Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Conviction
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-3 w-1.5 rounded-sm ${
                              i < entry.conviction
                                ? entry.conviction >= 7
                                  ? 'bg-emerald-500'
                                  : entry.conviction >= 4
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium tabular-nums w-5">
                        {entry.conviction}
                      </span>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <p className="text-sm leading-relaxed">{entry.reasoning}</p>

                  {/* Outcome (if reviewed) */}
                  {entry.outcome && (
                    <div className="mt-3 rounded-md bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Outcome Review
                        {entry.reviewed_at && (
                          <span className="ml-2">
                            ({new Date(entry.reviewed_at).toLocaleDateString()})
                          </span>
                        )}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          entry.outcome === 'profit'
                            ? 'text-emerald-500'
                            : entry.outcome === 'loss'
                              ? 'text-red-500'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {entry.outcome.charAt(0).toUpperCase() +
                          entry.outcome.slice(1)}
                      </p>
                      {entry.outcome_notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.outcome_notes}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
