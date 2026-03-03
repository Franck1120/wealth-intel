import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { transactionSchema } from '@/lib/validators';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * GET /api/portfolio/transactions?portfolio_id=<uuid>&limit=50&offset=0
 * List transactions for a portfolio with pagination.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const portfolioId = request.nextUrl.searchParams.get('portfolio_id');

  if (!portfolioId) {
    return NextResponse.json(
      { error: 'portfolio_id query param is required' },
      { status: 400 },
    );
  }

  const limit = Math.min(
    Math.max(
      1,
      parseInt(request.nextUrl.searchParams.get('limit') ?? '', 10) ||
        DEFAULT_LIMIT,
    ),
    MAX_LIMIT,
  );
  const offset = Math.max(
    0,
    parseInt(request.nextUrl.searchParams.get('offset') ?? '', 10) || 0,
  );

  const { data, error, count } = await supabase
    .from('transactions')
    .select(
      `
      *,
      assets:asset_id (
        id,
        symbol,
        name,
        asset_type
      )
    `,
      { count: 'exact' },
    )
    .eq('portfolio_id', portfolioId)
    .order('executed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      total: count ?? 0,
      limit,
      offset,
      has_more: (count ?? 0) > offset + limit,
    },
  });
}

/**
 * POST /api/portfolio/transactions
 * Create a new transaction and recalculate the holding's avg_cost_basis.
 *
 * For BUY:  new_avg = (old_qty * old_avg + new_qty * price) / (old_qty + new_qty)
 * For SELL: reduce quantity, avg stays same; if qty reaches 0, delete holding
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = transactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    portfolio_id,
    asset_id,
    type: transaction_type,
    quantity,
    price: price_per_unit,
    fees,
    currency,
    notes,
    executed_at,
  } = parsed.data;

  // Verify portfolio ownership via RLS
  const { data: portfolio, error: portfolioError } = await supabase
    .from('portfolios')
    .select('id')
    .eq('id', portfolio_id)
    .single();

  if (portfolioError || !portfolio) {
    return NextResponse.json(
      { error: 'Portfolio not found or access denied' },
      { status: 404 },
    );
  }

  // Fetch existing holding
  const { data: existingHolding } = await supabase
    .from('holdings')
    .select('id, quantity, avg_cost_basis')
    .eq('portfolio_id', portfolio_id)
    .eq('asset_id', asset_id)
    .maybeSingle();

  const totalCost = quantity * price_per_unit + (fees ?? 0);

  if (transaction_type === 'buy') {
    const oldQty = existingHolding?.quantity ?? 0;
    const oldAvg = existingHolding?.avg_cost_basis ?? 0;
    const newTotalQty = oldQty + quantity;
    const newAvgCost =
      newTotalQty > 0
        ? (oldQty * oldAvg + totalCost) / newTotalQty
        : price_per_unit;

    if (existingHolding) {
      // Update existing holding
      const { error: holdingError } = await supabase
        .from('holdings')
        .update({
          quantity: newTotalQty,
          avg_cost_basis: newAvgCost,
        })
        .eq('id', existingHolding.id);

      if (holdingError) {
        return NextResponse.json(
          { error: holdingError.message },
          { status: 500 },
        );
      }
    } else {
      // Create new holding
      const { error: holdingError } = await supabase
        .from('holdings')
        .insert({
          portfolio_id,
          asset_id,
          quantity,
          avg_cost_basis: totalCost / quantity,
        });

      if (holdingError) {
        return NextResponse.json(
          { error: holdingError.message },
          { status: 500 },
        );
      }
    }
  } else if (transaction_type === 'sell') {
    if (!existingHolding) {
      return NextResponse.json(
        { error: 'Cannot sell: no existing holding for this asset' },
        { status: 400 },
      );
    }

    const oldQty = existingHolding.quantity as number;

    if (quantity > oldQty) {
      return NextResponse.json(
        {
          error: `Cannot sell ${quantity} units: only ${oldQty} held`,
        },
        { status: 400 },
      );
    }

    const newQty = oldQty - quantity;

    if (newQty === 0) {
      // Remove the holding entirely
      const { error: deleteError } = await supabase
        .from('holdings')
        .delete()
        .eq('id', existingHolding.id);

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 },
        );
      }
    } else {
      // Reduce quantity, avg_cost_basis stays the same
      const { error: holdingError } = await supabase
        .from('holdings')
        .update({ quantity: newQty })
        .eq('id', existingHolding.id);

      if (holdingError) {
        return NextResponse.json(
          { error: holdingError.message },
          { status: 500 },
        );
      }
    }
  } else if (transaction_type === 'dividend' || transaction_type === 'fee') {
    // Dividends and fees are recorded but don't affect holdings quantity
    // They are tracked for performance calculation purposes
  }

  // Record the transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      portfolio_id,
      asset_id,
      type: transaction_type,
      quantity,
      price: price_per_unit,
      fees: fees ?? 0,
      currency,
      notes: notes ?? null,
      executed_at: executed_at ?? new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .select()
    .single();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  return NextResponse.json(transaction, { status: 201 });
}

/**
 * DELETE /api/portfolio/transactions?id=<uuid>
 * Delete a transaction by id.
 * Note: This does NOT reverse the holding impact.
 * For accurate holdings, the user should recalculate or adjust manually.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Transaction id is required' },
      { status: 400 },
    );
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
