'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { Sparkles, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

type Insight = Database['public']['Tables']['ai_insights']['Row']

const TYPE_LABEL: Record<string, string> = {
  daily_summary: 'Summary',
  opportunity: 'Opportunity',
  alert: 'Alert',
  trend: 'Trend',
  production_plan: 'Plan',
}

export function DailyInsights({ manufacturerId }: { manufacturerId: string }) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!manufacturerId) return
    const supabase = createSupabaseBrowser()
    supabase
      .from('ai_insights')
      .select('*')
      .eq('manufacturer_id', manufacturerId)
      .order('generated_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { setInsights(data ?? []); setLoading(false) })
  }, [manufacturerId])

  const latest = insights[0]

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col text-white relative"
      style={{ background: 'linear-gradient(145deg, #F15A2B 0%, #E04318 55%, #C73510 100%)', boxShadow: '0 8px 24px rgba(241,90,43,0.25)' }}
    >
      {/* Decorative glow — like the screenshot's soft highlight */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.12)', filter: 'blur(40px)' }} />

      <div className="px-5 py-4 flex items-center gap-2 relative">
        <Sparkles className="w-4 h-4 text-white/90" />
        <h2 className="font-semibold text-white text-sm">AI Insights</h2>
      </div>

      <div className="flex-1 px-5 pb-5 flex flex-col relative">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse bg-white/15 rounded-xl" />)}
          </div>
        ) : !latest ? (
          <div className="flex-1 flex flex-col justify-between gap-6">
            <div>
              <p className="text-lg font-bold leading-snug" style={{ letterSpacing: '-0.02em' }}>
                Your AI business advisor is ready
              </p>
              <p className="text-sm text-white/75 mt-2 leading-relaxed">
                Daily insights are generated automatically once orders start coming in. Ask anything about your sales, returns, or demand.
              </p>
            </div>
            <Link href="/manufacturer/dashboard/ai"
              className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#F15A2B] text-xs font-bold hover:bg-orange-50 transition-colors">
              Ask AI <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wide">
                    {TYPE_LABEL[latest.insight_type] ?? latest.insight_type}
                  </span>
                  <span className="text-[10px] text-white/60">
                    {new Date(latest.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-base font-bold leading-snug" style={{ letterSpacing: '-0.02em' }}>{latest.title}</p>
                <p className="text-sm text-white/80 mt-2 leading-relaxed line-clamp-4">{latest.content}</p>
              </div>

              {insights.slice(1).map((insight) => (
                <div key={insight.id} className="rounded-xl bg-white/10 border border-white/15 p-3">
                  <p className="text-xs font-semibold text-white truncate">{insight.title}</p>
                  <p className="text-[11px] text-white/65 mt-0.5 line-clamp-2 leading-relaxed">{insight.content}</p>
                </div>
              ))}
            </div>

            <Link href="/manufacturer/dashboard/ai"
              className="self-start inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#F15A2B] text-xs font-bold hover:bg-orange-50 transition-colors">
              Read More <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
