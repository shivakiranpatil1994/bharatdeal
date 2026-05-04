// src/lib/adHelpers.ts
// Shared utilities for the Ads system

import { createHash } from 'crypto'

export function formatINRFromPaise(paise: number): string {
  const rupees = paise / 100
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`
  if (Number.isInteger(rupees)) return `₹${rupees}`
  return `₹${rupees.toFixed(2)}`
}

export function formatROAS(roas: number): string {
  return `${roas.toFixed(1)}×`
}

export function formatCTR(ctr: number): string {
  return `${(ctr * 100).toFixed(2)}%`
}

export function roasColorClass(roas: number): string {
  if (roas >= 4) return 'text-emerald-500'
  if (roas >= 2) return 'text-amber-500'
  return 'text-red-500'
}

export function ctrColorClass(ctr: number): string {
  if (ctr >= 0.025) return 'text-emerald-500'
  if (ctr >= 0.010) return 'text-amber-500'
  return 'text-red-500'
}

export function hashIP(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  let sid = sessionStorage.getItem('bd_sid')
  if (!sid) {
    sid = crypto.randomUUID()
    sessionStorage.setItem('bd_sid', sid)
  }
  return sid
}

export const AD_TYPE_LABELS: Record<string, string> = {
  sponsored_search: 'Sponsored Search',
  product_card:     'Product Card',
  flash_deal:       'Flash Deal',
  banner:           'Homepage Banner',
  zero_result:      'Zero-Result Takeover',
}

export const AD_TYPE_COLORS: Record<string, string> = {
  sponsored_search: 'bg-purple-100 text-purple-800',
  product_card:     'bg-blue-100 text-blue-800',
  flash_deal:       'bg-orange-100 text-orange-800',
  banner:           'bg-teal-100 text-teal-800',
  zero_result:      'bg-green-100 text-green-800',
}

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  pending_review:   'Pending review',
  active:           'Active',
  paused:           'Paused',
  ended:            'Ended',
  budget_exhausted: 'Budget paused',
  rejected:         'Rejected',
}

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  pending_review:   'bg-amber-100 text-amber-800',
  active:           'bg-emerald-100 text-emerald-800',
  paused:           'bg-gray-100 text-gray-700',
  ended:            'bg-gray-100 text-gray-600',
  budget_exhausted: 'bg-orange-100 text-orange-800',
  rejected:         'bg-red-100 text-red-800',
}

export const REJECT_REASONS = [
  'Quality score too low',
  'Return rate too high',
  'Misleading keywords',
  'Competitor brand targeting',
  'Poor listing quality / bad photos',
  'Product not in stock',
  'Prohibited product category',
  'Price manipulation',
  'Duplicate campaign',
  'Other (add note below)',
]

export const BID_FLOORS: Record<string, number> = {
  sponsored_search: 200,
  product_card:     150,
  banner:           5000,
  flash_deal:       200000,
}

export const TOPUP_PRESETS = [
  { label: '+ ₹500',   paise: 50000  },
  { label: '+ ₹1,000', paise: 100000 },
  { label: '+ ₹2,000', paise: 200000 },
  { label: '+ ₹5,000', paise: 500000 },
]

export function estimateDaysRemaining(balancePaise: number, dailySpendPaise: number): string {
  if (dailySpendPaise <= 0) return '—'
  const days = balancePaise / dailySpendPaise
  if (days < 1)  return 'Less than 1 day'
  if (days < 2)  return '~1 day'
  return `~${Math.floor(days)} days`
}
