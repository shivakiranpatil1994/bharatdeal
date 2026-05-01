import { createSupabaseAdmin } from '@/lib/supabase'
import { ShoppingBag, TrendingUp, AlertTriangle, Factory, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

async function getPlatformStats() {
  const supabase = createSupabaseAdmin()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [ordersRes, revenueRes, manufacturersRes, rtoRes] = await Promise.all([
    // Orders today
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),

    // Revenue today (paid orders only)
    supabase
      .from('orders')
      .select('amount_paise')
      .gte('created_at', todayStart.toISOString())
      .eq('payment_status', 'paid'),

    // Active manufacturers
    supabase
      .from('manufacturers')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),

    // RTO this month
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rto')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ])

  const ordersTotal = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())

  const revenueToday = (revenueRes.data ?? []).reduce((s, o) => s + (o.amount_paise ?? 0), 0)

  return {
    ordersToday: ordersRes.count ?? 0,
    revenueToday: revenueToday,
    activeManufacturers: manufacturersRes.count ?? 0,
    rtoThisMonth: rtoRes.count ?? 0,
    totalOrdersToday: ordersTotal.count ?? 0,
  }
}

async function getRecentOrders() {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, payment_method, payment_status, amount_paise,
      buyer_name, buyer_pincode, created_at,
      products ( title )
    `)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

async function getTopManufacturers() {
  const supabase = createSupabaseAdmin()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('orders')
    .select('manufacturer_id, amount_paise, manufacturers(name, cluster)')
    .gte('created_at', todayStart.toISOString())
    .eq('payment_status', 'paid')

  if (!data) return []

  const map = new Map<string, { name: string; cluster: string; revenue: number; orders: number }>()
  for (const o of data) {
    const mfr = o.manufacturers as { name: string; cluster: string } | null
    if (!o.manufacturer_id || !mfr) continue
    const existing = map.get(o.manufacturer_id)
    if (existing) {
      existing.revenue += o.amount_paise ?? 0
      existing.orders += 1
    } else {
      map.set(o.manufacturer_id, {
        name: mfr.name,
        cluster: mfr.cluster,
        revenue: o.amount_paise ?? 0,
        orders: 1,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  confirmed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  packed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rto: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

export default async function AdminOverviewPage() {
  const [stats, recentOrders, topMfrs] = await Promise.all([
    getPlatformStats(),
    getRecentOrders(),
    getTopManufacturers(),
  ])

  const rtoRate =
    stats.totalOrdersToday > 0
      ? ((stats.rtoThisMonth / Math.max(stats.totalOrdersToday, 1)) * 100).toFixed(1)
      : '0.0'

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Platform Overview</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="text-xs px-3 py-1.5 rounded-lg border border-[var(--bg-border)] text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:border-red-500/30 transition-colors duration-200"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Orders Today',
            value: stats.ordersToday.toLocaleString('en-IN'),
            icon: ShoppingBag,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'GMV Today',
            value: formatINR(stats.revenueToday),
            icon: TrendingUp,
            color: 'text-[var(--brand-accent)]',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'RTO This Month',
            value: `${stats.rtoThisMonth} (${rtoRate}%)`,
            icon: AlertTriangle,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
          },
          {
            label: 'Active Manufacturers',
            value: stats.activeManufacturers.toLocaleString(),
            icon: Factory,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4 flex flex-col gap-3"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-[var(--text-primary)]">{value}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bg-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Recent Orders</h2>
            <a
              href="/admin/orders"
              className="text-xs text-[var(--brand-primary)] hover:underline"
            >
              View all →
            </a>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <ShoppingBag className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--bg-border)]">
                    {['Order', 'Product', 'Amount', 'Method', 'Status', 'Time'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const product = order.products as { title: string } | null
                    return (
                      <tr
                        key={order.id}
                        className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                          {order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-primary)] max-w-[160px] truncate">
                          {product?.title ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--brand-primary)]">
                          {formatINR(order.amount_paise)}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)] uppercase text-xs">
                          {order.payment_method}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              STATUS_COLORS[order.status] ?? STATUS_COLORS.placed
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                          {new Date(order.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top manufacturers today */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--bg-border)] flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Top Sellers Today</h2>
            <RefreshCw className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
          </div>
          {topMfrs.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <Factory className="w-8 h-8 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-tertiary)]">No sales today yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--bg-border)]">
              {topMfrs.map((m, i) => (
                <div key={m.name} className="px-5 py-3 flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--text-tertiary)] w-4">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {m.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {m.cluster} · {m.orders} orders
                    </p>
                  </div>
                  <span className="font-mono text-sm text-[var(--brand-accent)] flex-shrink-0">
                    {formatINR(m.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
