'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { StatsHeader } from '@/components/manufacturer/StatsHeader'
import { AlertsPanel } from '@/components/manufacturer/AlertsPanel'
import { DailyInsights } from '@/components/manufacturer/DailyInsights'
import { MessageSquare, BarChart2, MapPin, RotateCcw, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />
}

export default function ManufacturerDashboardPage() {
  const router = useRouter()
  const { manufacturer, loading, error } = useManufacturerData()

  useEffect(() => {
    if (!loading && error && process.env.NODE_ENV !== 'development') {
      router.replace('/manufacturer/login')
    }
  }, [loading, error, router])

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-6xl mx-auto">
        <Skeleton className="h-7 w-52" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!manufacturer) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center">
          <BarChart2 className="w-7 h-7 text-[#F15A2B]" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">No manufacturer data found</p>
          <p className="text-sm text-gray-500 mt-1">Run migration <code className="bg-gray-100 px-1 rounded">006_seed.sql</code> in Supabase first.</p>
        </div>
      </div>
    )
  }

  const score = manufacturer.seller_score ?? 50
  const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F5A623' : '#EF4444'
  const scoreLabel = score >= 70 ? 'Healthy' : score >= 40 ? 'Fair' : 'At Risk'

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-6xl mx-auto">
      {/* Workspace header — breadcrumb + title like the screenshot */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] text-gray-400 font-medium mb-1">Dashboard <span className="mx-1">›</span> Overview</p>
          <h1 className="text-[22px] font-bold text-gray-900" style={{ letterSpacing: '-0.03em' }}>
            {manufacturer.name} <span className="text-gray-400 font-medium">Workspace</span>
          </h1>
        </div>
        <div className="flex gap-2 flex-shrink-0 items-center">
          <Link href="/manufacturer/dashboard/skus"
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>
          <Link href="/manufacturer/dashboard/ai"
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F15A2B] hover:bg-[#D94A1E] text-white text-sm font-semibold transition-colors"
            style={{ boxShadow: '0 4px 12px rgba(241,90,43,0.3)' }}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </Link>
        </div>
      </div>

      {/* KPI cards row */}
      <StatsHeader manufacturerId={manufacturer.id} />

      {/* Main grid — alerts wide left, gradient AI card right (like screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        <div className="lg:col-span-2">
          <AlertsPanel manufacturerId={manufacturer.id} />
        </div>
        <DailyInsights manufacturerId={manufacturer.id} />
      </div>

      {/* Bottom row — Business Health + quick shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Business Health card — gauge style like screenshot's Company Health */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900" style={{ letterSpacing: '-0.01em' }}>Business Health</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${scoreColor}15`, color: scoreColor }}>
              {scoreLabel}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {/* Semi-circular gauge */}
            <div className="relative w-24 h-14 flex-shrink-0">
              <svg viewBox="0 0 100 55" className="w-full h-full">
                <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke="#F3F4F6" strokeWidth="9" strokeLinecap="round" />
                <path d="M 8 50 A 42 42 0 0 1 92 50" fill="none" stroke={scoreColor} strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 132} 132`} />
              </svg>
              <div className="absolute inset-x-0 bottom-0 text-center">
                <span className="font-['JetBrains_Mono',monospace] text-xl font-bold text-gray-900">{score}</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">Seller Score</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">Based on delivery rate, returns &amp; ratings. Payout: <span className="font-semibold text-gray-600">{manufacturer.payout_schedule ?? 'T+2'}</span></p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-3">
            {[
              { label: 'Cluster', value: manufacturer.cluster },
              { label: 'Category', value: manufacturer.category },
              { label: 'Location', value: `${manufacturer.city}` },
              { label: 'State', value: manufacturer.state },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-xs font-semibold text-gray-800 truncate mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/manufacturer/dashboard/skus', icon: BarChart2, label: 'SKU Performance', desc: 'Orders & revenue per product', color: 'text-blue-600', bg: 'bg-blue-50' },
            { href: '/manufacturer/dashboard/ai', icon: MessageSquare, label: 'AI Business Chat', desc: 'Ask anything about sales', color: 'text-[#F15A2B]', bg: 'bg-orange-50' },
            { href: '/manufacturer/dashboard/skus?tab=pincode', icon: MapPin, label: 'Pincode Demand', desc: 'Where buyers are', color: 'text-purple-600', bg: 'bg-purple-50' },
            { href: '/manufacturer/dashboard/skus?tab=returns', icon: RotateCcw, label: 'Return Analysis', desc: 'Why items come back', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ href, icon: Icon, label, desc, color, bg }) => (
            <Link key={label} href={href}
              className="bg-white border border-gray-100 rounded-2xl p-4 hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xs font-bold text-gray-900 leading-snug" style={{ letterSpacing: '-0.01em' }}>{label}</p>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
