'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import type { Database } from '@/types/database'
import { ShoppingCart } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

export function AddToCartSection({ product }: { product: Product }) {
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? '')
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] ?? '')
  const [quantity, setQuantity] = useState(1)

  const isOutOfStock = product.stock === 0

  function handleBuyNow() {
    track('checkout_started', { productId: product.id }, { productId: product.id })
    const params = new URLSearchParams({
      productId: product.id,
      quantity: String(quantity),
      ...(selectedSize && { size: selectedSize }),
      ...(selectedColor && { color: selectedColor }),
    })
    router.push(`/checkout?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      {/* Size selector */}
      {product.sizes.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
                  selectedSize === size
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color selector */}
      {product.colors.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Colour</p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200',
                  selectedColor === color
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-8 h-8 rounded-lg border border-[var(--bg-border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-200"
          >
            −
          </button>
          <span className="font-mono-price text-base font-semibold text-[var(--text-primary)] w-6 text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="w-8 h-8 rounded-lg border border-[var(--bg-border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all duration-200"
          >
            +
          </button>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={handleBuyNow}
        disabled={isOutOfStock}
        className={cn(
          'w-full h-12 text-base font-semibold transition-all duration-200',
          isOutOfStock
            ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed'
            : 'bg-[var(--brand-primary)] hover:bg-orange-600 text-white shadow-lg shadow-orange-900/30'
        )}
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
      </Button>

      <p className="text-[11px] text-center text-[var(--text-tertiary)]">
        COD available · ₹49 deposit for new buyers at high-RTO areas
      </p>
    </div>
  )
}
