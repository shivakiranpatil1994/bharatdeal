import { createSupabaseServer } from '@/lib/supabase'
import { ProductCard } from '@/components/buyer/ProductCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ShoppingBag, Zap } from 'lucide-react'

export const revalidate = 60

export default async function StorefrontPage() {
  const supabase = await createSupabaseServer()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('is_flash_deal', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const now = new Date()
  const flashDeals = products?.filter(
    (p) => p.is_flash_deal && p.flash_ends_at && new Date(p.flash_ends_at) > now
  ) ?? []
  const regularProducts = products?.filter(
    (p) => !p.is_flash_deal || !p.flash_ends_at || new Date(p.flash_ends_at) <= now
  ) ?? []

  return (
    <div className="min-h-screen" style={{ background: '#0F0F14' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--bg-border)] bg-[#0F0F14]/95 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-['Syne',sans-serif] text-xl font-extrabold text-[var(--brand-primary)] tracking-tight">
            Bharat<span className="text-[var(--text-primary)]">Deal</span>
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">🇮🇳 Factory Direct</span>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-3 sm:px-4 py-4 space-y-8">
        {/* Flash Deals */}
        {flashDeals.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-[var(--brand-secondary)] fill-[var(--brand-secondary)]" />
              <h2 className="font-['Syne',sans-serif] text-lg font-bold text-[var(--text-primary)]">
                Flash Deals
              </h2>
              <span className="text-xs text-[var(--text-tertiary)] ml-1">· Ends soon</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {flashDeals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-['Syne',sans-serif] text-lg font-bold text-[var(--text-primary)]">
              Factory Direct
            </h2>
            <span className="text-xs text-[var(--text-tertiary)]">
              {products?.length ?? 0} products
            </span>
          </div>

          {regularProducts.length === 0 && flashDeals.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Products coming soon"
              description="We're onboarding manufacturers. Check back shortly."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {regularProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Trust bar */}
        <div className="border-t border-[var(--bg-border)] pt-6 pb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Factory Direct', sub: 'No middlemen' },
              { label: 'Made in India', sub: 'Tirupur · Surat · Moradabad' },
              { label: 'COD Available', sub: '₹49 deposit only' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
