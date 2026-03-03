/**
 * AI Client Factory — Optional Module
 *
 * This module is DISABLED by default. It activates only when
 * ANTHROPIC_API_KEY is present in the environment.
 *
 * To enable: add ANTHROPIC_API_KEY to your .env.local
 * Estimated cost: $2-5/month with Haiku for batch scoring + weekly digests.
 */

export function isAIEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getAIClient() {
  if (!isAIEnabled()) {
    throw new Error(
      'AI module is not enabled. Add ANTHROPIC_API_KEY to .env.local to activate.'
    );
  }

  // Dynamic import to avoid loading SDK when not needed
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk');
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const AI_MODELS = {
  FAST: 'claude-haiku-4-5-20251001',
  BALANCED: 'claude-sonnet-4-6',
  POWERFUL: 'claude-opus-4-6',
} as const;
