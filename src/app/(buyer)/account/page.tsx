'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { User, Phone, Package, ChevronRight, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

type OrderRow = {
  id: string
  created_at: string
  status: string
  amount_paise: number
  payment_method: string
  products: { title: string; images: string[] } | null
}

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-50 text-blue-600 border-blue-100',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
  packed: 'bg-amber-50 text-amber-600 border-amber-100',
  shipped: 'bg-purple-50 text-purple-600 border-purple-100',
  delivered: 'bg-green-50 text-green-600 border-green-100',
  rto: 'bg-red-50 text-red-500 border-red-100',
  cancelled: 'bg-red-50 text-red-500 border-red-100',
}

export default function AccountPage() {
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [error, setError] = useState('')

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = phone.replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError('Enter a valid 10-digit Indian mobile number')
      return
    }
    setError('')
    setLoading(true)
    const supabase = createSupabaseBrowser()
    const { data, error: dbErr } = await supabase
      .from('orders')
      .select('id, created_at, status, amount_paise, payment_method, products(title, images)')
      .eq('buyer_phone', cleaned)
      .order('created_at', { ascending: false })
      .limit(20)
    setLoading(false)
    if (dbErr) { setError('Something went wrong. Please try again.'); return }
    setOrders((data as unknown as OrderRow[]) ?? [])
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
            <User className="w-5 h-5 text-[#E8450A]" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">My Orders</h1>
            <p className="text-xs text-gray-400">+91 {phone.replace(/\D/g, '').slice(-10)}</p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setOrders([]); setPhone('') }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Change
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <div>
              <p className="font-semibold text-gray-700">No orders found</p>
              <p className="text-xs text-gray-400 mt-1">Orders placed with a different number won&apos;t appear here.</p>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white text-sm font-semibold transition-colors">
              Start shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-start justify-between gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{order.products?.title ?? 'Product'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{order.payment_method.toUpperCase()}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-gray-900">
                    {formatINR(order.amount_paise)}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${STATUS_COLORS[order.status] ?? STATUS_COLORS['placed']}`}>
                    {order.status}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto pt-4 space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-[#E8450A]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">My Account</h1>
          <p className="text-sm text-gray-500">Enter your mobile number to view orders</p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">Mobile Number</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#E8450A] focus-within:bg-white transition-colors">
              <div className="flex items-center gap-2 px-3 border-r border-gray-200 py-3">
                <span className="text-sm">🇮🇳</span>
                <span className="text-sm text-gray-500 font-mono">+91</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                className="flex-1 bg-transparent px-3 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              />
              <Phone className="w-4 h-4 text-gray-300 mr-3" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E8450A] hover:bg-orange-700 disabled:opacity-60 text-white font-semibold text-sm transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> View My Orders</>}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center">No account needed · Orders linked to your number</p>
      </div>
    </div>
  )
}
