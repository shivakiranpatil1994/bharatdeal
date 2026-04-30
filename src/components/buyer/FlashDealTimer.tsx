'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface FlashDealTimerProps {
  endsAt: string
  className?: string
}

interface TimeLeft {
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function getTimeLeft(endsAt: string): TimeLeft {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true }
  const totalSeconds = Math.floor(diff / 1000)
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  }
}

export function FlashDealTimer({ endsAt, className }: FlashDealTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(endsAt))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (timeLeft.expired) return null

  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 5
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mr-1">Ends in</span>
      {[pad(timeLeft.hours), pad(timeLeft.minutes), pad(timeLeft.seconds)].map((unit, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className={cn(
              'font-mono-price text-sm font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]',
              isUrgent ? 'text-red-400' : 'text-[var(--text-primary)]'
            )}
          >
            {unit}
          </span>
          {i < 2 && <span className={cn('text-sm font-bold', isUrgent ? 'text-red-400' : 'text-[var(--text-tertiary)]')}>:</span>}
        </span>
      ))}
    </div>
  )
}
