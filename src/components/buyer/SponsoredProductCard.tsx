'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatINRFromPaise, getOrCreateSessionId } from '@/lib/adHelpers'
import { track } from '@/lib/analytics'

interface SponsoredProduct {
  id:            string
  title:         string
  price_paise:   number
  mrp_paise?:    number | null
  images:        string[]
  category:      string
  impressionId?: string
  isSponsored?:  boolean
}

interface Props {
  product:       SponsoredProduct
  buyerPincode?: string
}

export function SponsoredProductCard({ product, buyerPincode }: Props) {
  const router = useRouter()

  async function handleClick() {
    track('product_viewed', { product_id: product.id, is_sponsored: true }, {
      pincode: buyerPincode, productId: product.id,
    })

    if (product.impressionId) {
      fetch('/api/ads/click', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impressionId: product.impressionId,
          buyerPincode: buyerPincode ?? null,
        }),
      }).catch(console.error)
    }

    router.push(`/products/${product.id}`)
  }

  const rawImage = product.images?.[0] ?? ''
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const imageUrl = rawImage.startsWith('http')
    ? rawImage
    : rawImage && cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/upload/w_400,h_400,c_fill,f_auto,q_auto/${rawImage}`
      : '/placeholder-product.jpg'

  const discountPct = product.mrp_paise && product.mrp_paise > product.price_paise
    ? Math.round((1 - product.price_paise / product.mrp_paise) * 100)
    : null

  return (
    <div
      onClick={handleClick}
      className="
        group relative cursor-pointer rounded-xl overflow-hidden
        bg-[--bg-surface] border border-[--bg-border]
        hover:border-[--brand-primary]/40 hover:shadow-lg hover:shadow-black/30
        transition-all duration-200
      "
    >
      {product.isSponsored && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Sponsored
        </div>
      )}

      {discountPct && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[10px] font-medium bg-[--brand-primary]/10 text-[--brand-primary] border border-[--brand-primary]/20">
          {discountPct}% off
        </div>
      )}

      <div className="aspect-square w-full overflow-hidden bg-[--bg-elevated]">
        <Image
          src={imageUrl}
          alt={product.title}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />
      </div>

      <div className="p-3">
        <p className="text-[13px] text-[--text-secondary] line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.title}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] font-semibold text-[--brand-primary] font-mono">
            {formatINRFromPaise(product.price_paise)}
          </span>
          {product.mrp_paise && product.mrp_paise > product.price_paise && (
            <span className="text-[12px] text-[--text-tertiary] line-through font-mono">
              {formatINRFromPaise(product.mrp_paise)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
