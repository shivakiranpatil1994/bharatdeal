'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Info } from 'lucide-react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { useAdWalletBalance } from '@/hooks/useAdWalletBalance'
import { formatINRFromPaise, BID_FLOORS, AD_TYPE_LABELS } from '@/lib/adHelpers'

interface Product { id: string; title: string; price_paise: number; images: string[] }

type Step = 1 | 2 | 3

const AD_TYPES = [
  { value: 'sponsored_search', label: 'Sponsored Search', desc: 'Show when buyers search for your keywords', minBid: BID_FLOORS.sponsored_search },
  { value: 'product_card',     label: 'Product Card',     desc: 'Appear in product grids & related sections', minBid: BID_FLOORS.product_card },
  { value: 'banner',           label: 'Homepage Banner',  desc: 'Featured banner on the homepage (CPM)', minBid: BID_FLOORS.banner },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const { manufacturer } = useManufacturerData()
  const { balancePaise } = useAdWalletBalance(manufacturer?.id ?? '')
  const [products, setProducts]   = useState<Product[]>([])
  const [step, setStep]           = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')

  const [form, setForm] = useState({
    name:             '',
    adType:           'sponsored_search',
    productId:        '',
    keywords:         '',
    categories:       '',
    maxBidPaise:      200,
    dailyBudgetPaise: 10000,
    totalBudgetPaise: 50000,
    endDate:          '',
  })

  useEffect(() => {
    if (!manufacturer) return
    fetch('/api/manufacturer/products')
      .then(r => r.json())
      .then(d => setProducts(d.products ?? []))
      .catch(() => {})
  }, [manufacturer])

  function update(k: keyof typeof form, v: string | number) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/manufacturer/ads/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:             form.name,
          adType:           form.adType,
          productId:        form.productId,
          keywords:         form.keywords.split(',').map(k => k.trim()).filter(Boolean),
          categories:       form.categories.split(',').map(c => c.trim()).filter(Boolean),
          maxBidPaise:      form.maxBidPaise,
          dailyBudgetPaise: form.dailyBudgetPaise,
          totalBudgetPaise: form.totalBudgetPaise,
          endDate:          form.endDate || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Failed to create campaign')
        setSubmitting(false)
        return
      }
      router.push('/manufacturer/dashboard/ads')
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  const selectedAdType = AD_TYPES.find(t => t.value === form.adType)
  const minBid = selectedAdType?.minBid ?? BID_FLOORS.sponsored_search

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/manufacturer/dashboard/ads" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Campaign</h1>
          <p className="text-sm text-gray-500">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1">
        {([1,2,3] as Step[]).map(s => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-[#F15A2B]' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Step 1: Ad type + product */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Tirupur Cotton T-shirts – Summer"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ad type</label>
            <div className="space-y-2">
              {AD_TYPES.map(t => (
                <button key={t.value} onClick={() => update('adType', t.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${form.adType === t.value ? 'border-[#F15A2B] bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-semibold text-gray-900 text-sm">{t.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.desc} · Min bid: {formatINRFromPaise(t.minBid)}/click</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Product to promote</label>
            {products.length === 0 ? (
              <p className="text-sm text-gray-500">No active products found. Add products first.</p>
            ) : (
              <select
                value={form.productId}
                onChange={e => update('productId', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B]"
              >
                <option value="">Select a product…</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.title} — {formatINRFromPaise(p.price_paise)}</option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.name.trim() || !form.productId}
            className="w-full py-3 rounded-xl bg-[#F15A2B] text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Targeting */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
            <p className="text-xs text-gray-500 mb-2">Comma-separated. Buyers searching these terms will see your ad.</p>
            <textarea
              value={form.keywords}
              onChange={e => update('keywords', e.target.value)}
              placeholder="cotton t-shirt, round neck tee, casual wear, tirupur cotton"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categories</label>
            <p className="text-xs text-gray-500 mb-2">Show your ad to buyers browsing these categories.</p>
            <input
              type="text"
              value={form.categories}
              onChange={e => update('categories', e.target.value)}
              placeholder="Cotton Knitwear, Kids Wear"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B]"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Do not use competitor brand names as keywords — this will automatically flag your campaign for admin review.
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Back
            </button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl bg-[#F15A2B] text-white font-semibold text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Budget & bid */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Available wallet balance</p>
            <p className="text-xl font-bold text-gray-900 font-mono">{formatINRFromPaise(balancePaise)}</p>
            {balancePaise < form.dailyBudgetPaise && (
              <p className="text-xs text-red-500 mt-1">Insufficient balance. <Link href="/manufacturer/dashboard/ads/wallet" className="underline">Add funds</Link></p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Max bid per click
              <span className="ml-2 text-xs text-gray-400 font-normal">Min: {formatINRFromPaise(minBid)}</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
              <input
                type="number"
                value={form.maxBidPaise / 100}
                onChange={e => update('maxBidPaise', Math.max(minBid, Math.round(parseFloat(e.target.value) * 100)))}
                step="0.5"
                min={minBid / 100}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Daily budget
              <span className="ml-2 text-xs text-gray-400 font-normal">Min ₹100/day</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
              <input
                type="number"
                value={form.dailyBudgetPaise / 100}
                onChange={e => update('dailyBudgetPaise', Math.max(10000, Math.round(parseFloat(e.target.value) * 100)))}
                step="100"
                min={100}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Total budget
              <span className="ml-2 text-xs text-gray-400 font-normal">Campaign stops when this is spent</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
              <input
                type="number"
                value={form.totalBudgetPaise / 100}
                onChange={e => update('totalBudgetPaise', Math.max(form.dailyBudgetPaise, Math.round(parseFloat(e.target.value) * 100)))}
                step="100"
                min={form.dailyBudgetPaise / 100}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">End date (optional)</label>
            <input
              type="date"
              value={form.endDate}
              onChange={e => update('endDate', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 bg-white focus:outline-none focus:border-[#F15A2B] [color-scheme:light]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Back
            </button>
            <button
              onClick={submit}
              disabled={submitting || balancePaise < form.dailyBudgetPaise}
              className="flex-1 py-3 rounded-xl bg-[#F15A2B] text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting…' : 'Launch Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
