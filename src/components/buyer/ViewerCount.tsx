'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

interface ViewerCountProps {
  productId: string
}

// Seeded by productId + hour so the number is stable within the hour
function seedCount(productId: string): number {
  let hash = 0
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) & 0xffff
  }
  const hourSeed = new Date().getHours() * 7
  return 12 + ((hash + hourSeed) % 89) // 12–100
}

export function ViewerCount({ productId }: ViewerCountProps) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const base = seedCount(productId)
    setCount(base)

    // Randomly nudge ±1 every 20–40s to feel live
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev === null) return base
        const delta = Math.random() > 0.5 ? 1 : -1
        return Math.max(8, Math.min(120, prev + delta))
      })
    }, 20_000 + Math.random() * 20_000)

    return () => clearInterval(interval)
  }, [productId])

  if (count === null) return null

  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-accent)] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-accent)]" />
      </span>
      <Eye className="w-3 h-3" />
      <span>
        <span className="font-mono font-medium text-[var(--text-secondary)]">{count}</span>
        {' '}people viewing now
      </span>
    </div>
  )
}
