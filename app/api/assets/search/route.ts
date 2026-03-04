import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface SearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchDisp?: string;
  quoteType?: string;
  typeDisp?: string;
}

/**
 * GET /api/assets/search?q=AAPL&type=equity
 * Search for assets using Yahoo Finance.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.search(query, {
      newsCount: 0,
      quotesCount: 10,
    });

    const quotes = (result.quotes ?? []) as SearchQuote[];
    const results = quotes
      .filter((q) => q.symbol && q.quoteType !== 'OPTION' && q.quoteType !== 'FUTURE')
      .map((q) => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        type: mapQuoteType(q.quoteType),
        exchange: q.exchDisp ?? '',
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}

function mapQuoteType(quoteType?: string): string {
  switch (quoteType) {
    case 'EQUITY':
      return 'stock';
    case 'ETF':
      return 'etf';
    case 'CRYPTOCURRENCY':
      return 'crypto';
    case 'CURRENCY':
      return 'forex';
    case 'INDEX':
      return 'index';
    case 'MUTUALFUND':
      return 'fund';
    default:
      return 'stock';
  }
}
