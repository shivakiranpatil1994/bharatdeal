'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import type { Database } from '@/types/database'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { MapPin } from 'lucide-react'

type PincodeDemandRow = Database['public']['Tables']['pincode_demand']['Row']

interface PincodeEntry {
  pincode: string; city: string; state: string
  orders: number; revenue: number; rtoRate: number
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm shadow-lg">
      <p className="text-gray-400 mb-1 text-xs">{label}</p>
      <p className="font-semibold text-[#F15A2B]">{payload[0].value} orders</p>
    </div>
  )
}

export function PincodeMap({ manufacturerId }: { manufacturerId: string }) {
  const [pincodes, setPincodes] = useState<PincodeEntry[]>([])
  const [stateData, setStateData] = useState<{ state: string; orders: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createSupabaseBrowser()
      const weekStart = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0]

      const { data } = await supabase
        .from('pincode_demand').select('*')
        .eq('manufacturer_id', manufacturerId)
        .gte('week_start', weekStart)
        .order('order_count', { ascending: false })

      if (!data) { setLoading(false); return }

      const pincodeMap = new Map<string, { pincode: string; city: string; state: string; orders: number; revenue: number; rtoCount: number }>()
      const stateMap = new Map<string, number>()

      for (const row of data as PincodeDemandRow[]) {
        const existing = pincodeMap.get(row.pincode)
        if (existing) {
          existing.orders += row.order_count
          existing.revenue += row.avg_price_paise ?? 0
          existing.rtoCount += row.rto_count
        } else {
          pincodeMap.set(row.pincode, { pincode: row.pincode, city: row.city ?? 'Unknown', state: row.state ?? 'Unknown', orders: row.order_count, revenue: row.avg_price_paise ?? 0, rtoCount: row.rto_count })
        }
        if (row.state) stateMap.set(row.state, (stateMap.get(row.state) ?? 0) + row.order_count)
      }

      setPincodes(Array.from(pincodeMap.values()).sort((a, b) => b.orders - a.orders).slice(0, 10).map((p) => ({ ...p, rtoRate: p.orders > 0 ? (p.rtoCount / p.orders) * 100 : 0 })))
      setStateData(Array.from(stateMap.entries()).map(([state, orders]) => ({ state, orders })).sort((a, b) => b.orders - a.orders).slice(0, 8))
      setLoading(false)
    }
    fetchData()
  }, [manufacturerId])

  if (loading) return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-48" /></div>

  if (pincodes.length === 0) return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
        <MapPin className="w-7 h-7 text-purple-400" />
      </div>
      <p className="font-semibold text-gray-700">No pincode data yet</p>
      <p className="text-sm text-gray-400 max-w-xs">Geographic demand appears once orders arrive.</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* State bar chart */}
      {stateData.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Orders by State</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stateData} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="state" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" fill="#F15A2B" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top pincodes table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Top 10 Pincodes — Last 28 days</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['#', 'Pincode', 'City', 'State', 'Orders', 'Avg Revenue', 'RTO Rate'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pincodes.map((p, i) => (
                <tr key={p.pincode} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{i + 1}</td>
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] font-semibold text-gray-900">{p.pincode}</td>
                  <td className="px-4 py-3 text-gray-700">{p.city}</td>
                  <td className="px-4 py-3 text-gray-500">{p.state}</td>
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-gray-900 font-semibold">{p.orders}</td>
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace] text-[#F15A2B] font-semibold">{formatINR(p.revenue)}</td>
                  <td className="px-4 py-3 font-['JetBrains_Mono',monospace]">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.rtoRate >= 20 ? 'bg-red-50 text-red-600' : p.rtoRate >= 10 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {p.rtoRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
