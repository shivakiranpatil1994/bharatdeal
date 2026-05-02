'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Package, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { formatINR } from '@/lib/utils'

interface Product {
  id: string; title: string; category: string; description: string | null
  price_paise: number; mrp_paise: number | null; stock: number
  sizes: string[]; colors: string[]; images: string[]
  approval_status: string; approval_note: string | null
  created_at: string
  manufacturers?: { name: string; cluster: string; city: string; category: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/products?status=${filter}`)
    const data = await res.json()
    setProducts(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  async function handleDecision(product: Product, decision: 'approved' | 'rejected') {
    setProcessingId(product.id)
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, decision, note: noteMap[product.id] ?? '' }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(decision === 'approved'
          ? `✅ "${product.title}" approved — now live!`
          : `❌ "${product.title}" rejected.`)
        fetchProducts()
        setExpandedId(null)
      } else {
        toast.error(result.error ?? 'Failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setProcessingId(null)
    }
  }

  const counts = { pending: 0, approved: 0, rejected: 0 }
  // Use current list count for the active tab
  counts[filter] = products.length

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Product Approvals</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve new product listings from manufacturers</p>
        </div>
        {filter === 'pending' && products.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-sm font-semibold">
            <Clock className="w-4 h-4" /> {products.length} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <Package className="w-10 h-10 text-gray-200" />
          <p className="font-semibold text-gray-500">No {filter} products</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${product.approval_status === 'pending' ? 'border-amber-100' : 'border-gray-100'}`}>
              {/* Header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Product image */}
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{product.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[product.approval_status]}`}>{product.approval_status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{product.category}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {product.manufacturers?.name ?? 'Unknown Manufacturer'} · {product.manufacturers?.cluster ?? ''} · {product.manufacturers?.city ?? ''}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#E8450A]">{formatINR(product.price_paise)}</span>
                    {product.mrp_paise && <span className="font-['JetBrains_Mono',monospace] text-xs text-gray-400 line-through">{formatINR(product.mrp_paise)}</span>}
                    <span className="text-xs text-gray-400">{product.stock} in stock</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">Added {new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <button onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  {expandedId === product.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded details */}
              {expandedId === product.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                  {/* Product details grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Price', value: formatINR(product.price_paise) },
                      { label: 'MRP', value: product.mrp_paise ? formatINR(product.mrp_paise) : 'Not set' },
                      { label: 'Stock', value: `${product.stock} units` },
                      { label: 'Category', value: product.category },
                      { label: 'Sizes', value: product.sizes?.join(', ') || 'Not specified' },
                      { label: 'Colors', value: product.colors?.join(', ') || 'Not specified' },
                      { label: 'Seller', value: product.manufacturers?.name ?? '—' },
                      { label: 'Cluster', value: product.manufacturers?.cluster ?? '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {product.description && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Description</p>
                      <p className="text-sm text-gray-700">{product.description}</p>
                    </div>
                  )}

                  {/* Image preview */}
                  {product.images?.length > 0 && (
                    <div className="flex gap-2">
                      {product.images.slice(0, 4).map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={img} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                      ))}
                    </div>
                  )}

                  {/* Action area for pending */}
                  {product.approval_status === 'pending' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600">Admin Note (shown to seller if rejected)</label>
                        <textarea value={noteMap[product.id] ?? ''} onChange={e => setNoteMap(m => ({ ...m, [product.id]: e.target.value }))}
                          placeholder="e.g. Images are blurry, please upload better photos. / Product violates category guidelines."
                          rows={2}
                          className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none resize-none" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleDecision(product, 'approved')} disabled={processingId === product.id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                          <CheckCircle2 className="w-4 h-4" /> Approve & Go Live
                        </button>
                        <button onClick={() => handleDecision(product, 'rejected')} disabled={processingId === product.id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-sm font-semibold transition-colors disabled:opacity-50">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show existing note */}
                  {product.approval_note && (
                    <div className={`rounded-xl p-3 border ${product.approval_status === 'rejected' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                      <p className={`text-xs font-semibold ${product.approval_status === 'rejected' ? 'text-red-600' : 'text-blue-600'}`}>Admin Note</p>
                      <p className={`text-sm mt-0.5 ${product.approval_status === 'rejected' ? 'text-red-700' : 'text-blue-700'}`}>{product.approval_note}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
