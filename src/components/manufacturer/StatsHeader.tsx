'use client'

import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'
import { TrendingUp, ShoppingBag, RefreshCcw, Package } from 'lucide-react'
import { formatINR } from '@/lib/utils'

function StatCard({
  label, value, sub, icon: Icon, iconColor, iconBg, loading,
}: {
  label: string; value: string; sub?: string
  icon: React.ElementType; iconColor: string; iconBg: string; loading: boolean
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-28 animate-pulse bg-gray-100 rounded-xl mb-1" />
      ) : (
        <p className="font-['JetBrains_Mono',monospace] text-2xl font-bold text-gray-900">{value}</p>
      )}
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      {sub && !loading && (
        <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
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
        <StatCard label="Orders Today" value={ordersToday.toLocaleString('en-IN')}
          icon={ShoppingBag} iconColor="text-blue-600" iconBg="bg-blue-50" loading={loading} />
        <StatCard label="Revenue Today" value={formatINR(revenueTodayPaise)}
          icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading} />
        <StatCard label="Returns Today" value={String(returnsToday)}
          sub={returnRate > 0 ? `${returnRate.toFixed(1)}% return rate` : undefined}
          icon={RefreshCcw}
          iconColor={returnRate > 10 ? 'text-red-600' : 'text-amber-600'}
          iconBg={returnRate > 10 ? 'bg-red-50' : 'bg-amber-50'}
          loading={loading} />
        <StatCard label="Total Stock" value={totalStock.toLocaleString('en-IN')}
          sub={totalStock < 20 ? '⚠ Low stock' : undefined}
          icon={Package}
          iconColor={totalStock < 20 ? 'text-red-600' : 'text-purple-600'}
          iconBg={totalStock < 20 ? 'bg-red-50' : 'bg-purple-50'}
          loading={loading} />
      </div>
    </div>
  )
}
