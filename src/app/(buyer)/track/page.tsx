'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { MapPin, Search, Loader2, Package, Truck, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function TrackPage() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<{ id: string; status: string; products: { title: string } | null; created_at: string; shiprocket_awb: string | null; courier_name: string | null; tracking_url: string | null }[]>([])
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = phone.replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError('Enter a valid 10-digit number')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createSupabaseBrowser()
    const { data } = await supabase
      .from('orders')
      .select('id, status, created_at, shiprocket_awb, courier_name, tracking_url, products(title)')
      .eq('buyer_phone', cleaned)
      .in('status', ['placed', 'confirmed', 'packed', 'shipped'])
      .order('created_at', { ascending: false })
      .limit(10)
    setLoading(false)
    setOrders((data as typeof orders) ?? [])
    setSearched(true)
  }

  const statusIcon = (status: string) => {
    if (status === 'shipped') return <Truck className="w-4 h-4 text-purple-500" />
    if (status === 'delivered') return <CheckCircle2 className="w-4 h-4 text-green-500" />
    return <Package className="w-4 h-4 text-amber-500" />
  }

  return (
    <div className="max-w-sm mx-auto pt-4 space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto">
            <MapPin className="w-7 h-7 text-[#E8450A]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Track Order</h1>
          <p className="text-sm text-gray-500">Enter your mobile to find active orders</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Mobile Number</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#E8450A] focus-within:bg-white transition-colors">
              <span className="px-3 py-3 text-sm text-gray-500 border-r border-gray-200 font-mono">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E8450A] hover:bg-orange-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Track Orders</>}
          </button>
        </form>
      </div>

      {searched && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {orders.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Package className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-600 font-medium">No active orders</p>
              <Link href="/account" className="text-xs text-[#E8450A] hover:underline">View all orders →</Link>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors group"
              >
                {statusIcon(order.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{order.products?.title ?? 'Order'}</p>
                  {order.shiprocket_awb && (
                    <p className="text-xs text-gray-400">{order.courier_name ?? 'Courier'} · {order.shiprocket_awb}</p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
