'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RefreshCw } from 'lucide-react'

interface ReturnReasonData { reason: string; count: number }

interface ReturnRow {
  id: string; reason: string; status: string
  created_at: string; order_id: string; productTitle: string
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

const REASON_LABELS: Record<string, string> = {
  size: 'Wrong Size', quality: 'Quality Issue', colour_diff: 'Colour Mismatch',
  wrong_item: 'Wrong Item', changed_mind: 'Changed Mind',
}

const REASON_COLORS: Record<string, string> = {
  size: '#E8450A', quality: '#EF4444', colour_diff: '#F5A623',
  wrong_item: '#3B82F6', changed_mind: '#8B5CF6',
}

const STATUS_CLASSES: Record<string, string> = {
  requested: 'bg-blue-50 text-blue-600 border-blue-100',
  approved: 'bg-amber-50 text-amber-600 border-amber-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
  refunded: 'bg-emerald-50 text-emerald-600 border-emerald-100',
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-sm shadow-lg">
      <p className="text-gray-800 font-medium">{REASON_LABELS[payload[0].name] ?? payload[0].name}</p>
      <p className="text-gray-500 mt-0.5">{payload[0].value} returns</p>
    </div>
  )
}

export function ReturnAnalysis({ manufacturerId }: { manufacturerId: string }) {
  const [reasonData, setReasonData] = useState<ReturnReasonData[]>([])
  const [recentReturns, setRecentReturns] = useState<ReturnRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createSupabaseBrowser()
      const { data } = await supabase
        .from('returns')
        .select('id, reason, status, created_at, order_id, orders(manufacturer_id, products(title))')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!data) { setLoading(false); return }

      type ReturnRaw = (typeof data)[number]
      type OrderJoin = { manufacturer_id: string; products: { title: string } | null } | null

      const myReturns = data.filter((r: ReturnRaw) => (r.orders as OrderJoin)?.manufacturer_id === manufacturerId)

      const reasonMap = new Map<string, number>()
      for (const r of myReturns) reasonMap.set(r.reason as string, (reasonMap.get(r.reason as string) ?? 0) + 1)

      setReasonData(Array.from(reasonMap.entries()).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count))
      setRecentReturns(myReturns.slice(0, 20).map((r: ReturnRaw) => {
        const order = r.orders as OrderJoin
        return { id: r.id as string, reason: r.reason as string, status: r.status as string, created_at: r.created_at as string, order_id: r.order_id as string, productTitle: order?.products?.title ?? 'Unknown Product' }
      }))
      setLoading(false)
    }
    fetchData()
  }, [manufacturerId])

  if (loading) return (
    <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-48" /></div>
  )

  if (reasonData.length === 0) return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
        <RefreshCw className="w-7 h-7 text-gray-300" />
      </div>
      <p className="font-semibold text-gray-700">No returns yet</p>
      <p className="text-sm text-gray-400 max-w-xs">Return analysis will appear once buyers start returning items.</p>
    </div>
  )

  const total = reasonData.reduce((s, r) => s + r.count, 0)

  return (
    <div className="space-y-5">
      {/* Pie chart */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900">Return Reasons</h3>
        <p className="text-xs text-gray-400 mt-0.5 mb-4">{total} total returns</p>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={reasonData} dataKey="count" nameKey="reason" cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3}>
              {reasonData.map((entry) => (
                <Cell key={entry.reason} fill={REASON_COLORS[entry.reason] ?? '#6B7280'} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
            <Legend formatter={(value) => <span style={{ color: '#6B7280', fontSize: 12 }}>{REASON_LABELS[value as string] ?? value}</span>} />
          </PieChart>
        </ResponsiveContainer>

        {/* Reason breakdown pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
          {reasonData.map((r) => (
            <div key={r.reason} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: REASON_COLORS[r.reason] ?? '#6B7280' }} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{REASON_LABELS[r.reason] ?? r.reason}</p>
                <p className="text-xs text-gray-400">{r.count} · {((r.count / total) * 100).toFixed(0)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent returns table */}
      {recentReturns.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Returns</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Product', 'Reason', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-medium max-w-[180px] truncate">{r.productTitle}</td>
                    <td className="px-4 py-3 text-gray-600">{REASON_LABELS[r.reason] ?? r.reason}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_CLASSES[r.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
