'use client'

import { useEffect, useState } from 'react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { Tag, Zap, ZapOff, X, Percent } from 'lucide-react'
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
  const [dealModal, setDealModal] = useState<Product | null>(null)
  const [discountPct, setDiscountPct] = useState('10')
  const [duration, setDuration] = useState('24')

  useEffect(() => {
    if (!manufacturer) return
    async function load() {
      const supabase = createSupabaseBrowser()
      const { data } = await supabase.from('products').select('*').eq('manufacturer_id', manufacturer!.id).eq('active', true).order('created_at', { ascending: false })
      setProducts(data ?? [])
      setLoading(false)
    }
    load()
  }, [manufacturer])

  async function startDeal(product: Product) {
    const pct = Math.min(90, Math.max(1, parseInt(discountPct) || 10))
    const hrs = Math.min(168, Math.max(1, parseInt(duration) || 24))
    const discountedPrice = Math.round(product.price_paise * (1 - pct / 100))
    setTogglingId(product.id)
    const supabase = createSupabaseBrowser()
    await supabase.from('products').update({
      is_flash_deal: true,
      flash_discount_pct: pct,
      flash_ends_at: new Date(Date.now() + hrs * 3600000).toISOString(),
      mrp_paise: product.mrp_paise ?? product.price_paise,
      price_paise: discountedPrice,
    }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? {
      ...p, is_flash_deal: true, flash_discount_pct: pct,
      flash_ends_at: new Date(Date.now() + hrs * 3600000).toISOString(),
      mrp_paise: product.mrp_paise ?? product.price_paise,
      price_paise: discountedPrice,
    } : p))
    setTogglingId(null)
    setDealModal(null)
  }

  async function endDeal(product: Product) {
    setTogglingId(product.id)
    const supabase = createSupabaseBrowser()
    await supabase.from('products').update({
      is_flash_deal: false,
      flash_ends_at: null,
      flash_discount_pct: null,
      price_paise: product.mrp_paise ?? product.price_paise,
    }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? {
      ...p, is_flash_deal: false, flash_ends_at: null, flash_discount_pct: null,
      price_paise: product.mrp_paise ?? product.price_paise,
    } : p))
    setTogglingId(null)
  }

  const flashActive = products.filter(p => p.is_flash_deal)
  const flashInactive = products.filter(p => !p.is_flash_deal)

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Promotions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Flash deals are seller-funded. You set the discount — we boost your visibility.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Flash Deals', value: flashActive.length, color: 'text-[#E8450A]', bg: 'bg-orange-50' },
          { label: 'Total Products', value: products.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Discount', value: flashActive.length ? Math.round(flashActive.reduce((s, p) => s + (p.flash_discount_pct ?? 0), 0) / flashActive.length) + '%' : '—', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Ready to Promote', value: flashInactive.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
                <span className="ml-auto text-xs text-gray-400">Products are live at discounted prices</span>
              </div>
              <div className="divide-y divide-gray-50">
                {flashActive.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#E8450A]">{formatINR(p.price_paise)}</span>
                        {p.mrp_paise && <span className="font-['JetBrains_Mono',monospace] text-xs text-gray-400 line-through">{formatINR(p.mrp_paise)}</span>}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-[#E8450A] border border-orange-100 font-semibold">{p.flash_discount_pct}% OFF</span>
                      </div>
                      {p.flash_ends_at && <p className="text-xs text-gray-400 mt-1">Ends {new Date(p.flash_ends_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                    <button onClick={() => endDeal(p)} disabled={togglingId === p.id}
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
              <p className="text-xs text-gray-400 mt-0.5">Set discount % and duration — original price restored automatically when deal ends</p>
            </div>
            {flashInactive.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">All products are already in a flash deal</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {flashInactive.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{p.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-['JetBrains_Mono',monospace] text-sm text-gray-700">{formatINR(p.price_paise)}</span>
                        <span className="text-xs text-gray-400">{p.stock} in stock</span>
                        <span className="text-xs text-gray-400">{p.category}</span>
                      </div>
                    </div>
                    <button onClick={() => { setDealModal(p); setDiscountPct('10'); setDuration('24') }} disabled={togglingId === p.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-orange-50 text-[#E8450A] border border-orange-100 hover:bg-orange-100 transition-all disabled:opacity-50">
                      <Zap className="w-3 h-3" /> Start Deal
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Flash deal modal */}
      {dealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Start Flash Deal</h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[260px]">{dealModal.title}</p>
              </div>
              <button onClick={() => setDealModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Discount Percentage</label>
                <div className="relative">
                  <input type="number" min="1" max="90" value={discountPct} onChange={e => setDiscountPct(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {discountPct && (
                  <p className="text-xs text-gray-500 mt-1.5">
                    Discounted price: <span className="font-['JetBrains_Mono',monospace] font-bold text-[#E8450A]">
                      {formatINR(Math.round(dealModal.price_paise * (1 - (parseInt(discountPct) || 0) / 100)))}
                    </span>
                    <span className="ml-2 line-through text-gray-400">{formatINR(dealModal.price_paise)}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Duration (hours)</label>
                <div className="flex gap-2">
                  {['6', '12', '24', '48', '72'].map(h => (
                    <button key={h} onClick={() => setDuration(h)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${duration === h ? 'bg-[#E8450A] text-white border-[#E8450A]' : 'border-gray-200 text-gray-600 hover:border-[#E8450A] hover:text-[#E8450A]'}`}>
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                The original price will be automatically restored when the deal ends. You fund the discount — platform takes no cut.
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setDealModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={() => startDeal(dealModal)} disabled={togglingId === dealModal.id}
                className="flex-1 py-2.5 rounded-xl bg-[#E8450A] text-white text-sm font-semibold hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" /> Launch Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
