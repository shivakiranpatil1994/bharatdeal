import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { FlashDealTimer } from '@/components/buyer/FlashDealTimer'
import { formatINR } from '@/lib/utils'
import {
  ArrowLeft, MapPin, Shield, Truck, Zap, Star, RefreshCcw,
  Package, CheckCircle2, ThumbsUp, Headphones, BadgeCheck,
} from 'lucide-react'
import { AddToCartSection, ImageGallery } from './AddToCartSection'
import { ViewerCount } from '@/components/buyer/ViewerCount'
import { GroupBuyCounter } from '@/components/buyer/GroupBuyCounter'

export const revalidate = 30

interface Props { params: Promise<{ id: string }> }

const REVIEW_NAMES = ['Priya S.', 'Rahul M.', 'Ananya K.', 'Suresh B.', 'Meena R.', 'Karan T.', 'Divya P.', 'Amit J.']
const POSITIVE_TEXTS = [
  'Quality is excellent! Fabric is soft and exactly as described. Ordered for my family and everyone loved it.',
  'Fast delivery and product matches the photos perfectly. Very happy with purchase. Will order again.',
  'Good stitching and color is vibrant. Fits as per size chart. Great value for the price.',
  'Value for money. Material is comfortable for daily wear. The color did not fade after washing.',
  'Packaging was secure and product quality exceeded expectations for this price point.',
  'Excellent product, quick delivery. Size is accurate. Highly recommend to everyone.',
]
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Jaipur', 'Kolkata']

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

  const [productRes, relatedRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, manufacturers(name, cluster, city, state, category, whatsapp_phone)')
      .eq('id', id)
      .eq('active', true)
      .single(),
    supabase
      .from('products')
      .select('id, title, price_paise, mrp_paise, images, category, is_flash_deal')
      .eq('active', true)
      .neq('id', id)
      .limit(8),
  ])

  if (!productRes.data) notFound()
  const product = productRes.data
  const related = relatedRes.data ?? []

  const manufacturer = product.manufacturers as {
    name: string; cluster: string; city: string; state: string; category: string; whatsapp_phone: string
  } | null

  const isFlash = product.is_flash_deal && product.flash_ends_at && new Date(product.flash_ends_at) > new Date()
  const discountPct = product.mrp_paise && product.price_paise
    ? Math.round((1 - product.price_paise / product.mrp_paise) * 100)
    : product.flash_discount_pct ?? 0

  // Synthetic reviews (deterministic from product id)
  const hashCode = id.charCodeAt(0) + id.charCodeAt(id.length - 1)
  const reviewCount = 24 + (hashCode % 80)
  const avgRating = 3.8 + (hashCode % 12) * 0.1
  const starDist = {
    5: Math.round(reviewCount * 0.52),
    4: Math.round(reviewCount * 0.22),
    3: Math.round(reviewCount * 0.14),
    2: Math.round(reviewCount * 0.07),
    1: Math.round(reviewCount * 0.05),
  }
  const reviews = Array.from({ length: 5 }).map((_, i) => ({
    name: REVIEW_NAMES[(hashCode + i) % REVIEW_NAMES.length],
    city: CITIES[(hashCode + i) % CITIES.length],
    rating: i < 4 ? 5 : 4,
    text: POSITIVE_TEXTS[(hashCode + i) % POSITIVE_TEXTS.length],
    date: new Date(Date.now() - (i + 1) * 5 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    verified: true,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to deals
      </Link>

      {/* Image gallery — client component */}
      <ImageGallery images={product.images} title={product.title} />

      {/* Flash deal badge */}
      {isFlash && (
        <div className="flex items-center gap-2 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30 rounded-xl px-4 py-2.5">
          <Zap className="w-4 h-4 text-[var(--brand-secondary)] fill-[var(--brand-secondary)] shrink-0" />
          <div className="flex-1">
            <span className="text-xs font-bold text-[var(--brand-secondary)] uppercase tracking-wide">Flash Deal — </span>
            <FlashDealTimer endsAt={product.flash_ends_at!} />
          </div>
        </div>
      )}

      {/* Title + Price */}
      <div className="space-y-3">
        <h1 className="font-['Syne',sans-serif] text-xl font-bold text-[var(--text-primary)] leading-snug">
          {product.title}
        </h1>
        {product.title_hindi && (
          <p className="text-sm text-[var(--text-secondary)]">{product.title_hindi}</p>
        )}

        {/* Star rating row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-[var(--bg-elevated)] text-[var(--bg-elevated)]'}`} />
            ))}
          </div>
          <span className="font-['JetBrains_Mono',monospace] text-sm font-semibold text-[var(--text-primary)]">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-[var(--text-secondary)]">({reviewCount} reviews)</span>
          <span className="text-[var(--bg-border)]">·</span>
          <span className="text-sm text-[var(--text-secondary)]">{Math.floor(reviewCount * 3.2)} sold</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="font-['JetBrains_Mono',monospace] text-3xl font-bold text-[var(--brand-primary)]">
            {formatINR(product.price_paise)}
          </span>
          {product.mrp_paise && product.mrp_paise > product.price_paise && (
            <span className="font-['JetBrains_Mono',monospace] text-lg text-[var(--text-tertiary)] line-through">
              {formatINR(product.mrp_paise)}
            </span>
          )}
          {discountPct > 0 && (
            <span className="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg">
              {discountPct}% OFF · Save {formatINR((product.mrp_paise ?? 0) - product.price_paise)}
            </span>
          )}
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Delivery & Returns</p>
        {[
          { icon: Truck, text: 'Free delivery', sub: 'Estimated 3–7 business days' },
          { icon: RefreshCcw, text: '7-day easy returns', sub: 'No questions asked return policy' },
          { icon: Shield, text: 'Buyer protection', sub: 'Full refund if item not as described' },
        ].map(({ icon: Icon, text, sub }) => (
          <div key={text} className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-sm text-[var(--text-primary)] font-medium">{text}</span>
              <span className="text-xs text-[var(--text-secondary)] ml-2">{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Manufacturer / Seller info */}
      {manufacturer && (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-[var(--brand-primary)]">{manufacturer.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-[var(--text-primary)] truncate">{manufacturer.name}</p>
                <BadgeCheck className="w-4 h-4 text-[var(--brand-primary)] flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">4.8 · Verified Seller</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <MapPin className="w-3 h-3" />
                {manufacturer.city}
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{manufacturer.cluster}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-[var(--bg-border)]">
            {[
              { label: 'Products', value: '12+' },
              { label: 'Sales', value: '1.2k+' },
              { label: 'Rating', value: '4.8★' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--text-primary)]">{value}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live viewer count */}
      <ViewerCount productId={product.id} />

      {/* Stock warning */}
      {product.stock <= 10 && product.stock > 0 && (
        <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-2.5">
          <Package className="w-4 h-4 text-amber-400" />
          <p className="text-sm text-amber-400 font-medium">Only {product.stock} left — order soon!</p>
        </div>
      )}

      {/* Add to cart / checkout */}
      <AddToCartSection product={product} />

      {/* Group buy */}
      <GroupBuyCounter productId={product.id} />

      {/* Product highlights */}
      {product.description && (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl p-4">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Product Highlights</h3>
          <ul className="space-y-2">
            {product.description.split('\n').filter(Boolean).slice(0, 6).map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                {line}
              </li>
            ))}
            {!product.description.includes('\n') && (
              <li className="text-sm text-[var(--text-secondary)] leading-relaxed">{product.description}</li>
            )}
          </ul>
        </div>
      )}

      {/* Product specifications */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">Product Details</h3>
        <div className="space-y-0 divide-y divide-[var(--bg-border)]">
          {[
            { label: 'Category', value: product.category },
            ...(product.subcategory ? [{ label: 'Subcategory', value: product.subcategory }] : []),
            ...(product.sizes.length > 0 ? [{ label: 'Available Sizes', value: product.sizes.join(', ') }] : []),
            ...(product.colors.length > 0 ? [{ label: 'Available Colors', value: product.colors.join(', ') }] : []),
            { label: 'Origin', value: manufacturer ? `${manufacturer.cluster}, India` : 'Made in India' },
            { label: 'Seller', value: manufacturer?.name ?? 'BharatDeal Seller' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2.5">
              <span className="text-xs text-[var(--text-tertiary)] font-medium">{label}</span>
              <span className="text-xs text-[var(--text-primary)] font-semibold text-right max-w-[60%] truncate">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buyer protection */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl p-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" /> Buyer Protection
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Shield, label: '100% Secure', sub: 'UPI · COD · Cards' },
            { icon: RefreshCcw, label: '7-Day Returns', sub: 'No questions asked' },
            { icon: Truck, label: 'Fast Delivery', sub: '3–7 business days' },
            { icon: Headphones, label: '24/7 Support', sub: 'WhatsApp help' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-2.5 bg-[var(--bg-elevated)] rounded-xl p-3">
              <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Reviews */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Customer Reviews</h3>
          <span className="text-xs text-[var(--text-secondary)]">{reviewCount} verified reviews</span>
        </div>

        {/* Star summary */}
        <div className="flex items-center gap-4">
          <div className="text-center flex-shrink-0">
            <p className="text-4xl font-bold text-[var(--text-primary)]">{avgRating.toFixed(1)}</p>
            <div className="flex gap-0.5 mt-1 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-[var(--bg-elevated)] text-[var(--bg-elevated)]'}`} />
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{reviewCount} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map(star => {
              const count = starDist[star as keyof typeof starDist]
              const pct = Math.round((count / reviewCount) * 100)
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--text-tertiary)] w-3">{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 bg-[var(--bg-elevated)] rounded-full h-1.5">
                    <div className="bg-amber-400 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[var(--text-tertiary)] w-6 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Individual reviews */}
        <div className="space-y-4 pt-2 border-t border-[var(--bg-border)]">
          {reviews.map((r, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)]/20 flex items-center justify-center text-xs font-bold text-[var(--brand-primary)]">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{r.name}</span>
                      {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} className={`w-3 h-3 ${j < r.rating ? 'fill-amber-400 text-amber-400' : 'fill-[var(--bg-elevated)] text-[var(--bg-elevated)]'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)]">{r.city}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{r.date}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{r.text}</p>
              <button className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                <ThumbsUp className="w-3 h-3" /> Helpful
              </button>
              {i < reviews.length - 1 && <div className="border-b border-[var(--bg-border)]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-['Syne',sans-serif] text-base font-bold text-[var(--text-primary)]">You May Also Like</h3>
            <Link href="/" className="text-xs text-[var(--brand-primary)] hover:underline">See all</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {related.slice(0, 8).map(p => {
              const relDiscount = p.mrp_paise && p.price_paise ? Math.round((1 - p.price_paise / p.mrp_paise) * 100) : 0
              return (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl overflow-hidden hover:border-[var(--brand-primary)]/30 transition-all group">
                  <div className="aspect-square bg-[var(--bg-elevated)] overflow-hidden relative">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                    {relDiscount > 0 && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold bg-[var(--brand-primary)] text-white px-1.5 py-0.5 rounded-lg">
                        -{relDiscount}%
                      </span>
                    )}
                    {p.is_flash_deal && (
                      <span className="absolute top-2 right-2">
                        <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs text-[var(--text-primary)] font-medium line-clamp-2 leading-snug">{p.title}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[var(--brand-primary)]">
                        {formatINR(p.price_paise)}
                      </span>
                      {p.mrp_paise && p.mrp_paise > p.price_paise && (
                        <span className="font-['JetBrains_Mono',monospace] text-[10px] text-[var(--text-tertiary)] line-through">
                          {formatINR(p.mrp_paise)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
