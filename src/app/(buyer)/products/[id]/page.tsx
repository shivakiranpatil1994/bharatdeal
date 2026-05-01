import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createSupabaseServer } from '@/lib/supabase'
import { FlashDealTimer } from '@/components/buyer/FlashDealTimer'
import { Badge } from '@/components/ui/badge'
import { formatINR } from '@/lib/utils'
import { ArrowLeft, MapPin, Shield, Truck, Zap } from 'lucide-react'
import { AddToCartSection } from './AddToCartSection'
import { ViewerCount } from '@/components/buyer/ViewerCount'
import { GroupBuyCounter } from '@/components/buyer/GroupBuyCounter'

export const revalidate = 30

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const { data } = await supabase.from('products').select('title, description').eq('id', id).single()
  if (!data) return { title: 'Product Not Found' }
  return {
    title: `${data.title} — BharatDeal`,
    description: data.description ?? 'Buy factory direct on BharatDeal',
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createSupabaseServer()

  const { data: product } = await supabase
    .from('products')
    .select('*, manufacturers(name, cluster, city, state)')
    .eq('id', id)
    .eq('active', true)
    .single()

  if (!product) notFound()

  const manufacturer = product.manufacturers as { name: string; cluster: string; city: string; state: string } | null
  const isFlash = product.is_flash_deal && product.flash_ends_at && new Date(product.flash_ends_at) > new Date()
  const discountPct = product.mrp_paise && product.price_paise
    ? Math.round((1 - product.price_paise / product.mrp_paise) * 100)
    : product.flash_discount_pct ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to deals
      </Link>

      <div className="space-y-5">
        {/* Image carousel — single image for MVP */}
        <div
          className={[
            'relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-elevated)]',
            isFlash ? 'ring-2 ring-[var(--brand-primary)]' : '',
          ].join(' ')}
        >
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)] text-sm">
              No image
            </div>
          )}
          {discountPct > 0 && (
            <Badge className="absolute top-3 left-3 bg-[var(--brand-primary)] text-white border-0 text-sm px-2 py-1 font-semibold">
              {discountPct}% OFF
            </Badge>
          )}
          {isFlash && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/80 rounded-full px-3 py-1">
              <Zap className="w-3.5 h-3.5 text-[var(--brand-secondary)] fill-[var(--brand-secondary)]" />
              <span className="text-xs text-[var(--brand-secondary)] font-semibold uppercase tracking-wide">Flash Deal</span>
            </div>
          )}

          {/* Additional images strip */}
          {product.images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-4">
              {product.images.slice(0, 6).map((img, i) => (
                <div key={i} className="w-10 h-10 rounded-md overflow-hidden border-2 border-white/20">
                  <Image src={img} alt="" width={40} height={40} className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title + Price */}
        <div className="space-y-2">
          <h1 className="font-['Syne',sans-serif] text-xl font-700 text-[var(--text-primary)] leading-snug">
            {product.title}
          </h1>
          {product.title_hindi && (
            <p className="text-sm text-[var(--text-secondary)] font-devanagari">{product.title_hindi}</p>
          )}

          <div className="flex items-baseline gap-3">
            <span className="font-mono-price text-3xl font-semibold text-[var(--brand-primary)]">
              {formatINR(product.price_paise)}
            </span>
            {product.mrp_paise && product.mrp_paise > product.price_paise && (
              <span className="font-mono-price text-lg text-[var(--text-tertiary)] line-through">
                {formatINR(product.mrp_paise)}
              </span>
            )}
            {discountPct > 0 && (
              <span className="text-sm font-semibold text-emerald-400">
                You save {formatINR(product.mrp_paise! - product.price_paise)}
              </span>
            )}
          </div>

          {isFlash && product.flash_ends_at && (
            <div className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--brand-primary)]/30 rounded-lg px-3 py-2">
              <Zap className="w-4 h-4 text-[var(--brand-secondary)] fill-[var(--brand-secondary)] shrink-0" />
              <FlashDealTimer endsAt={product.flash_ends_at} />
            </div>
          )}
        </div>

        {/* Manufacturer info */}
        {manufacturer && (
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <MapPin className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
            <span>
              Made in <span className="text-[var(--text-primary)] font-medium">{manufacturer.cluster}</span>
              {' · '}{manufacturer.city}, {manufacturer.state}
            </span>
          </div>
        )}

        {/* Live viewer count */}
        <ViewerCount productId={product.id} />

        {/* Stock warning */}
        {product.stock <= 10 && product.stock > 0 && (
          <p className="text-sm text-amber-400 font-medium">
            ⚡ Only {product.stock} left in stock
          </p>
        )}

        {/* Add to cart / checkout — Client Component */}
        <AddToCartSection product={product} />

        {/* Group buy */}
        <GroupBuyCounter productId={product.id} />

        {/* Description */}
        {product.description && (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">About this product</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>
        )}

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: 'Secure Payment', sub: 'UPI & COD' },
            { icon: Truck, label: 'Fast Delivery', sub: '3–7 days' },
            { icon: MapPin, label: 'Made in India', sub: manufacturer?.cluster ?? 'Indian Factory' },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-3 text-center"
            >
              <Icon className="w-5 h-5 text-[var(--text-tertiary)] mx-auto mb-1" />
              <p className="text-[11px] font-semibold text-[var(--text-primary)]">{label}</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
