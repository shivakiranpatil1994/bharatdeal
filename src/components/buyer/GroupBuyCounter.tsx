'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

interface GroupBuyCounterProps {
  productId: string
  targetCount?: number
}

// Deterministic "live" buyer count seeded from productId + current hour
function getLiveCount(productId: string, base: number): number {
  const seed = productId.charCodeAt(0) + productId.charCodeAt(1) + new Date().getHours()
  return base + (seed % 12)
}

export function GroupBuyCounter({ productId, targetCount = 50 }: GroupBuyCounterProps) {
  const [count, setCount] = useState(0)
  const [currentBuyers, setCurrentBuyers] = useState(0)
  const storageKey = `bd_grp_${productId}`

  useEffect(() => {
    // Persist a stable base count in sessionStorage so it doesn't jump on re-renders
    const stored = sessionStorage.getItem(storageKey)
    const base = stored ? parseInt(stored, 10) : Math.floor(targetCount * 0.35 + Math.random() * 20)
    if (!stored) sessionStorage.setItem(storageKey, String(base))
    setCount(base)
    setCurrentBuyers(getLiveCount(productId, 3))

    // Slowly increment to simulate real group buy filling up
    const interval = setInterval(() => {
      setCount((prev) => {
        const next = Math.min(prev + 1, targetCount)
        sessionStorage.setItem(storageKey, String(next))
        return next
      })
    }, 45_000) // +1 every 45 seconds

    return () => clearInterval(interval)
  }, [productId, storageKey, targetCount])

  const pct = Math.min(100, Math.round((count / targetCount) * 100))
  const remaining = targetCount - count

  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[var(--brand-secondary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">Group Buy</span>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          <span className="font-mono text-[var(--brand-accent)]">{currentBuyers}</span> buying now
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--text-secondary)]">
            <span className="font-mono font-bold text-[var(--text-primary)]">{count}</span>
            {' '}/ {targetCount} joined
          </span>
          <span className="font-mono text-[var(--brand-secondary)]">{pct}%</span>
        </div>
        <div className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-primary)] rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          {remaining > 0 ? (
            <>
              <span className="text-[var(--brand-secondary)] font-semibold">{remaining} more</span>
              {' '}needed to unlock group price
            </>
          ) : (
            <span className="text-[var(--brand-accent)] font-semibold">
              Group price unlocked! 🎉
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
