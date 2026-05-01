'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { ShoppingCart, Search } from 'lucide-react'

type Order = { id: string; buyer_name: string | null; buyer_phone: string; buyer_city: string | null; buyer_state: string | null; amount_paise: number; payment_method: string; status: string; created_at: string; quantity: number }

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-50 text-blue-600 border-blue-100',
  confirmed: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  packed: 'bg-purple-50 text-purple-600 border-purple-100',
  shipped: 'bg-amber-50 text-amber-600 border-amber-100',
  delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  rto: 'bg-red-50 text-red-600 border-red-100',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

export default function OrdersPage() {
  const { manufacturer } = useManufacturerData()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get('status')
  const [orders, setOrders] = useState<Order[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!manufacturer) return
    async function fetch() {
      setLoading(true)
      const supabase = createSupabaseBrowser()
      let q = supabase.from('orders').select('id,buyer_name,buyer_phone,buyer_city,buyer_state,amount_paise,payment_method,status,created_at,quantity')
        .eq('manufacturer_id', manufacturer!.id).order('created_at', { ascending: false }).limit(100)
      if (statusFilter) q = q.eq('status', statusFilter)
      const { data } = await q
      setOrders((data ?? []) as Order[])
      setLoading(false)
    }
    fetch()
  }, [manufacturer, statusFilter])

  const filtered = orders.filter(o =>
    !query || o.buyer_name?.toLowerCase().includes(query.toLowerCase()) || o.buyer_phone.includes(query) || o.id.includes(query)
  )

  const tabs = [
    { label: 'All Orders', status: null },
    { label: 'Pending', status: 'placed' },
    { label: 'Shipped', status: 'shipped' },
    { label: 'Delivered', status: 'delivered' },
    { label: 'RTO / Returns', status: 'rto' },
  ]

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-6xl">
      <h1 className="text-xl font-bold text-gray-900">Orders</h1>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {tabs.map(t => (
          <a key={t.label} href={t.status ? `?status=${t.status}` : '?'}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${
              statusFilter === t.status ? 'bg-[#E8450A] text-white border-[#E8450A]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}>{t.label}</a>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, phone or order ID…"
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:outline-none shadow-sm" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <ShoppingCart className="w-10 h-10 text-gray-200" />
          <p className="font-semibold text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order ID', 'Buyer', 'Location', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{o.buyer_name ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{o.buyer_phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{o.buyer_city}, {o.buyer_state}</td>
                    <td className="px-4 py-3 font-['JetBrains_Mono',monospace] font-semibold text-[#E8450A]">{formatINR(o.amount_paise)}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize text-xs">{o.payment_method}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-500'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">{filtered.length} orders shown</p>
          </div>
        </div>
      )}
    </div>
  )
}
