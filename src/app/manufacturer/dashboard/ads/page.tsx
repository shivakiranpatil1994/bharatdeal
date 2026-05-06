'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, MousePointerClick, Wallet, Eye } from 'lucide-react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { useAdWalletBalance } from '@/hooks/useAdWalletBalance'
import { useRealtimeAdSpend } from '@/hooks/useRealtimeAdSpend'
import {
  formatINRFromPaise, formatCTR, formatROAS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  AD_TYPE_LABELS, AD_TYPE_COLORS,
} from '@/lib/adHelpers'

interface Campaign {
  id: string
  name: string
  ad_type: string
  status: string
  review_status: string
  max_bid_paise: number
  daily_budget_paise: number
  total_spent_paise: number
  total_impressions: number
  total_clicks: number
  total_conversions: number
  total_revenue_paise: number
  quality_score: number
  auto_flags: string[]
  created_at: string
  products: { id: string; title: string; images: string[]; price_paise: number } | null
}

export default function AdsPage() {
  const { manufacturer, loading: mfrLoading } = useManufacturerData()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading]     = useState(true)

  const { balancePaise } = useAdWalletBalance(manufacturer?.id ?? '')
  const { spendTodayPaise, clicksToday } = useRealtimeAdSpend(manufacturer?.id ?? '')

  useEffect(() => {
    if (!manufacturer) return
    fetch('/api/manufacturer/ads/campaigns')
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [manufacturer])

  if (mfrLoading || loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const totalImpressions = campaigns.reduce((s, c) => s + c.total_impressions, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.total_revenue_paise, 0)
  const totalSpend   = campaigns.reduce((s, c) => s + c.total_spent_paise, 0)
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Advertise</h1>
          <p className="text-sm text-gray-500 mt-0.5">Promote your products to reach more buyers</p>
        </div>
        <Link
          href="/manufacturer/dashboard/ads/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F15A2B] text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
          <p className="text-xl font-bold text-gray-900 font-mono">{formatINRFromPaise(balancePaise)}</p>
          <Link href="/manufacturer/dashboard/ads/wallet" className="text-xs text-[#F15A2B] mt-1 block">
            Add funds →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Spent Today</p>
          <p className="text-xl font-bold text-gray-900 font-mono">{formatINRFromPaise(spendTodayPaise)}</p>
          <p className="text-xs text-gray-500 mt-1">{clicksToday} clicks</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Active Campaigns</p>
          <p className="text-xl font-bold text-gray-900">{activeCampaigns}</p>
          <p className="text-xs text-gray-500 mt-1">{totalImpressions.toLocaleString()} total impressions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Overall ROAS</p>
          <p className={`text-xl font-bold font-mono ${roas >= 4 ? 'text-emerald-600' : roas >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
            {roas > 0 ? `${roas.toFixed(1)}×` : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{formatINRFromPaise(totalRevenue)} revenue</p>
        </div>
      </div>

      {/* Wallet low warning */}
      {balancePaise < 50000 && balancePaise > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Low wallet balance</p>
              <p className="text-xs text-amber-600">Only {formatINRFromPaise(balancePaise)} remaining. Top up to keep campaigns running.</p>
            </div>
          </div>
          <Link href="/manufacturer/dashboard/ads/wallet" className="text-xs font-semibold text-amber-800 underline">
            Top up
          </Link>
        </div>
      )}

      {balancePaise === 0 && campaigns.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold mb-1">Start advertising today</p>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Reach buyers actively searching for products like yours. Pay only when they click.
          </p>
          <Link href="/manufacturer/dashboard/ads/wallet" className="inline-block px-6 py-2.5 rounded-xl bg-[#F15A2B] text-white text-sm font-semibold hover:bg-orange-600 transition-colors">
            Add wallet balance
          </Link>
        </div>
      )}

      {/* Campaigns table */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">All Campaigns</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 text-left font-medium">Campaign</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Impressions</th>
                  <th className="px-4 py-3 text-right font-medium">Clicks</th>
                  <th className="px-4 py-3 text-right font-medium">Spent</th>
                  <th className="px-4 py-3 text-right font-medium">ROAS</th>
                  <th className="px-4 py-3 text-right font-medium">QS</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map(c => {
                  const roas = c.total_spent_paise > 0 ? c.total_revenue_paise / c.total_spent_paise : 0
                  const ctr  = c.total_impressions > 0 ? c.total_clicks / c.total_impressions : 0
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{c.name}</p>
                        <p className="text-xs text-gray-400 line-clamp-1">{c.products?.title ?? '—'}</p>
                        {c.auto_flags.length > 0 && (
                          <p className="text-[10px] text-amber-600 mt-0.5">{c.auto_flags.length} flag{c.auto_flags.length > 1 ? 's' : ''}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${AD_TYPE_COLORS[c.ad_type] ?? 'bg-gray-100 text-gray-700'}`}>
                          {AD_TYPE_LABELS[c.ad_type] ?? c.ad_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {CAMPAIGN_STATUS_LABELS[c.status] ?? c.status}
                        </span>
                        {c.review_status === 'pending_review' && (
                          <p className="text-[10px] text-amber-500 mt-0.5">Pending review</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">{c.total_impressions.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-gray-700">{c.total_clicks.toLocaleString()}</span>
                        <span className="block text-[10px] text-gray-400">{formatCTR(ctr)}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">{formatINRFromPaise(c.total_spent_paise)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono font-semibold ${roas >= 4 ? 'text-emerald-600' : roas >= 2 ? 'text-amber-600' : 'text-gray-400'}`}>
                          {roas > 0 ? `${roas.toFixed(1)}×` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-mono text-sm font-semibold ${c.quality_score >= 0.7 ? 'text-emerald-600' : c.quality_score >= 0.4 ? 'text-amber-600' : 'text-red-500'}`}>
                          {(c.quality_score * 10).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/manufacturer/dashboard/ads/${c.id}`} className="text-xs text-[#F15A2B] font-medium hover:underline">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
