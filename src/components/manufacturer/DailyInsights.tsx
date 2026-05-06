'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { Sparkles, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Insight = Database['public']['Tables']['ai_insights']['Row']

const TYPE_LABEL: Record<string, string> = {
  daily_summary: 'Summary',
  opportunity: 'Opportunity',
  alert: 'Alert',
  trend: 'Trend',
  production_plan: 'Plan',
}

const TYPE_COLOR: Record<string, string> = {
  daily_summary:   'text-blue-700 bg-blue-50/80 border-blue-200',
  opportunity:     'text-emerald-700 bg-emerald-50/80 border-emerald-200',
  alert:           'text-red-700 bg-red-50/80 border-red-200',
  trend:           'text-purple-700 bg-purple-50/80 border-purple-200',
  production_plan: 'text-amber-700 bg-amber-50/80 border-amber-200',
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

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-gray-900">AI Insights</h2>
        </div>
        <Link href="/manufacturer/dashboard/ai" className="text-xs text-[#F15A2B] hover:underline flex items-center gap-1 font-medium">
          Ask AI <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto max-h-80">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse bg-gray-100 rounded-xl" />)}
          </div>
        ) : insights.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">No insights yet</p>
              <p className="text-xs text-gray-400 mt-1">Generated daily once orders come in.</p>
            </div>
            <Link href="/manufacturer/dashboard/ai" className="px-4 py-2 rounded-xl bg-[#F15A2B]/10 border border-[#F15A2B]/20 text-sm text-[#F15A2B] hover:bg-[#F15A2B]/20 transition-colors font-medium">
              Ask AI instead
            </Link>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[insight.insight_type] ?? TYPE_COLOR.daily_summary}`}>
                    {TYPE_LABEL[insight.insight_type] ?? insight.insight_type}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(insight.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{insight.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
