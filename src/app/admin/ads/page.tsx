import { createSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { AD_TYPE_LABELS, AD_TYPE_COLORS, formatINRFromPaise } from '@/lib/adHelpers'

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

  if (filter === 'pending') query = query.eq('review_status', 'pending_review')
  else if (filter === 'approved') query = query.eq('review_status', 'approved')
  else if (filter === 'rejected') query = query.eq('review_status', 'rejected')

  const { data } = await query
  return (data ?? []) as AdCampaign[]
}

export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const filter = sp.filter ?? 'pending'
  const campaigns = await getCampaigns(filter)
  const pendingCount = filter === 'pending' ? campaigns.length : 0

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Ad Review Queue</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Review and approve manufacturer ad campaigns</p>
        </div>
        {filter === 'pending' && pendingCount > 0 && (
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-sm font-semibold">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-1 w-fit">
        {[
          { key: 'pending',  label: 'Pending Review' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
          { key: 'all',      label: 'All' },
        ].map(tab => (
          <Link
            key={tab.key}
            href={`/admin/ads?filter=${tab.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-[var(--brand-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-tertiary)]">
          <p className="text-lg">No campaigns</p>
          <p className="text-sm mt-1">Nothing to review right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const manufacturer = c.manufacturers
            const product      = c.products
            const flags        = c.auto_flags ?? []

            return (
              <div key={c.id} className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 hover:border-[var(--bg-border)]/80 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{c.name}</h3>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${AD_TYPE_COLORS[c.ad_type] ?? 'bg-gray-100 text-gray-700'}`}>
                        {AD_TYPE_LABELS[c.ad_type] ?? c.ad_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                      <span>{manufacturer?.name ?? '—'} · {manufacturer?.cluster ?? '—'}</span>
                      <span>{product?.title ?? '—'} · {product?.category ?? '—'}</span>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--text-tertiary)]">
                      <span>Bid: {formatINRFromPaise(c.max_bid_paise)}/click</span>
                      <span>Daily: {formatINRFromPaise(c.daily_budget_paise)}</span>
                      <span>Total: {formatINRFromPaise(c.total_budget_paise)}</span>
                      <span>QS: {(c.quality_score * 10).toFixed(1)}/10</span>
                      <span className="text-gray-500">{new Date(c.created_at).toLocaleDateString('en-IN')}</span>
                    </div>

                    {flags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {flags.map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/admin/ads/${c.id}`}
                    className="flex-shrink-0 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                  >
                    Review
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
