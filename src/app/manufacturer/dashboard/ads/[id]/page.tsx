'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pause, Play, TrendingUp } from 'lucide-react'
import {
  formatINRFromPaise, formatCTR, formatROAS,
  CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS,
  AD_TYPE_LABELS, REJECT_REASONS,
} from '@/lib/adHelpers'

interface Campaign {
  id: string; name: string; ad_type: string; status: string; review_status: string
  max_bid_paise: number; daily_budget_paise: number; total_budget_paise: number
  spent_today_paise: number; total_spent_paise: number; total_impressions: number
  total_clicks: number; total_conversions: number; total_revenue_paise: number
  quality_score: number; auto_flags: string[]; reject_reason: string | null
  review_note: string | null; keywords: string[]; categories: string[]
  start_date: string; end_date: string | null; created_at: string
  products: { id: string; title: string; images: string[]; price_paise: number } | null
}

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading]   = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetch('/api/manufacturer/ads/campaigns')
      .then(r => r.json())
      .then(d => {
        const found = (d.campaigns as Campaign[])?.find(c => c.id === params.id)
        setCampaign(found ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [params.id])

  async function toggleStatus() {
    if (!campaign) return
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    setUpdating(true)
    const res = await fetch(`/api/manufacturer/ads/campaigns/${campaign.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const data = await res.json()
      setCampaign(prev => prev ? { ...prev, ...data.campaign } : null)
    }
    setUpdating(false)
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-20">
        <p className="text-gray-500">Campaign not found.</p>
        <Link href="/manufacturer/dashboard/ads" className="text-[#E8450A] text-sm mt-2 inline-block">← Back to Ads</Link>
      </div>
    )
  }

  const roas = campaign.total_spent_paise > 0 ? campaign.total_revenue_paise / campaign.total_spent_paise : 0
  const ctr  = campaign.total_impressions > 0 ? campaign.total_clicks / campaign.total_impressions : 0
  const convRate = campaign.total_clicks > 0 ? campaign.total_conversions / campaign.total_clicks : 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/manufacturer/dashboard/ads" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_STATUS_COLORS[campaign.status] ?? 'bg-gray-100 text-gray-700'}`}>
                {CAMPAIGN_STATUS_LABELS[campaign.status]}
              </span>
              <span className="text-xs text-gray-400">{AD_TYPE_LABELS[campaign.ad_type]}</span>
            </div>
          </div>
        </div>

        {campaign.review_status === 'approved' && (
          <button
            onClick={toggleStatus}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              campaign.status === 'active'
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-[#E8450A] text-white hover:bg-orange-600'
            }`}
          >
            {campaign.status === 'active' ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
          </button>
        )}
      </div>

      {/* Review status notices */}
      {campaign.review_status === 'pending_review' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800">Under review</p>
          <p className="text-xs text-amber-600 mt-1">Our team will review your campaign within 24 hours. You'll receive a WhatsApp notification when approved.</p>
          {campaign.auto_flags.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-amber-700">Auto-detected flags:</p>
              <ul className="mt-1 space-y-0.5">
                {campaign.auto_flags.map((f, i) => <li key={i} className="text-xs text-amber-600">• {f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {campaign.review_status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-800">Campaign rejected</p>
          {campaign.reject_reason && <p className="text-xs text-red-600 mt-1">Reason: {campaign.reject_reason}</p>}
          {campaign.review_note  && <p className="text-xs text-red-600 mt-1">{campaign.review_note}</p>}
          <p className="text-xs text-red-500 mt-2">Please fix the issues and create a new campaign.</p>
        </div>
      )}

      {/* Performance metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Impressions', value: campaign.total_impressions.toLocaleString(), sub: null },
          { label: 'Clicks', value: campaign.total_clicks.toLocaleString(), sub: formatCTR(ctr) + ' CTR' },
          { label: 'Conversions', value: campaign.total_conversions.toLocaleString(), sub: (convRate * 100).toFixed(1) + '% conv rate' },
          { label: 'ROAS', value: roas > 0 ? `${roas.toFixed(1)}×` : '—', sub: formatINRFromPaise(campaign.total_revenue_paise) + ' revenue' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 font-mono">{card.value}</p>
            {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>

      {/* Budget & bid */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Budget & Bidding</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Max bid</p>
            <p className="font-mono font-semibold text-gray-900">{formatINRFromPaise(campaign.max_bid_paise)}/click</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Daily budget</p>
            <p className="font-mono font-semibold text-gray-900">{formatINRFromPaise(campaign.daily_budget_paise)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total budget</p>
            <p className="font-mono font-semibold text-gray-900">{formatINRFromPaise(campaign.total_budget_paise)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Spent today</p>
            <p className="font-mono font-semibold text-gray-900">{formatINRFromPaise(campaign.spent_today_paise)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total spent</p>
            <p className="font-mono font-semibold text-gray-900">{formatINRFromPaise(campaign.total_spent_paise)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Quality score</p>
            <p className={`font-mono font-semibold ${campaign.quality_score >= 0.7 ? 'text-emerald-600' : campaign.quality_score >= 0.4 ? 'text-amber-600' : 'text-red-500'}`}>
              {(campaign.quality_score * 10).toFixed(1)}/10
            </p>
          </div>
        </div>
      </div>

      {/* Targeting */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Targeting</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {campaign.keywords.length > 0
                ? campaign.keywords.map(k => <span key={k} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">{k}</span>)
                : <span className="text-xs text-gray-400">None set</span>
              }
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Categories</p>
            <div className="flex flex-wrap gap-2">
              {campaign.categories.length > 0
                ? campaign.categories.map(c => <span key={c} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">{c}</span>)
                : <span className="text-xs text-gray-400">None set</span>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Product */}
      {campaign.products && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Promoted Product</h2>
          <div className="flex items-center gap-3">
            {campaign.products.images?.[0] && (
              <img
                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_80,h_80,c_fill,f_auto/${campaign.products.images[0]}`}
                alt={campaign.products.title}
                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{campaign.products.title}</p>
              <p className="text-sm text-gray-500 font-mono">{formatINRFromPaise(campaign.products.price_paise)}</p>
              <Link href={`/products/${campaign.products.id}`} target="_blank" className="text-xs text-[#E8450A] hover:underline">
                View product →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
