'use client'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface FlashDealTimerProps {
  endsAt: string
  className?: string
  large?: boolean
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

export function FlashDealTimer({ endsAt, className, large }: FlashDealTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(endsAt))

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(endsAt)), 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (timeLeft.expired) return null

  const isUrgent = timeLeft.hours === 0 && timeLeft.minutes < 5
  const pad = (n: number) => String(n).padStart(2, '0')
  const units = [pad(timeLeft.hours), pad(timeLeft.minutes), pad(timeLeft.seconds)]
  const labels = ['HRS', 'MIN', 'SEC']

  if (large) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {units.map((unit, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="flex flex-col items-center">
              <span className="font-['JetBrains_Mono',monospace] text-2xl sm:text-3xl font-extrabold text-white bg-black/30 rounded-xl px-3 py-1.5 min-w-[56px] text-center tabular-nums">
                {unit}
              </span>
              <span className="text-[9px] text-white/60 uppercase tracking-widest mt-1">{labels[i]}</span>
            </span>
            {i < 2 && <span className="text-white/50 font-bold text-xl mb-4">:</span>}
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <span className="text-[10px] text-gray-400 mr-1">Ends in</span>
      {units.map((unit, i) => (
        <span key={i} className="flex items-center gap-0.5">
          <span className={cn(
            'font-[\'JetBrains_Mono\',monospace] text-[10px] font-bold px-1.5 py-0.5 rounded',
            isUrgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'
          )}>
            {unit}
          </span>
          {i < 2 && <span className={cn('text-[10px]', isUrgent ? 'text-red-500' : 'text-gray-400')}>:</span>}
        </span>
      ))}
    </div>
  )
}
