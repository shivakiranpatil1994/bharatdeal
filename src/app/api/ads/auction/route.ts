import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { runAuction } from '@/lib/adAuction'
import { createSupabaseAdmin } from '@/lib/supabase'

const AuctionSchema = z.object({
  placement:    z.enum(['sponsored_search', 'product_card', 'homepage_banner', 'flash_deal']),
  query:        z.string().max(200).optional(),
  category:     z.string().max(100).optional(),
  buyerPincode: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
  buyerSession: z.string().min(1).max(100),
  slots:        z.number().int().min(1).max(4).default(2),
})

export async function POST(req: NextRequest) {
  try {
    const body = AuctionSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const ip     = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const ipHash = createHash('sha256').update(ip).digest('hex')

    const winners = await runAuction({ ...body.data, buyerIpHash: ipHash })

    if (!winners.length) {
      return NextResponse.json({ sponsored: [] })
    }

    const supabase   = createSupabaseAdmin()
    const productIds = winners.map(w => w.productId)

    const { data: products } = await supabase
      .from('products')
      .select('id, title, price_paise, mrp_paise, images, category, manufacturer_id')
      .in('id', productIds)

    const productsById = Object.fromEntries(
      (products ?? []).map(p => [p.id, p])
    )

    const sponsored = winners.map(w => ({
      ...productsById[w.productId],
      isSponsored:  true,
      impressionId: w.impressionId,
    }))

    return NextResponse.json({ sponsored })
  } catch (err) {
    console.error('[/api/ads/auction]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
