'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { createSupabaseBrowser } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import type { Database } from '@/types/database'
import { Search, Package, ArrowLeft, Zap, ZapOff, AlertCircle, Plus, X, Clock, CheckCircle2, XCircle } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

const CATEGORIES = [
  'Cotton Knitwear', 'Sarees', 'Dress Materials', 'Ethnic Wear',
  'Sportswear', 'Kids Wear', 'Accessories', 'Home Textiles',
  'Handicrafts', 'Brass & Metal', 'Leather Goods', 'Jewellery', 'Other',
]

const APPROVAL_BADGE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  approved: { label: 'Live', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
  pending: { label: 'Pending Approval', cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-100 font-semibold">Out of stock</span>
  if (stock < 10) return <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-100 font-semibold">Low: {stock}</span>
  return <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100 font-semibold">{stock} in stock</span>
}

const EMPTY_FORM = {
  title: '', category: '', description: '', price: '', mrp: '',
  stock: '', sizes: '', colors: '', imageUrl: '',
}

export default function ProductsPage() {
  const router = useRouter()
  const { manufacturer, loading: mfrLoading, error } = useManufacturerData()
  const [products, setProducts] = useState<Product[]>([])
  const [filtered, setFiltered] = useState<Product[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

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
    if (product.approval_status !== 'approved') return
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

  async function submitProduct() {
    if (!manufacturer) return
    if (!form.title.trim() || !form.category || !form.price || !form.stock) return
    setSubmitting(true)
    const supabase = createSupabaseBrowser()
    const pricePaise = Math.round(parseFloat(form.price) * 100)
    const mrpPaise = form.mrp ? Math.round(parseFloat(form.mrp) * 100) : null
    await supabase.from('products').insert({
      manufacturer_id: manufacturer.id,
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim() || null,
      price_paise: pricePaise,
      mrp_paise: mrpPaise,
      stock: parseInt(form.stock) || 0,
      sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
      colors: form.colors ? form.colors.split(',').map(s => s.trim()).filter(Boolean) : [],
      images: form.imageUrl.trim() ? [form.imageUrl.trim()] : [],
      active: false,
      approval_status: 'pending',
    })
    setSubmitting(false)
    setSubmitSuccess(true)
    setForm(EMPTY_FORM)
    setTimeout(() => {
      setSubmitSuccess(false)
      setShowAddModal(false)
      fetchProducts()
    }, 2000)
  }

  if (mfrLoading) return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-7 w-48" />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
    </div>
  )
  if (!manufacturer) return null

  const pendingCount = products.filter(p => p.approval_status === 'pending').length

  return (
    <div className="p-5 sm:p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">My Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">{manufacturer.name} · {filtered.length} of {products.length} shown</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8450A] text-white text-sm font-semibold hover:bg-orange-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Pending approval banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{pendingCount} product{pendingCount > 1 ? 's' : ''} pending admin review.</span>{' '}
            You will be notified once approved. Products are hidden from buyers until approved.
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by product name or category…"
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:outline-none transition-colors shadow-sm" />
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
          <p className="text-sm text-gray-400 max-w-xs">{query ? 'Try a different keyword.' : 'Click "Add Product" to submit your first product for review.'}</p>
          {!query && (
            <button onClick={() => setShowAddModal(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E8450A] text-white text-sm font-semibold hover:bg-orange-700 transition-all">
              <Plus className="w-4 h-4" /> Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex-1">Product</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-24 hidden sm:block">Price</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 hidden sm:block">Stock</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-32 text-right">Status</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((product) => {
              const approval = APPROVAL_BADGE[product.approval_status ?? 'approved']
              const ApprovalIcon = approval.icon
              return (
                <div key={product.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${product.approval_status === 'pending' ? 'bg-amber-50/30' : product.approval_status === 'rejected' ? 'bg-red-50/30' : ''}`}>
                  {/* Image */}
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
                      {product.is_flash_deal && product.approval_status === 'approved' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-orange-50 text-[#E8450A] font-medium">⚡ Flash</span>
                      )}
                      <span className="sm:hidden"><StockBadge stock={product.stock} /></span>
                    </div>
                    {/* Rejection note */}
                    {product.approval_status === 'rejected' && product.approval_note && (
                      <p className="text-xs text-red-500 mt-1">Admin note: {product.approval_note}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="w-24 hidden sm:block">
                    <p className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[#E8450A]">{formatINR(product.price_paise)}</p>
                    {product.mrp_paise && product.mrp_paise > product.price_paise && (
                      <p className="font-['JetBrains_Mono',monospace] text-xs text-gray-400 line-through">{formatINR(product.mrp_paise)}</p>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="w-28 hidden sm:block">
                    <StockBadge stock={product.stock} />
                  </div>

                  {/* Approval status / flash toggle */}
                  <div className="w-32 flex justify-end">
                    {product.approval_status === 'approved' ? (
                      <button onClick={() => toggleFlashDeal(product)} disabled={togglingId === product.id}
                        title={product.is_flash_deal ? 'Remove flash deal' : 'Make flash deal (24h)'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          product.is_flash_deal ? 'bg-orange-50 text-[#E8450A] border-orange-100 hover:bg-orange-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        } disabled:opacity-50`}>
                        {product.is_flash_deal ? <Zap className="w-3 h-3" /> : <ZapOff className="w-3 h-3" />}
                        {product.is_flash_deal ? 'Flash On' : 'Flash Off'}
                      </button>
                    ) : (
                      <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${approval.cls}`}>
                        <ApprovalIcon className="w-3 h-3" /> {approval.label}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">New products require admin approval before going live. Flash deals are seller-funded.</p>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Add New Product</h3>
                <p className="text-xs text-gray-400 mt-0.5">Submitted products go to admin review before going live</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM) }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Submitted for Review!</p>
                  <p className="text-sm text-gray-500 mt-1">Admin will review and approve your product shortly.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Form */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Product Title *</label>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Premium Cotton Round Neck T-Shirt"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Category *</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none bg-white">
                        <option value="">Select category…</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Selling Price (₹) *</label>
                      <input type="number" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="299"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">MRP (₹) <span className="text-gray-400 font-normal">optional</span></label>
                      <input type="number" min="1" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                        placeholder="499"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Initial Stock *</label>
                      <input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                        placeholder="100"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Sizes <span className="text-gray-400 font-normal">comma-separated</span></label>
                      <input value={form.sizes} onChange={e => setForm(f => ({ ...f, sizes: e.target.value }))}
                        placeholder="S, M, L, XL, XXL"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Colors <span className="text-gray-400 font-normal">comma-separated</span></label>
                      <input value={form.colors} onChange={e => setForm(f => ({ ...f, colors: e.target.value }))}
                        placeholder="Red, Blue, Black, White"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Product Image URL <span className="text-gray-400 font-normal">optional — Cloudinary/any URL</span></label>
                      <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                        placeholder="https://res.cloudinary.com/…"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none" />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
                      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe material, fit, care instructions…" rows={3}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none resize-none" />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                    After submission, admin will review your product within 24 hours. You can track the status in this page — it will show "Pending Approval" until reviewed.
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 pt-3 flex gap-3 flex-shrink-0 border-t border-gray-100">
                  <button onClick={() => { setShowAddModal(false); setForm(EMPTY_FORM) }}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={submitProduct} disabled={submitting || !form.title || !form.category || !form.price || !form.stock}
                    className="flex-1 py-2.5 rounded-xl bg-[#E8450A] text-white text-sm font-semibold hover:bg-orange-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                    {submitting ? 'Submitting…' : <><Plus className="w-4 h-4" /> Submit for Review</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
