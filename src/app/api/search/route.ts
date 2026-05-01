import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { SearchEventSchema } from '@/types/index'

export async function POST(req: NextRequest) {
  try {
    const body = SearchEventSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { term, resultsCount, pincode, productId } = body.data
    const supabase = createSupabaseAdmin()

    const { error } = await supabase.from('search_events').insert({
      term,
      term_normalised: term, // already lowercased + trimmed by Zod transform
      results_count: resultsCount,
      buyer_pincode: pincode ?? null,
      clicked_product_id: productId ?? null,
    })

    if (error) {
      console.error('[search] insert error:', error)
      return NextResponse.json({ error: 'Failed to log search' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[search] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
