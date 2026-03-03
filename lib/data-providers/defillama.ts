/**
 * DeFi Llama data provider
 * REST API wrapper for DeFi protocol TVL and yield data
 * No API key required
 */

const BASE_URL = 'https://api.llama.fi';
const YIELDS_URL = 'https://yields.llama.fi';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProtocolTVL {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chains: string[];
  tvl: number;
  change1h: number | null;
  change1d: number | null;
  change7d: number | null;
  chainTvls: Record<string, number>;
  category: string | null;
  url: string;
  logo: string;
  fetchedAt: Date;
}

export interface TopProtocol {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chains: string[];
  tvl: number;
  change1h: number | null;
  change1d: number | null;
  change7d: number | null;
  category: string | null;
  logo: string;
  url: string;
}

export interface ChainTVLData {
  chain: string;
  tvl: number;
  tokenSymbol: string | null;
  tvlHistory: ChainTVLHistoryPoint[];
  fetchedAt: Date;
}

export interface ChainTVLHistoryPoint {
  date: number;
  tvl: number;
}

export interface YieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta: string | null;
}

// ── Raw API response types ─────────────────────────────────────────────────

interface DefiLlamaProtocolResponse {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chains: string[];
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  chainTvls: Record<string, { tvl: Array<{ date: number; totalLiquidityUSD: number }> }>;
  category: string | null;
  url: string;
  logo: string;
}

interface DefiLlamaProtocolListItem {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chains: string[];
  tvl: number;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  category: string | null;
  logo: string;
  url: string;
}

interface DefiLlamaChainResponse {
  name: string;
  tokenSymbol: string | null;
  tvl: number;
}

interface DefiLlamaChainHistoryResponse {
  date: number;
  tvl: number;
}

interface DefiLlamaYieldPoolResponse {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta: string | null;
}

interface DefiLlamaYieldsResponse {
  status: string;
  data: DefiLlamaYieldPoolResponse[];
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function fetchDefiLlama<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new DefiLlamaProviderError(
      `DeFi Llama API error: ${response.status} ${response.statusText}`,
      url,
      response.status,
    );
  }

  return (await response.json()) as T;
}

// ── Functions ──────────────────────────────────────────────────────────────

/**
 * Get TVL data for a specific DeFi protocol.
 * Protocol slug should be lowercase (e.g., 'aave', 'uniswap', 'lido').
 */
export async function getProtocolTVL(protocol: string): Promise<ProtocolTVL> {
  try {
    const data = await fetchDefiLlama<DefiLlamaProtocolResponse>(
      `${BASE_URL}/protocol/${protocol}`,
    );

    const chainTvls: Record<string, number> = {};
    for (const [chain, chainData] of Object.entries(data.chainTvls)) {
      const latestEntry = chainData.tvl[chainData.tvl.length - 1];
      if (latestEntry) {
        chainTvls[chain] = latestEntry.totalLiquidityUSD;
      }
    }

    return {
      id: data.id,
      name: data.name,
      symbol: data.symbol,
      chain: data.chain,
      chains: data.chains,
      tvl: data.tvl,
      change1h: data.change_1h,
      change1d: data.change_1d,
      change7d: data.change_7d,
      chainTvls,
      category: data.category,
      url: data.url,
      logo: data.logo,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof DefiLlamaProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new DefiLlamaProviderError(
      `Failed to fetch TVL for protocol ${protocol}: ${message}`,
      `${BASE_URL}/protocol/${protocol}`,
    );
  }
}

/**
 * Get top DeFi protocols ranked by TVL.
 */
export async function getTopProtocols(limit: number = 20): Promise<TopProtocol[]> {
  try {
    const data = await fetchDefiLlama<DefiLlamaProtocolListItem[]>(`${BASE_URL}/protocols`);

    const sorted = data
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
      .slice(0, limit);

    return sorted.map((p) => ({
      id: p.id,
      name: p.name,
      symbol: p.symbol,
      chain: p.chain,
      chains: p.chains,
      tvl: p.tvl,
      change1h: p.change_1h,
      change1d: p.change_1d,
      change7d: p.change_7d,
      category: p.category,
      logo: p.logo,
      url: p.url,
    }));
  } catch (error) {
    if (error instanceof DefiLlamaProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new DefiLlamaProviderError(
      `Failed to fetch top protocols: ${message}`,
      `${BASE_URL}/protocols`,
    );
  }
}

/**
 * Get TVL data for a specific blockchain.
 * Chain name is case-sensitive (e.g., 'Ethereum', 'Solana', 'Arbitrum').
 */
export async function getChainTVL(chain: string): Promise<ChainTVLData> {
  try {
    const [chainsData, historyData] = await Promise.all([
      fetchDefiLlama<DefiLlamaChainResponse[]>(`${BASE_URL}/v2/chains`),
      fetchDefiLlama<DefiLlamaChainHistoryResponse[]>(`${BASE_URL}/v2/historicalChainTvl/${chain}`),
    ]);

    const chainInfo = chainsData.find(
      (c) => c.name.toLowerCase() === chain.toLowerCase(),
    );

    const tvlHistory: ChainTVLHistoryPoint[] = historyData.map((point) => ({
      date: point.date,
      tvl: point.tvl,
    }));

    const latestTvl = tvlHistory.length > 0
      ? tvlHistory[tvlHistory.length - 1].tvl
      : (chainInfo?.tvl ?? 0);

    return {
      chain: chainInfo?.name ?? chain,
      tvl: latestTvl,
      tokenSymbol: chainInfo?.tokenSymbol ?? null,
      tvlHistory,
      fetchedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof DefiLlamaProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new DefiLlamaProviderError(
      `Failed to fetch TVL for chain ${chain}: ${message}`,
      `${BASE_URL}/v2/historicalChainTvl/${chain}`,
    );
  }
}

/**
 * Get yield farming pool data.
 * Optionally filter by chain (e.g., 'Ethereum', 'Arbitrum').
 */
export async function getYieldPools(chain?: string): Promise<YieldPool[]> {
  try {
    const data = await fetchDefiLlama<DefiLlamaYieldsResponse>(`${YIELDS_URL}/pools`);

    let pools = data.data;

    if (chain) {
      const chainLower = chain.toLowerCase();
      pools = pools.filter((p) => p.chain.toLowerCase() === chainLower);
    }

    return pools.map((p) => ({
      pool: p.pool,
      chain: p.chain,
      project: p.project,
      symbol: p.symbol,
      tvlUsd: p.tvlUsd,
      apyBase: p.apyBase,
      apyReward: p.apyReward,
      apy: p.apy,
      stablecoin: p.stablecoin,
      ilRisk: p.ilRisk,
      exposure: p.exposure,
      poolMeta: p.poolMeta,
    }));
  } catch (error) {
    if (error instanceof DefiLlamaProviderError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new DefiLlamaProviderError(
      `Failed to fetch yield pools: ${message}`,
      `${YIELDS_URL}/pools`,
    );
  }
}

// ── Error class ────────────────────────────────────────────────────────────

export class DefiLlamaProviderError extends Error {
  public readonly provider = 'defillama' as const;
  public readonly url: string;
  public readonly statusCode: number | null;

  constructor(message: string, url: string, statusCode: number | null = null) {
    super(message);
    this.name = 'DefiLlamaProviderError';
    this.url = url;
    this.statusCode = statusCode;
  }
}
