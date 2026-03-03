/**
 * Rate Limiting — Uses Upstash Redis when available, falls back to in-memory.
 *
 * Enable distributed rate limiting by adding:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 * to your .env.local
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In-memory store (per-instance, resets on cold start)
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60_000
): Promise<RateLimitResult> {
  // Try Upstash first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return upstashRateLimit(identifier, limit, windowMs);
  }

  // Fallback to in-memory
  return memoryRateLimit(identifier, limit, windowMs);
}

async function upstashRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const key = `rate_limit:${identifier}`;
  const windowSec = Math.ceil(windowMs / 1000);

  try {
    // INCR + EXPIRE pipeline
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec],
      ]),
    });

    const results = await response.json();
    const count = results[0]?.result ?? 1;

    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset: Date.now() + windowMs,
    };
  } catch {
    // Fallback to memory if Upstash fails
    return memoryRateLimit(identifier, limit, windowMs);
  }
}

function memoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  entry.count++;

  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.resetAt,
  };
}
