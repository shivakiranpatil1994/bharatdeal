import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { z } from 'zod'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase'

const VerifySchema = z.object({
  razorpayOrderId:   z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  amountPaise:       z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const admin    = createSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = VerifySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amountPaise } = body.data

  const expected = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expected !== razorpaySignature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 401 })
  }

  const { error } = await admin.rpc('credit_ad_wallet', {
    p_manufacturer_id:     user.id,
    p_amount_paise:        amountPaise,
    p_razorpay_payment_id: razorpayPaymentId,
    p_razorpay_order_id:   razorpayOrderId,
  })

  if (error) {
    console.error('[wallet verify]', error)
    return NextResponse.json({ error: 'Failed to credit wallet' }, { status: 500 })
  }

  const { data: wallet } = await supabase
    .from('ad_wallets')
    .select('balance_paise')
    .eq('manufacturer_id', user.id)
    .single()

  // Re-activate campaigns that were budget-exhausted
  await admin
    .from('ad_campaigns')
    .update({ status: 'active' })
    .eq('manufacturer_id', user.id)
    .eq('status', 'budget_exhausted')
    .eq('review_status', 'approved')

  return NextResponse.json({
    success:         true,
    newBalancePaise: (wallet as { balance_paise: number } | null)?.balance_paise ?? 0,
  })
}
