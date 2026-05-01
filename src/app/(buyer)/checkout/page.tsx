import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Truck, RefreshCw } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase'
import CheckoutForm from '@/components/buyer/CheckoutForm'

interface SearchParams {
  productId?: string
  quantity?: string
  size?: string
  color?: string
}

export const dynamic = 'force-dynamic'

async function getProduct(productId: string) {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('products')
    .select('id, title, price_paise, mrp_paise, images, sizes, colors, stock, active')
    .eq('id', productId)
    .eq('active', true)
    .single()
  return data
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { productId, quantity: qtyStr, size, color } = params

  if (!productId) notFound()

  const product = await getProduct(productId)
  if (!product) notFound()

  const quantity = Math.max(1, Math.min(10, parseInt(qtyStr ?? '1', 10) || 1))

  if (product.stock < quantity) notFound()

  const totalPaise = product.price_paise * quantity

  function formatINR(paise: number) {
    return `₹${(paise / 100).toLocaleString('en-IN')}`
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-base)]/90 backdrop-blur border-b border-[var(--bg-border)]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={`/products/${product.id}`}
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </Link>
          <h1 className="font-bold text-[var(--text-primary)]">Checkout</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 pb-24 flex flex-col gap-6">
        {/* Trust bar */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: 'Secure Payment' },
            { icon: Truck, label: 'Fast Delivery' },
            { icon: RefreshCw, label: 'Easy Returns' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 py-3 px-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl"
            >
              <Icon className="w-4 h-4 text-[var(--brand-accent)]" />
              <span className="text-xs text-[var(--text-secondary)] text-center">{label}</span>
            </div>
          ))}
        </div>

        {/* Price summary */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4">
          <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-1">
            <span>
              {formatINR(product.price_paise)} × {quantity}
            </span>
            <span className="font-mono">{formatINR(product.price_paise * quantity)}</span>
          </div>
          <div className="flex justify-between text-sm text-[var(--text-secondary)] mb-3">
            <span>Delivery</span>
            <span className="text-[var(--brand-accent)] font-medium">FREE</span>
          </div>
          <div className="border-t border-[var(--bg-border)] pt-3 flex justify-between font-bold">
            <span className="text-[var(--text-primary)]">Total</span>
            <span className="font-mono text-xl text-[var(--brand-primary)]">
              {formatINR(totalPaise)}
            </span>
          </div>
        </div>

        <Suspense>
          <CheckoutForm
            product={{
              id: product.id,
              title: product.title,
              price_paise: product.price_paise,
              images: product.images,
            }}
            quantity={quantity}
            size={size}
            color={color}
          />
        </Suspense>
      </main>
    </div>
  )
}
