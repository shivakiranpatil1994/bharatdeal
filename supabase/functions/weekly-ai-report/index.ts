import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!
const interaktApiKey = Deno.env.get('INTERAKT_API_KEY')!

interface Manufacturer {
  id: string
  name: string
  category: string
  cluster: string
  whatsapp_phone: string
  seller_score: number
}

interface DailyMetric {
  product_id: string
  orders_count: number
  revenue_paise: number
  returns_count: number
  return_rate: number
  products: { title: string } | null
}

async function generateWeeklySummary(
  manufacturer: Manufacturer,
  metrics: DailyMetric[],
  totalOrders: number,
  totalRevenue: number,
  avgReturnRate: number
): Promise<string> {
  const prompt = `Write a brief weekly business summary for a factory owner on BharatDeal.

Manufacturer: ${manufacturer.name}
Category: ${manufacturer.category}
Cluster: ${manufacturer.cluster}
Seller Score: ${manufacturer.seller_score}/100

This Week:
- Total Orders: ${totalOrders}
- Total Revenue: ₹${(totalRevenue / 100).toFixed(0)}
- Avg Return Rate: ${avgReturnRate.toFixed(1)}%

Top Products:
${metrics
  .slice(0, 3)
  .map((m) => `- ${m.products?.title ?? 'Product'}: ${m.orders_count} orders, ₹${(m.revenue_paise / 100).toFixed(0)} revenue`)
  .join('\n')}

Write 2-3 short paragraphs:
1. How this week went overall
2. What to focus on next week
3. One specific action to take

Be direct and specific. Use ₹. Max 200 words.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json() as {
    choices: { message: { content: string } }[]
  }
  return data.choices[0]?.message?.content ?? 'Unable to generate summary'
}

async function sendWhatsApp(phone: string, message: string): Promise<void> {
  await fetch('https://api.interakt.ai/v1/public/message/', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${interaktApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      countryCode: '+91',
      phoneNumber: phone,
      type: 'Template',
      template: {
        name: 'weekly_report',
        languageCode: 'en',
        bodyValues: [message.slice(0, 1000)],
      },
    }),
  })
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Get all active manufacturers
    const { data: manufacturers, error: mfrError } = await supabase
      .from('manufacturers')
      .select('id, name, category, cluster, whatsapp_phone, seller_score')
      .eq('active', true)

    if (mfrError || !manufacturers) {
      console.error('[weekly-ai-report] manufacturers error:', mfrError?.message)
      return new Response(JSON.stringify({ error: mfrError?.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    let processed = 0
    let failed = 0

    for (const manufacturer of manufacturers as Manufacturer[]) {
      try {
        // Fetch this week's metrics
        const { data: metrics } = await supabase
          .from('daily_sku_metrics')
          .select('product_id, orders_count, revenue_paise, returns_count, return_rate, products(title)')
          .eq('manufacturer_id', manufacturer.id)
          .gte('date', weekStart)
          .order('orders_count', { ascending: false })

        const typedMetrics = (metrics ?? []) as DailyMetric[]
        const totalOrders = typedMetrics.reduce((s, m) => s + m.orders_count, 0)
        const totalRevenue = typedMetrics.reduce((s, m) => s + m.revenue_paise, 0)
        const avgReturnRate =
          typedMetrics.length > 0
            ? typedMetrics.reduce((s, m) => s + Number(m.return_rate), 0) / typedMetrics.length
            : 0

        // Generate AI summary
        const summary = await generateWeeklySummary(
          manufacturer,
          typedMetrics,
          totalOrders,
          totalRevenue,
          avgReturnRate
        )

        // Save to ai_insights
        const { error: insightError } = await supabase.from('ai_insights').insert({
          manufacturer_id: manufacturer.id,
          insight_type: 'daily_summary',
          title: `Weekly Report — ${new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}`,
          content: summary,
          data_snapshot: { totalOrders, totalRevenue, avgReturnRate },
        })

        if (insightError) {
          console.error(`[weekly-ai-report] insight insert error for ${manufacturer.name}:`, insightError.message)
        }

        // Send WhatsApp notification
        const whatsappMessage = `BharatDeal Weekly Report for ${manufacturer.name}:\n\n${summary.slice(0, 500)}\n\nView full report: https://bharatdeal.in/manufacturer/dashboard`
        try {
          await sendWhatsApp(manufacturer.whatsapp_phone, whatsappMessage)
        } catch (waError) {
          const waMsg = waError instanceof Error ? waError.message : 'WhatsApp send failed'
          console.error(`[weekly-ai-report] WhatsApp error for ${manufacturer.name}:`, waMsg)
        }

        processed++
        console.log(`[weekly-ai-report] Processed ${manufacturer.name}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error(`[weekly-ai-report] Failed for ${manufacturer.name}:`, message)
        failed++
      }
    }

    console.log(`[weekly-ai-report] Done. Processed: ${processed}, Failed: ${failed}`)
    return new Response(
      JSON.stringify({ ok: true, processed, failed }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[weekly-ai-report] Fatal error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
