'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface AdSpendStats {
  spendTodayPaise: number
  clicksToday:     number
  isLoading:       boolean
}

export function useRealtimeAdSpend(manufacturerId: string): AdSpendStats {
  const [stats, setStats] = useState<AdSpendStats>({
    spendTodayPaise: 0,
    clicksToday:     0,
    isLoading:       true,
  })

  const fetchInitial = useCallback(async () => {
    if (!manufacturerId) { setStats({ spendTodayPaise: 0, clicksToday: 0, isLoading: false }); return }
    const supabase = createSupabaseBrowser()
    const todayStr = new Date().toISOString().split('T')[0]
    const todayISO = new Date(todayStr).toISOString()

    const { data } = await supabase
      .from('ad_clicks')
      .select('cpc_charged_paise')
      .eq('manufacturer_id', manufacturerId)
      .eq('is_fraud', false)
      .gte('created_at', todayISO)

    if (data) {
      setStats({
        spendTodayPaise: (data as { cpc_charged_paise: number }[]).reduce((sum, c) => sum + c.cpc_charged_paise, 0),
        clicksToday:     data.length,
        isLoading:       false,
      })
    } else {
      setStats(prev => ({ ...prev, isLoading: false }))
    }
  }, [manufacturerId])

  useEffect(() => {
    fetchInitial()

    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`ad-spend-${manufacturerId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'ad_clicks',
          filter: `manufacturer_id=eq.${manufacturerId}`,
        },
        (payload) => {
          const click = payload.new as { cpc_charged_paise: number; is_fraud: boolean }
          if (click.is_fraud) return
          setStats(prev => ({
            ...prev,
            spendTodayPaise: prev.spendTodayPaise + click.cpc_charged_paise,
            clicksToday:     prev.clicksToday + 1,
          }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [manufacturerId, fetchInitial])

  return stats
}
