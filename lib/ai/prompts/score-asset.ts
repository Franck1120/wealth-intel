/**
 * AI Scoring Prompt — Optional (requires ANTHROPIC_API_KEY)
 *
 * Enhances the quantitative score with qualitative AI analysis.
 * When enabled, AI contributes ~30% to the overall score.
 */

export function buildScoreAssetPrompt(context: {
  symbol: string;
  name: string;
  type: string;
  quantScore: number;
  dimensions: Record<string, number>;
  recentNews?: string[];
}): string {
  return `You are a financial analyst. Analyze the following asset and provide a qualitative assessment.

Asset: ${context.symbol} (${context.name})
Type: ${context.type}
Quantitative Score: ${context.quantScore}/100
Dimension Scores: ${JSON.stringify(context.dimensions, null, 2)}

${context.recentNews ? `Recent News:\n${context.recentNews.join('\n')}` : ''}

Provide:
1. A brief qualitative assessment (2-3 sentences)
2. Key risks not captured by quantitative metrics
3. A qualitative score adjustment (-15 to +15 points)

Respond in JSON format:
{
  "analysis": "string",
  "risks": "string",
  "scoreAdjustment": number
}`;
}
