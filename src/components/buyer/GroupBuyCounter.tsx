'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

interface GroupBuyCounterProps {
  productId: string
  targetCount?: number
}

function getLiveCount(productId: string, base: number): number {
  const seed = productId.charCodeAt(0) + productId.charCodeAt(1) + new Date().getHours()
  return base + (seed % 12)
}

export function GroupBuyCounter({ productId, targetCount = 50 }: GroupBuyCounterProps) {
  const [count, setCount] = useState(0)
  const [currentBuyers, setCurrentBuyers] = useState(0)
  const storageKey = `bd_grp_${productId}`

  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey)
    const base = stored ? parseInt(stored, 10) : Math.floor(targetCount * 0.35 + Math.random() * 20)
    if (!stored) sessionStorage.setItem(storageKey, String(base))
    setCount(base)
    setCurrentBuyers(getLiveCount(productId, 3))

    const interval = setInterval(() => {
      setCount((prev) => {
        const next = Math.min(prev + 1, targetCount)
        sessionStorage.setItem(storageKey, String(next))
        return next
      })
    }, 45_000)

    return () => clearInterval(interval)
  }, [productId, storageKey, targetCount])

  const pct = Math.min(100, Math.round((count / targetCount) * 100))
  const remaining = targetCount - count
  const unlocked = remaining <= 0

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-sm font-bold text-gray-900">Group Buy</span>
          {unlocked && (
            <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              UNLOCKED
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          <span className="font-bold text-orange-600">{currentBuyers}</span> buying now
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">
            <span className="font-bold text-gray-900">{count}</span> / {targetCount} joined
          </span>
          <span className="font-bold text-orange-600">{pct}%</span>
        </div>
        <div className="h-2.5 bg-orange-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${unlocked ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {unlocked ? (
            <span className="text-green-600 font-semibold">Group price unlocked! Everyone saves extra.</span>
          ) : (
            <><span className="font-semibold text-orange-600">{remaining} more</span> people needed to unlock group discount</>
          )}
        </p>
      </div>
    </div>
  )
}
