'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, PauseCircle } from 'lucide-react'
import { AD_TYPE_LABELS, formatINRFromPaise, REJECT_REASONS } from '@/lib/adHelpers'

interface Campaign {
  id: string; name: string; ad_type: string; review_status: string; status: string
  max_bid_paise: number; daily_budget_paise: number; total_budget_paise: number
  quality_score: number; auto_flags: string[]; keywords: string[]; categories: string[]
  start_date: string; end_date: string | null; auto_approved: boolean; created_at: string
  products: { id: string; title: string; images: string[]; price_paise: number; category: string } | null
  manufacturers: { id: string; name: string; cluster: string; whatsapp_phone: string } | null
}

export default function AdminAdReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading]   = useState(true)
  const [action, setAction]     = useState<'approved' | 'rejected' | 'needs_changes' | 'suspended' | null>(null)
  const [reason, setReason]     = useState('')
  const [note, setNote]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(false)

  useEffect(() => {
    // Fetch via public Supabase (RLS allows admin to read via service role cookie)
    // For simplicity, use the API route to avoid re-implementing server client in client component
    fetch(`/api/admin/ads/${params.id}/data`)
      .then(r => r.json())
      .then(d => { setCampaign(d.campaign ?? null); setLoading(false) })
      .catch(() => {
        // Fallback: try via supabase browser (admin token handled server-side)
        import('@/lib/supabase').then(({ createSupabaseBrowser }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sb = createSupabaseBrowser() as any
          sb.from('ad_campaigns')
            .select('*, products ( id, title, images, price_paise, category ), manufacturers ( id, name, cluster, whatsapp_phone )')
            .eq('id', params.id)
            .single()
            .then(({ data }: { data: Campaign | null }) => { setCampaign(data); setLoading(false) })
        })
      })
  }, [params.id])

  async function submitReview() {
    if (!action) return
    setSubmitting(true)
    const res = await fetch(`/api/admin/ads/${params.id}/review`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, reason: reason || undefined, note: note || undefined }),
    })
    if (res.ok) {
      setDone(true)
      setTimeout(() => router.push('/admin/ads'), 1500)
    } else {
      alert('Failed to submit review')
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="p-6 max-w-3xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-[var(--bg-elevated)] rounded w-48" />
      <div className="h-64 bg-[var(--bg-elevated)] rounded-xl" />
    </div>
  )

  if (!campaign) return (
    <div className="p-6 max-w-3xl mx-auto text-center py-20 text-[var(--text-tertiary)]">
      <p>Campaign not found.</p>
      <Link href="/admin/ads" className="text-[var(--brand-primary)] text-sm mt-2 inline-block">← Back to Ad Review</Link>
    </div>
  )

  if (done) return (
    <div className="p-6 max-w-3xl mx-auto text-center py-20">
      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
      <p className="text-[var(--text-primary)] font-semibold">Review submitted. Redirecting…</p>
    </div>
  )

  const flags = campaign.auto_flags ?? []
  const mfr   = campaign.manufacturers
  const prod  = campaign.products

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/ads" className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
          <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Review Campaign</h1>
          <p className="text-sm text-[var(--text-secondary)]">{campaign.name}</p>
        </div>
      </div>

      {/* Campaign details */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Manufacturer</p>
            <p className="text-[var(--text-primary)] font-medium">{mfr?.name ?? '—'}</p>
            <p className="text-[var(--text-secondary)] text-xs">{mfr?.cluster}</p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Ad type</p>
            <p className="text-[var(--text-primary)] font-medium">{AD_TYPE_LABELS[campaign.ad_type]}</p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Product</p>
            <p className="text-[var(--text-primary)] font-medium">{prod?.title ?? '—'}</p>
            <p className="text-[var(--text-secondary)] text-xs">{prod?.category} · {formatINRFromPaise(prod?.price_paise ?? 0)}</p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Quality score</p>
            <p className={`font-mono font-semibold text-lg ${campaign.quality_score >= 0.7 ? 'text-emerald-400' : campaign.quality_score >= 0.4 ? 'text-amber-400' : 'text-red-400'}`}>
              {(campaign.quality_score * 10).toFixed(1)}/10
            </p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Bid</p>
            <p className="text-[var(--text-primary)] font-mono">{formatINRFromPaise(campaign.max_bid_paise)}/click</p>
          </div>
          <div>
            <p className="text-[var(--text-tertiary)] text-xs">Budget</p>
            <p className="text-[var(--text-primary)] font-mono">{formatINRFromPaise(campaign.daily_budget_paise)}/day · {formatINRFromPaise(campaign.total_budget_paise)} total</p>
          </div>
        </div>

        {campaign.keywords?.length > 0 && (
          <div>
            <p className="text-[var(--text-tertiary)] text-xs mb-1.5">Keywords</p>
            <div className="flex flex-wrap gap-2">
              {campaign.keywords.map(k => <span key={k} className="text-xs px-2 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] rounded">{k}</span>)}
            </div>
          </div>
        )}

        {flags.length > 0 && (
          <div>
            <p className="text-amber-400 text-xs font-semibold mb-1.5">⚠ Auto-detected flags</p>
            <div className="space-y-1">
              {flags.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 border border-amber-500/20 rounded px-3 py-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review actions */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Your decision</h2>

        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'approved',      label: 'Approve',       Icon: CheckCircle,   color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
            { key: 'rejected',      label: 'Reject',        Icon: XCircle,       color: 'border-red-500 bg-red-500/10 text-red-400' },
            { key: 'needs_changes', label: 'Needs Changes', Icon: AlertTriangle, color: 'border-amber-500 bg-amber-500/10 text-amber-400' },
            { key: 'suspended',     label: 'Suspend',       Icon: PauseCircle,   color: 'border-gray-500 bg-gray-500/10 text-gray-400' },
          ] as const).map(({ key, label, Icon, color }) => (
            <button
              key={key}
              onClick={() => setAction(key)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                action === key ? color : 'border-[var(--bg-border)] text-[var(--text-secondary)] hover:border-[var(--bg-elevated)]'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {(action === 'rejected' || action === 'needs_changes') && (
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Reason</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
            >
              <option value="">Select a reason…</option>
              {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1.5">
            Note to manufacturer {action === 'approved' ? '(optional)' : ''}
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder={action === 'approved' ? 'Any note…' : 'Explain what needs to be fixed…'}
            className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] resize-none"
          />
        </div>

        <button
          onClick={submitReview}
          disabled={!action || submitting || ((action === 'rejected' || action === 'needs_changes') && !reason)}
          className="w-full py-3 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </div>
  )
}
