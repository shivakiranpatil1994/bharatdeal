import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SearchEventRow {
  term_normalised: string | null
  term: string
  results_count: number
  buyer_pincode: string | null
  created_at: string
}

interface ProductRow {
  category: string
}

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const now = new Date()
    const thisWeekStart = new Date(now.getTime() - 7 * 86400000).toISOString()
    const lastWeekStart = new Date(now.getTime() - 14 * 86400000).toISOString()

    // Fetch this week's searches
    const { data: thisWeek, error: thisWeekError } = await supabase
      .from('search_events')
      .select('term_normalised, term, results_count, buyer_pincode, created_at')
      .gte('created_at', thisWeekStart)

    if (thisWeekError) {
      console.error('[compute-search-trends] this week error:', thisWeekError.message)
      return new Response(JSON.stringify({ error: thisWeekError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fetch last week's searches
    const { data: lastWeek } = await supabase
      .from('search_events')
      .select('term_normalised, results_count')
      .gte('created_at', lastWeekStart)
      .lt('created_at', thisWeekStart)

    // Aggregate this week counts
    const thisWeekMap = new Map<
      string,
      { count: number; zeroResults: boolean; pincodes: Set<string> }
    >()
    for (const s of (thisWeek ?? []) as SearchEventRow[]) {
      const term = (s.term_normalised ?? s.term).toLowerCase().trim()
      if (!term) continue
      const existing = thisWeekMap.get(term)
      if (existing) {
        existing.count += 1
        if (s.results_count === 0) existing.zeroResults = true
        if (s.buyer_pincode) existing.pincodes.add(s.buyer_pincode)
      } else {
        thisWeekMap.set(term, {
          count: 1,
          zeroResults: s.results_count === 0,
          pincodes: new Set(s.buyer_pincode ? [s.buyer_pincode] : []),
        })
      }
    }

    // Aggregate last week counts
    const lastWeekMap = new Map<string, number>()
    for (const s of (lastWeek ?? []) as { term_normalised: string | null; results_count: number }[]) {
      const term = (s.term_normalised ?? '').toLowerCase().trim()
      if (!term) continue
      lastWeekMap.set(term, (lastWeekMap.get(term) ?? 0) + 1)
    }

    // Fetch products to get category mapping (simple: search for matching terms)
    const { data: products } = await supabase
      .from('products')
      .select('title, category')
      .eq('active', true)

    // Build category lookup from product titles
    const productKeywords = new Map<string, string>()
    for (const p of (products ?? []) as (ProductRow & { title: string })[]) {
      const words = p.title.toLowerCase().split(/\s+/)
      for (const word of words) {
        if (word.length > 3) {
          productKeywords.set(word, p.category)
        }
      }
    }

    function guessCategory(term: string): string | null {
      const words = term.toLowerCase().split(/\s+/)
      for (const word of words) {
        const category = productKeywords.get(word)
        if (category) return category
      }
      // Keyword-based fallback
      if (/saree|sari|silk|banarasi|georgette/.test(term)) return 'Sarees'
      if (/tshirt|t-shirt|kurti|cotton|polo|knitwear/.test(term)) return 'Cotton Knitwear'
      if (/brass|diya|ganesh|idol|vase|decor/.test(term)) return 'Brass Home Decor'
      return null
    }

    // Build upsert rows
    const upsertRows = Array.from(thisWeekMap.entries()).map(([term, data]) => {
      const lastCount = lastWeekMap.get(term) ?? 0
      const growthPct =
        lastCount > 0
          ? Number((((data.count - lastCount) / lastCount) * 100).toFixed(2))
          : 100

      return {
        term,
        category: guessCategory(term),
        count_this_week: data.count,
        count_last_week: lastCount,
        growth_pct: growthPct,
        zero_results: data.zeroResults,
        top_pincodes: Array.from(data.pincodes).slice(0, 5),
        updated_at: new Date().toISOString(),
      }
    })

    // Upsert in batches
    let processed = 0
    for (let i = 0; i < upsertRows.length; i += 100) {
      const batch = upsertRows.slice(i, i + 100)
      const { error } = await supabase
        .from('search_trends')
        .upsert(batch, { onConflict: 'term', ignoreDuplicates: false })

      if (error) {
        console.error('[compute-search-trends] upsert error:', error.message)
      } else {
        processed += batch.length
      }
    }

    console.log(`[compute-search-trends] Processed ${upsertRows.length} terms, upserted ${processed}`)
    return new Response(
      JSON.stringify({ ok: true, terms_processed: upsertRows.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[compute-search-trends] Unexpected error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
