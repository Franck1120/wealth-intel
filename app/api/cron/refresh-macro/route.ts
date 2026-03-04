import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getLatestValue, FRED_SERIES } from '@/lib/data-providers/fred';
import { getCryptoFearGreed } from '@/lib/data-providers/fear-greed';
import { getEuribor } from '@/lib/data-providers/ecb';

/** FRED series IDs to fetch daily. */
const FRED_INDICATORS = [
  FRED_SERIES.FED_FUNDS_RATE,
  FRED_SERIES.CPI,
  FRED_SERIES.GDP,
  FRED_SERIES.UNEMPLOYMENT,
  FRED_SERIES.US_10Y_TREASURY,
  FRED_SERIES.US_2Y_TREASURY,
  FRED_SERIES.VIX,
] as const;

interface MacroIndicatorRow {
  indicator_key: string;
  value: number;
  source: string;
  date: string;
}

interface MarketSentimentRow {
  index_name: string;
  value: number;
  classification: string | null;
  date: string;
}

/**
 * Cron: Refresh Macro Indicators
 * Schedule: Daily at 06:00 UTC (0 6 * * *)
 *
 * Fetches key macroeconomic indicators from FRED, Fear & Greed index,
 * and ECB EURIBOR rates, then upserts into respective tables.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Use Promise.allSettled so partial failures don't kill the job
  const [fredResults, fearGreedResult, euriborResult] = await Promise.allSettled([
    // 1. Fetch all FRED indicators in parallel
    Promise.allSettled(
      FRED_INDICATORS.map(async (seriesId) => {
        const data = await getLatestValue(seriesId);
        return {
          indicator_key: seriesId,
          value: data.value ?? 0,
          source: 'fred',
          date: data.date ?? today,
        } satisfies MacroIndicatorRow;
      }),
    ),

    // 2. Fetch Fear & Greed crypto index
    getCryptoFearGreed(),

    // 3. Fetch ECB EURIBOR rates
    getEuribor(),
  ]);

  const macroRows: MacroIndicatorRow[] = [];
  const sentimentRows: MarketSentimentRow[] = [];
  const errors: Array<{ source: string; error: string }> = [];

  // Process FRED results
  if (fredResults.status === 'fulfilled') {
    for (const result of fredResults.value) {
      if (result.status === 'fulfilled') {
        macroRows.push(result.value);
      } else {
        errors.push({
          source: `fred`,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
        });
      }
    }
  } else {
    errors.push({
      source: 'fred_batch',
      error: fredResults.reason instanceof Error ? fredResults.reason.message : 'Unknown error',
    });
  }

  // Process Fear & Greed result
  if (fearGreedResult.status === 'fulfilled') {
    const fg = fearGreedResult.value;
    sentimentRows.push({
      index_name: 'crypto_fear_greed',
      value: fg.value,
      classification: fg.classification,
      date: today,
    });
  } else {
    errors.push({
      source: 'fear_greed',
      error:
        fearGreedResult.reason instanceof Error
          ? fearGreedResult.reason.message
          : 'Unknown error',
    });
  }

  // Process EURIBOR result
  if (euriborResult.status === 'fulfilled') {
    const euribor = euriborResult.value;
    for (const rate of euribor.rates) {
      macroRows.push({
        indicator_key: `EURIBOR_${rate.tenor}`,
        value: rate.rate,
        source: 'ecb',
        date: rate.date ?? today,
      });
    }
  } else {
    errors.push({
      source: 'ecb_euribor',
      error:
        euriborResult.reason instanceof Error
          ? euriborResult.reason.message
          : 'Unknown error',
    });
  }

  // Upsert macro indicators
  let macroUpserted = 0;
  if (macroRows.length > 0) {
    const { error: macroError } = await supabase
      .from('macro_indicators')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(macroRows as any, { onConflict: 'indicator_key,date,source' });

    if (macroError) {
      errors.push({ source: 'macro_upsert', error: macroError.message });
    } else {
      macroUpserted = macroRows.length;
    }
  }

  // Upsert market sentiment
  let sentimentUpserted = 0;
  if (sentimentRows.length > 0) {
    const { error: sentimentError } = await supabase
      .from('market_sentiment')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(sentimentRows as any, { onConflict: 'index_name,date' });

    if (sentimentError) {
      errors.push({ source: 'sentiment_upsert', error: sentimentError.message });
    } else {
      sentimentUpserted = sentimentRows.length;
    }
  }

  return NextResponse.json({
    success: true,
    macroIndicators: macroUpserted,
    sentimentIndicators: sentimentUpserted,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now,
  });
}
