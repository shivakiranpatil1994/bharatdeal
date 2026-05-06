'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Clock } from 'lucide-react'
import { useManufacturerData } from '@/hooks/useManufacturerData'
import { useAdWalletBalance } from '@/hooks/useAdWalletBalance'
import { formatINRFromPaise, TOPUP_PRESETS, estimateDaysRemaining } from '@/lib/adHelpers'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

interface TxRow {
  id: string
  type: string
  amount_paise: number
  description: string | null
  created_at: string
}

export default function WalletPage() {
  const { manufacturer } = useManufacturerData()
  const { balancePaise } = useAdWalletBalance(manufacturer?.id ?? '')
  const [transactions, setTransactions] = useState<TxRow[]>([])
  const [loading, setLoading]           = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [topping, setTopping]           = useState(false)

  useEffect(() => {
    if (!manufacturer) return
    const s = manufacturer as { id: string }
    // Load wallet transaction history (via the same Supabase client)
    // Since we don't have a dedicated endpoint, use supabase directly
    setLoading(true)
    import('@/lib/supabase').then(({ createSupabaseBrowser }) => {
      createSupabaseBrowser()
        .from('ad_wallet_transactions')
        .select('*')
        .eq('manufacturer_id', s.id)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(({ data }) => {
          setTransactions((data ?? []) as TxRow[])
          setLoading(false)
        })
    })
  }, [manufacturer])

  async function handleTopup(amountPaise: number) {
    setTopping(true)
    try {
      const res  = await fetch('/api/manufacturer/ads/wallet/topup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amountPaise }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); setTopping(false); return }

      // Load Razorpay script if needed
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          s.onerror = reject
          document.head.appendChild(s)
        })
      }

      const rzp = new window.Razorpay({
        key:         data.key,
        order_id:    data.razorpayOrderId,
        amount:      data.amount,
        currency:    'INR',
        name:        'BharatDeal',
        description: 'Ad Wallet Top-up',
        handler:     async (response: Record<string, string>) => {
          const verifyRes = await fetch('/api/manufacturer/ads/wallet/topup/verify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amountPaise,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyRes.ok) {
            alert(`✅ Wallet topped up! New balance: ${formatINRFromPaise(verifyData.newBalancePaise)}`)
          } else {
            alert(`Payment failed: ${verifyData.error}`)
          }
          setTopping(false)
        },
        modal: { ondismiss: () => setTopping(false) },
      })
      rzp.open()
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setTopping(false)
    }
  }

  function handleCustomTopup() {
    const paise = Math.round(parseFloat(customAmount) * 100)
    if (isNaN(paise) || paise < 20000) { alert('Minimum top-up is ₹200'); return }
    handleTopup(paise)
  }

  // Estimate daily spend from last 7 days
  const dailySpendEstimate = transactions
    .filter(t => t.type === 'click_deduction')
    .reduce((s, t) => s + Math.abs(t.amount_paise), 0) / 7

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/manufacturer/dashboard/ads" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ad Wallet</h1>
          <p className="text-sm text-gray-500">Manage your advertising balance</p>
        </div>
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <p className="text-sm text-orange-100">Available balance</p>
        <p className="text-4xl font-bold font-mono mt-1">{formatINRFromPaise(balancePaise)}</p>
        {dailySpendEstimate > 0 && (
          <p className="text-sm text-orange-100 mt-2">
            {estimateDaysRemaining(balancePaise, dailySpendEstimate)} remaining at current spend
          </p>
        )}
      </div>

      {/* Quick top-up presets */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Add funds</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {TOPUP_PRESETS.map(preset => (
            <button
              key={preset.paise}
              onClick={() => handleTopup(preset.paise)}
              disabled={topping}
              className="py-3 rounded-xl border-2 border-orange-200 bg-orange-50 text-[#F15A2B] font-semibold text-sm hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              min={200}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#F15A2B]"
            />
          </div>
          <button
            onClick={handleCustomTopup}
            disabled={topping || !customAmount}
            className="px-5 py-2.5 rounded-xl bg-[#F15A2B] text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Minimum top-up ₹200 · Secure payment via Razorpay</p>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Transaction history</h2>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {transactions.map(t => {
              const isCredit = t.type === 'topup' || t.type === 'refund'
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {t.type === 'topup'           ? 'Wallet top-up'
                       : t.type === 'click_deduction' ? 'Click charge'
                       : t.type === 'refund'          ? 'Refund'
                       : t.type === 'flash_deal_fee'  ? 'Flash deal fee'
                       : t.description ?? t.type}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className={`font-mono font-semibold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isCredit ? '+' : '−'}{formatINRFromPaise(Math.abs(t.amount_paise))}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
