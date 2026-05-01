import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createSupabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

const RequestSchema = z.object({
  manufacturerId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const body = RequestSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { manufacturerId } = body.data
    const supabase = createSupabaseAdmin()

    // Fetch manufacturer info
    const { data: manufacturer, error: mfrError } = await supabase
      .from('manufacturers')
      .select('name, category, cluster, seller_score')
      .eq('id', manufacturerId)
      .single()

    if (mfrError || !manufacturer) {
      return NextResponse.json({ error: 'Manufacturer not found' }, { status: 404 })
    }

    // Fetch last 7 days of daily_sku_metrics
    const since = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    const { data: metrics } = await supabase
      .from('daily_sku_metrics')
      .select('*, products(title, price_paise, stock)')
      .eq('manufacturer_id', manufacturerId)
      .gte('date', since)
      .order('orders_count', { ascending: false })

    // Fetch top search trends in their category
    const { data: trends } = await supabase
      .from('search_trends')
      .select('term, count_this_week, growth_pct, zero_results')
      .eq('category', manufacturer.category)
      .order('growth_pct', { ascending: false })
      .limit(10)

    // Fetch recent alerts
    const { data: alerts } = await supabase
      .from('manufacturer_alerts')
      .select('type, title, message')
      .eq('manufacturer_id', manufacturerId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(5)

    // Build data snapshot for the prompt
    const dataSnapshot = {
      manufacturer: {
        name: manufacturer.name,
        category: manufacturer.category,
        cluster: manufacturer.cluster,
        sellerScore: manufacturer.seller_score,
      },
      metrics: metrics ?? [],
      searchTrends: trends ?? [],
      unreadAlerts: alerts ?? [],
    }

    // Calculate totals for the prompt
    const totalOrders = (metrics ?? []).reduce((s, m) => s + m.orders_count, 0)
    const totalRevenue = (metrics ?? []).reduce((s, m) => s + m.revenue_paise, 0)
    const totalReturns = (metrics ?? []).reduce((s, m) => s + m.returns_count, 0)
    const avgReturnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : '0'

    const prompt = `You are a business analyst for BharatDeal, an Indian factory-direct e-commerce platform.

Generate a concise daily summary insight for this manufacturer:

Manufacturer: ${manufacturer.name}
Category: ${manufacturer.category}
Cluster: ${manufacturer.cluster}
Seller Score: ${manufacturer.seller_score}/100

Last 7 Days Performance:
- Total Orders: ${totalOrders}
- Total Revenue: ₹${(totalRevenue / 100).toFixed(0)}
- Return Rate: ${avgReturnRate}%

Top SKUs by Orders:
${(metrics ?? [])
  .slice(0, 5)
  .map((m) => {
    const product = m.products as unknown as { title: string } | null
    return `- ${product?.title ?? 'Unknown'}: ${m.orders_count} orders, ₹${(m.revenue_paise / 100).toFixed(0)} revenue, ${m.return_rate}% return rate`
  })
  .join('\n')}

Trending Searches in ${manufacturer.category}:
${(trends ?? [])
  .slice(0, 5)
  .map((t) => `- "${t.term}": ${t.count_this_week} searches, +${Number(t.growth_pct).toFixed(1)}% growth${t.zero_results ? ' (NO PRODUCTS LISTED)' : ''}`)
  .join('\n')}

Active Alerts: ${(alerts ?? []).length} unread

Write a 3-4 paragraph daily summary insight that:
1. Highlights the week's performance (what went well, what didn't)
2. Identifies the #1 opportunity they should act on today
3. Gives one specific, actionable recommendation
4. Ends with a motivating closing line

Keep it direct, data-driven, and specific. Use ₹ for prices. Reference actual product names.`

    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      prompt,
      maxOutputTokens: 600,
    })

    // Save to ai_insights table
    const { data: insight, error: insertError } = await supabase
      .from('ai_insights')
      .insert({
        manufacturer_id: manufacturerId,
        insight_type: 'daily_summary',
        title: `Daily Summary — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        content: text,
        data_snapshot: dataSnapshot,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[ai-insights] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save insight' }, { status: 500 })
    }

    return NextResponse.json({ insight })
  } catch (err) {
    console.error('[ai-insights] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
