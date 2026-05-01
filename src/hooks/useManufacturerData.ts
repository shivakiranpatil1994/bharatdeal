'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Manufacturer = Database['public']['Tables']['manufacturers']['Row']

interface ManufacturerData {
  manufacturer: Manufacturer | null
  userId: string | null
  loading: boolean
  error: string | null
}

export function useManufacturerData(): ManufacturerData {
  const [manufacturer, setManufacturer] = useState<Manufacturer | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createSupabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          // Dev preview: load the first manufacturer from the DB
          const { data } = await supabase
            .from('manufacturers')
            .select('*')
            .limit(1)
            .single()

          if (data) {
            setManufacturer(data)
            setUserId(data.id)
          } else {
            setError('No manufacturer found — run seed migration 006_seed.sql')
          }
          setLoading(false)
          return
        }

        setUserId(user.id)

        // Look up by email — auth UUID does not need to match manufacturer UUID
        const { data, error: mfrError } = await supabase
          .from('manufacturers')
          .select('*')
          .eq('login_email', user.email!)
          .single()

        if (mfrError || !data) {
          setError('Manufacturer record not found')
        } else {
          setManufacturer(data)
        }
      } catch {
        setError('Failed to load manufacturer data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { manufacturer, userId, loading, error }
}
