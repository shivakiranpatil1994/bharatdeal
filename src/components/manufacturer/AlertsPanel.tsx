'use client'

import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts'
import { Bell, TrendingUp, AlertTriangle, Package, Percent, X, Zap } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; dot: string }> = {
  'quality-spike': { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500' },
  'low-stock':     { icon: Package,       color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', dot: 'bg-amber-500' },
  stockout:        { icon: Package,       color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', dot: 'bg-red-500' },
  trend:           { icon: TrendingUp,    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-500' },
  opportunity:     { icon: Zap,           color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  pricing:         { icon: Percent,       color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-500' },
}

const DEFAULT = { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', dot: 'bg-gray-400' }

export function AlertsPanel({ manufacturerId }: { manufacturerId: string }) {
  const { alerts, loading, markRead } = useRealtimeAlerts(manufacturerId)

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Alerts</h2>
          {alerts.length > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#E8450A]/10 text-[#E8450A] border border-[#E8450A]/20">
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-80">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-gray-100 rounded-xl" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No new alerts</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {alerts.map((alert) => {
              const cfg = TYPE_CONFIG[alert.type] ?? DEFAULT
              const Icon = cfg.icon
              return (
                <div key={alert.id} className={`rounded-xl border p-3 flex gap-3 items-start ${cfg.bg} ${cfg.border}`}>
                  <div className={`w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                    <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${cfg.color} leading-snug`}>{alert.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{alert.message}</p>
                    {alert.recommended_action && (
                      <p className="text-xs text-gray-400 mt-1 italic">→ {alert.recommended_action}</p>
                    )}
                  </div>
                  <button onClick={() => markRead(alert.id)} className="p-1 rounded-lg hover:bg-white/60 transition-colors flex-shrink-0">
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
