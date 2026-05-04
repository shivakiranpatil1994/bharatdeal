import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase'
import { runAutoFlagCheck } from '@/lib/adAutoFlag'
import { sendWhatsAppText } from '@/lib/interakt'

const CreateCampaignSchema = z.object({
  name:             z.string().min(3).max(100).transform(s => s.trim()),
  adType:           z.enum(['sponsored_search', 'product_card', 'flash_deal', 'banner', 'zero_result']),
  productId:        z.string().uuid(),
  keywords:         z.array(z.string().max(100)).max(15).default([]),
  categories:       z.array(z.string().max(100)).max(5).default([]),
  maxBidPaise:      z.number().int().min(100),
  dailyBudgetPaise: z.number().int().min(10000),
  totalBudgetPaise: z.number().int().min(10000),
  startDate:        z.string().optional(),
  endDate:          z.string().optional(),
  flashSlotDate:    z.string().optional(),
  flashSlotTime:    z.string().optional(),
  flashFeePaise:    z.number().int().optional(),
})

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseAdmin()
  const { data: mfr } = await admin
    .from('manufacturers')
    .select('id')
    .eq('login_email', user.email)
    .single()

  if (!mfr) return NextResponse.json({ error: 'Manufacturer not found' }, { status: 403 })

  const { data, error } = await admin
    .from('ad_campaigns')
    .select('*, products ( id, title, images, price_paise, category )')
    .eq('manufacturer_id', mfr.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data })
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const admin    = createSupabaseAdmin()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: mfr } = await admin
      .from('manufacturers')
      .select('id, whatsapp_phone, name')
      .eq('login_email', user.email)
      .single()

    if (!mfr) return NextResponse.json({ error: 'Manufacturer not found' }, { status: 403 })

    const mfrData = mfr as { id: string; whatsapp_phone: string; name: string }

    const body = CreateCampaignSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
    }
    const d = body.data

    const { data: product } = await admin
      .from('products')
      .select('id, title, manufacturer_id')
      .eq('id', d.productId)
      .eq('manufacturer_id', mfrData.id)
      .eq('active', true)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found or not yours' }, { status: 403 })
    }

    const { data: wallet } = await admin
      .from('ad_wallets')
      .select('balance_paise')
      .eq('manufacturer_id', mfrData.id)
      .single()

    const walletBalance = (wallet as { balance_paise: number } | null)?.balance_paise ?? 0
    if (walletBalance < d.dailyBudgetPaise) {
      return NextResponse.json({
        error:    'Insufficient wallet balance. Add funds first.',
        required: d.dailyBudgetPaise,
        current:  walletBalance,
      }, { status: 402 })
    }

    const { flags, canAutoApprove } = await runAutoFlagCheck(
      d.productId,
      d.keywords,
      d.categories,
    )

    const reviewStatus = canAutoApprove ? 'approved'       : 'pending_review'
    const status       = canAutoApprove ? 'active'         : 'pending_review'

    const { data: campaign, error: insertErr } = await admin
      .from('ad_campaigns')
      .insert({
        manufacturer_id:    mfrData.id,
        name:               d.name,
        ad_type:            d.adType,
        product_id:         d.productId,
        keywords:           d.keywords,
        categories:         d.categories,
        max_bid_paise:      d.maxBidPaise,
        daily_budget_paise: d.dailyBudgetPaise,
        total_budget_paise: d.totalBudgetPaise,
        start_date:         d.startDate ?? new Date().toISOString().split('T')[0],
        end_date:           d.endDate ?? null,
        flash_slot_date:    d.flashSlotDate ?? null,
        flash_slot_time:    d.flashSlotTime ?? null,
        flash_fee_paise:    d.flashFeePaise ?? null,
        review_status:      reviewStatus,
        status,
        auto_flags:         flags,
        auto_approved:      canAutoApprove,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('[create campaign]', insertErr)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    if (mfrData.whatsapp_phone) {
      const msg = canAutoApprove
        ? `🎉 Your campaign "${d.name}" for ${product.title} is now LIVE on BharatDeal!`
        : `⏱ Your campaign "${d.name}" for ${product.title} has been submitted. Our team will review it within 24 hours.`
      sendWhatsAppText(mfrData.whatsapp_phone, msg).catch(console.error)
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/manufacturer/ads/campaigns]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
