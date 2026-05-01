'use client'

import { useEffect, useState } from 'react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { Tag, Zap, ZapOff } from 'lucide-react'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

export default function PromotionsPage() {
  const { manufacturer } = useManufacturerData()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (!manufacturer) return
    async function fetch() {
      const supabase = createSupabaseBrowser()
      const { data } = await supabase.from('products').select('*').eq('manufacturer_id', manufacturer!.id).eq('active', true).order('created_at', { ascending: false })
      setProducts(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [manufacturer])

  async function toggleFlash(product: Product) {
    setTogglingId(product.id)
    const supabase = createSupabaseBrowser()
    const newVal = !product.is_flash_deal
    await supabase.from('products').update({ is_flash_deal: newVal, flash_ends_at: newVal ? new Date(Date.now() + 24 * 3600000).toISOString() : null }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_flash_deal: newVal } : p))
    setTogglingId(null)
  }

  const flashActive = products.filter(p => p.is_flash_deal)
  const flashInactive = products.filter(p => !p.is_flash_deal)

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Promotions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Flash deals are seller-funded. Platform does not subsidise discounts.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Flash Deals', value: flashActive.length, color: 'text-[#E8450A]', bg: 'bg-orange-50' },
          { label: 'Total Products', value: products.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Discount', value: flashActive.length ? Math.round(flashActive.reduce((s, p) => s + (p.flash_discount_pct ?? 0), 0) / flashActive.length) + '%' : '—', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Eligible Products', value: flashInactive.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Tag className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-bold font-['JetBrains_Mono',monospace] ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <>
          {/* Active flash deals */}
          {flashActive.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#E8450A]" />
                <h2 className="font-semibold text-gray-900">Active Flash Deals</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {flashActive.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#E8450A]">{formatINR(p.price_paise)}</span>
                        {p.mrp_paise && <span className="font-['JetBrains_Mono',monospace] text-xs text-gray-400 line-through">{formatINR(p.mrp_paise)}</span>}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-[#E8450A] border border-orange-100 font-semibold">{p.flash_discount_pct}% OFF</span>
                      </div>
                      {p.flash_ends_at && <p className="text-xs text-gray-400 mt-1">Ends {new Date(p.flash_ends_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                    <button onClick={() => toggleFlash(p)} disabled={togglingId === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all disabled:opacity-50">
                      <ZapOff className="w-3 h-3" /> End Deal
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products eligible for flash deal */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Start a Flash Deal</h2>
              <p className="text-xs text-gray-400 mt-0.5">Toggle to run a 24-hour flash deal on any product</p>
            </div>
            <div className="divide-y divide-gray-50">
              {flashInactive.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-['JetBrains_Mono',monospace] text-sm text-gray-700">{formatINR(p.price_paise)}</span>
                      <span className="text-xs text-gray-400">{p.stock} in stock</span>
                    </div>
                  </div>
                  <button onClick={() => toggleFlash(p)} disabled={togglingId === p.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-[#E8450A] border border-orange-100 hover:bg-orange-100 transition-all disabled:opacity-50">
                    <Zap className="w-3 h-3" /> Start Deal
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
