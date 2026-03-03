import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

/** Fear & Greed classification thresholds */
const SENTIMENT_CLASSIFICATION = {
  EXTREME_FEAR: { min: 0, max: 24, label: 'Extreme Fear' },
  FEAR: { min: 25, max: 44, label: 'Fear' },
  NEUTRAL: { min: 45, max: 55, label: 'Neutral' },
  GREED: { min: 56, max: 74, label: 'Greed' },
  EXTREME_GREED: { min: 75, max: 100, label: 'Extreme Greed' },
} as const;

const CACHE_DURATION_HOURS = 4;
const CACHE_DURATION_MS = CACHE_DURATION_HOURS * 60 * 60 * 1000;

const ALTERNATIVE_ME_API = 'https://api.alternative.me/fng/?limit=30&format=json';
interface FearGreedEntry {
  value: string;
  value_classification: string;
  timestamp: string;
  time_until_update?: string;
}

interface FearGreedResponse {
  name: string;
  data: FearGreedEntry[];
  metadata: { error: string | null };
}

/**
 * Classify a numeric Fear & Greed value into a label.
 */
function classifySentiment(value: number): string {
  if (value <= SENTIMENT_CLASSIFICATION.EXTREME_FEAR.max) {
    return SENTIMENT_CLASSIFICATION.EXTREME_FEAR.label;
  }
  if (value <= SENTIMENT_CLASSIFICATION.FEAR.max) {
    return SENTIMENT_CLASSIFICATION.FEAR.label;
  }
  if (value <= SENTIMENT_CLASSIFICATION.NEUTRAL.max) {
    return SENTIMENT_CLASSIFICATION.NEUTRAL.label;
  }
  if (value <= SENTIMENT_CLASSIFICATION.GREED.max) {
    return SENTIMENT_CLASSIFICATION.GREED.label;
  }
  return SENTIMENT_CLASSIFICATION.EXTREME_GREED.label;
}

/**
 * GET /api/data/sentiment
 * Fetch market sentiment (Fear & Greed Index) with caching.
 * Returns current value, classification, and 30-day history.
 */
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const cacheThreshold = new Date(
    Date.now() - CACHE_DURATION_MS,
  ).toISOString();

  // Check cache for recent sentiment data
  const { data: cached } = await admin
    .from('market_sentiment')
    .select('*')
    .eq('index_name', 'fear_greed_index')
    .gte('date', cacheThreshold)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached) {
    return NextResponse.json({
      data: cached,
      source: 'cache',
    });
  }

  // Fetch fresh data from alternative.me
  try {
    const response = await fetch(ALTERNATIVE_ME_API, {
      next: { revalidate: CACHE_DURATION_HOURS * 3600 },
    });

    if (!response.ok) {
      throw new Error(`Alternative.me API returned ${response.status}`);
    }

    const result = (await response.json()) as FearGreedResponse;

    if (result.metadata?.error) {
      throw new Error(result.metadata.error);
    }

    if (!result.data || result.data.length === 0) {
      throw new Error('No data returned from Fear & Greed API');
    }

    const current = result.data[0];
    const currentValue = parseInt(current.value, 10);
    const now = new Date().toISOString();

    // Build history from the 30-day data
    const history = result.data.map((entry) => ({
      value: parseInt(entry.value, 10),
      classification: classifySentiment(parseInt(entry.value, 10)),
      timestamp: new Date(parseInt(entry.timestamp, 10) * 1000).toISOString(),
    }));

    // Calculate trend (compare current to 7-day average)
    const recentValues = history
      .slice(0, 7)
      .map((h) => h.value);
    const weekAvg =
      recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
    const trend =
      currentValue > weekAvg + 5
        ? 'improving'
        : currentValue < weekAvg - 5
          ? 'declining'
          : 'stable';

    const sentimentRecord = {
      index_name: 'fear_greed_index',
      value: currentValue,
      classification: classifySentiment(currentValue),
      date: now.split('T')[0],
    };

    // Upsert into cache
    const { error: upsertError } = await admin
      .from('market_sentiment')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(sentimentRecord as any, {
        onConflict: 'index_name',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Sentiment cache upsert error:', upsertError.message);
    }

    return NextResponse.json({
      data: {
        ...sentimentRecord,
        trend,
        history,
      },
      source: 'fresh',
    });
  } catch (fetchError) {
    const message =
      fetchError instanceof Error
        ? fetchError.message
        : 'Unknown error fetching sentiment';

    // Try to return stale cache if available
    const { data: staleCached } = await admin
      .from('market_sentiment')
      .select('*')
      .eq('index_name', 'fear_greed_index')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (staleCached) {
      return NextResponse.json({
        data: staleCached,
        source: 'cache_stale',
        warning: `Fresh fetch failed: ${message}`,
      });
    }

    return NextResponse.json(
      { error: `Failed to fetch sentiment data: ${message}` },
      { status: 502 },
    );
  }
}
