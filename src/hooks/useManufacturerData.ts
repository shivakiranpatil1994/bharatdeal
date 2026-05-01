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

        // Load first manufacturer directly — no auth required for demo
        const { data } = await supabase
          .from('manufacturers')
          .select('*')
          .limit(1)
          .single()

        if (data) {
          setManufacturer(data)
          setUserId(data.id)
        } else {
          setError('No manufacturer found — run seed SQL first')
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
