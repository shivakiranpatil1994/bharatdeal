'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import type { Database } from '@/types/database'
import { ShoppingCart, Minus, Plus, Heart, Share2, ChevronRight, Check } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)

  if (!images.length) {
    return (
      <div className="aspect-square rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-tertiary)] text-sm">
        No image
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--bg-elevated)] relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[active]} alt={title} className="w-full h-full object-cover" />
      </div>
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={cn('w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all',
                active === i ? 'border-[var(--brand-primary)]' : 'border-transparent opacity-60 hover:opacity-100'
              )}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function AddToCartSection({ product }: { product: Product }) {
  const router = useRouter()
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? '')
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [copied, setCopied] = useState(false)

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

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-5">
      {/* Wishlist + Share row */}
      <div className="flex items-center gap-2 justify-end">
        <button onClick={() => setWishlisted(v => !v)}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
            wishlisted ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          )}>
          <Heart className={cn('w-3.5 h-3.5', wishlisted && 'fill-red-400')} />
          {wishlisted ? 'Saved' : 'Save'}
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Color selector */}
      {product.colors.length > 0 && (
        <div>
          <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide font-semibold">
            Colour <span className="normal-case font-normal text-[var(--text-primary)]">— {selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button key={color} onClick={() => setSelectedColor(color)}
                className={cn('px-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-200',
                  selectedColor === color
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                )}>
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {product.sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wide font-semibold">
              Size <span className="normal-case font-normal text-[var(--text-primary)]">— {selectedSize}</span>
            </p>
            <button className="flex items-center gap-1 text-xs text-[var(--brand-primary)]">
              Size guide <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button key={size} onClick={() => setSelectedSize(size)}
                className={cn('w-12 h-10 rounded-xl text-sm font-semibold border transition-all duration-200',
                  selectedSize === size
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                    : 'border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                )}>
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-xs text-[var(--text-secondary)] mb-2 uppercase tracking-wide font-semibold">Quantity</p>
        <div className="flex items-center gap-3">
          <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-xl border border-[var(--bg-border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all font-semibold text-lg">
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-['JetBrains_Mono',monospace] text-base font-bold text-[var(--text-primary)] w-8 text-center">
            {quantity}
          </span>
          <button onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="w-9 h-9 rounded-xl border border-[var(--bg-border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all font-semibold text-lg">
            <Plus className="w-4 h-4" />
          </button>
          {product.stock > 0 && product.stock <= 20 && (
            <span className="text-xs text-amber-400 font-medium">Only {product.stock} left</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <button onClick={handleBuyNow} disabled={isOutOfStock}
          className={cn('w-full h-13 py-3.5 rounded-2xl text-base font-bold transition-all duration-200 flex items-center justify-center gap-2',
            isOutOfStock
              ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed'
              : 'bg-[var(--brand-primary)] hover:bg-orange-600 text-white shadow-lg shadow-orange-900/30 active:scale-[0.98]'
          )}>
          <ShoppingCart className="w-5 h-5" />
          {isOutOfStock ? 'Out of Stock' : `Buy Now · ₹${Math.round((product.price_paise * quantity) / 100).toLocaleString('en-IN')}`}
        </button>

        <p className="text-[11px] text-center text-[var(--text-tertiary)]">
          COD available · ₹49 deposit for new buyers at high-RTO areas
        </p>
      </div>
    </div>
  )
}
