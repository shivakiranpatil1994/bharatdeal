'use client'

import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { TrendingUp, ShoppingBag, RefreshCcw, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatINR } from '@/lib/utils'

function StatCard({
  label, value, pill, pillTone = 'neutral', icon: Icon, loading,
}: {
  label: string; value: string
  pill?: string; pillTone?: 'good' | 'bad' | 'neutral'
  icon: React.ElementType; loading: boolean
}) {
  const pillStyles = {
    good:    'bg-emerald-50 text-emerald-600',
    bad:     'bg-red-50 text-red-500',
    neutral: 'bg-gray-100 text-gray-500',
  }[pillTone]
  const PillArrow = pillTone === 'bad' ? ArrowDownRight : ArrowUpRight

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Label row — like screenshot: icon + label left, period hint right */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">{label}</span>
        </div>
        <span className="text-[10px] text-gray-300 font-medium">Today</span>
      </div>

      {/* Big value */}
      {loading ? (
        <div className="h-8 w-28 animate-pulse bg-gray-100 rounded-xl" />
      ) : (
        <p className="font-['JetBrains_Mono',monospace] text-[26px] font-bold text-gray-900 leading-none" style={{ letterSpacing: '-0.02em' }}>
          {value}
        </p>
      )}

      {/* Change pill */}
      {pill && !loading && (
        <span className={`inline-flex items-center gap-0.5 mt-3 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${pillStyles}`}>
          <PillArrow className="w-2.5 h-2.5" />
          {pill}
        </span>
      )}
    </div>
  )
}

export function StatsHeader({ manufacturerId }: { manufacturerId: string }) {
  const { ordersToday, revenueTodayPaise, returnsToday, returnRate, totalStock, loading } =
    useRealtimeOrders(manufacturerId)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs text-gray-400 font-medium">Live · updates in real-time</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Orders" value={ordersToday.toLocaleString('en-IN')}
          pill={ordersToday > 0 ? `${ordersToday} placed` : undefined} pillTone="good"
          icon={ShoppingBag} loading={loading} />
        <StatCard label="Revenue" value={formatINR(revenueTodayPaise)}
          pill={revenueTodayPaise > 0 ? formatINR(revenueTodayPaise) : undefined} pillTone="good"
          icon={TrendingUp} loading={loading} />
        <StatCard label="Returns" value={String(returnsToday)}
          pill={returnRate > 0 ? `${returnRate.toFixed(1)}% rate` : undefined}
          pillTone={returnRate > 10 ? 'bad' : 'neutral'}
          icon={RefreshCcw} loading={loading} />
        <StatCard label="Stock" value={totalStock.toLocaleString('en-IN')}
          pill={totalStock < 20 ? 'Low stock' : undefined}
          pillTone={totalStock < 20 ? 'bad' : 'neutral'}
          icon={Package} loading={loading} />
      </div>
    </div>
  )
}
