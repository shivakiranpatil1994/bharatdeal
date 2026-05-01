'use client'

import { useEffect, useState, useCallback } from 'react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { Search, AlertTriangle, Clock, Package, RotateCcw, Truck, XCircle, ChevronRight, Printer, CheckCircle2 } from 'lucide-react'

type Order = {
  id: string; buyer_name: string | null; buyer_phone: string
  buyer_city: string | null; buyer_state: string | null; buyer_pincode: string
  amount_paise: number; payment_method: string; status: string
  payment_status: string; created_at: string; quantity: number
  shiprocket_awb: string | null; courier_name: string | null; tracking_url: string | null
  size: string | null; color: string | null
  products?: { title: string; images: string[] } | null
}

type TabId = 'all' | 'pending' | 'unshipped' | 'shipped' | 'delivered' | 'rto' | 'cancelled'

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'unshipped', label: 'Unshipped' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'rto', label: 'RTO' },
  { id: 'cancelled', label: 'Cancelled' },
]

const STATUS_MAP: Record<TabId, string[]> = {
  all: [],
  pending: ['placed'],
  unshipped: ['confirmed', 'packed'],
  shipped: ['shipped'],
  delivered: ['delivered'],
  rto: ['rto'],
  cancelled: ['cancelled'],
}

const STATUS_BADGE: Record<string, string> = {
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
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<TabId>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!manufacturer) return
    setLoading(true)
    const supabase = createSupabaseBrowser()
    const { data } = await supabase
      .from('orders')
      .select('*, products(title, images)')
      .eq('manufacturer_id', manufacturer.id)
      .order('created_at', { ascending: false })
      .limit(200)
    setOrders((data ?? []) as Order[])
    setLoading(false)
  }, [manufacturer])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId)
    const supabase = createSupabaseBrowser()
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    setUpdatingId(null)
  }

  const filtered = orders.filter(o => {
    const statusMatch = STATUS_MAP[tab].length === 0 || STATUS_MAP[tab].includes(o.status)
    const queryMatch = !query || o.buyer_name?.toLowerCase().includes(query.toLowerCase()) || o.buyer_phone.includes(query) || o.id.includes(query)
    return statusMatch && queryMatch
  })

  // Action alerts counts
  const alerts = {
    logistics: orders.filter(o => o.status === 'shipped' && !o.shiprocket_awb).length,
    overdue: orders.filter(o => ['confirmed', 'packed'].includes(o.status) && new Date(o.created_at) < new Date(Date.now() - 3 * 86400000)).length,
    lateShipment: orders.filter(o => o.status === 'placed' && new Date(o.created_at) < new Date(Date.now() - 86400000)).length,
    cancellations: orders.filter(o => o.status === 'cancelled').length,
    labelsFailed: 0,
    rto: orders.filter(o => o.status === 'rto').length,
  }

  const counts: Record<TabId, number> = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'placed').length,
    unshipped: orders.filter(o => ['confirmed', 'packed'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    rto: orders.filter(o => o.status === 'rto').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="p-5 sm:p-6 space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Manage Orders</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search order, buyer…"
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:outline-none w-56 shadow-sm" />
          </div>
        </div>
      </div>

      {/* Action needed alerts */}
      {(alerts.logistics > 0 || alerts.overdue > 0 || alerts.lateShipment > 0 || alerts.rto > 0) && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Action Needed</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: 'Suspected Logistics Issue', count: alerts.logistics, icon: AlertTriangle, color: 'text-red-500', tab: 'shipped' as TabId },
              { label: 'Overdue Shipment', count: alerts.overdue, icon: Clock, color: 'text-amber-500', tab: 'unshipped' as TabId },
              { label: 'Verge of Late Shipment', count: alerts.lateShipment, icon: Clock, color: 'text-orange-500', tab: 'pending' as TabId },
              { label: 'Cancellation Request', count: alerts.cancellations, icon: XCircle, color: 'text-gray-500', tab: 'cancelled' as TabId },
              { label: 'Purchase Labels Failed', count: alerts.labelsFailed, icon: Printer, color: 'text-gray-400', tab: 'unshipped' as TabId },
              { label: 'RTO Orders', count: alerts.rto, icon: RotateCcw, color: 'text-red-500', tab: 'rto' as TabId },
              { label: 'Shipped Orders', count: counts.shipped, icon: Truck, color: 'text-blue-500', tab: 'shipped' as TabId },
              { label: 'Delivered', count: counts.delivered, icon: CheckCircle2, color: 'text-emerald-500', tab: 'delivered' as TabId },
            ].map(({ label, count, icon: Icon, color, tab: t }) => (
              <button key={label} onClick={() => setTab(t)}
                className="flex flex-col items-start p-3 rounded-xl bg-gray-50 hover:bg-orange-50 hover:border-orange-100 border border-transparent transition-all text-left">
                <Icon className={`w-4 h-4 ${color} mb-1.5`} />
                <p className={`text-lg font-bold font-['JetBrains_Mono',monospace] ${count > 0 ? color : 'text-gray-300'}`}>{count}</p>
                <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{label}</p>
                {count > 0 && <ChevronRight className="w-3 h-3 text-gray-400 mt-1" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all -mb-px ${
              tab === t.id ? 'border-[#E8450A] text-[#E8450A]' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}>
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? 'bg-[#E8450A] text-white' : 'bg-gray-100 text-gray-500'}`}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <Package className="w-10 h-10 text-gray-200" />
          <p className="font-semibold text-gray-500">No orders in this category</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500"><span className="font-semibold text-gray-800">{filtered.length}</span> orders</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Order Date', 'Order Details', 'Product Info', 'Qty', 'Unit Price', 'Buyer Location', 'Order Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-xs text-gray-500">{Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000)} day{Math.floor((Date.now() - new Date(o.created_at).getTime()) / 86400000) !== 1 ? 's' : ''} ago</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>

                    {/* Order details */}
                    <td className="px-4 py-4">
                      <p className="text-xs font-mono text-[#E8450A] font-semibold">BD-{o.id.slice(0, 12).toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Buyer: {o.buyer_name ?? o.buyer_phone}</p>
                      <p className="text-xs text-gray-400 capitalize">{o.payment_method} · {o.payment_status}</p>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {o.products?.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.products.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate max-w-[160px]">{o.products?.title ?? 'Product'}</p>
                          {o.size && <p className="text-xs text-gray-400">Size: {o.size}</p>}
                          {o.color && <p className="text-xs text-gray-400">Color: {o.color}</p>}
                          {o.shiprocket_awb && <p className="text-xs text-blue-500 mt-0.5">AWB: {o.shiprocket_awb}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="px-4 py-4 text-center">
                      <span className="font-['JetBrains_Mono',monospace] text-gray-800 font-semibold">{o.quantity}</span>
                      {['confirmed', 'packed'].includes(o.status) && (
                        <p className="text-[10px] text-amber-500 mt-0.5">{o.quantity} unshipped</p>
                      )}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-4">
                      <p className="font-['JetBrains_Mono',monospace] font-semibold text-[#E8450A] text-sm">{formatINR(o.amount_paise)}</p>
                    </td>

                    {/* Location */}
                    <td className="px-4 py-4">
                      <p className="text-xs text-gray-700">{o.buyer_city}</p>
                      <p className="text-xs text-gray-400">{o.buyer_state} · {o.buyer_pincode}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${STATUS_BADGE[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {o.status}
                      </span>
                      {o.courier_name && <p className="text-[10px] text-gray-400 mt-1">{o.courier_name}</p>}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5">
                        {o.status === 'placed' && (
                          <button onClick={() => updateStatus(o.id, 'confirmed')} disabled={updatingId === o.id}
                            className="px-3 py-1.5 rounded-lg bg-[#E8450A] hover:bg-orange-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap">
                            Confirm Order
                          </button>
                        )}
                        {o.status === 'confirmed' && (
                          <button onClick={() => updateStatus(o.id, 'packed')} disabled={updatingId === o.id}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap">
                            Mark Packed
                          </button>
                        )}
                        {o.status === 'packed' && (
                          <button onClick={() => updateStatus(o.id, 'shipped')} disabled={updatingId === o.id}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap">
                            Confirm Shipment
                          </button>
                        )}
                        {o.status === 'shipped' && (
                          <button onClick={() => updateStatus(o.id, 'delivered')} disabled={updatingId === o.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap">
                            Mark Delivered
                          </button>
                        )}
                        {o.tracking_url && (
                          <a href={o.tracking_url} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors text-center whitespace-nowrap">
                            Track Package
                          </a>
                        )}
                        <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-1 justify-center whitespace-nowrap">
                          <Printer className="w-3 h-3" /> Print Slip
                        </button>
                      </div>
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
