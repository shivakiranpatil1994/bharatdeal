'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Alert = Database['public']['Tables']['manufacturer_alerts']['Row']

export function useRealtimeAlerts(manufacturerId: string) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    const supabase = createSupabaseBrowser()
    const { data } = await supabase
      .from('manufacturer_alerts')
      .select('*')
      .eq('manufacturer_id', manufacturerId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10)
    setAlerts(data ?? [])
    setLoading(false)
  }, [manufacturerId])

  const markRead = useCallback(async (alertId: string) => {
    const supabase = createSupabaseBrowser()
    await supabase
      .from('manufacturer_alerts')
      .update({ read: true })
      .eq('id', alertId)
    setAlerts((prev) => prev.filter((a) => a.id !== alertId))
  }, [])

  useEffect(() => {
    if (!manufacturerId) return
    fetchAlerts()

    const supabase = createSupabaseBrowser()
    const channel = supabase
      .channel(`alerts-${manufacturerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'manufacturer_alerts',
          filter: `manufacturer_id=eq.${manufacturerId}`,
        },
        () => fetchAlerts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [manufacturerId, fetchAlerts])

  return { alerts, loading, markRead }
}
