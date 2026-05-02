'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { useCart } from '@/context/CartContext'
import type { Database } from '@/types/database'
import { ShoppingCart, Minus, Plus, Heart, Share2, ChevronRight, Check, ZoomIn, PackagePlus } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

export function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  if (!images.length) {
    return (
      <div className="aspect-square rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
        No image
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="aspect-square rounded-2xl overflow-hidden bg-white border border-gray-100 relative cursor-zoom-in group"
        onClick={() => setZoomed(v => !v)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={title}
          className={cn('w-full h-full object-cover transition-transform duration-500', zoomed ? 'scale-150' : 'group-hover:scale-105')}
        />
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all',
                active === i
                  ? 'border-orange-500 shadow-sm shadow-orange-100'
                  : 'border-gray-200 opacity-60 hover:opacity-100'
              )}
            >
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
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? '')
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] ?? '')
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const isOutOfStock = product.stock === 0

  function handleAddToCart() {
    addItem({
      productId: product.id,
      title: product.title,
      image: product.images[0] ?? '',
      pricePaise: product.price_paise,
      mrpPaise: product.mrp_paise ?? undefined,
      quantity,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
    })
    track('add_to_cart', { productId: product.id }, { productId: product.id })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

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
        <button
          onClick={() => setWishlisted(v => !v)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
            wishlisted
              ? 'border-red-200 bg-red-50 text-red-500'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          )}
        >
          <Heart className={cn('w-3.5 h-3.5', wishlisted && 'fill-red-500')} />
          {wishlisted ? 'Saved' : 'Wishlist'}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Share'}
        </button>
      </div>

      {/* Color selector */}
      {product.colors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Colour: <span className="normal-case font-semibold text-gray-900">{selectedColor}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                  selectedColor === color
                    ? 'border-orange-500 bg-orange-50 text-orange-600 font-semibold'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Size: <span className="normal-case font-semibold text-gray-900">{selectedSize}</span>
            </p>
            <button className="flex items-center gap-1 text-xs text-orange-600 hover:underline">
              Size Guide <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  'w-12 h-10 rounded-lg text-sm font-semibold border transition-all',
                  selectedSize === size
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quantity</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-['JetBrains_Mono',monospace] text-base font-bold text-gray-900 w-8 text-center">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
          {product.stock > 0 && product.stock <= 20 && (
            <span className="text-xs text-amber-600 font-medium">Only {product.stock} left</span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3 pt-1">
        {isOutOfStock ? (
          <div className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 font-bold text-base flex items-center justify-center gap-2 cursor-not-allowed">
            <PackagePlus className="w-5 h-5" /> Out of Stock
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className={cn(
                'py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border-2',
                addedToCart
                  ? 'border-green-500 bg-green-50 text-green-600'
                  : 'border-orange-500 bg-white text-orange-600 hover:bg-orange-50 active:scale-[0.98]'
              )}
            >
              {addedToCart
                ? <><Check className="w-4 h-4" /> Added!</>
                : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
            </button>

            {/* Buy Now */}
            <button
              onClick={handleBuyNow}
              className="py-3.5 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Buy Now
            </button>
          </div>
        )}

        <p className="text-[11px] text-center text-gray-400">
          COD available · ₹49 deposit for new buyers at high-RTO areas
        </p>
      </div>
    </div>
  )
}
