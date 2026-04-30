import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { FlashDealTimer } from './FlashDealTimer'
import { formatINR } from '@/lib/utils'
import type { Database } from '@/types/database'
import { Zap } from 'lucide-react'

type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const isFlash = product.is_flash_deal && product.flash_ends_at && new Date(product.flash_ends_at) > new Date()
  const discountPct = product.mrp_paise && product.price_paise
    ? Math.round((1 - product.price_paise / product.mrp_paise) * 100)
    : product.flash_discount_pct ?? 0

  const imageUrl = product.images[0] ?? '/placeholder-product.jpg'

  return (
    <Link
      href={`/products/${product.id}`}
      className={[
        'group block bg-[var(--bg-surface)] border rounded-xl overflow-hidden',
        'transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:shadow-lg hover:shadow-black/50',
        isFlash
          ? 'border-[var(--brand-primary)] animate-pulse hover:animate-none'
          : 'border-[var(--bg-border)]',
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[var(--bg-elevated)]">
        <Image
          src={imageUrl}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        {discountPct > 0 && (
          <Badge className="absolute top-2 left-2 bg-[var(--brand-primary)] text-white border-0 text-[10px] px-1.5 py-0.5 font-semibold">
            {discountPct}% OFF
          </Badge>
        )}
        {isFlash && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded-full px-2 py-0.5">
            <Zap className="w-3 h-3 text-[var(--brand-secondary)] fill-[var(--brand-secondary)]" />
            <span className="text-[10px] text-[var(--brand-secondary)] font-semibold uppercase">Flash</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-[var(--text-secondary)] truncate leading-tight">{product.title}</p>
        {product.title_hindi && (
          <p className="text-[10px] text-[var(--text-tertiary)] font-devanagari truncate">{product.title_hindi}</p>
        )}

        <div className="flex items-baseline gap-2">
          <span className="font-mono-price text-base font-semibold text-[var(--brand-primary)]">
            {formatINR(product.price_paise)}
          </span>
          {product.mrp_paise && product.mrp_paise > product.price_paise && (
            <span className="font-mono-price text-xs text-[var(--text-tertiary)] line-through">
              {formatINR(product.mrp_paise)}
            </span>
          )}
        </div>

        {isFlash && product.flash_ends_at && (
          <FlashDealTimer endsAt={product.flash_ends_at} className="mt-1" />
        )}

        {product.stock <= 10 && product.stock > 0 && (
          <p className="text-[10px] text-amber-400">Only {product.stock} left</p>
        )}
      </div>
    </Link>
  )
}
