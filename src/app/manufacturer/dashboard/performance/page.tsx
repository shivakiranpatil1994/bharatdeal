'use client'

import { useEffect, useState } from 'react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Star, TrendingUp, Package, RotateCcw, ShoppingCart } from 'lucide-react'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function ScoreBar({ value, max = 100, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  )
}

export default function PerformancePage() {
  const { manufacturer } = useManufacturerData()
  const [stats, setStats] = useState({ orders: 0, delivered: 0, rto: 0, returns: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!manufacturer) return
    async function fetch() {
      const supabase = createSupabaseBrowser()
      const { data: orders } = await supabase.from('orders').select('status').eq('manufacturer_id', manufacturer!.id)
      const all = orders ?? []
      setStats({
        orders: all.length,
        delivered: all.filter(o => o.status === 'delivered').length,
        rto: all.filter(o => o.status === 'rto').length,
        returns: all.filter(o => o.status === 'cancelled').length,
      })
      setLoading(false)
    }
    fetch()
  }, [manufacturer])

  const deliveryRate = stats.orders > 0 ? Math.round((stats.delivered / stats.orders) * 100) : 0
  const rtoRate = stats.orders > 0 ? Math.round((stats.rto / stats.orders) * 100) : 0
  const score = manufacturer?.seller_score ?? 50

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900">Performance</h1>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (
        <>
          {/* Seller Score */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Seller Score</h2>
                <p className="text-xs text-gray-400 mt-0.5">Updated daily based on delivery, returns, and ratings</p>
              </div>
              <div className={`text-3xl font-bold font-['JetBrains_Mono',monospace] ${score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                {score}<span className="text-lg text-gray-400">/100</span>
              </div>
            </div>
            <ScoreBar value={score} color={score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-500'} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-red-400">Poor (0–49)</span>
              <span className="text-xs text-amber-500">Good (50–69)</span>
              <span className="text-xs text-emerald-500">Excellent (70–100)</span>
            </div>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Delivered', value: stats.delivered, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'RTO', value: stats.rto, icon: RotateCcw, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Delivery Rate', value: `${deliveryRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
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

          {/* Score breakdown */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Score Breakdown</h2>
            {[
              { label: 'Delivery Rate', value: deliveryRate, note: `${stats.delivered} of ${stats.orders} orders delivered`, color: 'bg-emerald-500' },
              { label: 'RTO Rate', value: 100 - rtoRate, note: `${rtoRate}% RTO — lower is better`, color: rtoRate > 10 ? 'bg-red-500' : 'bg-emerald-500' },
              { label: 'Listing Quality', value: 65, note: 'Add more images and descriptions', color: 'bg-amber-400' },
              { label: 'Response Time', value: 80, note: 'Good — respond to queries within 24h', color: 'bg-blue-500' },
            ].map(({ label, value, note, color }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="font-['JetBrains_Mono',monospace] text-gray-500">{value}%</span>
                </div>
                <ScoreBar value={value} color={color} />
                <p className="text-xs text-gray-400">{note}</p>
              </div>
            ))}
          </div>

          {/* Star rating placeholder */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Buyer Reviews</h2>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">4.3</p>
                <div className="flex gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Based on orders</p>
              </div>
              <div className="flex-1 space-y-1.5">
                {[5,4,3,2,1].map(star => (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-gray-500">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${[65,20,8,4,3][5-star]}%` }} />
                    </div>
                    <span className="text-gray-400 w-6">{[65,20,8,4,3][5-star]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
