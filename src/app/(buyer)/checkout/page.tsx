import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Truck, RefreshCw, Lock } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase'
import CheckoutForm from '@/components/buyer/CheckoutForm'
import { CartOrderSummary } from '@/components/buyer/CartOrderSummary'
import { formatINR } from '@/lib/utils'

interface SearchParams {
  productId?: string
  quantity?: string
  size?: string
  color?: string
  cart?: string
}

export const dynamic = 'force-dynamic'

async function getProduct(productId: string) {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('products')
    .select('id, title, price_paise, mrp_paise, images, sizes, colors, stock, active, manufacturers(name, city)')
    .eq('id', productId)
    .eq('active', true)
    .single()
  return data
}

// Shared header/steps shell
function CheckoutShell({ backHref, children }: { backHref: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <span className="font-bold text-gray-900 text-lg">
            Bharat<span className="text-orange-500">Deal</span>
          </span>
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-sm text-gray-600 font-medium">Secure Checkout</span>
          <Lock className="w-3.5 h-3.5 text-green-500 ml-0.5" />
        </div>
      </header>
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2 text-xs font-medium">
          {['Login', 'Address', 'Payment'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-gray-200" />}
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </div>
                <span className={i === 0 ? 'text-orange-600' : 'text-gray-400'}>{step}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { productId, quantity: qtyStr, size, color, cart } = params

  // ── CART MODE ──
  if (cart === '1') {
    return (
      <CheckoutShell backHref="/cart">
        <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
          <div className="lg:grid lg:grid-cols-[1fr_340px] gap-6">
            <div>
              <Suspense>
                <CheckoutForm cartMode={true} />
              </Suspense>
            </div>
            <div className="hidden lg:block">
              <CartOrderSummary />
            </div>
          </div>
        </main>
      </CheckoutShell>
    )
  }

  // ── SINGLE PRODUCT MODE ──
  if (!productId) notFound()
  const product = await getProduct(productId)
  if (!product) notFound()

  const quantity = Math.max(1, Math.min(10, parseInt(qtyStr ?? '1', 10) || 1))
  if (product.stock < quantity) notFound()

  const totalPaise = product.price_paise * quantity
  const mfr = product.manufacturers as { name: string; city: string } | null
  const discountPct = product.mrp_paise && product.mrp_paise > product.price_paise
    ? Math.round((1 - product.price_paise / product.mrp_paise) * 100)
    : 0

  return (
    <CheckoutShell backHref={`/products/${product.id}`}>
      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
        <div className="lg:grid lg:grid-cols-[1fr_340px] gap-6">
          <div>
            <Suspense>
              <CheckoutForm
                product={{ id: product.id, title: product.title, price_paise: product.price_paise, images: product.images }}
                quantity={quantity}
                size={size}
                color={color}
              />
            </Suspense>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Order Summary</p>
                <div className="flex gap-3">
                  {product.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.images[0]} alt={product.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{product.title}</p>
                    {mfr && <p className="text-xs text-gray-400 mt-0.5">{mfr.name}, {mfr.city}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {size && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Size: {size}</span>}
                      {color && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{color}</span>}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Qty: {quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Price ({quantity} item{quantity > 1 ? 's' : ''})</span>
                  <span>{formatINR(product.price_paise * quantity)}</span>
                </div>
                {discountPct > 0 && product.mrp_paise && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({discountPct}% off)</span>
                    <span>-{formatINR((product.mrp_paise - product.price_paise) * quantity)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-green-600">
                  <span>Delivery</span>
                  <span className="font-semibold">FREE</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-xl font-['JetBrains_Mono',monospace]">{formatINR(totalPaise)}</span>
                </div>
                {discountPct > 0 && product.mrp_paise && (
                  <p className="text-xs text-green-600 font-medium text-right">
                    You save {formatINR((product.mrp_paise - product.price_paise) * quantity)}
                  </p>
                )}
              </div>
              <div className="border-t border-gray-100 p-4 grid grid-cols-3 gap-2">
                {[
                  { icon: ShieldCheck, label: 'Secure' },
                  { icon: Truck, label: 'Free Ship' },
                  { icon: RefreshCw, label: '7-Day Return' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 text-center">
                    <Icon className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </CheckoutShell>
  )
}
