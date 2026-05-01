import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { createRazorpayOrder } from '@/lib/razorpay'
import { getRTOScore } from '@/lib/gokwik'
import { sanitize, validateAmount } from '@/lib/security'
import { CreateOrderSchema } from '@/types/index'

const COD_DEPOSIT_PAISE = 4900 // ₹49

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const parsed = CreateOrderSchema.safeParse(JSON.parse(rawBody))

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const {
      productId, buyerPhone, buyerName, buyerPincode,
      buyerAddress, quantity, size, color, paymentMethod,
    } = parsed.data

    const supabase = createSupabaseAdmin()

    // Fetch product + validate it's still active and in stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, manufacturer_id, price_paise, mrp_paise, stock, title, active')
      .eq('id', productId)
      .eq('active', true)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Not enough stock' }, { status: 409 })
    }

    const amountPaise = product.price_paise * quantity

    // Validate amount is within sane bounds (₹1 – ₹50,000)
    if (!validateAmount(amountPaise, 100, 5_000_000)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // GoKwik RTO scoring for COD orders
    let rtoScore = 0
    let codDepositRequired = false

    if (paymentMethod === 'cod') {
      const rto = await getRTOScore({
        phone: buyerPhone,
        pincode: buyerPincode,
        orderAmountPaise: amountPaise,
        paymentMethod,
      })
      rtoScore = rto.score
      codDepositRequired = rto.requiresDeposit
    }

    // Create order record in Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: productId,
        manufacturer_id: product.manufacturer_id,
        buyer_phone: buyerPhone,
        buyer_name: sanitize(buyerName),
        buyer_pincode: buyerPincode,
        buyer_address: sanitize(buyerAddress),
        quantity,
        size: size ?? null,
        color: color ?? null,
        amount_paise: amountPaise,
        mrp_paise: product.mrp_paise ?? null,
        payment_method: paymentMethod,
        payment_status: 'pending',
        rto_risk_score: rtoScore,
        cod_deposit_amount: codDepositRequired ? COD_DEPOSIT_PAISE : 0,
        status: 'placed',
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Decrement stock
    await supabase
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', productId)

    // Log order event
    await supabase.from('order_events').insert({
      order_id: order.id,
      event_type: 'order_placed',
      description: `Order placed via ${paymentMethod}`,
      metadata: { rto_score: rtoScore, cod_deposit_required: codDepositRequired },
    })

    // For UPI/card: create Razorpay order for full amount
    // For COD with deposit: create Razorpay order for ₹49
    // For COD without deposit: no Razorpay needed
    const needsRazorpay = paymentMethod !== 'cod' || codDepositRequired
    const razorpayAmount = paymentMethod === 'cod' ? COD_DEPOSIT_PAISE : amountPaise

    if (needsRazorpay) {
      const rzpOrder = await createRazorpayOrder({
        amountPaise: razorpayAmount,
        receipt: order.id,
        notes: {
          order_id: order.id,
          product_title: sanitize(product.title),
          buyer_phone: buyerPhone,
          is_cod_deposit: String(paymentMethod === 'cod'),
        },
      })

      // Persist the Razorpay order ID
      await supabase
        .from('orders')
        .update({ razorpay_order_id: rzpOrder.id })
        .eq('id', order.id)

      return NextResponse.json({
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        razorpayAmount,
        isCodDeposit: paymentMethod === 'cod',
        codDepositRequired,
      })
    }

    // Pure COD, no deposit needed → order is confirmed
    await supabase
      .from('orders')
      .update({ payment_status: 'pending', status: 'confirmed' })
      .eq('id', order.id)

    await supabase.from('order_events').insert({
      order_id: order.id,
      event_type: 'order_confirmed',
      description: 'COD order confirmed without deposit',
    })

    return NextResponse.json({ orderId: order.id, codDepositRequired: false })
  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
