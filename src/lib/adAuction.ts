// src/lib/adAuction.ts
// BharatDeal Phase 1 Ad Auction Engine
// Rule-based second-price auction with quality scoring

import { createSupabaseAdmin } from './supabase'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
export type AdPlacement =
  | 'sponsored_search'
  | 'product_card'
  | 'homepage_banner'
  | 'flash_deal'

export interface AuctionRequest {
  placement:     AdPlacement
  query?:        string
  category?:     string
  buyerPincode?: string
  buyerSession:  string
  buyerIpHash:   string
  slots?:        number
}

export interface AuctionWinner {
  campaignId:     string
  productId:      string
  manufacturerId: string
  actualCpcPaise: number
  adScore:        number
  qualityScore:   number
  relevanceScore: number
  pCTR:           number
  impressionId?:  string
}

export interface AlgorithmConfig {
  weight_bid:       number
  weight_quality:   number
  weight_relevance: number
  weight_pctr:      number
  min_quality_score:    number
  min_relevance_score:  number
  min_bid_search_paise: number
  min_bid_card_paise:   number
  min_bid_banner_cpm:   number
  max_rto_pct:          number
  auto_approve_min_qs:  number
  auto_approve_max_rto: number
  attribution_days:     number
  fraud_cooldown_hours: number
  max_clicks_per_ip_day: number
}

// ─────────────────────────────────────────────────────────
// Config cache (in-memory, 5-minute TTL)
// ─────────────────────────────────────────────────────────
let configCache: AlgorithmConfig | null = null
let configCachedAt = 0
const CONFIG_TTL_MS = 5 * 60 * 1000

export async function getAlgorithmConfig(): Promise<AlgorithmConfig> {
  if (configCache && Date.now() - configCachedAt < CONFIG_TTL_MS) {
    return configCache
  }

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('algorithm_config')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (data && !error) {
    configCache = data as unknown as AlgorithmConfig
    configCachedAt = Date.now()
    return configCache
  }

  return {
    weight_bid: 0.35,       weight_quality: 0.30,
    weight_relevance: 0.20, weight_pctr: 0.15,
    min_quality_score: 0.30,    min_relevance_score: 0.20,
    min_bid_search_paise: 200,  min_bid_card_paise: 150,
    min_bid_banner_cpm: 5000,   max_rto_pct: 25.0,
    auto_approve_min_qs: 0.70,  auto_approve_max_rto: 8.0,
    attribution_days: 7,        fraud_cooldown_hours: 24,
    max_clicks_per_ip_day: 5,
  }
}

export function invalidateConfigCache() {
  configCache = null
  configCachedAt = 0
}

// ─────────────────────────────────────────────────────────
// Main auction function
// ─────────────────────────────────────────────────────────
export async function runAuction(req: AuctionRequest): Promise<AuctionWinner[]> {
  const supabase = createSupabaseAdmin()
  const config   = await getAlgorithmConfig()
  const slots    = req.slots ?? 2

  const adType = placementToAdType(req.placement)
  const { data: campaigns, error } = await supabase
    .from('ad_campaigns')
    .select(`
      id,
      manufacturer_id,
      product_id,
      max_bid_paise,
      keywords,
      categories,
      quality_score,
      daily_budget_paise,
      spent_today_paise,
      total_budget_paise,
      total_spent_paise,
      products (
        title,
        category,
        price_paise,
        stock
      )
    `)
    .eq('status', 'active')
    .eq('review_status', 'approved')
    .eq('ad_type', adType)
    .lte('start_date', new Date().toISOString().split('T')[0])

  if (error || !campaigns?.length) return []

  const fraudSet = await checkClickFraud(
    req.buyerIpHash,
    campaigns.map(c => c.id),
    config
  )

  type ScoredCampaign = {
    id: string
    manufacturer_id: string
    product_id: string
    max_bid_paise: number
    quality_score: number
    adScore: number
    relevanceScore: number
    pCTR: number
  }

  const scored: ScoredCampaign[] = []

  for (const c of campaigns) {
    if (c.spent_today_paise  >= c.daily_budget_paise)  continue
    if (c.total_spent_paise  >= c.total_budget_paise)  continue
    if (fraudSet.has(c.id)) continue

    const product = c.products as unknown as { title: string; category: string; price_paise: number; stock: number } | null

    const qs = c.quality_score ?? 0.5
    if (qs < config.min_quality_score) continue
    if (c.max_bid_paise < getBidFloor(req.placement, config)) continue

    const rs = computeRelevance({
      query:              req.query,
      category:           req.category,
      campaignKeywords:   (c.keywords ?? []) as string[],
      campaignCategories: (c.categories ?? []) as string[],
      productTitle:       product?.title ?? '',
      productCategory:    product?.category ?? '',
    })
    if (rs < config.min_relevance_score) continue

    const pCTR = getBaselineCTR(product?.category, req.placement)

    const bidNorm = c.max_bid_paise / 100
    const adScore =
      bidNorm * config.weight_bid      +
      qs      * config.weight_quality   +
      rs      * config.weight_relevance +
      pCTR    * config.weight_pctr

    scored.push({
      id:              c.id,
      manufacturer_id: c.manufacturer_id,
      product_id:      c.product_id,
      max_bid_paise:   c.max_bid_paise,
      quality_score:   qs,
      adScore,
      relevanceScore:  rs,
      pCTR,
    })
  }

  if (!scored.length) return []

  scored.sort((a, b) => b.adScore - a.adScore)

  const winners: AuctionWinner[] = []

  for (let i = 0; i < Math.min(slots, scored.length); i++) {
    const winner   = scored[i]
    const nextBest = scored[i + 1]

    let actualCpc: number
    if (nextBest) {
      actualCpc = Math.ceil(
        (nextBest.adScore / (winner.quality_score * winner.pCTR)) * 100
      ) + 1
    } else {
      actualCpc = winner.max_bid_paise
    }

    actualCpc = Math.min(actualCpc, winner.max_bid_paise)
    actualCpc = Math.max(actualCpc, getBidFloor(req.placement, config))

    winners.push({
      campaignId:     winner.id,
      productId:      winner.product_id,
      manufacturerId: winner.manufacturer_id,
      actualCpcPaise: actualCpc,
      adScore:        winner.adScore,
      qualityScore:   winner.quality_score,
      relevanceScore: winner.relevanceScore,
      pCTR:           winner.pCTR,
    })
  }

  logImpressions(winners, req).catch((err) =>
    console.error('[adAuction] impression log error:', err)
  )

  return winners
}

// ─────────────────────────────────────────────────────────
// Relevance scoring
// ─────────────────────────────────────────────────────────
function computeRelevance(p: {
  query?:             string
  category?:          string
  campaignKeywords:   string[]
  campaignCategories: string[]
  productTitle:       string
  productCategory:    string
}): number {
  let score = 0
  const kw = p.campaignKeywords.map(k => k.toLowerCase().trim())

  if (p.query) {
    const q = p.query.toLowerCase().trim()
    const exactMatch   = kw.some(k => k === q)
    const partialMatch = kw.some(k => q.includes(k) || k.includes(q))
    const titleMatch   = p.productTitle.toLowerCase().includes(q)

    if (exactMatch)        score += 1.00
    else if (partialMatch) score += 0.60
    if (titleMatch)        score += 0.30
  }

  if (p.category) {
    const catMatch =
      p.campaignCategories.includes(p.category) ||
      p.productCategory === p.category
    if (catMatch) score += 0.40
  }

  return Math.min(score / 1.40, 1.0)
}

// ─────────────────────────────────────────────────────────
// Baseline CTR (Phase 1 — category-based hardcoded values)
// ─────────────────────────────────────────────────────────
const CATEGORY_BASE_CTR: Record<string, number> = {
  'Cotton Knitwear':  0.042,
  'Sarees':           0.038,
  'Home Textiles':    0.031,
  'Ethnic Wear':      0.045,
  'Footwear':         0.033,
  'Kids Wear':        0.041,
  'Brassware':        0.029,
  'Ceramics':         0.027,
  'Blankets':         0.030,
  'Woolens':          0.032,
  'default':          0.035,
}

const PLACEMENT_CTR_MULTIPLIER: Record<AdPlacement, number> = {
  sponsored_search: 1.00,
  product_card:     0.75,
  homepage_banner:  0.55,
  flash_deal:       2.10,
}

export function getBaselineCTR(category: string | undefined, placement: AdPlacement): number {
  const base = CATEGORY_BASE_CTR[category ?? 'default'] ?? CATEGORY_BASE_CTR['default']
  const mult = PLACEMENT_CTR_MULTIPLIER[placement] ?? 1.0
  return base * mult
}

function getBidFloor(placement: AdPlacement, config: AlgorithmConfig): number {
  switch (placement) {
    case 'sponsored_search': return config.min_bid_search_paise
    case 'product_card':     return config.min_bid_card_paise
    case 'homepage_banner':  return config.min_bid_banner_cpm
    case 'flash_deal':       return 200000
    default:                 return config.min_bid_search_paise
  }
}

function placementToAdType(placement: AdPlacement): string {
  switch (placement) {
    case 'sponsored_search': return 'sponsored_search'
    case 'product_card':     return 'product_card'
    case 'homepage_banner':  return 'banner'
    case 'flash_deal':       return 'flash_deal'
  }
}

async function checkClickFraud(
  ipHash:      string,
  campaignIds: string[],
  config:      AlgorithmConfig
): Promise<Set<string>> {
  if (!ipHash || !campaignIds.length) return new Set()

  const supabase = createSupabaseAdmin()
  const since    = new Date(
    Date.now() - config.fraud_cooldown_hours * 3_600_000
  ).toISOString()

  const { data } = await supabase
    .from('ad_clicks')
    .select('campaign_id')
    .eq('buyer_ip_hash', ipHash)
    .in('campaign_id', campaignIds)
    .gte('created_at', since)

  if (!data?.length) return new Set()

  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.campaign_id] = (counts[row.campaign_id] ?? 0) + 1
  }

  return new Set(
    Object.entries(counts)
      .filter(([, count]) => count >= config.max_clicks_per_ip_day)
      .map(([id]) => id)
  )
}

async function logImpressions(
  winners: AuctionWinner[],
  req:     AuctionRequest
): Promise<void> {
  if (!winners.length) return

  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('ad_impressions')
    .insert(
      winners.map((w, i) => ({
        campaign_id:      w.campaignId,
        product_id:       w.productId,
        query:            req.query    ?? null,
        placement:        req.placement,
        position:         i + 1,
        ad_score:         w.adScore,
        actual_cpc_paise: w.actualCpcPaise,
        quality_score:    w.qualityScore,
        relevance_score:  w.relevanceScore,
        pctr:             w.pCTR,
        buyer_pincode:    req.buyerPincode ?? null,
        buyer_session:    req.buyerSession,
        buyer_ip_hash:    req.buyerIpHash,
      }))
    )
    .select('id')

  if (data) {
    data.forEach((row, i) => {
      if (winners[i]) winners[i].impressionId = row.id
    })
  }
}
