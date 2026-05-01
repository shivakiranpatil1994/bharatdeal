'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { StatsHeader } from '@/components/manufacturer/StatsHeader'
import { AlertsPanel } from '@/components/manufacturer/AlertsPanel'
import { DailyInsights } from '@/components/manufacturer/DailyInsights'
import { MessageSquare, BarChart2, MapPin, RotateCcw } from 'lucide-react'
import Link from 'next/link'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
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
      <div className="p-6 space-y-5 max-w-5xl">
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
          <BarChart2 className="w-7 h-7 text-[#E8450A]" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">No manufacturer data found</p>
          <p className="text-sm text-gray-500 mt-1">Run migration <code className="bg-gray-100 px-1 rounded">006_seed.sql</code> in Supabase first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{manufacturer.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{manufacturer.cluster} · {manufacturer.category}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href="/manufacturer/dashboard/skus"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors font-medium">
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Link>
          <Link href="/manufacturer/dashboard/ai"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white text-sm font-semibold transition-colors shadow-sm">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </Link>
        </div>
      </div>

      {/* Live KPI cards */}
      <StatsHeader manufacturerId={manufacturer.id} />

      {/* Alerts + Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AlertsPanel manufacturerId={manufacturer.id} />
        <DailyInsights manufacturerId={manufacturer.id} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/manufacturer/dashboard/skus', icon: BarChart2, label: 'SKU Performance', color: 'text-blue-600', bg: 'bg-blue-50' },
          { href: '/manufacturer/dashboard/ai', icon: MessageSquare, label: 'AI Business Chat', color: 'text-[#E8450A]', bg: 'bg-orange-50' },
          { href: '/manufacturer/dashboard/skus', icon: MapPin, label: 'Pincode Demand', color: 'text-purple-600', bg: 'bg-purple-50' },
          { href: '/manufacturer/dashboard/skus', icon: RotateCcw, label: 'Return Analysis', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ href, icon: Icon, label, color, bg }) => (
          <Link key={label} href={href}
            className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all duration-200 group">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xs font-semibold text-gray-800 leading-snug group-hover:text-gray-900">{label}</p>
          </Link>
        ))}
      </div>

      {/* Profile card */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Your Profile</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Business', value: manufacturer.name },
            { label: 'Cluster', value: manufacturer.cluster },
            { label: 'Category', value: manufacturer.category },
            { label: 'Location', value: `${manufacturer.city}, ${manufacturer.state}` },
            { label: 'Payout', value: manufacturer.payout_schedule ?? 'T+2' },
            { label: 'Seller Score', value: `${manufacturer.seller_score ?? 50} / 100` },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-0.5">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
