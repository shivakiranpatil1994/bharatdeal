import type { MetadataRoute } from 'next'
import { createSupabaseAdmin } from '@/lib/supabase'

export const revalidate = 3600 // regenerate hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://bharatdeal.in'
  const supabase = createSupabaseAdmin()

  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at, category')
    .eq('active', true)
    .eq('approval_status', 'approved')
    .order('updated_at', { ascending: false })

  const staticPages: MetadataRoute.Sitemap = [
    { url: appUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${appUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${appUrl}/checkout`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const productPages: MetadataRoute.Sitemap = (products ?? []).map(p => ({
    url: `${appUrl}/products/${p.id}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticPages, ...productPages]
}
