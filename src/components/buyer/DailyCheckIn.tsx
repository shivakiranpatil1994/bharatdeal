'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Gift } from 'lucide-react'

const STREAK_KEY = 'bd_checkin'

interface CheckInData {
  lastDate: string
  streak: number
}

function getCheckInData(): CheckInData | null {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) ?? 'null')
  } catch {
    return null
  }
}

function saveCheckIn(streak: number) {
  localStorage.setItem(
    STREAK_KEY,
    JSON.stringify({ lastDate: new Date().toDateString(), streak })
  )
}

export function DailyCheckIn() {
  const [checked, setChecked] = useState(false)
  const [streak, setStreak] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const data = getCheckInData()
    const today = new Date().toDateString()

    if (!data) {
      setVisible(true)
      setStreak(0)
      return
    }

    if (data.lastDate === today) {
      setChecked(true)
      setStreak(data.streak)
      return
    }

    // Yesterday's check-in = maintain streak, else reset
    const yesterday = new Date(Date.now() - 86_400_000).toDateString()
    const newStreak = data.lastDate === yesterday ? data.streak : 0
    setStreak(newStreak)
    setVisible(true)
  }, [])

  function handleCheckIn() {
    const newStreak = streak + 1
    setStreak(newStreak)
    setChecked(true)
    setVisible(false)
    saveCheckIn(newStreak)
  }

  if (checked && streak > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        <span className="text-emerald-400 font-medium">
          {streak} day streak! Come back tomorrow.
        </span>
      </div>
    )
  }

  if (!visible) return null

  return (
    <button
      onClick={handleCheckIn}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <Gift className="w-4 h-4 text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-400">Daily Check-In</p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {streak > 0 ? `${streak} day streak — tap to continue!` : 'Tap to start your streak!'}
        </p>
      </div>
    </button>
  )
}
