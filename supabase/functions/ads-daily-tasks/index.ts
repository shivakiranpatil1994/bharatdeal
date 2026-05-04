// supabase/functions/ads-daily-tasks/index.ts
// Cron: daily at 2am IST (8:30pm UTC)
// Jobs: reset daily spend, compute quality scores, attribute conversions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // Job 1: Reset daily ad spend counters
  const { error: resetErr } = await supabase.rpc('reset_daily_ad_spend')
  results.dailySpendReset = resetErr ? `ERROR: ${resetErr.message}` : 'OK'

  // Job 2: Compute quality scores for all active products
  const { data: products } = await supabase
    .from('products')
    .select('id, manufacturer_id, listing_quality_score, stock')
    .eq('active', true)

  let qsUpdated = 0
  let qsErrors  = 0

  for (const product of products ?? []) {
    try {
      const score = await computeQualityScore(product.id, product)
      await supabase.from('ad_quality_scores').upsert({
        product_id: product.id,
        ...score,
        computed_at: new Date().toISOString(),
      })
      await supabase.from('ad_campaigns')
        .update({ quality_score: score.quality_score })
        .eq('product_id', product.id)
        .eq('status', 'active')
      qsUpdated++
    } catch (e) {
      qsErrors++
      console.error(`[quality_score] product ${product.id}:`, e)
    }
  }
  results.qualityScores = { updated: qsUpdated, errors: qsErrors }

  // Job 3: Attribution (click → order, 7-day window)
  const attributionDays = 7
  const since = new Date(Date.now() - attributionDays * 86_400_000).toISOString()
  const oneDayAgo = new Date(Date.now() - 86_400_000).toISOString()

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, buyer_phone, product_id, amount_paise, created_at')
    .gte('created_at', oneDayAgo)
    .eq('payment_status', 'paid')

  let attributed = 0

  for (const order of recentOrders ?? []) {
    const { count } = await supabase
      .from('ad_conversions')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', order.id)

    if ((count ?? 0) > 0) continue

    const { data: click } = await supabase
      .from('ad_clicks')
      .select('id, campaign_id')
      .eq('product_id', order.product_id)
      .eq('is_fraud', false)
      .gte('created_at', since)
      .lt('created_at', order.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (click) {
      await supabase.from('ad_conversions').insert({
        click_id:      click.id,
        campaign_id:   click.campaign_id,
        order_id:      order.id,
        revenue_paise: order.amount_paise,
      })
      await supabase.from('ad_campaigns')
        .update({
          total_conversions:   supabase.rpc('increment', { x: 1 }),
          total_revenue_paise: supabase.rpc('increment', { x: order.amount_paise }),
        })
        .eq('id', click.campaign_id)
      attributed++
    }
  }
  results.conversionsAttributed = attributed

  // Job 4: End campaigns past end_date
  await supabase
    .from('ad_campaigns')
    .update({ status: 'ended' })
    .eq('status', 'active')
    .eq('review_status', 'approved')
    .filter('end_date', 'lt', new Date().toISOString().split('T')[0])

  // Job 5: Low balance alerts
  const { data: lowWallets } = await supabase
    .from('ad_wallets')
    .select('manufacturer_id, balance_paise, manufacturers ( whatsapp_phone )')
    .gt('balance_paise', 0)
    .lt('balance_paise', 50000)

  for (const wallet of lowWallets ?? []) {
    const phone = (wallet.manufacturers as { whatsapp_phone: string } | null)?.whatsapp_phone
    if (!phone) continue
    const balRupees = wallet.balance_paise / 100
    await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: { Authorization: `Basic ${Deno.env.get('INTERAKT_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryCode: '+91', phoneNumber: phone, callbackData: 'wallet_low_alert',
        type: 'Text', data: { message: `⚠️ Ad Wallet low: ₹${balRupees} remaining. Top up to keep campaigns running.` },
      }),
    }).catch(console.error)
  }
  results.lowBalanceAlerts = lowWallets?.length ?? 0

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function computeQualityScore(productId: string, product: { manufacturer_id: string; listing_quality_score: number | null; stock: number }) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().split('T')[0]

  const { data: metrics } = await supabase
    .from('daily_sku_metrics')
    .select('return_rate, orders_count')
    .eq('product_id', productId)
    .gte('date', thirtyDaysAgo)

  const avgReturnRate = metrics?.length
    ? (metrics as { return_rate: number }[]).reduce((s, m) => s + Number(m.return_rate), 0) / metrics.length
    : 10

  const { data: manufacturer } = await supabase
    .from('manufacturers')
    .select('seller_score')
    .eq('id', product.manufacturer_id)
    .single()

  const avgRating = 4.0

  const { data: dispatchData } = await supabase
    .from('order_events')
    .select('created_at, orders!inner(created_at, product_id)')
    .eq('event_type', 'packed')
    .eq('orders.product_id', productId)
    .gte('created_at', thirtyDaysAgo)
    .limit(50)

  const avgDispatchDays = dispatchData?.length
    ? (dispatchData as { created_at: string; orders: { created_at: string } }[]).reduce((sum, ev) => {
        const orderDate  = new Date(ev.orders.created_at)
        const packedDate = new Date(ev.created_at)
        return sum + (packedDate.getTime() - orderDate.getTime()) / 86_400_000
      }, 0) / dispatchData.length
    : 1.5

  const returnRateScore    = Math.max(0, 1 - (avgReturnRate / 20))
  const sellerScoreNorm    = ((manufacturer as { seller_score: number } | null)?.seller_score ?? 50) / 100
  const listingQualityNorm = ((product.listing_quality_score ?? 50) / 100)
  const reviewRatingNorm   = (avgRating / 5)
  const fulfillmentSpeed   = Math.max(0, 1 - (avgDispatchDays / 3))

  const qualityScore =
    returnRateScore    * 0.30 +
    sellerScoreNorm    * 0.25 +
    listingQualityNorm * 0.20 +
    reviewRatingNorm   * 0.15 +
    fulfillmentSpeed   * 0.10

  return {
    quality_score:           Math.min(1, Math.max(0, qualityScore)),
    return_rate_score:       returnRateScore,
    seller_score_norm:       sellerScoreNorm,
    listing_quality_score:   listingQualityNorm,
    review_rating_norm:      reviewRatingNorm,
    fulfillment_speed_score: fulfillmentSpeed,
  }
}
