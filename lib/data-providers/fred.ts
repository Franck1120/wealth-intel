/**
 * FRED (Federal Reserve Economic Data) provider
 * Wraps the FRED API for macroeconomic indicators
 * Requires FRED_API_KEY environment variable
 */

const BASE_URL = 'https://api.stlouisfed.org/fred';

// ── Common Series IDs ──────────────────────────────────────────────────────

export const FRED_SERIES = {
  FED_FUNDS_RATE: 'FEDFUNDS',
  CPI: 'CPIAUCSL',
  CORE_CPI: 'CPILFESL',
  GDP: 'GDP',
  UNEMPLOYMENT: 'UNRATE',
  US_10Y_TREASURY: 'DGS10',
  US_2Y_TREASURY: 'DGS2',
  VIX: 'VIXCLS',
  SP500: 'SP500',
  MORTGAGE_30Y: 'MORTGAGE30US',
} as const;

export type FredSeriesId = (typeof FRED_SERIES)[keyof typeof FRED_SERIES];

// ── Types ──────────────────────────────────────────────────────────────────

export interface FredObservation {
  date: string;
  value: number | null;
}

export interface FredSeriesData {
  seriesId: string;
  title: string;
  frequency: string;
  units: string;
  seasonalAdjustment: string;
  lastUpdated: string;
  observations: FredObservation[];
  fetchedAt: Date;
}

export interface FredLatestValue {
  seriesId: string;
  date: string;
  value: number | null;
  fetchedAt: Date;
}

export interface FredMultiSeriesResult {
  series: Record<string, FredLatestValue>;
  errors: Record<string, string>;
  fetchedAt: Date;
}

// ── Raw API response types ─────────────────────────────────────────────────

interface FredSeriesInfoResponse {
  seriess: Array<{
    id: string;
    title: string;
    frequency: string;
    units: string;
    seasonal_adjustment: string;
    last_updated: string;
  }>;
}

interface FredObservationsResponse {
  observations: Array<{
    date: string;
    value: string;
  }>;
}

// ── Internal helpers ───────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    throw new FredProviderError(
      'FRED_API_KEY environment variable is not set. Get a free key at https://fred.stlouisfed.org/docs/api/api_key.html',
      'config',
    );
  }
  return key;
}

async function fetchFred<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new FredProviderError(
      `FRED API error: ${response.status} ${response.statusText}`,
      endpoint,
      response.status,
    );
  }

  return (await response.json()) as T;
}

function parseObservationValue(value: string): number | null {
  if (value === '.' || value === '' || value === 'N/A') {
    return null;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Get observation data for a FRED series.
 * Returns series metadata and all observations from startDate onward.
 */
export async function getSeriesData(
  seriesId: string,
  startDate?: string,
): Promise<FredSeriesData> {
  try {
    const observationParams: Record<string, string> = {
      series_id: seriesId,
      sort_order: 'asc',
    };
    if (startDate) {
      observationParams.observation_start = startDate;
    }

    const [seriesInfo, observationsData] = await Promise.all([
      fetchFred<FredSeriesInfoResponse>('series', { series_id: seriesId }),
      fetchFred<FredObservationsResponse>('series/observations', observationParams),
    ]);

    const info = seriesInfo.seriess[0];
    if (!info) {
      throw new FredProviderError(`Series ${seriesId} not found`, seriesId);
    }

    const observations: FredObservation[] = observationsData.observations.map((obs) => ({
      date: obs.date,
      value: parseObservationValue(obs.value),
    }));

    return {
      seriesId: info.id,
      title: info.title,
      frequency: info.frequency,
      units: info.units,
      seasonalAdjustment: info.seasonal_adjustment,
      lastUpdated: info.last_updated,
      observations,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof FredProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new FredProviderError(
      `Failed to fetch series data for ${seriesId}: ${message}`,
      seriesId,
    );
  }
}

/**
 * Get the most recent observation for a FRED series.
 */
export async function getLatestValue(seriesId: string): Promise<FredLatestValue> {
  try {
    const data = await fetchFred<FredObservationsResponse>('series/observations', {
      series_id: seriesId,
      sort_order: 'desc',
      limit: '1',
    });

    const latest = data.observations[0];
    if (!latest) {
      throw new FredProviderError(`No observations found for series ${seriesId}`, seriesId);
    }

    return {
      seriesId,
      date: latest.date,
      value: parseObservationValue(latest.value),
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof FredProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new FredProviderError(
      `Failed to fetch latest value for ${seriesId}: ${message}`,
      seriesId,
    );
  }
}

/**
 * Batch fetch the latest value for multiple FRED series.
 * Returns successful results and captured errors separately.
 */
export async function getMultipleSeries(
  seriesIds: string[],
): Promise<FredMultiSeriesResult> {
  const series: Record<string, FredLatestValue> = {};
  const errors: Record<string, string> = {};

  const results = await Promise.allSettled(
    seriesIds.map((id) => getLatestValue(id)),
  );

  for (let i = 0; i < seriesIds.length; i++) {
    const seriesId = seriesIds[i];
    const result = results[i];

    if (result.status === 'fulfilled') {
      series[seriesId] = result.value;
    } else {
      errors[seriesId] =
        result.reason instanceof Error
          ? result.reason.message
          : 'Unknown error';
    }
  }

  return {
    series,
    errors,
    fetchedAt: new Date(),
  };
}

// ── Error class ────────────────────────────────────────────────────────────

export class FredProviderError extends Error {
  public readonly provider = 'fred' as const;
  public readonly seriesOrEndpoint: string;
  public readonly statusCode: number | null;

  constructor(message: string, seriesOrEndpoint: string, statusCode: number | null = null) {
    super(message);
    this.name = 'FredProviderError';
    this.seriesOrEndpoint = seriesOrEndpoint;
    this.statusCode = statusCode;
  }
}
