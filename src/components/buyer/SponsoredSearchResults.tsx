'use client'

import { useEffect, useState } from 'react'
import { SponsoredProductCard } from './SponsoredProductCard'
import { getOrCreateSessionId } from '@/lib/adHelpers'

interface SponsoredProduct {
  id:            string
  title:         string
  price_paise:   number
  mrp_paise?:    number | null
  images:        string[]
  category:      string
  impressionId?: string
  isSponsored?:  boolean
}

interface Props {
  query?:        string
  category?:     string
  buyerPincode?: string
}

export function SponsoredSearchResults({ query, category, buyerPincode }: Props) {
  const [sponsored, setSponsored] = useState<SponsoredProduct[]>([])

  useEffect(() => {
    if (!query && !category) return

    fetch('/api/ads/auction', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placement:    'sponsored_search',
        query:        query || undefined,
        category:     category || undefined,
        buyerPincode: buyerPincode || undefined,
        buyerSession: getOrCreateSessionId(),
        slots:        2,
      }),
    })
      .then(r => r.json())
      .then(data => setSponsored(data.sponsored ?? []))
      .catch(console.error)
  }, [query, category, buyerPincode])

  if (!sponsored.length) return null

  return (
    <div className="mb-6">
      <p className="text-[11px] text-[--text-tertiary] uppercase tracking-wider mb-3">
        Sponsored
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {sponsored.map(product => (
          <SponsoredProductCard
            key={product.id}
            product={product}
            buyerPincode={buyerPincode}
          />
        ))}
      </div>
      <div className="border-b border-[--bg-border] mt-4 mb-1" />
    </div>
  )
}
