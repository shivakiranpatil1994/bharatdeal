import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyRazorpayPayment } from '@/lib/security'
import { VerifyPaymentSchema } from '@/types/index'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const parsed = VerifyPaymentSchema.safeParse(JSON.parse(rawBody))

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = parsed.data

    // Verify Razorpay signature: HMAC-SHA256(razorpayOrderId|razorpayPaymentId, KEY_SECRET)
    const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 401 })
    }

    const supabase = createSupabaseAdmin()

    // Fetch the order to ensure it exists and belongs to this razorpay order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, payment_method, payment_status, cod_deposit_amount, status')
      .eq('id', orderId)
      .eq('razorpay_order_id', razorpayOrderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status === 'paid') {
      // Already processed (idempotent)
      return NextResponse.json({ success: true, orderId })
    }

    const isCodDeposit = order.payment_method === 'cod' && (order.cod_deposit_amount ?? 0) > 0

    // Update order: mark paid, store payment ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        razorpay_payment_id: razorpayPaymentId,
        payment_status: 'paid',
        cod_deposit_paid: isCodDeposit ? true : undefined,
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Log payment event
    await supabase.from('order_events').insert({
      order_id: orderId,
      event_type: isCodDeposit ? 'cod_deposit_paid' : 'payment_confirmed',
      description: isCodDeposit
        ? `COD deposit paid via Razorpay (${razorpayPaymentId})`
        : `Payment confirmed via Razorpay (${razorpayPaymentId})`,
      metadata: {
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId,
      },
    })

    return NextResponse.json({ success: true, orderId })
  } catch (err) {
    console.error('Payment verify error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
