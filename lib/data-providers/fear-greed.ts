/**
 * Fear & Greed Index data provider
 * Wraps the Alternative.me Crypto Fear & Greed Index API
 * No API key required
 */

const BASE_URL = 'https://api.alternative.me/fng/';

// ── Types ──────────────────────────────────────────────────────────────────

export type FearGreedClassification =
  | 'Extreme Fear'
  | 'Fear'
  | 'Neutral'
  | 'Greed'
  | 'Extreme Greed';

export interface FearGreedValue {
  value: number;
  classification: FearGreedClassification;
  timestamp: string;
}

export interface FearGreedCurrent extends FearGreedValue {
  timeUntilUpdate: string | null;
  fetchedAt: Date;
}

export interface FearGreedHistory {
  values: FearGreedValue[];
  fetchedAt: Date;
}

// ── Raw API response types ─────────────────────────────────────────────────

interface FearGreedApiResponse {
  name: string;
  data: Array<{
    value: string;
    value_classification: string;
    timestamp: string;
    time_until_update?: string;
  }>;
  metadata: {
    error: string | null;
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────

function normalizeClassification(raw: string): FearGreedClassification {
  const normalized = raw.toLowerCase().trim();

  if (normalized === 'extreme fear') return 'Extreme Fear';
  if (normalized === 'fear') return 'Fear';
  if (normalized === 'neutral') return 'Neutral';
  if (normalized === 'greed') return 'Greed';
  if (normalized === 'extreme greed') return 'Extreme Greed';

  // Fallback based on numeric thresholds
  return 'Neutral';
}

function classifyValue(value: number): FearGreedClassification {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
}

async function fetchFearGreed(params?: Record<string, string>): Promise<FearGreedApiResponse> {
  const url = new URL(BASE_URL);
  url.searchParams.set('format', 'json');
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new FearGreedProviderError(
      `Fear & Greed API error: ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  const data = (await response.json()) as FearGreedApiResponse;

  if (data.metadata?.error) {
    throw new FearGreedProviderError(
      `Fear & Greed API returned error: ${data.metadata.error}`,
    );
  }

  return data;
}

function parseEntry(entry: FearGreedApiResponse['data'][number]): FearGreedValue {
  const numericValue = parseInt(entry.value, 10);
  const value = Number.isNaN(numericValue) ? 50 : numericValue;

  return {
    value,
    classification: entry.value_classification
      ? normalizeClassification(entry.value_classification)
      : classifyValue(value),
    timestamp: new Date(parseInt(entry.timestamp, 10) * 1000).toISOString(),
  };
}

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Get the current Crypto Fear & Greed Index value and classification.
 */
export async function getCryptoFearGreed(): Promise<FearGreedCurrent> {
  try {
    const data = await fetchFearGreed({ limit: '1' });

    const entry = data.data[0];
    if (!entry) {
      throw new FearGreedProviderError('No data returned from Fear & Greed API');
    }

    const parsed = parseEntry(entry);

    return {
      ...parsed,
      timeUntilUpdate: entry.time_until_update ?? null,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof FearGreedProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new FearGreedProviderError(
      `Failed to fetch Fear & Greed Index: ${message}`,
    );
  }
}

/**
 * Get historical Fear & Greed Index values.
 * @param limit Number of days of history to retrieve (max ~2000)
 */
export async function getFearGreedHistory(limit: number = 30): Promise<FearGreedHistory> {
  try {
    const data = await fetchFearGreed({ limit: String(limit) });

    const values: FearGreedValue[] = data.data.map(parseEntry);

    return {
      values,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof FearGreedProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new FearGreedProviderError(
      `Failed to fetch Fear & Greed history: ${message}`,
    );
  }
}

// ── Error class ────────────────────────────────────────────────────────────

export class FearGreedProviderError extends Error {
  public readonly provider = 'fear_greed' as const;
  public readonly statusCode: number | null;

  constructor(message: string, statusCode: number | null = null) {
    super(message);
    this.name = 'FearGreedProviderError';
    this.statusCode = statusCode;
  }
}
