import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyShiprocketWebhook } from '@/lib/security'
import { sendShipmentUpdate } from '@/lib/interakt'

export const runtime = 'nodejs'

// Maps Shiprocket status strings to our internal OrderStatus
function mapStatus(srStatus: string): string | null {
  const s = srStatus.toLowerCase()
  if (s.includes('picked') || s.includes('packed')) return 'packed'
  if (s.includes('in transit') || s.includes('shipped') || s.includes('out for delivery'))
    return 'shipped'
  if (s.includes('delivered')) return 'delivered'
  if (s.includes('rto') || s.includes('return')) return 'rto'
  if (s.includes('cancelled')) return 'cancelled'
  return null
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const token = req.headers.get('x-shiprocket-token') ?? ''

  if (!verifyShiprocketWebhook(rawBody, token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  let payload: {
    awb?: string
    current_status?: string
    shipment_track_activities?: Array<{ date: string; activity: string; location: string }>
    etd?: string
    tracking_url?: string
    courier_name?: string
    order_id?: string
  }

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { awb, current_status, tracking_url, courier_name } = payload

  if (!awb || !current_status) {
    return NextResponse.json({ received: true })
  }

  const supabase = createSupabaseAdmin()

  // Find order by AWB or Shiprocket order ID
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, buyer_phone, buyer_name, shiprocket_awb, shiprocket_order_id')
    .or(`shiprocket_awb.eq.${awb},shiprocket_order_id.eq.${payload.order_id ?? ''}`)
    .single()

  if (error || !order) {
    // AWB might not be set yet — store it by shiprocket_order_id
    console.error('Order not found for AWB:', awb)
    return NextResponse.json({ received: true })
  }

  const newStatus = mapStatus(current_status)
  const baseUpdate = {
    shiprocket_awb: awb,
    tracking_url: tracking_url ?? null,
    courier_name: courier_name ?? null,
    updated_at: new Date().toISOString(),
  }

  if (newStatus && newStatus !== order.status) {
    // RTO: the on_order_rto trigger in 005_functions.sql handles buyer.rto_count automatically
    if (newStatus === 'delivered') {
      await supabase
        .from('orders')
        .update({ ...baseUpdate, status: newStatus, delivered_at: new Date().toISOString() })
        .eq('id', order.id)
    } else {
      await supabase
        .from('orders')
        .update({ ...baseUpdate, status: newStatus })
        .eq('id', order.id)
    }
  } else {
    await supabase.from('orders').update(baseUpdate).eq('id', order.id)
  }

  await supabase.from('order_events').insert({
    order_id: order.id,
    event_type: 'shipment_update',
    description: current_status,
    metadata: { awb, courier: courier_name, tracking_url },
  })

  // WhatsApp update for significant status changes
  if (newStatus && ['shipped', 'delivered', 'rto'].includes(newStatus)) {
    sendShipmentUpdate(
      order.buyer_phone,
      order.buyer_name ?? 'Customer',
      order.id.slice(0, 8).toUpperCase(),
      current_status,
      tracking_url ?? `https://bharatdeal.in/orders/${order.id}`
    ).catch((err) => console.error('WhatsApp shipment update failed:', err))
  }

  return NextResponse.json({ received: true })
}
