import { createSupabaseAdmin } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Search,
  MapPin,
  Package,
  ShoppingCart,
  RotateCcw,
  Eye,
  Minus,
  type LucideIcon,
} from 'lucide-react'
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManufacturerLeaderboardRow {
  manufacturerId: string
  name: string
  cluster: string
  category: string
  orders30d: number
  revenue30d: number
  revenue7d: number
  growthPct: number
}

interface TopProductRow {
  productId: string
  title: string
  category: string
  orders: number
  revenue: number
  avgPricePaise: number
}

interface PincodeRow {
  pincode: string
  city: string
  state: string
  orders: number
  revenue: number
  rtoCount: number
}

interface CategoryRow {
  category: string
  revenue: number
  orders: number
  returns: number
}

interface TrendingSearch {
  term: string
  count_this_week: number
  count_last_week: number
  growth_pct: number
  category: string | null
  zero_results: boolean
}

interface ReturnReasonRow {
  reason: string
  count: number
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getAnalyticsData() {
  const supabase = createSupabaseAdmin()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    ordersLast30Res,
    ordersLast7Res,
    rtoThisMonthRes,
    totalOrdersMonthRes,
    conversionEventsRes,
    pageViewsRes,
    activeProductsRes,
    manufacturerCountRes,
    ordersWithMfrRes,
    orders7dWithMfrRes,
    ordersWithProductsRes,
    pincodeOrdersRes,
    returnsRes,
    trendingSearchesRes,
    zeroResultsRes,
    ordersByDayRes,
    paymentBreakdownRes,
  ] = await Promise.all([
    // 1a. All paid orders last 30d (for GMV, avg order value)
    supabase
      .from('orders')
      .select('amount_paise')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo),

    // 1b. Paid orders last 7d (week-over-week)
    supabase
      .from('orders')
      .select('amount_paise')
      .eq('payment_status', 'paid')
      .gte('created_at', sevenDaysAgo),

    // 1c. RTO count this month
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rto')
      .gte('created_at', monthStart),

    // 1d. Total orders this month
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', monthStart),

    // 1e. Conversion events last 30d
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'order_placed')
      .gte('created_at', thirtyDaysAgo),

    // 1f. Page views last 30d
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('event_name', 'page_view')
      .gte('created_at', thirtyDaysAgo),

    // Active products count
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),

    // Active manufacturers count
    supabase
      .from('manufacturers')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),

    // 2. Orders with manufacturer info — last 30d (for leaderboard)
    supabase
      .from('orders')
      .select('manufacturer_id, amount_paise, manufacturers(name, cluster, category)')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo),

    // 2b. Orders last 7d with manufacturer (for 7d revenue leaderboard)
    supabase
      .from('orders')
      .select('manufacturer_id, amount_paise')
      .eq('payment_status', 'paid')
      .gte('created_at', sevenDaysAgo),

    // 3. Orders with products — last 30d (for top products + category breakdown)
    supabase
      .from('orders')
      .select('product_id, amount_paise, products(title, category)')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo),

    // 4. Pincode demand last 30d
    supabase
      .from('orders')
      .select('buyer_pincode, buyer_city, buyer_state, amount_paise, status')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo),

    // 7. Returns last 30d
    supabase
      .from('returns')
      .select('reason')
      .gte('created_at', thirtyDaysAgo),

    // 6a. Trending searches (non-zero, ordered by growth)
    supabase
      .from('search_trends')
      .select('term, count_this_week, count_last_week, growth_pct, category, zero_results')
      .eq('zero_results', false)
      .order('growth_pct', { ascending: false })
      .limit(15),

    // 6b. Zero-result searches
    supabase
      .from('search_trends')
      .select('term, count_this_week, count_last_week, growth_pct, category, zero_results')
      .eq('zero_results', true)
      .order('count_this_week', { ascending: false })
      .limit(10),

    // 8. Orders by day
    supabase
      .from('orders')
      .select('created_at, amount_paise')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true }),

    // 9. Payment method breakdown
    supabase
      .from('orders')
      .select('payment_method')
      .gte('created_at', thirtyDaysAgo),
  ])

  // ── 1. Platform KPIs ──────────────────────────────────────────────────────
  const paid30 = ordersLast30Res.data ?? []
  const paid7 = ordersLast7Res.data ?? []
  const gmv30d = paid30.reduce((s, o) => s + (o.amount_paise ?? 0), 0)
  const orders30d = paid30.length
  const orders7d = paid7.length
  const avgOrderValue = orders30d > 0 ? gmv30d / orders30d : 0
  const rtoCount = rtoThisMonthRes.count ?? 0
  const totalOrdersMonth = totalOrdersMonthRes.count ?? 0
  const rtoRate = totalOrdersMonth > 0 ? (rtoCount / totalOrdersMonth) * 100 : 0
  const conversionEvents = conversionEventsRes.count ?? 0
  const pageViews = pageViewsRes.count ?? 0
  const conversionRate = pageViews > 0 ? (conversionEvents / pageViews) * 100 : 0
  const activeProducts = activeProductsRes.count ?? 0
  const totalManufacturers = manufacturerCountRes.count ?? 0

  // ── 2. Manufacturer leaderboard ───────────────────────────────────────────
  type MfrOrderRow = {
    manufacturer_id: string
    amount_paise: number
    manufacturers: { name: string; cluster: string; category: string } | null
  }

  const mfrMap = new Map<
    string,
    { name: string; cluster: string; category: string; orders: number; revenue: number }
  >()

  for (const o of (ordersWithMfrRes.data ?? []) as MfrOrderRow[]) {
    if (!o.manufacturer_id || !o.manufacturers) continue
    const existing = mfrMap.get(o.manufacturer_id)
    if (existing) {
      existing.orders += 1
      existing.revenue += o.amount_paise ?? 0
    } else {
      mfrMap.set(o.manufacturer_id, {
        name: o.manufacturers.name,
        cluster: o.manufacturers.cluster,
        category: o.manufacturers.category,
        orders: 1,
        revenue: o.amount_paise ?? 0,
      })
    }
  }

  const mfr7dMap = new Map<string, number>()
  for (const o of (orders7dWithMfrRes.data ?? []) as { manufacturer_id: string; amount_paise: number }[]) {
    if (!o.manufacturer_id) continue
    mfr7dMap.set(o.manufacturer_id, (mfr7dMap.get(o.manufacturer_id) ?? 0) + (o.amount_paise ?? 0))
  }

  const manufacturerLeaderboard: ManufacturerLeaderboardRow[] = Array.from(mfrMap.entries())
    .map(([id, v]) => {
      const rev7d = mfr7dMap.get(id) ?? 0
      const expected7d = v.revenue / 4 // expected weekly based on 30d avg
      const growthPct = expected7d > 0 ? ((rev7d / expected7d) - 1) * 100 : 0
      return {
        manufacturerId: id,
        name: v.name,
        cluster: v.cluster,
        category: v.category,
        orders30d: v.orders,
        revenue30d: v.revenue,
        revenue7d: rev7d,
        growthPct,
      }
    })
    .sort((a, b) => b.revenue30d - a.revenue30d)
    .slice(0, 10)

  // ── 3. Top products ───────────────────────────────────────────────────────
  type ProductOrderRow = {
    product_id: string
    amount_paise: number
    products: { title: string; category: string } | null
  }

  const productMap = new Map<
    string,
    { title: string; category: string; orders: number; revenue: number }
  >()

  for (const o of (ordersWithProductsRes.data ?? []) as ProductOrderRow[]) {
    if (!o.product_id || !o.products) continue
    const existing = productMap.get(o.product_id)
    if (existing) {
      existing.orders += 1
      existing.revenue += o.amount_paise ?? 0
    } else {
      productMap.set(o.product_id, {
        title: o.products.title,
        category: o.products.category,
        orders: 1,
        revenue: o.amount_paise ?? 0,
      })
    }
  }

  const topProducts: TopProductRow[] = Array.from(productMap.entries())
    .map(([id, v]) => ({
      productId: id,
      title: v.title,
      category: v.category,
      orders: v.orders,
      revenue: v.revenue,
      avgPricePaise: v.orders > 0 ? Math.round(v.revenue / v.orders) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // ── 4. Pincode demand ─────────────────────────────────────────────────────
  const pincodeMap = new Map<
    string,
    { city: string; state: string; orders: number; revenue: number; rtoCount: number }
  >()

  for (const o of pincodeOrdersRes.data ?? []) {
    const key = o.buyer_pincode
    if (!key) continue
    const existing = pincodeMap.get(key)
    if (existing) {
      existing.orders += 1
      existing.revenue += o.amount_paise ?? 0
      if (o.status === 'rto') existing.rtoCount += 1
    } else {
      pincodeMap.set(key, {
        city: o.buyer_city ?? 'Unknown',
        state: o.buyer_state ?? 'Unknown',
        orders: 1,
        revenue: o.amount_paise ?? 0,
        rtoCount: o.status === 'rto' ? 1 : 0,
      })
    }
  }

  const topPincodes: PincodeRow[] = Array.from(pincodeMap.entries())
    .map(([pincode, v]) => ({ pincode, ...v }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 15)

  // ── 5. Category performance ────────────────────────────────────────────────
  const categoryMap = new Map<string, { revenue: number; orders: number }>()
  for (const o of (ordersWithProductsRes.data ?? []) as ProductOrderRow[]) {
    if (!o.products?.category) continue
    const cat = o.products.category
    const existing = categoryMap.get(cat)
    if (existing) {
      existing.orders += 1
      existing.revenue += o.amount_paise ?? 0
    } else {
      categoryMap.set(cat, { orders: 1, revenue: o.amount_paise ?? 0 })
    }
  }

  const categoryBreakdown: CategoryRow[] = Array.from(categoryMap.entries())
    .map(([category, v]) => ({ category, revenue: v.revenue, orders: v.orders, returns: 0 }))
    .sort((a, b) => b.revenue - a.revenue)

  // ── 7. Return analysis ────────────────────────────────────────────────────
  const returnReasonMap = new Map<string, number>()
  for (const r of returnsRes.data ?? []) {
    returnReasonMap.set(r.reason, (returnReasonMap.get(r.reason) ?? 0) + 1)
  }
  const totalReturns = Array.from(returnReasonMap.values()).reduce((s, n) => s + n, 0)
  const returnAnalysis: ReturnReasonRow[] = Array.from(returnReasonMap.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)

  // ── 8. Orders by day ──────────────────────────────────────────────────────
  const dayMap = new Map<string, { date: string; orders: number; revenue: number }>()
  for (const o of ordersByDayRes.data ?? []) {
    const day = new Date(o.created_at).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
    const existing = dayMap.get(day)
    if (existing) {
      existing.orders += 1
      existing.revenue += o.amount_paise ?? 0
    } else {
      dayMap.set(day, { date: day, orders: 1, revenue: o.amount_paise ?? 0 })
    }
  }
  const ordersByDay = Array.from(dayMap.values())

  // ── 9. Payment breakdown ──────────────────────────────────────────────────
  const paymentMap = new Map<string, number>()
  for (const o of paymentBreakdownRes.data ?? []) {
    paymentMap.set(o.payment_method, (paymentMap.get(o.payment_method) ?? 0) + 1)
  }
  const paymentBreakdown = Array.from(paymentMap.entries()).map(([method, count]) => ({
    method: method.toUpperCase(),
    count,
  }))

  // ── 6. Trending searches ──────────────────────────────────────────────────
  const trendingSearches: TrendingSearch[] = (trendingSearchesRes.data ?? []) as TrendingSearch[]
  const zeroResultSearches: TrendingSearch[] = (zeroResultsRes.data ?? []) as TrendingSearch[]

  return {
    // KPIs
    gmv30d,
    orders30d,
    orders7d,
    avgOrderValue,
    rtoRate,
    rtoCount,
    conversionRate,
    conversionEvents,
    pageViews,
    activeProducts,
    totalManufacturers,
    // Tables
    manufacturerLeaderboard,
    topProducts,
    topPincodes,
    categoryBreakdown,
    returnAnalysis,
    totalReturns,
    // Search
    trendingSearches,
    zeroResultSearches,
    // Charts
    ordersByDay,
    paymentBreakdown,
  }
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: LucideIcon
  accent?: 'orange' | 'emerald' | 'amber' | 'red' | 'blue'
}) {
  const iconColor: Record<string, string> = {
    orange: 'text-[var(--brand-primary)]',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
  }
  const bgColor: Record<string, string> = {
    orange: 'bg-orange-500/10',
    emerald: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
    red: 'bg-red-500/10',
    blue: 'bg-blue-500/10',
  }
  const col = accent ?? 'orange'
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${bgColor[col]} flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor[col]}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">{label}</p>
        <p className="font-mono text-xl font-bold text-[var(--text-primary)] mt-0.5">{value}</p>
        {sub && <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Growth Badge ──────────────────────────────────────────────────────────────

function GrowthBadge({ pct }: { pct: number }) {
  if (Math.abs(pct) < 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
        <Minus className="w-3 h-3" />0%
      </span>
    )
  }
  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <TrendingUp className="w-3 h-3" />+{pct.toFixed(0)}%
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/20">
      <TrendingDown className="w-3 h-3" />{pct.toFixed(0)}%
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData()

  const now = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
  const dateRange = `${thirtyDaysAgo.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const maxPincodeOrders = data.topPincodes[0]?.orders ?? 1

  return (
    <div className="p-6 flex flex-col gap-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-[Syne,sans-serif]">
            Platform Intelligence
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{dateRange}</p>
        </div>
        <span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-surface)] border border-[var(--bg-border)] px-3 py-1.5 rounded-lg">
          Refreshed live
        </span>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="GMV (30d)"
          value={formatINR(data.gmv30d)}
          sub={`${data.orders30d.toLocaleString('en-IN')} paid orders`}
          icon={ShoppingCart}
          accent="orange"
        />
        <StatCard
          label="Orders (30d)"
          value={data.orders30d.toLocaleString('en-IN')}
          sub={`${data.orders7d.toLocaleString('en-IN')} in last 7d`}
          icon={Package}
          accent="blue"
        />
        <StatCard
          label="Avg Order Value"
          value={formatINR(data.avgOrderValue)}
          sub="paid orders"
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          label="RTO Rate (month)"
          value={`${data.rtoRate.toFixed(1)}%`}
          sub={`${data.rtoCount} RTOs of ${Math.round(data.rtoCount / (data.rtoRate / 100 || 1))} orders`}
          icon={RotateCcw}
          accent="red"
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversion Rate"
          value={`${data.conversionRate.toFixed(2)}%`}
          sub={`${data.conversionEvents.toLocaleString('en-IN')} order events`}
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          label="Page Views (30d)"
          value={data.pageViews.toLocaleString('en-IN')}
          sub="unique page_view events"
          icon={Eye}
          accent="blue"
        />
        <StatCard
          label="Active Products"
          value={data.activeProducts.toLocaleString('en-IN')}
          sub="live on storefront"
          icon={Package}
          accent="amber"
        />
        <StatCard
          label="Manufacturers"
          value={data.totalManufacturers.toLocaleString('en-IN')}
          sub="active on platform"
          icon={ShoppingCart}
          accent="orange"
        />
      </div>

      {/* Charts (client component) */}
      <AdminAnalyticsCharts
        ordersByDay={data.ordersByDay}
        paymentBreakdown={data.paymentBreakdown}
        categoryBreakdown={data.categoryBreakdown}
        trendingSearches={data.trendingSearches}
      />

      {/* Manufacturer Leaderboard + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manufacturer leaderboard */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bg-border)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Manufacturer Leaderboard</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Top 10 by GMV — last 30 days</p>
          </div>
          {data.manufacturerLeaderboard.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <ShoppingCart className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No manufacturer data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--bg-border)]">
              {data.manufacturerLeaderboard.map((m, i) => (
                <div key={m.manufacturerId} className="px-5 py-3 flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-tertiary)] w-5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {m.cluster} · {m.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="font-mono text-sm text-[var(--brand-primary)]">
                      {formatINR(m.revenue30d)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {m.orders30d} orders
                      </span>
                      <GrowthBadge pct={m.growthPct} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bg-border)]">
            <h2 className="font-semibold text-[var(--text-primary)]">Top Products by Revenue</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Last 30 days</p>
          </div>
          {data.topProducts.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <Package className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No product data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--bg-border)]">
              {data.topProducts.map((p, i) => (
                <div key={p.productId} className="px-5 py-3 flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-tertiary)] w-5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {p.title}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">{p.category}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-sm text-[var(--brand-primary)]">
                      {formatINR(p.revenue)}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {p.orders} orders · avg {formatINR(p.avgPricePaise)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Pincodes + Return Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pincodes */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bg-border)]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Top Pincodes</h2>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">By order volume — last 30 days</p>
          </div>
          {data.topPincodes.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No pincode data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--bg-border)]">
              {data.topPincodes.map((p) => (
                <div key={p.pincode} className="px-5 py-3">
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-sm text-[var(--text-primary)]">
                        {p.pincode}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)] ml-2">
                        {p.city}, {p.state}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <span className="font-mono text-sm text-[var(--brand-primary)]">
                        {formatINR(p.revenue)}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {p.orders} orders
                      </span>
                      {p.rtoCount > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                          {p.rtoCount} RTO
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Volume bar */}
                  <div className="h-1 bg-[var(--bg-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--brand-primary)] rounded-full transition-all duration-500"
                      style={{ width: `${(p.orders / maxPincodeOrders) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Return Analysis + Zero Result Searches */}
        <div className="flex flex-col gap-6">
          {/* Return Analysis */}
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--bg-border)]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold text-[var(--text-primary)]">Return Reasons</h2>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {data.totalReturns} total returns — last 30 days
              </p>
            </div>
            {data.returnAnalysis.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <RotateCcw className="w-8 h-8 text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-tertiary)]">No returns yet</p>
              </div>
            ) : (
              <div className="px-5 py-4 flex flex-col gap-3">
                {data.returnAnalysis.map((r) => {
                  const pct = data.totalReturns > 0 ? (r.count / data.totalReturns) * 100 : 0
                  return (
                    <div key={r.reason}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] capitalize">
                          {r.reason.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono text-[var(--text-primary)]">
                          {r.count} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-border)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Zero-result searches */}
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--bg-border)]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <h2 className="font-semibold text-[var(--text-primary)]">
                  Zero-Result Searches
                </h2>
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Unmet demand — recruit manufacturers for these
              </p>
            </div>
            {data.zeroResultSearches.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <Search className="w-8 h-8 text-[var(--text-tertiary)]" />
                <p className="text-sm text-[var(--text-tertiary)]">No zero-result searches yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--bg-border)]">
                {data.zeroResultSearches.map((s, i) => (
                  <div key={s.term} className="px-5 py-3 flex items-center gap-3">
                    <span className="font-mono text-xs text-[var(--text-tertiary)] w-5 flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {s.term}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {s.category ?? 'Uncategorized'}
                      </p>
                    </div>
                    <p className="font-mono text-sm text-amber-400 flex-shrink-0">
                      {s.count_this_week.toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trending Searches full-width table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--bg-border)]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="font-semibold text-[var(--text-primary)]">Trending Searches</h2>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Top growing search terms this week
          </p>
        </div>
        {data.trendingSearches.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-tertiary)]">No search trend data yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide w-8">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    Term
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    This Week
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    Last Week
                  </th>
                  <th className="text-right px-5 py-2.5 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                    Growth
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--bg-border)]">
                {data.trendingSearches.map((s, i) => (
                  <tr
                    key={s.term}
                    className="hover:bg-[var(--bg-elevated)] transition-colors duration-150"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-[var(--text-tertiary)]">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--text-primary)]">{s.term}</span>
                      {s.zero_results && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          0 results
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)]">
                      {s.category ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-primary)]">
                      {s.count_this_week.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--text-tertiary)]">
                      {s.count_last_week.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <GrowthBadge pct={s.growth_pct} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
