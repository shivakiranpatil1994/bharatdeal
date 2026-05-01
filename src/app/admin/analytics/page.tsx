import { createSupabaseAdmin } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { Search, MapPin, TrendingUp } from 'lucide-react'
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getAnalyticsData() {
  const supabase = createSupabaseAdmin()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  const [
    zeroResultsRes,
    topPincodesRes,
    paymentBreakdownRes,
    ordersLastThirtyRes,
  ] = await Promise.all([
    // Zero result searches (top 10)
    supabase
      .from('search_trends')
      .select('term, count_this_week, count_last_week, growth_pct, category')
      .eq('zero_results', true)
      .order('count_this_week', { ascending: false })
      .limit(10),

    // Top pincodes by order count
    supabase
      .from('orders')
      .select('buyer_pincode, buyer_city, buyer_state, amount_paise')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo),

    // Payment method breakdown
    supabase
      .from('orders')
      .select('payment_method')
      .gte('created_at', thirtyDaysAgo),

    // Orders by day last 30 days
    supabase
      .from('orders')
      .select('created_at, amount_paise')
      .eq('payment_status', 'paid')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true }),
  ])

  // Aggregate top pincodes
  const pincodeMap = new Map<
    string,
    { pincode: string; city: string; state: string; orders: number; revenue: number }
  >()
  for (const o of topPincodesRes.data ?? []) {
    const key = o.buyer_pincode
    const existing = pincodeMap.get(key)
    if (existing) {
      existing.orders += 1
      existing.revenue += o.amount_paise ?? 0
    } else {
      pincodeMap.set(key, {
        pincode: key,
        city: o.buyer_city ?? 'Unknown',
        state: o.buyer_state ?? 'Unknown',
        orders: 1,
        revenue: o.amount_paise ?? 0,
      })
    }
  }
  const topPincodes = Array.from(pincodeMap.values())
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10)

  // Aggregate payment methods
  const paymentMap = new Map<string, number>()
  for (const o of paymentBreakdownRes.data ?? []) {
    paymentMap.set(o.payment_method, (paymentMap.get(o.payment_method) ?? 0) + 1)
  }
  const paymentBreakdown = Array.from(paymentMap.entries()).map(([method, count]) => ({
    method: method.toUpperCase(),
    count,
  }))

  // Aggregate orders by day
  const dayMap = new Map<string, { date: string; orders: number; revenue: number }>()
  for (const o of ordersLastThirtyRes.data ?? []) {
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

  return {
    zeroResultSearches: zeroResultsRes.data ?? [],
    topPincodes,
    paymentBreakdown,
    ordersByDay,
  }
}

export default async function AdminAnalyticsPage() {
  const { zeroResultSearches, topPincodes, paymentBreakdown, ordersByDay } =
    await getAnalyticsData()

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Platform Analytics</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Last 30 days</p>
      </div>

      {/* Charts section (client component) */}
      <AdminAnalyticsCharts ordersByDay={ordersByDay} paymentBreakdown={paymentBreakdown} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zero result searches — manufacturer recruitment opportunities */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bg-border)]">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-[var(--text-primary)]">
                Top Zero-Result Searches
              </h2>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Buyers searching but finding nothing — recruit manufacturers for these categories
            </p>
          </div>
          {zeroResultSearches.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <TrendingUp className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No zero-result data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--bg-border)]">
              {zeroResultSearches.map((s, i) => (
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
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-sm text-amber-400">
                      {s.count_this_week.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">searches</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top pincodes by order volume */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bg-border)]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
              <h2 className="font-semibold text-[var(--text-primary)]">Top Pincodes</h2>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              By order volume in the last 30 days
            </p>
          </div>
          {topPincodes.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2">
              <MapPin className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No order data yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--bg-border)]">
              {topPincodes.map((p, i) => (
                <div key={p.pincode} className="px-5 py-3 flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-tertiary)] w-5 flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {p.pincode}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate">
                      {p.city}, {p.state}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-sm text-[var(--brand-primary)]">
                      {formatINR(p.revenue)}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">{p.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
