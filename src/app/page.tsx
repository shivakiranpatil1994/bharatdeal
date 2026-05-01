import { createSupabaseServer } from '@/lib/supabase'
import { BuyerHeader } from '@/components/buyer/BuyerHeader'
import { MobileNav } from '@/components/buyer/MobileNav'
import { ProductCard } from '@/components/buyer/ProductCard'
import { SpinWheel } from '@/components/buyer/SpinWheel'
import { EmptyState } from '@/components/shared/EmptyState'
import { FlashDealTimer } from '@/components/buyer/FlashDealTimer'
import { ShoppingBag, Zap, Truck, RefreshCcw, Shield, Headphones } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

const CATEGORIES = [
  { emoji: '👕', label: 'T-Shirts', href: '/?category=Cotton+Knitwear' },
  { emoji: '🥻', label: 'Sarees', href: '/?category=Sarees' },
  { emoji: '🏺', label: 'Brass Decor', href: '/?category=Brass+Home+Decor' },
  { emoji: '👗', label: 'Kurtis', href: '/?category=Cotton+Knitwear' },
  { emoji: '⚡', label: 'Flash', href: '/?flash=1' },
  { emoji: '🎁', label: 'Gifts', href: '/?category=Brass+Home+Decor' },
  { emoji: '🛍️', label: 'All', href: '/' },
]

const PERKS = [
  { icon: Truck, label: 'Free Delivery', sub: 'On all orders' },
  { icon: RefreshCcw, label: 'Easy Returns', sub: '7-day policy' },
  { icon: Shield, label: 'Secure Pay', sub: 'UPI · COD · Cards' },
  { icon: Headphones, label: '24/7 Support', sub: 'WhatsApp help' },
]

interface PageProps {
  searchParams: Promise<{ category?: string; flash?: string }>
}

export default async function StorefrontPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createSupabaseServer()

  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(60)

  if (params.flash === '1') {
    query = query.eq('is_flash_deal', true)
  } else if (params.category) {
    query = query.eq('category', params.category)
  }

  const { data: products } = await query

  const now = new Date()
  const flashDeals =
    products?.filter((p) => p.is_flash_deal && p.flash_ends_at && new Date(p.flash_ends_at) > now) ?? []
  const regularProducts =
    products?.filter((p) => !p.is_flash_deal || !p.flash_ends_at || new Date(p.flash_ends_at) <= now) ?? []

  const flashEndTime = flashDeals[0]?.flash_ends_at ?? null
  const isFiltered = !!(params.category || params.flash)

  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-16 sm:pb-0">
      <BuyerHeader />

      {!isFiltered && (
        <>
          {/* Flash sale banner */}
          {flashDeals.length > 0 && (
            <div className="bg-gradient-to-r from-[#E8450A] via-[#F05A1A] to-[#E8450A] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }}
              />
              <div className="relative max-w-screen-xl mx-auto px-4 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                    <Zap className="w-3 h-3 fill-white" />
                    LIMITED TIME OFFER
                  </div>
                  <h1 className="font-['Syne',sans-serif] text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                    Flash Sale — Up to <span className="text-yellow-300">70% OFF</span>
                  </h1>
                  <p className="text-sm text-white/80 mt-1">Factory direct · No middlemen · Made in India</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-white/70 uppercase tracking-widest font-medium">Ends in</p>
                  {flashEndTime && <FlashDealTimer endsAt={flashEndTime} large />}
                  <Link
                    href="/?flash=1"
                    className="mt-1 inline-flex items-center gap-1.5 px-6 py-2.5 bg-white hover:bg-gray-100 text-[#E8450A] font-bold text-sm rounded-full transition-colors shadow-lg"
                  >
                    Shop Now →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Category icons */}
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-4">
              <div className="grid grid-cols-7 gap-2 sm:gap-4">
                {CATEGORIES.map(({ emoji, label, href }) => (
                  <Link key={label} href={href} className="flex flex-col items-center gap-1.5 group">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl sm:text-2xl group-hover:bg-orange-100 group-hover:border-orange-200 transition-all duration-200">
                      {emoji}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-gray-500 group-hover:text-gray-800 text-center leading-tight transition-colors font-medium">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Perks strip */}
          <div className="bg-white border-b border-gray-100">
            <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3">
              <div className="grid grid-cols-4 gap-2">
                {PERKS.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col sm:flex-row items-center sm:gap-2 text-center sm:text-left">
                    <Icon className="w-4 h-4 text-[#E8450A] flex-shrink-0" />
                    <div>
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-[9px] text-gray-400 hidden sm:block">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <main className="max-w-screen-xl mx-auto px-3 sm:px-4 py-4 space-y-6">

        {/* Flash deals row */}
        {flashDeals.length > 0 && !isFiltered && (
          <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#E8450A] fill-[#E8450A]" />
                <span className="text-sm font-bold text-gray-900">Flash Deals</span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[#E8450A] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E8450A] animate-pulse" />
                  Live
                </span>
              </div>
              <Link href="/?flash=1" className="text-xs text-[#E8450A] font-semibold hover:underline">
                See all →
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-1 px-1 pb-1 sm:pb-0">
              {flashDeals.slice(0, 6).map((product) => (
                <div key={product.id} className="flex-shrink-0 w-36 sm:w-auto">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Main product grid */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-[#E8450A]" />
              <h2 className="text-sm font-bold text-gray-900">
                {params.flash === '1' ? '⚡ Flash Deals' : params.category ? params.category : 'Recommended For You'}
              </h2>
            </div>
            <span className="font-['JetBrains_Mono',monospace] text-xs text-gray-400">
              {(params.flash === '1' ? flashDeals : regularProducts).length} items
            </span>
          </div>

          {(params.flash === '1' ? flashDeals : regularProducts).length === 0 && flashDeals.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No products yet" description="We're onboarding factories. Check back soon." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {(params.flash === '1' ? flashDeals : regularProducts).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        {!isFiltered && (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400">🇮🇳 BharatDeal · Factory direct from Tirupur · Surat · Moradabad</p>
          </div>
        )}
      </main>

      <SpinWheel />
      <MobileNav />
    </div>
  )
}
