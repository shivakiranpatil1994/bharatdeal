import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyRazorpayWebhook } from '@/lib/security'
import { createShiprocketOrder } from '@/lib/shiprocket'
import { sendOrderConfirmation, sendNewOrderToManufacturer } from '@/lib/interakt'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  if (!verifyRazorpayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: {
    event: string
    payload: {
      payment?: {
        entity: {
          id: string
          order_id: string
          amount: number
          status: string
        }
      }
    }
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle payment captured events
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const payment = event.payload.payment?.entity
  if (!payment) {
    return NextResponse.json({ received: true })
  }

  const supabase = createSupabaseAdmin()

  // Look up the order by Razorpay order ID
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select(`
      id, payment_status, payment_method, status,
      buyer_phone, buyer_name, buyer_address, buyer_pincode,
      buyer_city, buyer_state,
      amount_paise, quantity, cod_deposit_amount,
      products ( id, title, price_paise ),
      manufacturers ( id, name, whatsapp_phone )
    `)
    .eq('razorpay_order_id', payment.order_id)
    .single()

  if (fetchError || !order) {
    console.error('Order not found for razorpay order:', payment.order_id)
    return NextResponse.json({ received: true })
  }

  // Idempotency — skip if already processed
  if (order.payment_status === 'paid' && order.status !== 'placed') {
    return NextResponse.json({ received: true })
  }

  // Mark payment as paid
  await supabase
    .from('orders')
    .update({
      razorpay_payment_id: payment.id,
      payment_status: 'paid',
      cod_deposit_paid: order.payment_method === 'cod',
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id)

  await supabase.from('order_events').insert({
    order_id: order.id,
    event_type: 'payment_confirmed',
    description: `Payment captured via Razorpay webhook (${payment.id})`,
    metadata: { razorpay_payment_id: payment.id, amount: payment.amount },
  })

  const product = order.products as { id: string; title: string; price_paise: number } | null
  const manufacturer = order.manufacturers as {
    id: string
    name: string
    whatsapp_phone: string
  } | null

  // Create Shiprocket shipment (only for fully paid orders, not COD deposits)
  const isCodDeposit =
    order.payment_method === 'cod' && (order.cod_deposit_amount ?? 0) > 0 &&
    payment.amount === order.cod_deposit_amount

  if (!isCodDeposit && product) {
    try {
      const shiprocketData = await createShiprocketOrder({
        order_id: order.id,
        order_date: new Date().toISOString().split('T')[0],
        pickup_location: 'Primary', // configured in Shiprocket dashboard
        billing_customer_name: order.buyer_name ?? 'Customer',
        billing_address: order.buyer_address,
        billing_city: order.buyer_city ?? '',
        billing_pincode: order.buyer_pincode,
        billing_state: order.buyer_state ?? '',
        billing_country: 'India',
        billing_phone: order.buyer_phone,
        order_items: [
          {
            name: product.title,
            sku: product.id.slice(0, 8),
            units: order.quantity,
            selling_price: product.price_paise / 100,
          },
        ],
        payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
        sub_total: order.amount_paise / 100,
        length: 25,
        breadth: 20,
        height: 5,
        weight: 0.5,
      })

      if (shiprocketData.shipment_id) {
        await supabase
          .from('orders')
          .update({
            shiprocket_order_id: String(shiprocketData.order_id),
            status: 'packed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)

        await supabase.from('order_events').insert({
          order_id: order.id,
          event_type: 'shipment_created',
          description: 'Shipment created in Shiprocket',
          metadata: { shiprocket_order_id: shiprocketData.order_id },
        })
      }
    } catch (err) {
      // Log but don't fail — retry manually if needed
      console.error('Shiprocket order creation failed:', err)
      await supabase.from('order_events').insert({
        order_id: order.id,
        event_type: 'shipment_error',
        description: 'Shiprocket order creation failed — manual action needed',
        metadata: { error: String(err) },
      })
    }
  }

  // WhatsApp notifications (fire-and-forget — never block webhook response)
  if (product) {
    const amountINR = `₹${(order.amount_paise / 100).toLocaleString('en-IN')}`

    sendOrderConfirmation(
      order.buyer_phone,
      order.buyer_name ?? 'Customer',
      order.id.slice(0, 8).toUpperCase(),
      product.title,
      amountINR
    ).catch((err) => console.error('WhatsApp buyer notification failed:', err))

    if (manufacturer) {
      sendNewOrderToManufacturer(
        manufacturer.whatsapp_phone,
        manufacturer.name,
        order.id.slice(0, 8).toUpperCase(),
        product.title,
        String(order.quantity),
        order.buyer_city ?? order.buyer_pincode
      ).catch((err) => console.error('WhatsApp manufacturer notification failed:', err))
    }
  }

  return NextResponse.json({ received: true })
}
