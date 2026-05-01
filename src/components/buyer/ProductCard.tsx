'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FlashDealTimer } from './FlashDealTimer'
import { useCart } from '@/context/CartContext'
import { formatINR } from '@/lib/utils'
import type { Database } from '@/types/database'
import { Zap, ShoppingCart, Check, Star, Truck } from 'lucide-react'
import { useState } from 'react'

type Product = Database['public']['Tables']['products']['Row']

function seedSold(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff
  return 50 + (Math.abs(h) % 950)
}

function seedRating(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) & 0xffffffff
  return 38 + (Math.abs(h) % 12)
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const isFlash =
    product.is_flash_deal && product.flash_ends_at && new Date(product.flash_ends_at) > new Date()
  const discountPct =
    product.mrp_paise && product.price_paise
      ? Math.round((1 - product.price_paise / product.mrp_paise) * 100)
      : (product.flash_discount_pct ?? 0)

  const imageUrl = product.images[0] ?? '/placeholder-product.jpg'
  const sold = seedSold(product.id)
  const rating = seedRating(product.id)

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    addItem({
      productId: product.id,
      title: product.title,
      image: imageUrl,
      pricePaise: product.price_paise,
      mrpPaise: product.mrp_paise ?? undefined,
      size: product.sizes[0] ?? undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative flex flex-col bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Discount badge */}
        {discountPct > 0 && (
          <div className="absolute top-0 left-0 bg-[#E8450A] text-white font-black text-[11px] px-2 py-0.5 rounded-br-lg">
            -{discountPct}%
          </div>
        )}

        {/* Flash badge */}
        {isFlash && (
          <div className="absolute top-0 right-0 flex items-center gap-0.5 bg-amber-500 px-1.5 py-0.5 rounded-bl-lg">
            <Zap className="w-2.5 h-2.5 text-white fill-white" />
            <span className="text-[9px] text-white font-black uppercase">Flash</span>
          </div>
        )}

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 ${
            added ? 'bg-green-500' : 'bg-[#E8450A]'
          }`}
        >
          {added ? (
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          ) : (
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 gap-1.5">
        {/* Price */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-['JetBrains_Mono',monospace] text-sm sm:text-[15px] font-extrabold text-[#E8450A] leading-none">
            {formatINR(product.price_paise)}
          </span>
          {product.mrp_paise && product.mrp_paise > product.price_paise && (
            <span className="font-['JetBrains_Mono',monospace] text-[10px] text-gray-400 line-through">
              {formatINR(product.mrp_paise)}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-[11px] sm:text-xs text-gray-600 line-clamp-2 leading-snug">
          {product.title}
        </p>

        {/* Rating + sold */}
        <div className="flex items-center gap-1.5 mt-auto">
          <div className="flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] text-amber-600 font-semibold">{(rating / 10).toFixed(1)}</span>
          </div>
          <span className="text-[10px] text-gray-300">|</span>
          <span className="text-[10px] text-gray-400">{sold.toLocaleString('en-IN')} sold</span>
        </div>

        {/* Free shipping */}
        <div className="flex items-center gap-1">
          <Truck className="w-2.5 h-2.5 text-green-500" />
          <span className="text-[10px] text-green-600 font-medium">Free shipping</span>
        </div>

        {/* Flash timer */}
        {isFlash && product.flash_ends_at && (
          <FlashDealTimer endsAt={product.flash_ends_at} className="mt-0.5" />
        )}

        {product.stock <= 10 && product.stock > 0 && (
          <p className="text-[10px] text-orange-500 font-semibold">Only {product.stock} left!</p>
        )}
      </div>
    </Link>
  )
}
