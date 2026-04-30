'use client'
import { createSupabaseBrowser } from './supabase'
import type { Database, Json } from '@/types/database'

type EventName =
  | 'page_view' | 'product_viewed' | 'search_performed'
  | 'add_to_cart' | 'checkout_started' | 'checkout_abandoned'
  | 'order_placed' | 'payment_method_chosen' | 'cod_deposit_shown'
  | 'flash_deal_viewed' | 'spin_wheel_spun' | 'group_buy_shared'
  | 'referral_sent' | 'daily_checkin' | 'return_requested'

export function track(
  event: EventName,
  properties: Json = {},
  context: { pincode?: string; productId?: string; manufacturerId?: string } = {}
) {
  // Fire-and-forget — never await this, never block UI
  const supabase = createSupabaseBrowser()
  const sessionId = getSessionId()
  const device = getDevice()
  const pincode = context.pincode || getPincodeFromStorage()

  const payload: Database['public']['Tables']['events']['Insert'] = {
    event_name: event,
    session_id: sessionId,
    buyer_phone: getBuyerPhone(),
    product_id: context.productId || null,
    manufacturer_id: context.manufacturerId || null,
    pincode: pincode || null,
    device_type: device,
    properties,
  }
  supabase.from('events').insert(payload).then()

  if (typeof window !== 'undefined' && (window as Window & { posthog?: { capture: (e: string, p: Json) => void } }).posthog) {
    (window as Window & { posthog?: { capture: (e: string, p: Json) => void } }).posthog?.capture(event, { pincode, ...(properties as Record<string, Json>) })
  }
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem('bd_sid')
  if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('bd_sid', sid) }
  return sid
}

function getDevice(): string {
  if (typeof window === 'undefined') return 'ssr'
  return /Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

function getPincodeFromStorage(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('bd_pincode')
}

function getBuyerPhone(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('bd_phone')
}
