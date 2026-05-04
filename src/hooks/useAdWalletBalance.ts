'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'

interface WalletState {
  balancePaise: number
  isLoading:    boolean
}

export function useAdWalletBalance(manufacturerId: string): WalletState {
  const [state, setState] = useState<WalletState>({ balancePaise: 0, isLoading: true })

  useEffect(() => {
    const supabase = createSupabaseBrowser()

    supabase
      .from('ad_wallets')
      .select('balance_paise')
      .eq('manufacturer_id', manufacturerId)
      .single()
      .then(({ data }) => {
        setState({ balancePaise: (data as { balance_paise: number } | null)?.balance_paise ?? 0, isLoading: false })
      })

    const channel = supabase
      .channel(`ad-wallet-${manufacturerId}`)
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'ad_wallets',
          filter: `manufacturer_id=eq.${manufacturerId}`,
        },
        (payload) => {
          const updated = payload.new as { balance_paise: number }
          setState(prev => ({ ...prev, balancePaise: updated.balance_paise }))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [manufacturerId])

  return state
}
