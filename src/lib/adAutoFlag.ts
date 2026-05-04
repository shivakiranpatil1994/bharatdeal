// src/lib/adAutoFlag.ts
// Automatically checks new campaigns for policy violations

import { createSupabaseAdmin } from './supabase'
import { getAlgorithmConfig } from './adAuction'

const BRAND_BLOCKLIST = [
  'nike', 'puma', 'adidas', 'reebok', 'skechers',
  'amazon', 'flipkart', 'meesho', 'ajio', 'myntra',
  'fabindia', 'bata', 'woodland', 'liberty',
  'peter england', 'raymond', 'allen solly',
  'louis philippe', 'wrangler', 'levis', "levi's",
  'zara', 'h&m', 'forever 21',
  'patanjali', 'tata', 'reliance',
]

export interface AutoFlagResult {
  flags:          string[]
  shouldBlock:    boolean
  canAutoApprove: boolean
}

export async function runAutoFlagCheck(
  productId:  string,
  keywords:   string[],
  categories: string[],
): Promise<AutoFlagResult> {
  const supabase = createSupabaseAdmin()
  const config   = await getAlgorithmConfig()
  const flags:   string[] = []

  await Promise.all([
    checkQualityScore(productId, config, flags, supabase),
    checkReturnRate(productId, config, flags, supabase),
    checkKeywords(keywords, flags),
    checkListingQuality(productId, flags, supabase),
    checkStock(productId, flags, supabase),
  ])

  const hardBlockFlags = flags.filter(f =>
    f.startsWith('qs_too_low') ||
    f.startsWith('return_rate_too_high') ||
    f.startsWith('brand_keyword')
  )

  const shouldBlock    = hardBlockFlags.length > 0
  const canAutoApprove = !shouldBlock && flags.length === 0

  return { flags, shouldBlock, canAutoApprove }
}

async function checkQualityScore(
  productId: string,
  config:    Awaited<ReturnType<typeof getAlgorithmConfig>>,
  flags:     string[],
  supabase:  ReturnType<typeof createSupabaseAdmin>
): Promise<void> {
  const { data: qs } = await supabase
    .from('ad_quality_scores')
    .select('quality_score, override_score')
    .eq('product_id', productId)
    .maybeSingle()

  const effectiveQS = (qs as { quality_score: number; override_score: number | null } | null)?.override_score
    ?? (qs as { quality_score: number } | null)?.quality_score
    ?? 0.50

  if (effectiveQS < config.min_quality_score) {
    flags.push(`qs_too_low:score=${effectiveQS.toFixed(3)},min=${config.min_quality_score}`)
  }
}

async function checkReturnRate(
  productId: string,
  config:    Awaited<ReturnType<typeof getAlgorithmConfig>>,
  flags:     string[],
  supabase:  ReturnType<typeof createSupabaseAdmin>
): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
    .toISOString()
    .split('T')[0]

  const { data: metrics } = await supabase
    .from('daily_sku_metrics')
    .select('return_rate')
    .eq('product_id', productId)
    .gte('date', sevenDaysAgo)

  if (metrics?.length) {
    const avgRTO =
      (metrics as { return_rate: number }[]).reduce((sum, m) => sum + Number(m.return_rate), 0) /
      metrics.length

    if (avgRTO > config.max_rto_pct) {
      flags.push(`return_rate_too_high:rate=${avgRTO.toFixed(1)},max=${config.max_rto_pct}`)
    }
  }
}

function checkKeywords(keywords: string[], flags: string[]): void {
  const normalised = keywords.map(k => k.toLowerCase())
  const hit = BRAND_BLOCKLIST.find(brand =>
    normalised.some(k => k.includes(brand))
  )
  if (hit) {
    flags.push(`brand_keyword:found=${hit}`)
  }
}

async function checkListingQuality(
  productId: string,
  flags:     string[],
  supabase:  ReturnType<typeof createSupabaseAdmin>
): Promise<void> {
  const { data: product } = await supabase
    .from('products')
    .select('listing_quality_score, images')
    .eq('id', productId)
    .maybeSingle()

  if (!product) return

  const p = product as { listing_quality_score: number | null; images: string[] | null }
  if ((p.listing_quality_score ?? 50) < 40) {
    flags.push(`listing_quality_low:score=${p.listing_quality_score}`)
  }
  if (!p.images?.length) {
    flags.push('no_product_images')
  }
}

async function checkStock(
  productId: string,
  flags:     string[],
  supabase:  ReturnType<typeof createSupabaseAdmin>
): Promise<void> {
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .maybeSingle()

  const stock = (product as { stock: number } | null)?.stock ?? 0
  if (stock < 5) {
    flags.push(`low_stock:count=${stock}`)
  }
}
