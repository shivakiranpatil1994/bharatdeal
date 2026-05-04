import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Razorpay from 'razorpay'
import { createSupabaseServer } from '@/lib/supabase'

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const TopupSchema = z.object({
  amountPaise: z.number().int().min(20000).max(5_000_000),
})

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = TopupSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const { amountPaise } = body.data

  const order = await razorpay.orders.create({
    amount:   amountPaise,
    currency: 'INR',
    receipt:  `adwallet_${user.id}_${Date.now()}`,
    notes:    { manufacturer_id: user.id, type: 'ad_wallet_topup' } as Record<string, string>,
  })

  return NextResponse.json({
    razorpayOrderId: order.id,
    amount:          amountPaise,
    key:             process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  })
}
