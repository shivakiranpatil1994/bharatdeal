'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

export interface ManufacturerStats {
  ordersToday: number
  revenueTodayPaise: number
  returnsToday: number
  returnRate: number
  totalStock: number
}

const DEFAULT: ManufacturerStats = {
  ordersToday: 0,
  revenueTodayPaise: 0,
  returnsToday: 0,
  returnRate: 0,
  totalStock: 0,
}

export function useRealtimeOrders(manufacturerId: string): ManufacturerStats & { loading: boolean } {
  const [stats, setStats] = useState<ManufacturerStats>(DEFAULT)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    const { data } = await supabase
      .from('manufacturer_today_stats')
      .select('*')
      .eq('manufacturer_id', manufacturerId)
      .single()

    if (data) {
      setStats({
        ordersToday: data.orders_today ?? 0,
        revenueTodayPaise: data.revenue_today_paise ?? 0,
        returnsToday: data.returns_today ?? 0,
        returnRate: Number(data.return_rate ?? 0),
        totalStock: data.total_stock ?? 0,
      })
    }
    setLoading(false)
  }, [manufacturerId])

  useEffect(() => {
    if (!manufacturerId) return

    fetchStats()

    const supabase = createSupabaseBrowser()

    // Re-fetch materialized view whenever a new order lands for this manufacturer
    const channel = supabase
      .channel(`orders-realtime-${manufacturerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `manufacturer_id=eq.${manufacturerId}`,
        },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `manufacturer_id=eq.${manufacturerId}`,
        },
        () => fetchStats()
      )
      .subscribe()

    // Refresh every 5 minutes as a fallback (materialized view is refreshed by cron)
    const interval = setInterval(fetchStats, 5 * 60 * 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [manufacturerId, fetchStats])

  return { ...stats, loading }
}
