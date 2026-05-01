import { streamText, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createSupabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    messages?: Parameters<typeof streamText>[0]['messages']
    manufacturerId?: string
  }

  const { messages, manufacturerId } = body

  if (!manufacturerId) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!messages || messages.length === 0) {
    return new Response('No messages', { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const result = streamText({
    model: openai('gpt-4o'),
    system: `You are a smart business advisor for an Indian factory owner on BharatDeal.
You have access to their real sales data through tools.
Rules:
- Always give specific, actionable advice — no vague recommendations
- Use ₹ for prices, reference products by actual name
- If data shows a problem, be direct and clear
- Keep responses concise — factory owners are busy people
- Offer to dig deeper if they want more detail
- Speak simply — avoid jargon
- If asked in Hindi, respond in Hindi
- Always think step by step before answering`,
    messages,
    tools: {
      getSKUPerformance: tool({
        description: 'Get orders, revenue, return rate for all products in last N days',
        inputSchema: z.object({
          days: z.number().min(1).max(90).default(7),
        }),
        execute: async ({ days }: { days: number }) => {
          const since = new Date(Date.now() - days * 86400000)
            .toISOString()
            .split('T')[0]
          const { data: metrics } = await supabase
            .from('daily_sku_metrics')
            .select('date, product_id, orders_count, revenue_paise, return_rate')
            .eq('manufacturer_id', manufacturerId)
            .gte('date', since)
            .order('orders_count', { ascending: false })

          const productIds = [...new Set((metrics ?? []).map((m) => m.product_id))]
          const { data: products } = await supabase
            .from('products')
            .select('id, title, price_paise, stock')
            .in('id', productIds)

          const productMap = new Map(
            (products ?? []).map((p) => [
              p.id,
              { title: p.title, price_paise: p.price_paise, stock: p.stock },
            ])
          )

          return (metrics ?? []).map((m) => ({
            ...m,
            product: productMap.get(m.product_id) ?? null,
          }))
        },
      }),

      getPincodeDemand: tool({
        description: 'Get top cities/pincodes where products are selling',
        inputSchema: z.object({
          productId: z.string().uuid().optional(),
        }),
        execute: async ({ productId }: { productId?: string }) => {
          const query = supabase
            .from('pincode_demand')
            .select('pincode, city, state, order_count, rto_rate, avg_price_paise')
            .eq('manufacturer_id', manufacturerId)
            .order('order_count', { ascending: false })
            .limit(15)
          const filteredQuery = productId ? query.eq('product_id', productId) : query
          const { data } = await filteredQuery
          return data ?? []
        },
      }),

      getSearchTrends: tool({
        description: 'Get trending search terms in this manufacturer category',
        inputSchema: z.object({}),
        execute: async () => {
          const { data: mfr } = await supabase
            .from('manufacturers')
            .select('category')
            .eq('id', manufacturerId)
            .single()
          const { data } = await supabase
            .from('search_trends')
            .select('term, count_this_week, count_last_week, growth_pct, zero_results')
            .eq('category', mfr?.category ?? '')
            .order('growth_pct', { ascending: false })
            .limit(20)
          return data ?? []
        },
      }),

      getOpportunities: tool({
        description:
          'Find unmet demand — searches with zero results (products to make that nobody else is listing)',
        inputSchema: z.object({}),
        execute: async () => {
          const { data: mfr } = await supabase
            .from('manufacturers')
            .select('category')
            .eq('id', manufacturerId)
            .single()
          const { data } = await supabase
            .from('search_trends')
            .select('term, count_this_week, growth_pct')
            .eq('zero_results', true)
            .eq('category', mfr?.category ?? '')
            .order('count_this_week', { ascending: false })
            .limit(10)
          return data ?? []
        },
      }),

      getReturnAnalysis: tool({
        description: 'Analyse why products are being returned',
        inputSchema: z.object({}),
        execute: async () => {
          const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('manufacturer_id', manufacturerId)
            .limit(500)

          const orderIds = (orders ?? []).map((o) => o.id)
          if (orderIds.length === 0) return {}

          const { data: returns } = await supabase
            .from('returns')
            .select('reason')
            .in('order_id', orderIds)
            .limit(100)

          return (returns ?? []).reduce<Record<string, number>>((acc, r) => {
            acc[r.reason] = (acc[r.reason] ?? 0) + 1
            return acc
          }, {})
        },
      }),

      getProductionRecommendation: tool({
        description: 'Get recommended production quantities for next 2 weeks based on trends',
        inputSchema: z.object({}),
        execute: async () => {
          const { data: metrics } = await supabase
            .from('daily_sku_metrics')
            .select('product_id, orders_count, return_rate')
            .eq('manufacturer_id', manufacturerId)
            .gte(
              'date',
              new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]
            )

          const productIds = [...new Set((metrics ?? []).map((m) => m.product_id))]
          const { data: products } = await supabase
            .from('products')
            .select('id, title, stock, sizes')
            .in('id', productIds)

          const productMap = new Map((products ?? []).map((p) => [p.id, p]))

          return (metrics ?? []).map((m) => ({
            ...m,
            product: productMap.get(m.product_id) ?? null,
          }))
        },
      }),
    },
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
