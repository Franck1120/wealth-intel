import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getSeriesData } from '@/lib/data-providers/fred';

/** Known macro indicators and their FRED series IDs */
const INDICATOR_SERIES: Record<string, string> = {
  FEDFUNDS: 'FEDFUNDS',
  CPI: 'CPIAUCSL',
  GDP: 'GDP',
  UNEMPLOYMENT: 'UNRATE',
  INFLATION_EXPECTATION: 'T10YIE',
  TREASURY_10Y: 'DGS10',
  TREASURY_2Y: 'DGS2',
  YIELD_SPREAD: 'T10Y2Y',
  VIX: 'VIXCLS',
  SP500: 'SP500',
  HOUSING_STARTS: 'HOUST',
  CONSUMER_SENTIMENT: 'UMCSENT',
  RETAIL_SALES: 'RSXFS',
  INDUSTRIAL_PRODUCTION: 'INDPRO',
  M2_MONEY_SUPPLY: 'M2SL',
};

/**
 * GET /api/data/macro?indicators=FEDFUNDS,CPI,GDP
 * Fetch macro economic indicators from FRED, with caching.
 * Pass indicators=all to fetch all known indicators.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const indicatorsParam = request.nextUrl.searchParams.get('indicators');

  if (!indicatorsParam) {
    return NextResponse.json(
      {
        error: 'indicators query param is required (comma-separated or "all")',
        available: Object.keys(INDICATOR_SERIES),
      },
      { status: 400 },
    );
  }

  const requestedIndicators =
    indicatorsParam.toLowerCase() === 'all'
      ? Object.keys(INDICATOR_SERIES)
      : indicatorsParam
          .split(',')
          .map((i) => i.trim().toUpperCase())
          .filter(Boolean);

  // Validate requested indicators
  const invalidIndicators = requestedIndicators.filter(
    (i) => !(i in INDICATOR_SERIES),
  );

  if (invalidIndicators.length > 0) {
    return NextResponse.json(
      {
        error: `Unknown indicators: ${invalidIndicators.join(', ')}`,
        available: Object.keys(INDICATOR_SERIES),
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // Check cache
  const { data: cached } = await admin
    .from('macro_indicators')
    .select('*')
    .in('indicator_key', requestedIndicators);

  const cachedMap = new Map(
    (cached ?? []).map((c) => [c.indicator_key as string, c]),
  );

  const staleIndicators = requestedIndicators.filter(
    (i) => !cachedMap.has(i),
  );

  // Fetch stale indicators from FRED
  const freshData: Array<Record<string, unknown>> = [];

  if (staleIndicators.length > 0) {
    const now = new Date().toISOString();
    const BATCH_SIZE = 5;

    for (let i = 0; i < staleIndicators.length; i += BATCH_SIZE) {
      const batch = staleIndicators.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (indicator) => {
        try {
          const seriesId = INDICATOR_SERIES[indicator];
          const series = await getSeriesData(seriesId);

          if (series && series.observations.length > 0) {
            const latest = series.observations[series.observations.length - 1];
            const previous =
              series.observations.length > 1
                ? series.observations[series.observations.length - 2]
                : null;

            const value = latest.value ?? 0;
            const previousValue = previous
              ? (previous.value ?? null)
              : null;
            const change =
              previousValue !== null ? value - previousValue : null;
            const changePct =
              previousValue !== null && previousValue !== 0
                ? ((value - previousValue) / Math.abs(previousValue)) * 100
                : null;

            const record = {
              indicator_key: indicator,
              value,
              date: latest.date,
              source: 'fred',
              metadata: {
                indicator_name: series.title ?? indicator,
                previous_value: previousValue,
                change,
                change_pct: changePct,
                unit: series.units ?? null,
                frequency: series.frequency ?? null,
                fetched_at: now,
              },
            };

            freshData.push(record);
          }
        } catch (err) {
          console.error(`FRED fetch failed for ${indicator}:`, err);
        }
      });

      await Promise.all(promises);
    }

    // Upsert fresh data into cache
    if (freshData.length > 0) {
      const { error: upsertError } = await admin
        .from('macro_indicators')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(freshData as any, {
          onConflict: 'indicator_key',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('Macro indicators upsert error:', upsertError.message);
      }
    }
  }

  // Combine cached + fresh
  const freshCodes = new Set(
    freshData.map((d) => d.indicator_key as string),
  );
  const dedupedCached = (cached ?? []).filter(
    (c) => !freshCodes.has(c.indicator_key as string),
  );

  const allData = [...dedupedCached, ...freshData];

  // Sort by the original request order
  const orderMap = new Map(
    requestedIndicators.map((ind, idx) => [ind, idx]),
  );
  allData.sort(
    (a, b) =>
      (orderMap.get(a.indicator_key as string) ?? 999) -
      (orderMap.get(b.indicator_key as string) ?? 999),
  );

  return NextResponse.json({
    data: allData,
    fetched_count: freshData.length,
    cached_count: dedupedCached.length,
  });
}
