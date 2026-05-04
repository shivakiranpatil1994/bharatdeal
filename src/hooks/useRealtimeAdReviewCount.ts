'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

export function useRealtimeAdReviewCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    supabase
      .from('ad_campaigns')
      .select('id', { count: 'exact', head: true })
      .eq('review_status', 'pending_review')
      .then(({ count: c }) => setCount(c ?? 0))

    const channel = supabase
      .channel('admin-pending-ads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ad_campaigns' }, () => {
        supabase
          .from('ad_campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('review_status', 'pending_review')
          .then(({ count: c }) => setCount(c ?? 0))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return count
}
