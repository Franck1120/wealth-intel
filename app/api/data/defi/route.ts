import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

const DEFILLAMA_BASE_URL = 'https://api.llama.fi';
const DEFILLAMA_YIELDS_URL = 'https://yields.llama.fi';

const CACHE_DURATION_HOURS = 1;
const CACHE_DURATION_MS = CACHE_DURATION_HOURS * 60 * 60 * 1000;

interface DefiProtocol {
  id: string;
  name: string;
  slug: string;
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  chains: string[];
  category: string;
  url: string;
  logo: string;
}

interface YieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  stablecoin: boolean;
  ilRisk: string;
}

/**
 * GET /api/data/defi?protocol=aave or ?top=20
 * Fetch DeFi protocol data from DeFi Llama.
 *
 * Query params:
 * - protocol: specific protocol slug (e.g., "aave", "uniswap")
 * - top: number of top protocols by TVL (default 20, max 100)
 * - yields: "true" to include top yield pools
 * - chain: filter by chain (e.g., "ethereum", "arbitrum")
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const protocol = request.nextUrl.searchParams.get('protocol');
  const topParam = request.nextUrl.searchParams.get('top');
  const includeYields = request.nextUrl.searchParams.get('yields') === 'true';
  const chain = request.nextUrl.searchParams.get('chain');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const cacheThreshold = new Date(
    Date.now() - CACHE_DURATION_MS,
  ).toISOString();

  // Single protocol detail
  if (protocol) {
    return await fetchProtocolDetail(admin, protocol, cacheThreshold);
  }

  // Top protocols by TVL
  const top = Math.min(
    Math.max(1, parseInt(topParam ?? '20', 10) || 20),
    100,
  );

  const result: {
    protocols?: DefiProtocol[];
    yields?: YieldPool[];
    total_tvl?: number;
    source: string;
  } = { source: 'fresh' };

  // Fetch top protocols
  try {
    // Check cache first
    const cacheKey = chain ? `top_protocols_${chain}` : 'top_protocols';
    const { data: cachedProtocols } = await admin
      .from('defi_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('fetched_at', cacheThreshold)
      .maybeSingle();

    if (cachedProtocols?.data) {
      const parsed = JSON.parse(cachedProtocols.data as string) as DefiProtocol[];
      result.protocols = parsed.slice(0, top);
      result.total_tvl = parsed.reduce((sum, p) => sum + p.tvl, 0);
      result.source = 'cache';
    } else {
      const response = await fetch(`${DEFILLAMA_BASE_URL}/protocols`, {
        next: { revalidate: CACHE_DURATION_HOURS * 3600 },
      });

      if (!response.ok) {
        throw new Error(`DeFi Llama API returned ${response.status}`);
      }

      const protocols = (await response.json()) as Array<Record<string, unknown>>;

      // Map and filter
      let mapped: DefiProtocol[] = protocols.map((p) => ({
        id: p.id as string,
        name: p.name as string,
        slug: p.slug as string,
        tvl: (p.tvl as number) ?? 0,
        change_1h: (p.change_1h as number) ?? null,
        change_1d: (p.change_1d as number) ?? null,
        change_7d: (p.change_7d as number) ?? null,
        chains: (p.chains as string[]) ?? [],
        category: (p.category as string) ?? 'Unknown',
        url: (p.url as string) ?? '',
        logo: (p.logo as string) ?? '',
      }));

      // Filter by chain if specified
      if (chain) {
        const chainLower = chain.toLowerCase();
        mapped = mapped.filter((p) =>
          p.chains.some((c) => c.toLowerCase() === chainLower),
        );
      }

      // Sort by TVL descending
      mapped.sort((a, b) => b.tvl - a.tvl);

      // Cache top 100 for future requests
      const toCache = mapped.slice(0, 100);
      const now = new Date().toISOString();

      const { error: upsertError } = await admin
        .from('defi_cache')
        .upsert(
          {
            cache_key: cacheKey,
            data: JSON.stringify(toCache),
            fetched_at: now,
          },
          { onConflict: 'cache_key', ignoreDuplicates: false },
        );

      if (upsertError) {
        console.error('DeFi cache upsert error:', upsertError.message);
      }

      result.protocols = mapped.slice(0, top);
      result.total_tvl = mapped.reduce((sum, p) => sum + p.tvl, 0);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error fetching protocols';
    return NextResponse.json(
      { error: `Failed to fetch DeFi protocols: ${message}` },
      { status: 502 },
    );
  }

  // Optionally fetch top yield pools
  if (includeYields) {
    try {
      const { data: cachedYields } = await admin
        .from('defi_cache')
        .select('*')
        .eq('cache_key', 'yield_pools')
        .gte('fetched_at', cacheThreshold)
        .maybeSingle();

      if (cachedYields?.data) {
        result.yields = JSON.parse(cachedYields.data as string) as YieldPool[];
      } else {
        const yieldResponse = await fetch(`${DEFILLAMA_YIELDS_URL}/pools`, {
          next: { revalidate: CACHE_DURATION_HOURS * 3600 },
        });

        if (yieldResponse.ok) {
          const yieldData = (await yieldResponse.json()) as {
            data: Array<Record<string, unknown>>;
          };

          let pools: YieldPool[] = (yieldData.data ?? [])
            .filter(
              (p) =>
                (p.tvlUsd as number) > 1_000_000 &&
                (p.apy as number) > 0,
            )
            .map((p) => ({
              pool: p.pool as string,
              chain: p.chain as string,
              project: p.project as string,
              symbol: p.symbol as string,
              tvlUsd: p.tvlUsd as number,
              apy: p.apy as number,
              apyBase: (p.apyBase as number) ?? null,
              apyReward: (p.apyReward as number) ?? null,
              stablecoin: (p.stablecoin as boolean) ?? false,
              ilRisk: (p.ilRisk as string) ?? 'unknown',
            }))
            .sort((a, b) => b.tvlUsd - a.tvlUsd)
            .slice(0, 50);

          // Filter by chain if specified
          if (chain) {
            const chainLower = chain.toLowerCase();
            pools = pools.filter(
              (p) => p.chain.toLowerCase() === chainLower,
            );
          }

          const now = new Date().toISOString();

          const { error: yieldUpsertError } = await admin
            .from('defi_cache')
            .upsert(
              {
                cache_key: 'yield_pools',
                data: JSON.stringify(pools),
                fetched_at: now,
              },
              { onConflict: 'cache_key', ignoreDuplicates: false },
            );

          if (yieldUpsertError) {
            console.error(
              'Yield cache upsert error:',
              yieldUpsertError.message,
            );
          }

          result.yields = pools;
        }
      }
    } catch (err) {
      console.error('Failed to fetch yield pools:', err);
      // Non-fatal: return protocols without yields
    }
  }

  const response = NextResponse.json(result);
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  return response;
}

/**
 * Fetch detailed data for a single DeFi protocol.
 */
async function fetchProtocolDetail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  slug: string,
  cacheThreshold: string,
) {
  const cacheKey = `protocol_${slug}`;

  // Check cache
  const { data: cached } = await admin
    .from('defi_cache')
    .select('*')
    .eq('cache_key', cacheKey)
    .gte('fetched_at', cacheThreshold)
    .maybeSingle();

  if (cached?.data) {
    const cachedRes = NextResponse.json({
      data: JSON.parse(cached.data as string),
      source: 'cache',
    });
    cachedRes.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return cachedRes;
  }

  try {
    const fetchRes = await fetch(
      `${DEFILLAMA_BASE_URL}/protocol/${encodeURIComponent(slug)}`,
      { next: { revalidate: CACHE_DURATION_HOURS * 3600 } },
    );

    if (!fetchRes.ok) {
      if (fetchRes.status === 404) {
        return NextResponse.json(
          { error: `Protocol not found: ${slug}` },
          { status: 404 },
        );
      }
      throw new Error(`DeFi Llama API returned ${fetchRes.status}`);
    }

    const protocolData = await fetchRes.json();
    const now = new Date().toISOString();

    // Extract relevant fields
    const detail = {
      id: protocolData.id,
      name: protocolData.name,
      slug: protocolData.slug,
      url: protocolData.url,
      description: protocolData.description,
      tvl: protocolData.tvl,
      chains: protocolData.chains,
      category: protocolData.category,
      logo: protocolData.logo,
      twitter: protocolData.twitter,
      audit_links: protocolData.audit_links,
      chain_tvls: protocolData.chainTvls,
      tvl_history: (protocolData.tvl ?? []).slice(-90), // Last 90 days
      raises: protocolData.raises,
      token: protocolData.symbol,
      mcap: protocolData.mcap,
    };

    // Cache
    const { error: upsertError } = await admin
      .from('defi_cache')
      .upsert(
        {
          cache_key: cacheKey,
          data: JSON.stringify(detail),
          fetched_at: now,
        },
        { onConflict: 'cache_key', ignoreDuplicates: false },
      );

    if (upsertError) {
      console.error('Protocol detail cache error:', upsertError.message);
    }

    const freshRes = NextResponse.json({
      data: detail,
      source: 'fresh',
    });
    freshRes.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return freshRes;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to fetch protocol: ${message}` },
      { status: 502 },
    );
  }
}
