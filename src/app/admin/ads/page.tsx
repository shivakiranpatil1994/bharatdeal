import { createSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { Megaphone, Clock, CheckCircle, XCircle, LayoutGrid, AlertTriangle } from 'lucide-react'
import { AD_TYPE_LABELS, AD_TYPE_COLORS, CAMPAIGN_STATUS_LABELS, CAMPAIGN_STATUS_COLORS, formatINRFromPaise } from '@/lib/adHelpers'

interface AdCampaign {
  id: string; name: string; ad_type: string; review_status: string; status: string
  max_bid_paise: number; daily_budget_paise: number; total_budget_paise: number
  quality_score: number; auto_flags: string[]; created_at: string
  products: { id: string; title: string; images: string[]; price_paise: number; category: string } | null
  manufacturers: { id: string; name: string; whatsapp_phone: string; cluster: string } | null
}

async function getCampaigns(filter: string): Promise<AdCampaign[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseAdmin() as any
  let query = supabase
    .from('ad_campaigns')
    .select(`
      id, name, ad_type, review_status, status,
      max_bid_paise, daily_budget_paise, total_budget_paise,
      quality_score, auto_flags, created_at,
      products ( id, title, images, price_paise, category ),
      manufacturers ( id, name, whatsapp_phone, cluster )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (filter === 'pending')  query = query.eq('review_status', 'pending_review')
  else if (filter === 'approved') query = query.eq('review_status', 'approved')
  else if (filter === 'rejected') query = query.eq('review_status', 'rejected')

  const { data } = await query
  return (data ?? []) as AdCampaign[]
}

async function getCounts() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseAdmin() as any
  const [pending, approved, rejected, total] = await Promise.all([
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('review_status', 'pending_review'),
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('review_status', 'approved'),
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('review_status', 'rejected'),
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }),
  ])
  return {
    pending:  pending.count  ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    total:    total.count    ?? 0,
  }
}

export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const filter = sp.filter ?? 'pending'
  const [campaigns, counts] = await Promise.all([getCampaigns(filter), getCounts()])

  const TABS = [
    { key: 'pending',  label: 'Pending',  icon: Clock,        count: counts.pending,  color: 'text-amber-400' },
    { key: 'approved', label: 'Approved', icon: CheckCircle,  count: counts.approved, color: 'text-emerald-400' },
    { key: 'rejected', label: 'Rejected', icon: XCircle,      count: counts.rejected, color: 'text-red-400' },
    { key: 'all',      label: 'All',      icon: LayoutGrid,   count: counts.total,    color: 'text-[var(--text-secondary)]' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Ad Review Queue</h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Review and approve manufacturer ad campaigns</p>
          </div>
        </div>
        {counts.pending > 0 && (
          <span className="px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/25 rounded-full text-sm font-semibold">
            {counts.pending} need review
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', value: counts.pending,  bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
          { label: 'Active',         value: counts.approved, bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'Rejected',       value: counts.rejected, bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
          { label: 'Total',          value: counts.total,    bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <p className={`text-2xl font-bold font-mono ${s.text}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-1 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = filter === tab.key
          return (
            <Link
              key={tab.key}
              href={`/admin/ads?filter=${tab.key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[11px] font-mono ${active ? 'text-white/70' : tab.color}`}>
                {tab.count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Campaign list */}
      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl">
          <Megaphone className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] font-medium">No campaigns</p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Nothing to show for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const manufacturer = c.manufacturers
            const product      = c.products
            const flags        = c.auto_flags ?? []
            const qs           = (c.quality_score * 10).toFixed(1)
            const qsColor      = c.quality_score >= 0.7 ? 'text-emerald-400' : c.quality_score >= 0.4 ? 'text-amber-400' : 'text-red-400'

            return (
              <div
                key={c.id}
                className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 hover:border-[var(--brand-primary)]/30 transition-all duration-150"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-2.5">

                    {/* Title row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[var(--text-primary)]">{c.name}</h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${AD_TYPE_COLORS[c.ad_type] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                        {AD_TYPE_LABELS[c.ad_type] ?? c.ad_type}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${CAMPAIGN_STATUS_COLORS[c.review_status] ?? 'bg-zinc-500/15 text-zinc-400'}`}>
                        {CAMPAIGN_STATUS_LABELS[c.review_status] ?? c.review_status}
                      </span>
                    </div>

                    {/* Manufacturer + product */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="text-[var(--text-secondary)]">
                        <span className="text-[var(--text-tertiary)]">Seller:</span>{' '}
                        <span className="font-medium">{manufacturer?.name ?? '—'}</span>
                        {manufacturer?.cluster && <span className="text-[var(--text-tertiary)]"> · {manufacturer.cluster}</span>}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        <span className="text-[var(--text-tertiary)]">Product:</span>{' '}
                        <span className="font-medium truncate max-w-[200px] inline-block align-bottom">{product?.title ?? '—'}</span>
                        {product?.category && <span className="text-[var(--text-tertiary)]"> · {product.category}</span>}
                      </span>
                    </div>

                    {/* Metrics */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--text-tertiary)]">
                      <span>
                        <span className="text-[var(--text-secondary)]">Bid</span>{' '}
                        <span className="font-mono text-[var(--brand-primary)]">{formatINRFromPaise(c.max_bid_paise)}/click</span>
                      </span>
                      <span>
                        <span className="text-[var(--text-secondary)]">Daily</span>{' '}
                        <span className="font-mono">{formatINRFromPaise(c.daily_budget_paise)}</span>
                      </span>
                      <span>
                        <span className="text-[var(--text-secondary)]">Total</span>{' '}
                        <span className="font-mono">{formatINRFromPaise(c.total_budget_paise)}</span>
                      </span>
                      <span>
                        <span className="text-[var(--text-secondary)]">Quality</span>{' '}
                        <span className={`font-mono font-semibold ${qsColor}`}>{qs}/10</span>
                      </span>
                      <span className="text-[var(--text-tertiary)]">
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Flags */}
                    {flags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        {flags.map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <Link
                    href={`/admin/ads/${c.id}`}
                    className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-lg shadow-[var(--brand-primary)]/20"
                  >
                    {c.review_status === 'pending_review' ? 'Review' : 'View'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
