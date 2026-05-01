'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import type { Database } from '@/types/database'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, TrendingDown, Minus, ArrowLeft, Package, Search, AlertCircle, MapPin, RotateCcw } from 'lucide-react'
import { PincodeMap } from '@/components/manufacturer/PincodeMap'
import { ReturnAnalysis } from '@/components/manufacturer/ReturnAnalysis'

type DailyMetric = Database['public']['Tables']['daily_sku_metrics']['Row']
type SearchTrend = Database['public']['Tables']['search_trends']['Row']
type Product = Database['public']['Tables']['products']['Row']

interface SKUSummary {
  productId: string; title: string; stock: number
  totalOrders: number; totalRevenue: number; avgReturnRate: number
  trend: 'up' | 'down' | 'flat'
  dailyData: { date: string; orders: number; revenue: number }[]
}
type TabId = 'sku' | 'search' | 'pincode' | 'returns'
type DayRange = 7 | 30 | 90

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100">
      <TrendingUp className="w-3 h-3" /> Up
    </span>
  )
  if (trend === 'down') return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-100">
      <TrendingDown className="w-3 h-3" /> Down
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-gray-100 text-gray-500 border-gray-200">
      <Minus className="w-3 h-3" /> Flat
    </span>
  )
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm shadow-lg">
      <p className="text-gray-500 mb-1.5 text-xs">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold text-gray-800">
          {p.name === 'revenue' ? `Revenue: ${formatINR(p.value)}` : `Orders: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

export default function SKUsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { manufacturer, loading: mfrLoading, error } = useManufacturerData()
  const [activeTab, setActiveTab] = useState<TabId>((searchParams.get('tab') as TabId) ?? 'sku')
  const [dayRange, setDayRange] = useState<DayRange>(7)
  const [skuData, setSkuData] = useState<SKUSummary[]>([])
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!mfrLoading && error && process.env.NODE_ENV !== 'development') router.replace('/manufacturer/login')
  }, [mfrLoading, error, router])

  useEffect(() => {
    if (!manufacturer) return
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manufacturer, dayRange])

  async function fetchData() {
    if (!manufacturer) return
    setLoading(true)
    const supabase = createSupabaseBrowser()
    const since = new Date(Date.now() - dayRange * 86400000).toISOString().split('T')[0]

    const [metricsRes, productsRes, trendsRes] = await Promise.all([
      supabase.from('daily_sku_metrics').select('*').eq('manufacturer_id', manufacturer.id).gte('date', since).order('date', { ascending: true }),
      supabase.from('products').select('id, title, stock').eq('manufacturer_id', manufacturer.id).eq('active', true),
      supabase.from('search_trends').select('*').eq('category', manufacturer.category).order('growth_pct', { ascending: false }).limit(50),
    ])

    const metrics: DailyMetric[] = metricsRes.data ?? []
    const products: Pick<Product, 'id' | 'title' | 'stock'>[] = productsRes.data ?? []
    setSearchTrends(trendsRes.data ?? [])

    const byProduct = new Map<string, DailyMetric[]>()
    for (const m of metrics) { const ex = byProduct.get(m.product_id) ?? []; ex.push(m); byProduct.set(m.product_id, ex) }

    const summaries: SKUSummary[] = products.map((p) => {
      const days = byProduct.get(p.id) ?? []
      const totalOrders = days.reduce((s, d) => s + d.orders_count, 0)
      const totalRevenue = days.reduce((s, d) => s + d.revenue_paise, 0)
      const avgReturnRate = days.length > 0 ? days.reduce((s, d) => s + Number(d.return_rate), 0) / days.length : 0
      const half = Math.floor(days.length / 2)
      const first = days.slice(0, half).reduce((s, d) => s + d.orders_count, 0)
      const second = days.slice(half).reduce((s, d) => s + d.orders_count, 0)
      const trend: 'up' | 'down' | 'flat' = second > first * 1.1 ? 'up' : second < first * 0.9 ? 'down' : 'flat'
      const dailyData = days.map((d) => ({ date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), orders: d.orders_count, revenue: d.revenue_paise }))
      return { productId: p.id, title: p.title, stock: p.stock, totalOrders, totalRevenue, avgReturnRate, trend, dailyData }
    })

    summaries.sort((a, b) => b.totalOrders - a.totalOrders)
    setSkuData(summaries)
    setLoading(false)
  }

  if (mfrLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-7 w-48" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
    </div>
  )
  if (!manufacturer) return null

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">SKU Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">{manufacturer.name} · {manufacturer.category}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'sku' as TabId, label: 'SKU Charts', icon: Package },
          { id: 'search' as TabId, label: 'Search Trends', icon: Search },
          { id: 'pincode' as TabId, label: 'Pincode Demand', icon: MapPin },
          { id: 'returns' as TabId, label: 'Returns', icon: RotateCcw },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id ? 'bg-white text-[#E8450A] shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </button>
        ))}
      </div>

      {/* SKU tab */}
      {activeTab === 'sku' && (
        <>
          <div className="flex gap-2">
            {([7, 30, 90] as DayRange[]).map((d) => (
              <button key={d} onClick={() => setDayRange(d)}
                className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  dayRange === d ? 'border-[#E8450A] text-[#E8450A] bg-orange-50' : 'border-gray-200 text-gray-500 hover:bg-gray-100'
                }`}>
                {d}d
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)}</div>
          ) : skuData.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Package className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">No SKU data yet</p>
              <p className="text-sm text-gray-400 max-w-xs">Sales data will appear once orders start coming in.</p>
            </div>
          ) : (
            <>
              {/* Summary table */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Summary — Last {dayRange} days</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        {['Product', 'Orders', 'Revenue', 'Return Rate', 'Stock', 'Trend'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {skuData.map((sku) => (
                        <tr key={sku.productId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-900 font-medium max-w-[200px] truncate">{sku.title}</td>
                          <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-gray-800">{sku.totalOrders.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[#E8450A] font-semibold">{formatINR(sku.totalRevenue)}</td>
                          <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-gray-600">{sku.avgReturnRate.toFixed(1)}%</td>
                          <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-gray-600">{sku.stock.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3"><TrendBadge trend={sku.trend} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-SKU charts */}
              <div className="space-y-4">
                {skuData.map((sku) => (
                  <div key={sku.productId} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
                    <div className="flex items-start justify-between gap-2 mb-5">
                      <div>
                        <h3 className="font-semibold text-gray-900">{sku.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{sku.totalOrders} orders · {formatINR(sku.totalRevenue)} revenue</p>
                      </div>
                      <TrendBadge trend={sku.trend} />
                    </div>
                    {sku.dailyData.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={sku.dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="orders" name="orders" fill="#E8450A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Pincode Demand tab */}
      {activeTab === 'pincode' && <PincodeMap manufacturerId={manufacturer.id} />}

      {/* Returns tab */}
      {activeTab === 'returns' && <ReturnAnalysis manufacturerId={manufacturer.id} />}

      {/* Search Trends tab */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Search terms in <span className="text-gray-800 font-semibold">{manufacturer.category}</span> this week.
            Highlighted rows = unmet demand — no products listed yet.
          </p>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : searchTrends.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Search className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-700">No search data yet</p>
              <p className="text-sm text-gray-400 max-w-xs">Populates once buyers start searching.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {['Search Term', 'This Week', 'Last Week', 'Growth', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {searchTrends.map((trend) => (
                      <tr key={trend.id} className={`transition-colors ${trend.zero_results ? 'bg-amber-50 hover:bg-amber-100/60' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {trend.zero_results && <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                            <span className="text-gray-900 font-medium">{trend.term}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-gray-800">{trend.count_this_week.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-gray-500">{trend.count_last_week.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`font-['JetBrains_Mono',monospace] text-sm font-bold ${Number(trend.growth_pct) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {Number(trend.growth_pct) >= 0 ? '+' : ''}{Number(trend.growth_pct).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {trend.zero_results ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-100 whitespace-nowrap">No products</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 whitespace-nowrap">Has results</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 bg-amber-50 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700">Amber rows = buyers searching but finding nothing — your biggest production opportunities.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
