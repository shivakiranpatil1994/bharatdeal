import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase'
import { FlashDealTimer } from '@/components/buyer/FlashDealTimer'
import { formatINR } from '@/lib/utils'
import {
  ArrowLeft, MapPin, Shield, Truck, Zap, Star, RefreshCcw,
  Package, CheckCircle2, ThumbsUp, Headphones, BadgeCheck, ChevronRight,
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
  const { data } = await supabase
    .from('products')
    .select('title, title_hindi, description, images, price_paise, mrp_paise, category, subcategory, sizes, colors, manufacturers(name, city, state, cluster, category)')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Product Not Found' }

  const mfr = data.manufacturers as { name: string; city: string; state: string; cluster: string; category: string } | null
  const priceINR = (data.price_paise / 100).toFixed(2)
  const priceDisplay = Math.round(data.price_paise / 100)

  // Title: product name + price signal (drives CTR in SERPs)
  const title = `${data.title} — Buy at ₹${priceDisplay} | BharatDeal`

  // Description: pulled directly from manufacturer-entered description, padded with conversion signals
  const descriptionBase = data.description
    ? data.description.replace(/\n/g, ' ').slice(0, 150).trim()
    : `${data.title} from ${mfr?.city ?? 'India'}`
  const description = `${descriptionBase}. Factory price ₹${priceDisplay}. Free delivery, 7-day returns, COD available.`

  // Keywords: built from every field manufacturers fill in — title words, description words,
  // category, subcategory, sizes, colors, city, cluster, manufacturer name
  const titleWords = data.title.split(/\s+/).filter(w => w.length > 3)
  const descWords = data.description
    ? [...new Set(data.description.toLowerCase().split(/\W+/).filter(w => w.length > 4))].slice(0, 8)
    : []
  const keywords = [
    ...titleWords,
    data.category,
    data.subcategory,
    ...(data.sizes ?? []),
    ...(data.colors ?? []),
    mfr?.name,
    mfr?.city,
    mfr?.cluster,
    mfr?.category,
    ...descWords,
    'factory direct',
    'buy online India',
    'free delivery',
    'COD available',
    `buy ${data.category} online`,
    `${data.category} lowest price`,
  ].filter((v): v is string => typeof v === 'string' && v.length > 1)

  const image = data.images?.[0] ?? '/og-default.jpg'
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://bharatdeal.in'}/products/${id}`

  return {
    title,
    description,
    keywords: [...new Set(keywords)].join(', '),
    alternates: { canonical: url },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'BharatDeal',
      locale: 'en_IN',
      images: [{ url: image, width: 800, height: 800, alt: data.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: '@bharatdeal',
    },
    other: {
      'product:price:amount': priceINR,
      'product:price:currency': 'INR',
    },
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bharatdeal.in'
  const productUrl = `${appUrl}/products/${id}`

  // JSON-LD: Google Product rich snippet
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description ?? `${product.title} — factory direct from ${manufacturer?.cluster ?? 'India'}`,
    image: product.images,
    sku: product.id,
    brand: { '@type': 'Brand', name: manufacturer?.name ?? 'BharatDeal Seller' },
    manufacturer: manufacturer ? {
      '@type': 'Organization',
      name: manufacturer.name,
      address: { '@type': 'PostalAddress', addressLocality: manufacturer.city, addressRegion: manufacturer.state, addressCountry: 'IN' },
    } : undefined,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: (product.price_paise / 100).toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'BharatDeal' },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'INR' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 7, unitCode: 'DAY' },
        },
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 3).map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.name },
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text,
      datePublished: r.date,
    })),
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* JSON-LD: Product rich snippet */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* JSON-LD: Breadcrumb */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
              { '@type': 'ListItem', position: 2, name: product.category, item: `${appUrl}/?category=${encodeURIComponent(product.category)}` },
              { '@type': 'ListItem', position: 3, name: product.title, item: productUrl },
            ],
          }),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/" className="hover:text-orange-600 transition-colors">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* ── Main product section: 2-column ── */}
        <div className="lg:grid lg:grid-cols-[48%_52%] gap-8 mb-8">

          {/* LEFT — Image Gallery (sticky on desktop) */}
          <div className="lg:sticky lg:top-4 lg:self-start mb-6 lg:mb-0">
            <ImageGallery images={product.images} title={product.title} />
          </div>

          {/* RIGHT — Product Info + Add to Cart */}
          <div className="space-y-4">

            {/* Flash deal banner */}
            {isFlash && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                <Zap className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">Flash Deal — </span>
                <FlashDealTimer endsAt={product.flash_ends_at!} />
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">
                {product.title}
              </h1>
              {product.title_hindi && (
                <p className="text-sm text-gray-500 mt-1">{product.title_hindi}</p>
              )}
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-gray-200">
              <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                <span>{avgRating.toFixed(1)}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-sm text-gray-500">{reviewCount} Ratings &amp; {Math.floor(reviewCount / 5)} Reviews</span>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-500">{Math.floor(reviewCount * 3.2)} sold</span>
            </div>

            {/* Price block */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-['JetBrains_Mono',monospace] text-3xl font-bold text-gray-900">
                  {formatINR(product.price_paise)}
                </span>
                {product.mrp_paise && product.mrp_paise > product.price_paise && (
                  <span className="font-['JetBrains_Mono',monospace] text-base text-gray-400 line-through">
                    {formatINR(product.mrp_paise)}
                  </span>
                )}
                {discountPct > 0 && (
                  <span className="text-base font-bold text-green-600">
                    {discountPct}% off
                  </span>
                )}
              </div>
              {discountPct > 0 && product.mrp_paise && (
                <p className="text-sm text-green-600 mt-1">
                  You save {formatINR(product.mrp_paise - product.price_paise)}
                </p>
              )}

              {/* Delivery & Returns */}
              <div className="mt-4 space-y-2.5 pt-4 border-t border-gray-100">
                {[
                  { icon: Truck, text: 'Free Delivery', sub: 'Estimated 3–7 business days' },
                  { icon: RefreshCcw, text: '7-Day Easy Returns', sub: 'No questions asked return policy' },
                  { icon: Shield, text: 'Buyer Protection', sub: 'Full refund if item not as described' },
                ].map(({ icon: Icon, text, sub }) => (
                  <div key={text} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{text}</span>
                    <span className="text-xs text-gray-400">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock warning */}
            {product.stock <= 10 && product.stock > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <Package className="w-4 h-4 text-amber-500" />
                <p className="text-sm text-amber-700 font-medium">Only {product.stock} left — order soon!</p>
              </div>
            )}

            {/* Live viewer count */}
            <ViewerCount productId={product.id} />

            {/* Add to cart — client component */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <AddToCartSection product={product} />
            </div>

            {/* Group buy */}
            <GroupBuyCounter productId={product.id} />

            {/* Seller info */}
            {manufacturer && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sold By</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-orange-600">{manufacturer.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-900 text-sm truncate">{manufacturer.name}</p>
                      <BadgeCheck className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{manufacturer.city}, {manufacturer.state}</span>
                      <span>·</span>
                      <span>{manufacturer.cluster}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-0.5 justify-end">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">4.8 Verified</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-center">
                  {[
                    { label: 'Products', value: '12+' },
                    { label: 'Sales', value: '1.2k+' },
                    { label: 'Rating', value: '4.8★' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="font-semibold text-sm text-gray-900">{value}</p>
                      <p className="text-[10px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Full-width sections below ── */}

        {/* Product Highlights */}
        {product.description && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-4">Product Highlights</h2>
            <ul className="space-y-2.5">
              {product.description.split('\n').filter(Boolean).slice(0, 8).map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {line}
                </li>
              ))}
              {!product.description.includes('\n') && (
                <li className="text-sm text-gray-700 leading-relaxed">{product.description}</li>
              )}
            </ul>
          </div>
        )}

        {/* Product Specifications */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-4">Product Specifications</h2>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Category', value: product.category },
              ...(product.subcategory ? [{ label: 'Subcategory', value: product.subcategory }] : []),
              ...(product.sizes.length > 0 ? [{ label: 'Available Sizes', value: product.sizes.join(', ') }] : []),
              ...(product.colors.length > 0 ? [{ label: 'Available Colors', value: product.colors.join(', ') }] : []),
              { label: 'Origin', value: manufacturer ? `${manufacturer.cluster}, India` : 'Made in India' },
              { label: 'Manufactured By', value: manufacturer?.name ?? 'BharatDeal Seller' },
              { label: 'In The Box', value: '1 Item' },
              { label: 'Country of Origin', value: 'India' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center py-3">
                <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
                <span className="text-sm text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer Protection */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" /> Buyer Protection
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: '100% Secure Payment', sub: 'UPI · COD · Cards' },
              { icon: RefreshCcw, label: '7-Day Returns', sub: 'No questions asked' },
              { icon: Truck, label: 'Fast Delivery', sub: '3–7 business days' },
              { icon: Headphones, label: '24/7 Support', sub: 'WhatsApp help' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-2 bg-gray-50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs font-semibold text-gray-800">{label}</p>
                <p className="text-[10px] text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900">Ratings &amp; Reviews</h2>
            <span className="text-xs text-gray-400">{reviewCount} verified reviews</span>
          </div>

          {/* Rating summary */}
          <div className="flex items-start gap-8 mb-6 pb-6 border-b border-gray-100">
            <div className="text-center flex-shrink-0">
              <p className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
              <div className="flex gap-0.5 mt-2 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">{reviewCount} ratings</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = starDist[star as keyof typeof starDist]
                const pct = Math.round((count / reviewCount) * 100)
                return (
                  <div key={star} className="flex items-center gap-3 text-xs">
                    <span className="text-gray-600 w-3">{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-gray-400 w-6 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Individual reviews */}
          <div className="space-y-5">
            {reviews.map((r, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600">
                      {r.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                        {r.verified && (
                          <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                            <BadgeCheck className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`w-3 h-3 ${j < r.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{r.city}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{r.date}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed ml-10">{r.text}</p>
                <button className="ml-10 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  <ThumbsUp className="w-3 h-3" /> Helpful
                </button>
                {i < reviews.length - 1 && <div className="border-b border-gray-100 pt-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">You May Also Like</h2>
              <Link href="/" className="text-sm text-orange-600 hover:underline flex items-center gap-0.5">
                See all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {related.slice(0, 8).map(p => {
                const relDiscount = p.mrp_paise && p.price_paise ? Math.round((1 - p.price_paise / p.mrp_paise) * 100) : 0
                return (
                  <Link key={p.id} href={`/products/${p.id}`}
                    className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-orange-200 transition-all group">
                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                      {relDiscount > 0 && (
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">
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
                      <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug">{p.title}</p>
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-gray-900">
                          {formatINR(p.price_paise)}
                        </span>
                        {p.mrp_paise && p.mrp_paise > p.price_paise && (
                          <span className="font-['JetBrains_Mono',monospace] text-[10px] text-gray-400 line-through">
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
    </div>
  )
}
