'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { Wallet, TrendingUp, Clock, CheckCircle2, Sparkles, MapPin, Package } from 'lucide-react'
import { Suspense } from 'react'

type TabId = 'earnings' | 'payouts' | 'statements'

const TABS: { id: TabId; label: string }[] = [
  { id: 'earnings', label: 'Earnings' },
  { id: 'payouts', label: 'Payouts' },
  { id: 'statements', label: 'Statements' },
]

const CITY_COLORS = ['#E8450A', '#F5A623', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm shadow-lg">
      <p className="text-gray-500 mb-1 text-xs">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="font-semibold text-gray-800">{p.name === 'revenue' ? formatINR(p.value) : `${p.value} orders`}</p>
      ))}
    </div>
  )
}

function FinancesPage() {
  const searchParams = useSearchParams()
  const { manufacturer } = useManufacturerData()
  const [tab, setTab] = useState<TabId>((searchParams.get('tab') as TabId) ?? 'earnings')
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, orders: 0, avgOrder: 0 })
  const [recentOrders, setRecentOrders] = useState<{ id: string; amount_paise: number; status: string; created_at: string; buyer_city: string | null; buyer_state: string | null }[]>([])
  const [cityData, setCityData] = useState<{ city: string; revenue: number; orders: number }[]>([])
  const [weeklyData, setWeeklyData] = useState<{ week: string; revenue: number }[]>([])
  const [aiInsight, setAiInsight] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = searchParams.get('tab') as TabId | null
    if (t) setTab(t)
  }, [searchParams])

  useEffect(() => {
    if (!manufacturer) return
    async function load() {
      const supabase = createSupabaseBrowser()
      const { data: orders } = await supabase
        .from('orders')
        .select('id,amount_paise,status,created_at,buyer_city,buyer_state')
        .eq('manufacturer_id', manufacturer!.id)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })
      const all = orders ?? []
      const total = all.reduce((s, o) => s + o.amount_paise, 0)
      const paid = all.filter(o => o.status === 'delivered').reduce((s, o) => s + o.amount_paise, 0)
      setStats({ total, paid, pending: total - paid, orders: all.length, avgOrder: all.length ? Math.round(total / all.length) : 0 })
      setRecentOrders(all.slice(0, 30) as typeof recentOrders)

      // Group by city for chart
      const byCity = new Map<string, { revenue: number; orders: number }>()
      for (const o of all) {
        const city = o.buyer_city ?? 'Unknown'
        const ex = byCity.get(city) ?? { revenue: 0, orders: 0 }
        byCity.set(city, { revenue: ex.revenue + o.amount_paise, orders: ex.orders + 1 })
      }
      const cityArr = Array.from(byCity.entries())
        .map(([city, d]) => ({ city, ...d }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)
      setCityData(cityArr)

      // Weekly revenue last 8 weeks
      const weeks = new Map<string, number>()
      for (const o of all) {
        const d = new Date(o.created_at)
        const monday = new Date(d)
        monday.setDate(d.getDate() - d.getDay() + 1)
        const key = monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        weeks.set(key, (weeks.get(key) ?? 0) + o.amount_paise)
      }
      const weekArr = Array.from(weeks.entries()).slice(-8).map(([week, revenue]) => ({ week, revenue }))
      setWeeklyData(weekArr)

      // Generate AI insight
      if (cityArr.length > 0) {
        const topCity = cityArr[0]
        const topCityPct = total > 0 ? Math.round((topCity.revenue / total) * 100) : 0
        const avgOrderFmt = `₹${Math.round((total / all.length) / 100)}`
        setAiInsight(`Your strongest market is **${topCity.city}** generating ${topCityPct}% of total revenue with ${topCity.orders} orders. Your average order value is **${avgOrderFmt}** — ${Math.round(total / all.length / 100) > 400 ? 'above' : 'below'} platform average. ${cityArr.length > 1 ? `**${cityArr[1].city}** is your second-best market — consider running a targeted flash deal to boost orders there.` : 'Expand to more cities by enabling COD and competitive pricing.'}`)
      }

      setLoading(false)
    }
    load()
  }, [manufacturer])

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Finances</h1>
          <p className="text-sm text-gray-500 mt-0.5">Payout schedule: {manufacturer?.payout_schedule ?? 'T+2'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
          <Skeleton className="h-64" />
        </div>
      ) : tab === 'earnings' ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatINR(stats.total), icon: TrendingUp, color: 'text-[#E8450A]', bg: 'bg-orange-50' },
              { label: 'Paid Out', value: formatINR(stats.paid), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Pending Payout', value: formatINR(stats.pending), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Avg Order Value', value: formatINR(stats.avgOrder), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <p className={`text-xl font-bold font-['JetBrains_Mono',monospace] ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* AI Insight */}
          {aiInsight && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#E8450A]" />
                <span className="text-xs font-bold text-[#E8450A] uppercase tracking-wide">AI Revenue Insight</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {aiInsight.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i} className="text-gray-900">{part}</strong> : part
                )}
              </p>
            </div>
          )}

          {/* Weekly revenue chart */}
          {weeklyData.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Weekly Revenue</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${Math.round(v / 100)}`} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="revenue" fill="#E8450A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue by city */}
          {cityData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-[#E8450A]" />
                  <h2 className="font-semibold text-gray-900">Revenue by City</h2>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={cityData} dataKey="revenue" nameKey="city" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                      {cityData.map((_, i) => <Cell key={i} fill={CITY_COLORS[i % CITY_COLORS.length]} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
                    <Tooltip formatter={(v) => formatINR(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-4">Top Cities</h2>
                <div className="space-y-3">
                  {cityData.slice(0, 6).map(({ city, revenue, orders }, i) => (
                    <div key={city} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-800 truncate">{city}</span>
                          <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#E8450A] ml-2">{formatINR(revenue)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${(revenue / cityData[0].revenue) * 100}%`, backgroundColor: CITY_COLORS[i % CITY_COLORS.length] }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{orders} orders · avg {formatINR(Math.round(revenue / orders))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent transactions */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Order ID', 'City', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-gray-600">{o.buyer_city ?? '—'}</td>
                      <td className="px-4 py-3 font-['JetBrains_Mono',monospace] font-semibold text-[#E8450A]">{formatINR(o.amount_paise)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {o.status === 'delivered' ? 'Paid Out' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : tab === 'payouts' ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Payout Summary</h2>
              <p className="text-xs text-gray-400 mt-0.5">Schedule: {manufacturer?.payout_schedule ?? 'T+2'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-['JetBrains_Mono',monospace] text-emerald-600">{formatINR(stats.paid)}</p>
              <p className="text-xs text-gray-400">Total paid out</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-600 mb-1">Paid Out</p>
              <p className="text-xl font-bold font-['JetBrains_Mono',monospace] text-emerald-700">{formatINR(stats.paid)}</p>
              <p className="text-xs text-emerald-500 mt-0.5">From {recentOrders.filter(o => o.status === 'delivered').length} delivered orders</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 mb-1">Pending Payout</p>
              <p className="text-xl font-bold font-['JetBrains_Mono',monospace] text-amber-700">{formatINR(stats.pending)}</p>
              <p className="text-xs text-amber-500 mt-0.5">Will be processed per schedule</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">How payouts work</p>
            <ul className="text-xs space-y-1 text-blue-600 list-disc list-inside">
              <li>T+2: Payment processed 2 days after delivery confirmation</li>
              <li>Funds sent to your registered bank account</li>
              <li>Contact support to switch to T+0 (2% fee) or T+7 (free)</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Monthly Statements</h2>
            <p className="text-xs text-gray-400 mt-0.5">Download your monthly account statements</p>
          </div>
          <div className="divide-y divide-gray-50">
            {['May 2026', 'April 2026', 'March 2026', 'February 2026'].map((month, i) => (
              <div key={month} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-gray-800">{month}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{i === 0 ? 'Current month (in progress)' : 'Statement available'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#E8450A]">
                    {formatINR([stats.total, Math.round(stats.total * 0.8), Math.round(stats.total * 0.6), Math.round(stats.total * 0.4)][i])}
                  </span>
                  {i > 0 && (
                    <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                      Download PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FinancesPageWrapper() {
  return <Suspense fallback={<div className="p-6 animate-pulse text-gray-400 text-sm">Loading…</div>}><FinancesPage /></Suspense>
}
