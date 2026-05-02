'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { track } from '@/lib/analytics'
import { formatINR } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import { Phone, MapPin, CreditCard, ChevronRight, Package, ShieldCheck, Truck, RefreshCw, Check, User, ShoppingBag } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  title: string
  price_paise: number
  images: string[]
}

// cartMode=true: product/quantity/size/color are all undefined
interface CheckoutFormProps {
  cartMode?: true
  product?: Product
  quantity?: number
  size?: string
  color?: string
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

type Step = 'login' | 'address' | 'payment'

export default function CheckoutForm({ cartMode, product, quantity = 1, size, color }: CheckoutFormProps) {
  const router = useRouter()
  const { items, totalPaise: cartTotal, count, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('login')

  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [isReturning, setIsReturning] = useState(false)

  const [form, setForm] = useState({
    buyerName: '',
    buyerPincode: '',
    buyerAddress: '',
    paymentMethod: 'upi' as 'upi' | 'cod' | 'card',
  })
  const [errors, setErrors] = useState<Partial<typeof form>>({})

  // In cart mode, default to COD (only supported payment method for multi-item cart)
  useEffect(() => {
    if (cartMode) {
      setForm(f => ({ ...f, paymentMethod: 'cod' }))
    }
  }, [cartMode])

  // Derived total: cart mode uses cart total, single mode uses product price
  const totalPaise = cartMode ? cartTotal : (product?.price_paise ?? 0) * quantity

  // Pre-fill from localStorage for returning users
  useEffect(() => {
    const savedPhone = localStorage.getItem('bd_phone') ?? ''
    const savedName = localStorage.getItem('bd_name') ?? ''
    const savedPincode = localStorage.getItem('bd_pincode') ?? ''
    const savedAddress = localStorage.getItem('bd_address') ?? ''
    if (savedPhone) {
      setPhone(savedPhone)
      setIsReturning(true)
    }
    if (savedName || savedPincode || savedAddress) {
      setForm(f => ({
        ...f,
        buyerName: savedName || f.buyerName,
        buyerPincode: savedPincode || f.buyerPincode,
        buyerAddress: savedAddress || f.buyerAddress,
      }))
    }
  }, [])

  function handlePhoneContinue() {
    const clean = phone.replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setPhoneError('Enter a valid 10-digit Indian mobile number')
      return
    }
    setPhoneError('')
    setStep('address')
  }

  function validateAddress() {
    const e: Partial<typeof form> = {}
    if (form.buyerName.trim().length < 2) e.buyerName = 'Enter your full name'
    if (!/^[1-9][0-9]{5}$/.test(form.buyerPincode)) e.buyerPincode = 'Enter a valid 6-digit pincode'
    if (form.buyerAddress.trim().length < 10) e.buyerAddress = 'Enter your full address (min 10 characters)'
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

  async function handlePlaceOrder() {
    if (!validateAddress()) return
    setLoading(true)

    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10)

      // Save to localStorage for next visit
      localStorage.setItem('bd_phone', cleanPhone)
      localStorage.setItem('bd_name', form.buyerName.trim())
      localStorage.setItem('bd_pincode', form.buyerPincode)
      localStorage.setItem('bd_address', form.buyerAddress.trim())

      // ── CART MODE: create one order per item (COD only) ──
      if (cartMode) {
        let allSucceeded = true
        for (const item of items) {
          track('checkout_started', { product_id: item.productId, quantity: item.quantity, payment_method: 'cod', amount_paise: item.pricePaise * item.quantity })
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: item.productId,
              buyerPhone: cleanPhone,
              buyerName: form.buyerName.trim(),
              buyerPincode: form.buyerPincode,
              buyerAddress: form.buyerAddress.trim(),
              quantity: item.quantity,
              size: item.size || undefined,
              color: item.color || undefined,
              paymentMethod: 'cod',
            }),
          })
          const data = await res.json() as { error?: string; orderId?: string }
          if (!res.ok) {
            toast.error(`Failed to order "${item.title}": ${data.error ?? 'Unknown error'}`)
            allSucceeded = false
          } else {
            track('order_placed', { order_id: data.orderId, payment_method: 'cod', amount_paise: item.pricePaise * item.quantity })
          }
        }
        if (allSucceeded) {
          clearCart()
          toast.success('All orders placed successfully!')
          router.push('/?ordered=1')
        }
        setLoading(false)
        return
      }

      // ── SINGLE PRODUCT MODE ──
      if (!product) {
        toast.error('Product not found. Please try again.')
        setLoading(false)
        return
      }

      track('checkout_started', { product_id: product.id, quantity, payment_method: form.paymentMethod, amount_paise: totalPaise })

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          buyerPhone: cleanPhone,
          buyerName: form.buyerName.trim(),
          buyerPincode: form.buyerPincode,
          buyerAddress: form.buyerAddress.trim(),
          quantity,
          size: size || undefined,
          color: color || undefined,
          paymentMethod: form.paymentMethod,
        }),
      })

      const data = await res.json() as { error?: string; orderId?: string; razorpayOrderId?: string; razorpayAmount?: number; isCodDeposit?: boolean }

      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Pure COD, no deposit
      if (!data.razorpayOrderId) {
        track('order_placed', { order_id: data.orderId, payment_method: 'cod', amount_paise: totalPaise })
        router.push(`/orders/${data.orderId}?placed=1`)
        return
      }

      // Razorpay payment
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        toast.error('Payment system failed to load. Please refresh.')
        setLoading(false)
        return
      }

      const isCodDeposit = data.isCodDeposit === true
      const displayAmount = data.razorpayAmount

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: displayAmount,
        currency: 'INR',
        name: 'BharatDeal',
        description: isCodDeposit ? `COD Deposit — ${product.title}` : product.title,
        order_id: data.razorpayOrderId,
        prefill: { name: form.buyerName.trim(), contact: `+91${cleanPhone}` },
        theme: { color: '#F97316' },
        modal: {
          ondismiss: () => { setLoading(false); toast.info('Payment cancelled.') },
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
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
            const verifyData = await verifyRes.json() as { orderId?: string }
            if (!verifyRes.ok) { toast.error('Payment verification failed. Contact support.'); return }
            track('order_placed', { order_id: verifyData.orderId, payment_method: form.paymentMethod, amount_paise: displayAmount })
            router.push(`/orders/${verifyData.orderId}?placed=1`)
          } catch {
            toast.error('Something went wrong verifying payment.')
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

  function inputCls(hasError?: boolean) {
    return `w-full px-4 py-3 rounded-xl border ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'} text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all text-sm`
  }

  // ── Mobile order summary ──
  const MobileSummary = () => {
    if (cartMode) {
      return (
        <div className="lg:hidden bg-white rounded-2xl border border-gray-200 p-4 mb-5">
          <p className="text-xs font-semibold text-gray-500 mb-3">{count} item{count !== 1 ? 's' : ''} in cart</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-700 flex-1 line-clamp-1">{item.title}</p>
                <p className="text-xs font-bold text-gray-900 font-['JetBrains_Mono',monospace] flex-shrink-0">
                  {formatINR(item.pricePaise * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <p className="text-sm font-bold text-gray-900">Total</p>
            <p className="font-bold text-gray-900 font-['JetBrains_Mono',monospace]">{formatINR(cartTotal)}</p>
          </div>
          <p className="text-xs text-green-600 mt-1">FREE delivery</p>
        </div>
      )
    }

    if (!product) return null
    return (
      <div className="lg:hidden bg-white rounded-2xl border border-gray-200 p-4 mb-5">
        <div className="flex gap-3 items-center">
          {product.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{product.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {quantity} item{quantity > 1 ? 's' : ''}
              {size ? ` · ${size}` : ''}{color ? ` · ${color}` : ''}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-gray-900 font-['JetBrains_Mono',monospace]">{formatINR(totalPaise)}</p>
            <p className="text-xs text-green-600">FREE delivery</p>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 1: Login / Phone ──
  if (step === 'login') {
    return (
      <div className="space-y-5">
        <MobileSummary />

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Phone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Login or Continue</h2>
              <p className="text-xs text-gray-500 mt-0.5">We&apos;ll send order updates on WhatsApp</p>
            </div>
          </div>

          {isReturning && (
            <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Welcome back! Your details are pre-filled.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium flex-shrink-0">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError('') }}
                className={inputCls(!!phoneError)}
                onKeyDown={e => e.key === 'Enter' && handlePhoneContinue()}
              />
            </div>
            {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
            <p className="text-xs text-gray-400">No OTP needed. We use your number for order tracking only.</p>
          </div>

          <button
            onClick={handlePhoneContinue}
            className="mt-5 w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>

          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure checkout</div>
            <div className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-green-500" /> COD available</div>
          </div>
        </div>
      </div>
    )
  }

  // ── STEP 2: Address ──
  if (step === 'address') {
    return (
      <div className="space-y-5">
        <MobileSummary />

        {/* Logged in indicator */}
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 px-4 py-3">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-orange-600" />
          </div>
          <span>+91 {phone}</span>
          <button onClick={() => setStep('login')} className="ml-auto text-xs text-orange-500 hover:underline font-medium">Change</button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Delivery Address</h2>
              <p className="text-xs text-gray-500">Where should we deliver?</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Full Name</label>
            <input
              type="text"
              placeholder="Rahul Sharma"
              value={form.buyerName}
              onChange={e => { setForm(f => ({ ...f, buyerName: e.target.value })); setErrors(er => ({ ...er, buyerName: undefined })) }}
              className={inputCls(!!errors.buyerName)}
            />
            {errors.buyerName && <p className="text-xs text-red-500">{errors.buyerName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Pincode</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="400001"
              value={form.buyerPincode}
              onChange={e => { setForm(f => ({ ...f, buyerPincode: e.target.value.replace(/\D/g, '').slice(0, 6) })); setErrors(er => ({ ...er, buyerPincode: undefined })) }}
              className={inputCls(!!errors.buyerPincode)}
            />
            {errors.buyerPincode && <p className="text-xs text-red-500">{errors.buyerPincode}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Full Address</label>
            <textarea
              rows={3}
              placeholder="House no., Street name, Colony, City, State"
              value={form.buyerAddress}
              onChange={e => { setForm(f => ({ ...f, buyerAddress: e.target.value })); setErrors(er => ({ ...er, buyerAddress: undefined })) }}
              className={`${inputCls(!!errors.buyerAddress)} resize-none`}
            />
            {errors.buyerAddress && <p className="text-xs text-red-500">{errors.buyerAddress}</p>}
          </div>

          <button
            onClick={() => { if (validateAddress()) setStep('payment') }}
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Continue to Payment <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 3: Payment ──
  return (
    <div className="space-y-5">
      <MobileSummary />

      {/* Logged in */}
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 px-4 py-3">
        <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <User className="w-3.5 h-3.5 text-orange-600" />
        </div>
        <span>+91 {phone}</span>
        <button onClick={() => setStep('login')} className="ml-auto text-xs text-orange-500 hover:underline font-medium">Change</button>
      </div>

      {/* Address summary */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-start gap-3">
        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{form.buyerName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{form.buyerAddress}, {form.buyerPincode}</p>
        </div>
        <button onClick={() => setStep('address')} className="text-xs text-orange-500 hover:underline font-medium flex-shrink-0">Change</button>
      </div>

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Payment Method</h2>
            <p className="text-xs text-gray-500">
              {cartMode ? 'COD available for cart checkout' : 'Choose how you want to pay'}
            </p>
          </div>
        </div>

        {cartMode ? (
          // Cart mode: COD only
          <>
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-orange-400 bg-orange-50 cursor-pointer">
              <input type="radio" name="paymentMethod" value="cod" checked readOnly className="accent-orange-500" />
              <span className="text-xl flex-shrink-0">💵</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Pay when your order arrives</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
            </label>
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              <span className="text-base flex-shrink-0">ℹ️</span>
              <span>UPI and card payment are available on individual product pages. Cart checkout uses COD only.</span>
            </div>
          </>
        ) : (
          // Single product mode: all payment methods
          <>
            {([
              { value: 'upi', label: 'UPI / Net Banking', sub: 'PhonePe, GPay, Paytm, BHIM', icon: '⚡' },
              { value: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: '💳' },
              { value: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
            ] as const).map(({ value, label, sub, icon }) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  form.paymentMethod === value
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={value}
                  checked={form.paymentMethod === value}
                  onChange={() => setForm(f => ({ ...f, paymentMethod: value }))}
                  className="accent-orange-500"
                />
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
                {form.paymentMethod === value && (
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </label>
            ))}

            {form.paymentMethod === 'cod' && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <span className="text-base flex-shrink-0">ℹ️</span>
                <span>A refundable ₹49 security deposit may be required for COD orders in high-return areas. It is adjusted on delivery.</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Price summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
        {cartMode ? (
          <>
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({count} items)</span>
              <span className="font-['JetBrains_Mono',monospace]">{formatINR(cartTotal)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-gray-600">
            <span>Price × {quantity}</span>
            <span>{formatINR((product?.price_paise ?? 0) * quantity)}</span>
          </div>
        )}
        <div className="flex justify-between text-green-600">
          <span>Delivery</span>
          <span className="font-semibold">FREE</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
          <span>Total</span>
          <span className="font-['JetBrains_Mono',monospace]">{formatINR(totalPaise)}</span>
        </div>
      </div>

      {/* Place order */}
      <button
        onClick={handlePlaceOrder}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Processing…</>
        ) : cartMode ? (
          <>Place {count} Order{count !== 1 ? 's' : ''} · {formatINR(cartTotal)}</>
        ) : form.paymentMethod === 'cod' ? (
          <>Place COD Order · {formatINR(totalPaise)}</>
        ) : (
          <>Pay {formatINR(totalPaise)} Securely</>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pb-4">
        <div className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure payment</div>
        <div className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-green-500" /> Free delivery</div>
        <div className="flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5 text-green-500" /> 7-day returns</div>
      </div>
    </div>
  )
}
