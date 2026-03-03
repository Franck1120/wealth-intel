/**
 * Opportunity Validation Prompt — Optional (requires ANTHROPIC_API_KEY)
 *
 * Validates an investment opportunity with GO/WAIT/NO-GO recommendation.
 */

export function buildValidateOpportunityPrompt(context: {
  title: string;
  module: string;
  thesis: string;
  risks: string;
  targetPrice?: number;
  stopLoss?: number;
  currentPrice?: number;
  score?: number;
}): string {
  return `You are an investment analyst validating an opportunity.

Opportunity: ${context.title}
Module: ${context.module}
Investment Thesis: ${context.thesis}
Identified Risks: ${context.risks}
${context.targetPrice ? `Target Price: ${context.targetPrice}` : ''}
${context.stopLoss ? `Stop Loss: ${context.stopLoss}` : ''}
${context.currentPrice ? `Current Price: ${context.currentPrice}` : ''}
${context.score ? `Quantitative Score: ${context.score}/100` : ''}

Evaluate this opportunity and provide:
1. Recommendation: GO, WAIT, or NO-GO
2. Confidence level: 1-10
3. Key concerns not mentioned
4. Suggested position size (% of portfolio): conservative, moderate, aggressive

Respond in JSON format:
{
  "recommendation": "GO" | "WAIT" | "NO-GO",
  "confidence": number,
  "reasoning": "string",
  "concerns": ["string"],
  "positionSize": {
    "conservative": number,
    "moderate": number,
    "aggressive": number
  }
}`;
}
