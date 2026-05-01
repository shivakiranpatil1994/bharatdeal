import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface OrderRow {
  product_id: string
  manufacturer_id: string
  amount_paise: number
  created_at: string
}

interface ReturnRow {
  order_id: string
  status: string
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Process last 24 hours of orders
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('product_id, manufacturer_id, amount_paise, created_at')
      .gte('created_at', since)
      .eq('payment_status', 'paid')

    if (ordersError) {
      console.error('[aggregate-metrics] orders error:', ordersError.message)
      return new Response(JSON.stringify({ error: ordersError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!orders || orders.length === 0) {
      console.log('[aggregate-metrics] No new orders to aggregate')
      return new Response(JSON.stringify({ ok: true, processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch all return order_ids for these orders to calculate return rates
    const orderIds = orders.map((o: OrderRow) => o.product_id)
    const { data: returns } = await supabase
      .from('returns')
      .select('order_id, status')
      .in('order_id', orderIds)
      .in('status', ['approved', 'refunded'])

    const returnOrderIds = new Set((returns ?? []).map((r: ReturnRow) => r.order_id))

    // Group by product_id + date
    const metricsMap = new Map<
      string,
      {
        date: string
        product_id: string
        manufacturer_id: string
        orders_count: number
        revenue_paise: number
        returns_count: number
      }
    >()

    for (const order of orders as OrderRow[]) {
      const date = order.created_at.split('T')[0]
      const key = `${order.product_id}__${date}`

      const existing = metricsMap.get(key)
      const isReturn = returnOrderIds.has(order.product_id)

      if (existing) {
        existing.orders_count += 1
        existing.revenue_paise += order.amount_paise
        if (isReturn) existing.returns_count += 1
      } else {
        metricsMap.set(key, {
          date,
          product_id: order.product_id,
          manufacturer_id: order.manufacturer_id,
          orders_count: 1,
          revenue_paise: order.amount_paise,
          returns_count: isReturn ? 1 : 0,
        })
      }
    }

    const rows = Array.from(metricsMap.values()).map((m) => ({
      ...m,
      return_rate:
        m.orders_count > 0
          ? Number(((m.returns_count / m.orders_count) * 100).toFixed(2))
          : 0,
    }))

    // Upsert in batches of 50
    let upserted = 0
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50)
      const { error: upsertError } = await supabase
        .from('daily_sku_metrics')
        .upsert(batch, { onConflict: 'date,product_id', ignoreDuplicates: false })

      if (upsertError) {
        console.error('[aggregate-metrics] upsert error:', upsertError.message)
      } else {
        upserted += batch.length
      }
    }

    console.log(`[aggregate-metrics] Processed ${rows.length} SKU-date combinations, upserted ${upserted}`)
    return new Response(
      JSON.stringify({ ok: true, processed: rows.length, upserted }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[aggregate-metrics] Unexpected error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
