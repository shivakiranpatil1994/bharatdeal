import { createSupabaseAdmin } from '@/lib/supabase'
import { ShoppingBag, TrendingUp, AlertTriangle, Factory, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

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
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),

    supabase
      .from('orders')
      .select('amount_paise')
      .gte('created_at', todayStart.toISOString())
      .eq('payment_status', 'paid'),

    supabase
      .from('manufacturers')
      .select('id', { count: 'exact', head: true })
      .eq('active', true),

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

const STATUS_STYLE: Record<string, { dot: string; text: string }> = {
  placed:    { dot: 'bg-blue-400',    text: 'text-blue-300' },
  confirmed: { dot: 'bg-amber-400',   text: 'text-amber-300' },
  packed:    { dot: 'bg-purple-400',  text: 'text-purple-300' },
  shipped:   { dot: 'bg-cyan-400',    text: 'text-cyan-300' },
  delivered: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  rto:       { dot: 'bg-red-400',     text: 'text-red-300' },
  cancelled: { dot: 'bg-zinc-400',    text: 'text-zinc-400' },
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

  const kpis = [
    {
      label: 'Orders Today',
      value: stats.ordersToday.toLocaleString('en-IN'),
      icon: ShoppingBag,
      accent: false,
    },
    {
      label: 'GMV Today',
      value: formatINR(stats.revenueToday),
      icon: TrendingUp,
      accent: true, // the single hero card
    },
    {
      label: 'RTO This Month',
      value: `${stats.rtoThisMonth}`,
      sub: `${rtoRate}% of today's orders`,
      icon: AlertTriangle,
      accent: false,
    },
    {
      label: 'Active Manufacturers',
      value: stats.activeManufacturers.toLocaleString(),
      icon: Factory,
      accent: false,
    },
  ]

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
            Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span className="text-xs font-medium text-emerald-300">Live</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl p-5 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-0.5"
            style={accent
              ? { background: 'linear-gradient(135deg, #E8450A 0%, #c43a08 100%)', boxShadow: '0 8px 24px rgba(232,69,10,0.25)' }
              : { background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }
            }
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium" style={{ color: accent ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)' }}>
                {label}
              </p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: accent ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)' }}>
                <Icon className="w-4 h-4" style={{ color: accent ? '#ffffff' : 'rgba(255,255,255,0.6)' }} />
              </div>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
                {value}
              </p>
              {sub && (
                <p className="text-[11px] mt-1" style={{ color: accent ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)' }}>
                  {sub}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="font-semibold text-white text-sm" style={{ letterSpacing: '-0.01em' }}>Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-white"
              style={{ color: '#E8450A' }}
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <ShoppingBag className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.25)' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Order', 'Product', 'Amount', 'Method', 'Status', 'Time'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-widest"
                        style={{ color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const product = order.products as { title: string } | null
                    const st = STATUS_STYLE[order.status] ?? STATUS_STYLE.placed
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-white/[0.03]"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 text-white max-w-[160px] truncate font-medium">
                          {product?.title ?? '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-semibold" style={{ color: '#E8450A' }}>
                          {formatINR(order.amount_paise)}
                        </td>
                        <td className="px-5 py-3.5 uppercase text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {order.payment_method}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${st.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
        <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="font-semibold text-white text-sm" style={{ letterSpacing: '-0.01em' }}>Top Sellers Today</h2>
          </div>
          {topMfrs.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3 flex-1 justify-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <Factory className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.25)' }} />
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No sales today yet</p>
            </div>
          ) : (
            <div>
              {topMfrs.map((m, i) => (
                <div key={m.name} className="px-5 py-3.5 flex items-center gap-3 transition-colors hover:bg-white/[0.03]" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0"
                    style={i === 0
                      ? { background: 'rgba(232,69,10,0.15)', color: '#E8450A' }
                      : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }
                    }
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.name}</p>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {m.cluster} · {m.orders} orders
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-emerald-400 flex-shrink-0">
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
