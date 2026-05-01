'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import type { Database } from '@/types/database'
import { Search, Package, ArrowLeft, Zap, ZapOff, AlertCircle } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-100 font-semibold">Out of stock</span>
  if (stock < 10) return <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-100 font-semibold">Low: {stock}</span>
  return <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 font-semibold">{stock} in stock</span>
}

export default function ProductsPage() {
  const router = useRouter()
  const { manufacturer, loading: mfrLoading, error } = useManufacturerData()
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (!mfrLoading && error && process.env.NODE_ENV !== 'development') router.replace('/manufacturer/login')
  }, [mfrLoading, error, router])

  const fetchProducts = useCallback(async () => {
    if (!manufacturer) return
    setLoading(true)
    const supabase = createSupabaseBrowser()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('manufacturer_id', manufacturer.id)
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setFiltered(data ?? [])
    setLoading(false)
  }, [manufacturer])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    const q = query.toLowerCase().trim()
    if (!q) { setFiltered(products); return }
    setFiltered(products.filter((p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)))
  }, [query, products])

  async function toggleFlashDeal(product: Product) {
    setTogglingId(product.id)
    const supabase = createSupabaseBrowser()
    const newVal = !product.is_flash_deal
    await supabase.from('products').update({
      is_flash_deal: newVal,
      flash_ends_at: newVal ? new Date(Date.now() + 24 * 3600000).toISOString() : null,
    }).eq('id', product.id)
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, is_flash_deal: newVal } : p))
    setTogglingId(null)
  }

  if (mfrLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-7 w-48" />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
    </div>
  )
  if (!manufacturer) return null

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{manufacturer.name} · {filtered.length} of {products.length} shown</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product name or category…"
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:outline-none transition-colors shadow-sm"
        />
      </div>

      {/* Stock alert */}
      {!loading && products.some((p) => p.stock < 10 && p.active) && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">Low stock warning:</span>{' '}
            {products.filter((p) => p.stock < 10 && p.active).length} product(s) need restocking.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Package className="w-7 h-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700">{query ? 'No products match your search' : 'No products yet'}</p>
          <p className="text-sm text-gray-400 max-w-xs">{query ? 'Try a different keyword.' : 'Products will appear here once added to your account.'}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">Product</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 hidden sm:block">Price</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 hidden sm:block">Stock</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 text-right">Flash Deal</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((product) => (
              <div key={product.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${!product.active ? 'opacity-50' : ''}`}>
                {/* Image or placeholder */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Title + badges */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">{product.category}</span>
                    {!product.active && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">Inactive</span>}
                    {product.is_flash_deal && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-[#E8450A] font-medium">⚡ Flash</span>}
                    {/* Mobile stock */}
                    <span className="sm:hidden"><StockBadge stock={product.stock} /></span>
                  </div>
                </div>

                {/* Price — desktop */}
                <div className="w-24 hidden sm:block">
                  <p className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[#E8450A]">{formatINR(product.price_paise)}</p>
                  {product.mrp_paise && product.mrp_paise > product.price_paise && (
                    <p className="font-['JetBrains_Mono',monospace] text-xs text-gray-400 line-through">{formatINR(product.mrp_paise)}</p>
                  )}
                </div>

                {/* Stock — desktop */}
                <div className="w-28 hidden sm:block">
                  <StockBadge stock={product.stock} />
                </div>

                {/* Flash deal toggle */}
                <div className="w-24 flex justify-end">
                  <button
                    onClick={() => toggleFlashDeal(product)}
                    disabled={togglingId === product.id}
                    title={product.is_flash_deal ? 'Remove flash deal' : 'Make flash deal (24h)'}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      product.is_flash_deal
                        ? 'bg-orange-50 text-[#E8450A] border-orange-100 hover:bg-orange-100'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    } disabled:opacity-50`}
                  >
                    {product.is_flash_deal ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                    {product.is_flash_deal ? 'Active' : 'Off'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">Flash deals are seller-funded — platform does not subsidise discounts. Flash deal expires after 24h.</p>
          </div>
        </div>
      )}
    </div>
  )
}
