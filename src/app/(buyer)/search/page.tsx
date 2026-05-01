import { createSupabaseServer } from '@/lib/supabase'
import { ProductCard } from '@/components/buyer/ProductCard'
import type { Database } from '@/types/database'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Product = Database['public']['Tables']['products']['Row']

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''

  const supabase = await createSupabaseServer()
  let products: Product[] | null = null

  if (query.length >= 1) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .or(`title.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
      .order('is_flash_deal', { ascending: false })
      .limit(40)
    products = data

    fetch(
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: query.toLowerCase(), resultsCount: data?.length ?? 0 }),
        cache: 'no-store',
      }
    ).catch(() => {})
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        {query ? (
          <>
            <p className="text-xs text-gray-400 mb-0.5">Search results for</p>
            <h1 className="text-lg font-bold text-gray-900">&ldquo;{query}&rdquo;</h1>
            {products && (
              <p className="text-sm text-gray-500 mt-0.5">
                {products.length === 0 ? 'No products found' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
              </p>
            )}
          </>
        ) : (
          <h1 className="text-lg font-bold text-gray-900">Search Products</h1>
        )}
      </div>

      {!query ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7 text-[#E8450A]" />
          </div>
          <p className="text-sm font-medium text-gray-700">Start searching</p>
          <p className="text-xs text-gray-400">Type a product name in the search bar above</p>
        </div>
      ) : products?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
            <Search className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-700">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-gray-400">Try a different keyword or browse categories</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
