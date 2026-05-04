import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/supabase'
import { getAlgorithmConfig } from '@/lib/adAuction'

const ClickSchema = z.object({
  impressionId: z.string().uuid(),
  buyerPincode: z.string().regex(/^[1-9][0-9]{5}$/).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = ClickSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { impressionId, buyerPincode } = body.data
    const supabase = createSupabaseAdmin()
    const config   = await getAlgorithmConfig()

    const ip     = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const ipHash = createHash('sha256').update(ip).digest('hex')

    const { data: impression, error: impErr } = await supabase
      .from('ad_impressions')
      .select('id, campaign_id, product_id, actual_cpc_paise, created_at')
      .eq('id', impressionId)
      .single()

    if (impErr || !impression) {
      return NextResponse.json({ error: 'Impression not found' }, { status: 404 })
    }

    const ageMinutes = (Date.now() - new Date(impression.created_at).getTime()) / 60000
    if (ageMinutes > 30) {
      return NextResponse.json({ error: 'Impression expired' }, { status: 410 })
    }

    const { data: campaign } = await supabase
      .from('ad_campaigns')
      .select('id, manufacturer_id, status, review_status, max_bid_paise')
      .eq('id', impression.campaign_id)
      .single()

    if (!campaign || campaign.status !== 'active' || campaign.review_status !== 'approved') {
      return NextResponse.json({ error: 'Campaign not active' }, { status: 409 })
    }

    const sinceHours = config.fraud_cooldown_hours ?? 24
    const since = new Date(Date.now() - sinceHours * 3_600_000).toISOString()

    const { count: clickCount } = await supabase
      .from('ad_clicks')
      .select('id', { count: 'exact', head: true })
      .eq('buyer_ip_hash', ipHash)
      .eq('campaign_id', campaign.id)
      .gte('created_at', since)

    const isFraud = (clickCount ?? 0) >= (config.max_clicks_per_ip_day ?? 5)
    const cpcPaise = impression.actual_cpc_paise ?? campaign.max_bid_paise

    const { data: clickRow } = await supabase
      .from('ad_clicks')
      .insert({
        impression_id:     impression.id,
        campaign_id:       campaign.id,
        product_id:        impression.product_id,
        manufacturer_id:   campaign.manufacturer_id,
        cpc_charged_paise: cpcPaise,
        buyer_pincode:     buyerPincode ?? null,
        buyer_ip_hash:     ipHash,
        is_fraud:          isFraud,
      })
      .select('id')
      .single()

    if (!isFraud && clickRow) {
      const { error: walletErr } = await supabase.rpc('deduct_ad_wallet', {
        p_manufacturer_id: campaign.manufacturer_id,
        p_amount_paise:    cpcPaise,
        p_campaign_id:     campaign.id,
        p_click_id:        clickRow.id,
        p_buyer_pincode:   buyerPincode ?? null,
      })

      if (walletErr) {
        await supabase.from('ad_clicks').update({ is_fraud: true }).eq('id', clickRow.id)
      }
    }

    return NextResponse.json({
      success:   true,
      isFraud,
      productId: impression.product_id,
    })
  } catch (err) {
    console.error('[/api/ads/click]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
