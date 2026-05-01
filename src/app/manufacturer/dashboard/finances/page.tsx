'use client'

import { useEffect, useState } from 'react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { Wallet, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

export default function FinancesPage() {
  const { manufacturer } = useManufacturerData()
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, orders: 0 })
  const [recentOrders, setRecentOrders] = useState<{ id: string; amount_paise: number; status: string; created_at: string; buyer_city: string | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!manufacturer) return
    async function fetch() {
      const supabase = createSupabaseBrowser()
      const { data: orders } = await supabase.from('orders').select('id,amount_paise,status,created_at,buyer_city').eq('manufacturer_id', manufacturer!.id).eq('payment_status', 'paid').order('created_at', { ascending: false })
      const all = orders ?? []
      const total = all.reduce((s, o) => s + o.amount_paise, 0)
      const paid = all.filter(o => o.status === 'delivered').reduce((s, o) => s + o.amount_paise, 0)
      setStats({ total, paid, pending: total - paid, orders: all.length })
      setRecentOrders(all.slice(0, 20) as typeof recentOrders)
      setLoading(false)
    }
    fetch()
  }, [manufacturer])

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Finances</h1>
        <p className="text-sm text-gray-500 mt-0.5">Payout schedule: {manufacturer?.payout_schedule ?? 'T+2'}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: formatINR(stats.total), icon: TrendingUp, color: 'text-[#E8450A]', bg: 'bg-orange-50' },
              { label: 'Paid Out', value: formatINR(stats.paid), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Pending Payout', value: formatINR(stats.pending), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Paid Orders', value: stats.orders.toString(), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
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
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${o.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{o.status === 'delivered' ? 'Paid out' : 'Pending'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
