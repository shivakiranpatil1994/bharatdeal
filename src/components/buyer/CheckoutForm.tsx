'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'

interface Product {
  id: string
  title: string
  price_paise: number
  images: string[]
}

interface CheckoutFormProps {
  product: Product
  quantity: number
  size?: string
  color?: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

export default function CheckoutForm({ product, quantity, size, color }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerPincode: '',
    buyerAddress: '',
    paymentMethod: 'upi' as 'upi' | 'cod' | 'card',
  })

  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const totalPaise = product.price_paise * quantity

  function validate() {
    const e: Partial<typeof form> = {}
    if (form.buyerName.trim().length < 2) e.buyerName = 'Name must be at least 2 characters'
    if (!/^[6-9]\d{9}$/.test(form.buyerPhone.replace(/\D/g, '').slice(-10)))
      e.buyerPhone = 'Enter a valid 10-digit Indian mobile number'
    if (!/^[1-9][0-9]{5}$/.test(form.buyerPincode)) e.buyerPincode = 'Enter a valid 6-digit pincode'
    if (form.buyerAddress.trim().length < 10) e.buyerAddress = 'Address must be at least 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)

    try {
      track('checkout_started', {
        product_id: product.id,
        quantity,
        payment_method: form.paymentMethod,
        amount_paise: totalPaise,
      })

      // Create order
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          buyerPhone: form.buyerPhone.replace(/\D/g, '').slice(-10),
          buyerName: form.buyerName.trim(),
          buyerPincode: form.buyerPincode,
          buyerAddress: form.buyerAddress.trim(),
          quantity,
          size: size || undefined,
          color: color || undefined,
          paymentMethod: form.paymentMethod,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong. Please try again.')
        return
      }

      // Pure COD, no deposit required — go straight to tracking
      if (!data.razorpayOrderId) {
        track('order_placed', {
          order_id: data.orderId,
          payment_method: 'cod',
          amount_paise: totalPaise,
        })
        // Save phone for analytics
        localStorage.setItem('bd_phone', form.buyerPhone.replace(/\D/g, '').slice(-10))
        localStorage.setItem('bd_pincode', form.buyerPincode)
        router.push(`/orders/${data.orderId}?placed=1`)
        return
      }

      // Razorpay payment needed (UPI/card or COD deposit)
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Payment system failed to load. Please refresh and try again.')
        return
      }

      const isCodDeposit = data.isCodDeposit === true
      const displayAmount = data.razorpayAmount

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: displayAmount,
        currency: 'INR',
        name: 'BharatDeal',
        description: isCodDeposit
          ? `COD Security Deposit — ${product.title}`
          : product.title,
        order_id: data.razorpayOrderId,
        prefill: {
          name: form.buyerName.trim(),
          contact: `+91${form.buyerPhone.replace(/\D/g, '').slice(-10)}`,
        },
        theme: { color: '#E8450A' },
        modal: {
          ondismiss: () => {
            setLoading(false)
            toast.info('Payment cancelled. Your cart is saved.')
          },
        },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: data.orderId,
              }),
            })

            const verifyData = await verifyRes.json()

            if (!verifyRes.ok) {
              toast.error('Payment verification failed. Contact support with your order ID.')
              return
            }

            track('order_placed', {
              order_id: verifyData.orderId,
              payment_method: form.paymentMethod,
              amount_paise: displayAmount,
              is_cod_deposit: isCodDeposit,
            })

            localStorage.setItem('bd_phone', form.buyerPhone.replace(/\D/g, '').slice(-10))
            localStorage.setItem('bd_pincode', form.buyerPincode)
            router.push(`/orders/${verifyData.orderId}?placed=1`)
          } catch {
            toast.error('Something went wrong verifying payment. Contact support.')
          } finally {
            setLoading(false)
          }
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  function field(
    label: string,
    key: keyof typeof form,
    type = 'text',
    placeholder = ''
  ) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
        <input
          type={type}
          inputMode={type === 'tel' ? 'numeric' : undefined}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => {
            setForm((f) => ({ ...f, [key]: e.target.value }))
            if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
          }}
          className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors duration-200"
        />
        {errors[key] && <p className="text-xs text-[var(--danger)]">{errors[key]}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Order summary */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4 flex gap-4 items-center">
        {product.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] truncate">{product.title}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Qty: {quantity}
            {size ? ` · Size: ${size}` : ''}
            {color ? ` · ${color}` : ''}
          </p>
        </div>
        <span className="font-mono font-bold text-lg text-[var(--brand-primary)] flex-shrink-0">
          {formatINR(totalPaise)}
        </span>
      </div>

      {/* Delivery details */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Delivery Details</h2>
        {field('Full Name', 'buyerName', 'text', 'Rahul Sharma')}
        {field('Mobile Number', 'buyerPhone', 'tel', '9876543210')}
        {field('Pincode', 'buyerPincode', 'text', '400001')}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--text-secondary)]">
            Full Address
          </label>
          <textarea
            rows={3}
            placeholder="House no, Street, Colony, City"
            value={form.buyerAddress}
            onChange={(e) => {
              setForm((f) => ({ ...f, buyerAddress: e.target.value }))
              if (errors.buyerAddress) setErrors((er) => ({ ...er, buyerAddress: undefined }))
            }}
            className="px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none transition-colors duration-200 resize-none"
          />
          {errors.buyerAddress && (
            <p className="text-xs text-[var(--danger)]">{errors.buyerAddress}</p>
          )}
        </div>
      </div>

      {/* Payment method */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-[var(--text-primary)]">Payment Method</h2>
        {(
          [
            { value: 'upi', label: 'UPI / Net Banking', sub: 'PhonePe, GPay, Paytm, BHIM' },
            { value: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay' },
            { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives' },
          ] as const
        ).map(({ value, label, sub }) => (
          <label
            key={value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
              form.paymentMethod === value
                ? 'border-[var(--brand-primary)] bg-orange-500/5'
                : 'border-[var(--bg-border)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={value}
              checked={form.paymentMethod === value}
              onChange={() => setForm((f) => ({ ...f, paymentMethod: value }))}
              className="accent-[var(--brand-primary)]"
            />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
              <p className="text-xs text-[var(--text-tertiary)]">{sub}</p>
            </div>
          </label>
        ))}

        {form.paymentMethod === 'cod' && (
          <div className="mt-1 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
            <span className="font-semibold">Note:</span> A refundable ₹49 security deposit may be
            required for COD orders in high-return areas. It is adjusted against your order on
            delivery.
          </div>
        )}
      </div>

      {/* Place order CTA */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-[var(--brand-primary)] hover:bg-orange-600 text-white font-bold text-base transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? 'Processing…'
          : form.paymentMethod === 'cod'
          ? `Place COD Order — ${formatINR(totalPaise)}`
          : `Pay ${formatINR(totalPaise)}`}
      </button>

      <p className="text-center text-xs text-[var(--text-tertiary)]">
        By placing an order you agree to our Terms &amp; Conditions.
        100% secure payments via Razorpay.
      </p>
    </form>
  )
}
