/**
 * ECB (European Central Bank) data provider
 * Exchange rates and EURIBOR from ECB Statistical Data Warehouse
 * No API key required
 */

const EXR_BASE_URL = 'https://data-api.ecb.europa.eu/service/data/EXR';
const FM_BASE_URL = 'https://data-api.ecb.europa.eu/service/data/FM';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExchangeRate {
  baseCurrency: 'EUR';
  targetCurrency: string;
  rate: number;
  date: string;
  fetchedAt: Date;
}

export interface HistoricalRate {
  date: string;
  rate: number;
}

export interface HistoricalRatesData {
  baseCurrency: 'EUR';
  targetCurrency: string;
  rates: HistoricalRate[];
  fetchedAt: Date;
}

export interface EuriborRate {
  tenor: string;
  rate: number;
  date: string;
}

export interface EuriborData {
  rates: EuriborRate[];
  fetchedAt: Date;
}

// ── Raw ECB SDMX-JSON response types ───────────────────────────────────────

interface EcbSdmxResponse {
  dataSets?: Array<{
    series: Record<
      string,
      {
        observations: Record<string, [number]>;
      }
    >;
  }>;
  structure?: {
    dimensions: {
      observation: Array<{
        id: string;
        values: Array<{ id: string; name: string }>;
      }>;
      series: Array<{
        id: string;
        values: Array<{ id: string; name: string }>;
      }>;
    };
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function fetchEcb(url: string): Promise<EcbSdmxResponse> {
  const response = await fetch(url, {
    headers: {
      accept: 'application/vnd.sdmx.data+json;version=1.0.0-wd',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new EcbProviderError(
        `ECB data not found for the requested resource`,
        url,
        404,
      );
    }
    throw new EcbProviderError(
      `ECB API error: ${response.status} ${response.statusText}`,
      url,
      response.status,
    );
  }

  return (await response.json()) as EcbSdmxResponse;
}

function extractTimePeriods(data: EcbSdmxResponse): string[] {
  const timeDimension = data.structure?.dimensions.observation.find(
    (d) => d.id === 'TIME_PERIOD',
  );
  return timeDimension?.values.map((v) => v.id) ?? [];
}

function extractSeriesObservations(
  data: EcbSdmxResponse,
  seriesKey: string = '0:0:0:0:0',
): Record<string, [number]> {
  const dataSet = data.dataSets?.[0];
  if (!dataSet) return {};

  const series = dataSet.series[seriesKey];
  if (!series) {
    // Try first available series
    const firstKey = Object.keys(dataSet.series)[0];
    if (!firstKey) return {};
    return dataSet.series[firstKey].observations;
  }

  return series.observations;
}

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Get the latest EUR to target currency exchange rate.
 * @param currency Target currency code (e.g., 'USD', 'GBP', 'CHF', 'JPY')
 */
export async function getExchangeRate(currency: string): Promise<ExchangeRate> {
  try {
    const upperCurrency = currency.toUpperCase();
    const url = `${EXR_BASE_URL}/D.${upperCurrency}.EUR.SP00.A?lastNObservations=1`;
    const data = await fetchEcb(url);

    const timePeriods = extractTimePeriods(data);
    const observations = extractSeriesObservations(data);

    const lastIndex = Object.keys(observations).pop();
    if (lastIndex === undefined) {
      throw new EcbProviderError(
        `No exchange rate data available for EUR/${upperCurrency}`,
        url,
      );
    }

    const rate = observations[lastIndex][0];
    const date = timePeriods[parseInt(lastIndex, 10)] ?? '';

    return {
      baseCurrency: 'EUR',
      targetCurrency: upperCurrency,
      rate,
      date,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof EcbProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new EcbProviderError(
      `Failed to fetch EUR/${currency.toUpperCase()} exchange rate: ${message}`,
      `${EXR_BASE_URL}`,
    );
  }
}

/**
 * Get historical EUR to target currency exchange rates from a start date.
 * @param currency Target currency code (e.g., 'USD', 'GBP')
 * @param startDate Start date in YYYY-MM-DD format
 */
export async function getHistoricalRates(
  currency: string,
  startDate: string,
): Promise<HistoricalRatesData> {
  try {
    const upperCurrency = currency.toUpperCase();
    const url = `${EXR_BASE_URL}/D.${upperCurrency}.EUR.SP00.A?startPeriod=${startDate}`;
    const data = await fetchEcb(url);

    const timePeriods = extractTimePeriods(data);
    const observations = extractSeriesObservations(data);

    const rates: HistoricalRate[] = [];
    for (const [index, values] of Object.entries(observations)) {
      const periodIndex = parseInt(index, 10);
      const date = timePeriods[periodIndex];
      if (date && values[0] !== undefined) {
        rates.push({
          date,
          rate: values[0],
        });
      }
    }

    // Sort chronologically
    rates.sort((a, b) => a.date.localeCompare(b.date));

    return {
      baseCurrency: 'EUR',
      targetCurrency: upperCurrency,
      rates,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof EcbProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new EcbProviderError(
      `Failed to fetch historical EUR/${currency.toUpperCase()} rates: ${message}`,
      `${EXR_BASE_URL}`,
    );
  }
}

/**
 * Get current EURIBOR rates from ECB.
 * Fetches common tenors: 1 week, 1 month, 3 months, 6 months, 12 months.
 */
export async function getEuribor(): Promise<EuriborData> {
  // ECB SDMX key format: FM/M.U2.EUR.RT.MM.EURIBOR{tenor}D_.HSTA
  // M = Monthly frequency, D_ = daily average suffix
  const EURIBOR_TENORS: Record<string, string> = {
    'EURIBOR1WD_': '1 Week',
    'EURIBOR1MD_': '1 Month',
    'EURIBOR3MD_': '3 Months',
    'EURIBOR6MD_': '6 Months',
    'EURIBOR1YD_': '12 Months',
  };

  const rates: EuriborRate[] = [];
  const errors: string[] = [];

  const tenorEntries = Object.entries(EURIBOR_TENORS);
  const results = await Promise.allSettled(
    tenorEntries.map(async ([seriesCode, tenorName]) => {
      const url = `${FM_BASE_URL}/M.U2.EUR.RT.MM.${seriesCode}.HSTA?lastNObservations=1`;
      return { key: tenorName, data: await fetchEcb(url) };
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const [, tenorName] = tenorEntries[i];

    if (result.status === 'fulfilled') {
      const { data } = result.value;
      const timePeriods = extractTimePeriods(data);
      const observations = extractSeriesObservations(data);

      const lastIndex = Object.keys(observations).pop();
      if (lastIndex !== undefined) {
        rates.push({
          tenor: tenorName,
          rate: observations[lastIndex][0],
          date: timePeriods[parseInt(lastIndex, 10)] ?? '',
        });
      }
    } else {
      errors.push(`${tenorName}: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`);
    }
  }

  if (rates.length === 0 && errors.length > 0) {
    throw new EcbProviderError(
      `Failed to fetch any EURIBOR rates. Errors: ${errors.join('; ')}`,
      FM_BASE_URL,
    );
  }

  return {
    rates,
    fetchedAt: new Date(),
  };
}

// ── Error class ────────────────────────────────────────────────────────────

export class EcbProviderError extends Error {
  public readonly provider = 'ecb' as const;
  public readonly url: string;
  public readonly statusCode: number | null;

  constructor(message: string, url: string, statusCode: number | null = null) {
    super(message);
    this.name = 'EcbProviderError';
    this.url = url;
    this.statusCode = statusCode;
  }
}
