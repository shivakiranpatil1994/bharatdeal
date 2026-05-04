import { createSupabaseAdmin } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Users, ShoppingBag, Banknote,
  Megaphone, Target, Repeat, Globe, BarChart2, Zap, ArrowUpRight,
} from 'lucide-react'
import { InvestorCharts } from './InvestorCharts'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── helpers ─────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  if (b === 0) return 0
  return Math.round(((a - b) / b) * 100)
}

function fmt(n: number, decimals = 1) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(decimals)}Cr`
  if (n >= 100000)   return `₹${(n / 100000).toFixed(decimals)}L`
  if (n >= 1000)     return `₹${(n / 1000).toFixed(decimals)}K`
  return `₹${n}`
}

function num(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000)     return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

// ─── data fetchers ────────────────────────────────────────────────────────────

async function fetchAll() {
  const supabase = createSupabaseAdmin()
  const now      = new Date()

  const d30 = new Date(now.getTime() - 30 * 86400000).toISOString()
  const d60 = new Date(now.getTime() - 60 * 86400000).toISOString()
  const d7  = new Date(now.getTime() -  7 * 86400000).toISOString()
  const d14 = new Date(now.getTime() - 14 * 86400000).toISOString()
  const d90 = new Date(now.getTime() - 90 * 86400000).toISOString()
  const m1s = new Date(now.getFullYear(), now.getMonth(),     1).toISOString()
  const m0s = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const m0e = m1s

  const [
    // Users
    totalUsersR, newUsers30R, newUsers60R, newUsers7R, newUsers14R,
    repeatBuyersR, buyers3plusR,
    // Orders
    orders30R, orders60R, orders7R, orders14R,
    ordersThisMonthR, ordersLastMonthR,
    paidOrders30R,
    // RTO
    rto30R,
    // Ad ecosystem
    adWalletsR, adClicksR, adCampaignsR, adCampaignsActiveR,
    // Top ad spenders
    adSpendRawR,
    // Top campaigns
    topCampaignsR,
    // Daily series (90d for charts)
    dailySeriesR,
    // Geographic
    statesR, pincodesR,
    // Search
    trendingR,
    // Manufacturers
    mfrCountR, mfrActiveR,
    // Products
    productCountR,
  ] = await Promise.all([
    // ── Users ──
    supabase.from('buyers').select('id', { count: 'exact', head: true }),
    supabase.from('buyers').select('id', { count: 'exact', head: true }).gte('created_at', d30),
    supabase.from('buyers').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    supabase.from('buyers').select('id', { count: 'exact', head: true }).gte('created_at', d7),
    supabase.from('buyers').select('id', { count: 'exact', head: true }).gte('created_at', d14).lt('created_at', d7),

    // Repeat buyers (2+ orders)
    supabase.from('buyers').select('id', { count: 'exact', head: true }).gte('order_count', 2),
    // Loyal buyers (3+ orders)
    supabase.from('buyers').select('id', { count: 'exact', head: true }).gte('order_count', 3),

    // ── Orders ──
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', d30),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', d60).lt('created_at', d30),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', d7),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', d14).lt('created_at', d7),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', m1s),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', m0s).lt('created_at', m0e),

    // Paid orders for revenue
    supabase.from('orders').select('amount_paise').eq('payment_status', 'paid').gte('created_at', d30),

    // RTO
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'rto').gte('created_at', d30),

    // ── Ad ecosystem ──
    supabase.from('ad_wallets').select('balance_paise, manufacturer_id'),
    supabase.from('ad_clicks').select('cpc_charged_paise, manufacturer_id').eq('is_fraud', false).gte('created_at', d30),
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }),
    supabase.from('ad_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),

    // Top ad spenders — sum cpc_charged_paise per manufacturer last 30d
    supabase.from('ad_clicks')
      .select('manufacturer_id, cpc_charged_paise')
      .eq('is_fraud', false)
      .gte('created_at', d30),

    // Top campaigns by spend
    supabase.from('ad_campaigns')
      .select('id, name, ad_type, total_spent_paise, total_clicks, total_impressions, total_conversions, manufacturers(name, cluster)')
      .eq('review_status', 'approved')
      .order('total_spent_paise', { ascending: false })
      .limit(10),

    // ── Daily series 90d ──
    supabase.from('orders')
      .select('created_at, amount_paise, payment_status')
      .gte('created_at', d90)
      .order('created_at', { ascending: true }),

    // Geographic
    supabase.from('orders').select('buyer_state').eq('payment_status', 'paid').gte('created_at', d30),
    supabase.from('orders').select('buyer_pincode').eq('payment_status', 'paid').gte('created_at', d30),

    // Trending
    supabase.from('search_trends').select('term, count_this_week, count_last_week, growth_pct, zero_results').order('count_this_week', { ascending: false }).limit(10),

    // Manufacturers
    supabase.from('manufacturers').select('id', { count: 'exact', head: true }),
    supabase.from('manufacturers').select('id', { count: 'exact', head: true }).eq('active', true),

    // Products
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
  ])

  // ── Aggregate ────────────────────────────────────────────────────────────────

  const gmv30  = (paidOrders30R.data ?? []).reduce((s, o) => s + (o.amount_paise ?? 0), 0)
  const orders30  = orders30R.count  ?? 0
  const orders30p = orders60R.count  ?? 0  // prev period
  const orders7   = orders7R.count   ?? 0
  const orders7p  = orders14R.count  ?? 0
  const totalUsers     = totalUsersR.count  ?? 0
  const newUsers30     = newUsers30R.count  ?? 0
  const newUsers30p    = newUsers60R.count  ?? 0
  const newUsers7      = newUsers7R.count   ?? 0
  const newUsers7p     = newUsers14R.count  ?? 0
  const repeatBuyers   = repeatBuyersR.count ?? 0
  const buyers3plus    = buyers3plusR.count  ?? 0
  const aov30          = orders30 > 0 ? Math.round(gmv30 / orders30) : 0
  const rto30          = rto30R.count ?? 0
  const rtoRate        = orders30 > 0 ? ((rto30 / orders30) * 100).toFixed(1) : '0.0'
  const repeatRate     = totalUsers > 0 ? ((repeatBuyers / totalUsers) * 100).toFixed(1) : '0'
  const arrPaise       = gmv30 * 12   // annualised
  const platformTake   = Math.round(gmv30 * 0.05)  // 5% take rate estimate
  const arrTake        = platformTake * 12

  // Ad ecosystem
  const totalAdSpend30 = (adClicksR.data ?? []).reduce((s, c) => s + (c.cpc_charged_paise ?? 0), 0)
  const totalWalletFunds = (adWalletsR.data ?? []).reduce((s, w) => s + ((w as { balance_paise: number }).balance_paise ?? 0), 0)

  // Top ad spenders
  const spenderMap = new Map<string, number>()
  for (const c of adClicksR.data ?? []) {
    const k = c.manufacturer_id as string
    spenderMap.set(k, (spenderMap.get(k) ?? 0) + (c.cpc_charged_paise ?? 0))
  }

  // Get manufacturer names for spenders
  const topSpenderIds = Array.from(spenderMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  let spenderNames: Record<string, string> = {}
  if (topSpenderIds.length > 0) {
    const { data: mfrData } = await supabase
      .from('manufacturers')
      .select('id, name, cluster')
      .in('id', topSpenderIds)
    for (const m of mfrData ?? []) {
      spenderNames[m.id] = `${m.name} · ${m.cluster}`
    }
  }

  const topAdSpenders = Array.from(spenderMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, spendPaise]) => ({
      name: spenderNames[id] ?? id.slice(0, 8),
      spendPaise,
    }))

  // Top campaigns
  const topCampaigns = ((topCampaignsR.data ?? []) as unknown as {
    id: string; name: string; ad_type: string
    total_spent_paise: number; total_clicks: number
    total_impressions: number; total_conversions: number
    manufacturers: { name: string; cluster: string } | null
  }[]).map(c => ({
    id: c.id,
    name: c.name,
    adType: c.ad_type,
    spentPaise: c.total_spent_paise ?? 0,
    clicks: c.total_clicks ?? 0,
    impressions: c.total_impressions ?? 0,
    conversions: c.total_conversions ?? 0,
    ctr: c.total_impressions > 0 ? ((c.total_clicks / c.total_impressions) * 100).toFixed(1) : '0.0',
    convRate: c.total_clicks > 0 ? ((c.total_conversions / c.total_clicks) * 100).toFixed(1) : '0.0',
    mfrName: c.manufacturers?.name ?? '—',
    cluster: c.manufacturers?.cluster ?? '',
  }))

  // Daily series for chart
  const dayMap = new Map<string, { date: string; gmv: number; orders: number; newUsers: number }>()
  for (const o of dailySeriesR.data ?? []) {
    const day = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    const existing = dayMap.get(day)
    const rev = o.payment_status === 'paid' ? (o.amount_paise ?? 0) : 0
    if (existing) {
      existing.gmv += rev
      existing.orders += 1
    } else {
      dayMap.set(day, { date: day, gmv: rev, orders: 1, newUsers: 0 })
    }
  }
  const dailySeries = Array.from(dayMap.values())

  // Geographic
  const stateSet = new Set((statesR.data ?? []).map(o => o.buyer_state).filter(Boolean))
  const pincodeSet = new Set((pincodesR.data ?? []).map(o => o.buyer_pincode).filter(Boolean))

  // Monthly cohort (this month vs last)
  const ordersThisMonth = ordersThisMonthR.count ?? 0
  const ordersLastMonth = ordersLastMonthR.count ?? 0

  return {
    // Core KPIs
    totalUsers, newUsers30, newUsers30p, newUsers7, newUsers7p,
    repeatBuyers, buyers3plus, repeatRate,
    gmv30, orders30, orders30p, orders7, orders7p, aov30,
    rto30, rtoRate,
    arrPaise, platformTake, arrTake,
    ordersThisMonth, ordersLastMonth,
    // Ad
    totalAdSpend30, totalWalletFunds,
    adCampaignsTotal: adCampaignsR.count ?? 0,
    adCampaignsActive: adCampaignsActiveR.count ?? 0,
    topAdSpenders,
    topCampaigns,
    // Charts
    dailySeries,
    // Geo
    stateCount: stateSet.size,
    pincodeCount: pincodeSet.size,
    // Misc
    trendingSearches: trendingR.data ?? [],
    mfrTotal: mfrCountR.count ?? 0,
    mfrActive: mfrActiveR.count ?? 0,
    productCount: productCountR.count ?? 0,
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

function Delta({ pct: p }: { pct: number }) {
  if (p > 0) return (
    <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-semibold">
      <TrendingUp className="w-3 h-3" />+{p}%
    </span>
  )
  if (p < 0) return (
    <span className="flex items-center gap-0.5 text-red-400 text-xs font-semibold">
      <TrendingDown className="w-3 h-3" />{p}%
    </span>
  )
  return <span className="text-xs text-[var(--text-tertiary)]">—</span>
}

function KPI({
  label, value, sub, delta, icon: Icon, accent = false,
}: {
  label: string; value: string; sub?: string; delta?: number
  icon: React.ElementType; accent?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
      accent
        ? 'bg-[var(--brand-primary)]/8 border-[var(--brand-primary)]/25'
        : 'bg-[var(--bg-surface)] border-[var(--bg-border)]'
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        accent ? 'bg-[var(--brand-primary)]/15' : 'bg-[var(--bg-elevated)]'
      }`}>
        <Icon className={`w-4 h-4 ${accent ? 'text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold font-mono leading-none ${accent ? 'text-[var(--brand-primary)]' : 'text-[var(--text-primary)]'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
        {delta !== undefined && <Delta pct={delta} />}
      </div>
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-1 h-5 rounded-full bg-[var(--brand-primary)]" />
      <div>
        <h2 className="font-bold text-[var(--text-primary)]">{title}</h2>
        {sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InvestorPage() {
  const d = await fetchAll()

  const gmv30pApprox = d.orders30p > 0
    ? Math.round((d.gmv30 / Math.max(d.orders30, 1)) * d.orders30p)
    : 0

  return (
    <div className="p-6 space-y-8 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/25 uppercase tracking-widest">
              Investor View
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">BharatDeal — Growth Dashboard</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Live platform metrics · As of {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="text-xs px-3 py-2 rounded-lg border border-[var(--bg-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          ← Platform Analytics
        </Link>
      </div>

      {/* ── Executive summary strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl">
        {[
          { label: 'ARR (est.)',       value: fmt(d.arrPaise),      sub: '5% platform take', color: 'text-[var(--brand-primary)]' },
          { label: 'GMV (30d)',        value: fmt(d.gmv30),         sub: `${d.orders30} orders`, color: 'text-emerald-400' },
          { label: 'Total Users',      value: num(d.totalUsers),    sub: `+${d.newUsers30} this month`, color: 'text-blue-400' },
          { label: 'Platform Revenue', value: fmt(d.platformTake),  sub: '30-day est. revenue', color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="text-center py-2">
            <p className={`text-3xl font-black font-mono ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--text-primary)] font-semibold mt-1">{s.label}</p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── GMV + Orders chart ── */}
      <div>
        <SectionHeader title="Revenue & Growth Trajectory" sub="Last 90 days GMV and order volume" />
        <InvestorCharts dailySeries={d.dailySeries} topSpenders={d.topAdSpenders} />
      </div>

      {/* ── Growth KPIs ── */}
      <div>
        <SectionHeader title="Growth Metrics" sub="Week-over-week and month-over-month signals" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="New Users (30d)"  value={num(d.newUsers30)}    delta={pct(d.newUsers30, d.newUsers30p)}   icon={Users}       accent />
          <KPI label="New Users (7d)"   value={num(d.newUsers7)}     delta={pct(d.newUsers7, d.newUsers7p)}     icon={ArrowUpRight} />
          <KPI label="Orders (30d)"     value={num(d.orders30)}      delta={pct(d.orders30, d.orders30p)}       icon={ShoppingBag} accent />
          <KPI label="Orders (7d)"      value={num(d.orders7)}       delta={pct(d.orders7, d.orders7p)}         icon={ShoppingBag} />
          <KPI label="GMV (30d)"        value={fmt(d.gmv30)}         delta={pct(d.gmv30, gmv30pApprox)}         icon={Banknote}    accent />
          <KPI label="Avg Order Value"  value={formatINR(d.aov30)}   sub="per paid order"                       icon={BarChart2} />
          <KPI label="RTO Rate"         value={`${d.rtoRate}%`}      sub={`${d.rto30} returns`}                 icon={TrendingDown} />
          <KPI label="Platform Revenue" value={fmt(d.platformTake)}  sub="5% take-rate est."                    icon={Zap}         accent />
        </div>
      </div>

      {/* ── User quality ── */}
      <div>
        <SectionHeader title="User Quality & Retention" sub="Cohort depth and repeat purchase behaviour" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Total Registered" value={num(d.totalUsers)}    sub="all-time buyers"          icon={Users} />
          <KPI label="Repeat Buyers"    value={num(d.repeatBuyers)}  sub="2+ orders"                icon={Repeat} accent />
          <KPI label="Loyal Buyers"     value={num(d.buyers3plus)}   sub="3+ orders"                icon={Repeat} />
          <KPI label="Repeat Rate"      value={`${d.repeatRate}%`}   sub="of all users"             icon={Target}  accent />
          <KPI label="States Reached"   value={String(d.stateCount)} sub="delivery coverage"        icon={Globe} />
          <KPI label="Pincodes Served"  value={num(d.pincodeCount)}  sub="last 30 days"             icon={MapPin} />
          <KPI label="Active Sellers"   value={String(d.mfrActive)}  sub={`of ${d.mfrTotal} total`} icon={Users} />
          <KPI label="Live Products"    value={String(d.productCount)} sub="active SKUs"            icon={ShoppingBag} />
        </div>
      </div>

      {/* ── Ad ecosystem ── */}
      <div>
        <SectionHeader title="Advertising Ecosystem" sub="Self-serve ad platform performance — a recurring revenue layer" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KPI label="Ad Spend (30d)"       value={fmt(d.totalAdSpend30)}    sub="manufacturer spend"  icon={Megaphone} accent />
          <KPI label="Wallet Funds Loaded"  value={fmt(d.totalWalletFunds)}  sub="across all wallets"  icon={Banknote} />
          <KPI label="Active Campaigns"     value={String(d.adCampaignsActive)} sub={`of ${d.adCampaignsTotal} total`} icon={Target} accent />
          <KPI label="Ad Revenue (30d)"     value={fmt(Math.round(d.totalAdSpend30 * 0.15))} sub="15% platform cut" icon={Zap} />
        </div>

        {/* Top spenders + top campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top ad spenders */}
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--bg-border)] flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-[var(--brand-primary)]" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Top Ad Spenders</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Last 30 days · by CPC spend</p>
              </div>
            </div>
            {d.topAdSpenders.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--text-tertiary)]">No ad spend yet</div>
            ) : (
              <div className="divide-y divide-[var(--bg-border)]">
                {d.topAdSpenders.map((s, i) => {
                  const maxSpend = d.topAdSpenders[0]?.spendPaise ?? 1
                  const barW = Math.round((s.spendPaise / maxSpend) * 100)
                  return (
                    <div key={i} className="px-5 py-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] text-[10px] font-bold flex items-center justify-center">
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{s.name}</p>
                        </div>
                        <p className="font-mono text-sm text-[var(--brand-primary)] font-semibold">{formatINR(s.spendPaise)}</p>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-orange-400 rounded-full"
                          style={{ width: `${barW}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top campaigns */}
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--bg-border)] flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Top Sponsored Campaigns</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">All-time · by total spend</p>
              </div>
            </div>
            {d.topCampaigns.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--text-tertiary)]">No campaigns yet</div>
            ) : (
              <div className="divide-y divide-[var(--bg-border)]">
                {d.topCampaigns.slice(0, 5).map((c, i) => (
                  <div key={c.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.name}</p>
                          <p className="text-[11px] text-[var(--text-tertiary)]">{c.mfrName} · {c.cluster}</p>
                        </div>
                      </div>
                      <p className="font-mono text-sm text-purple-400 font-semibold flex-shrink-0">{formatINR(c.spentPaise)}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-[var(--text-tertiary)] ml-7">
                      <span>{c.impressions.toLocaleString('en-IN')} imp</span>
                      <span>{c.clicks.toLocaleString('en-IN')} clicks</span>
                      <span className="text-emerald-400">{c.ctr}% CTR</span>
                      <span>{c.conversions} conv · <span className="text-blue-400">{c.convRate}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Trending demand ── */}
      <div>
        <SectionHeader title="Demand Intelligence" sub="What buyers are searching — shows product-market fit" />
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  {['#', 'Search Term', 'This Week', 'Last Week', 'Growth', 'Gap?'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.trendingSearches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--text-tertiary)]">
                      No search data yet
                    </td>
                  </tr>
                ) : d.trendingSearches.map((s, i) => {
                  const g = s.growth_pct ?? 0
                  return (
                    <tr key={s.term} className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-tertiary)]">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{s.term}</td>
                      <td className="px-4 py-3 font-mono text-[var(--brand-primary)]">{(s.count_this_week ?? 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">{(s.count_last_week ?? 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        {g > 0
                          ? <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs"><TrendingUp className="w-3 h-3" />+{g.toFixed(0)}%</span>
                          : g < 0
                            ? <span className="flex items-center gap-1 text-red-400 text-xs"><TrendingDown className="w-3 h-3" />{g.toFixed(0)}%</span>
                            : <span className="text-[var(--text-tertiary)] text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {s.zero_results
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">No products</span>
                          : <span className="text-[10px] text-[var(--text-tertiary)]">Served</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Footer note ── */}
      <div className="text-center py-4 border-t border-[var(--bg-border)]">
        <p className="text-xs text-[var(--text-tertiary)]">
          BharatDeal · Live data from production database · All amounts in INR · ARR and revenue estimates based on current run-rate
        </p>
      </div>

    </div>
  )
}

// keep linter happy — used in KPI component
const MapPin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
