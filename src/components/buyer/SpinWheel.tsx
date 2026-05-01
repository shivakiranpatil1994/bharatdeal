'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Gift, X } from 'lucide-react'

const SEGMENTS = [
  { label: '₹50 OFF', color: '#E8450A', value: 50, probability: 0.15 },
  { label: '₹20 OFF', color: '#F5A623', value: 20, probability: 0.25 },
  { label: 'Free Ship', color: '#10B981', value: 0, probability: 0.20 },
  { label: '₹100 OFF', color: '#3B82F6', value: 100, probability: 0.08 },
  { label: 'Try Again', color: '#52525B', value: -1, probability: 0.17 },
  { label: '₹30 OFF', color: '#8B5CF6', value: 30, probability: 0.15 },
]

const TOTAL_SEGMENTS = SEGMENTS.length
const SEGMENT_ANGLE = 360 / TOTAL_SEGMENTS

function pickSegment(): number {
  const rand = Math.random()
  let cum = 0
  for (let i = 0; i < SEGMENTS.length; i++) {
    cum += SEGMENTS[i].probability
    if (rand < cum) return i
  }
  return 0
}

const STORAGE_KEY = 'bd_spin_date'

function canSpinToday(): boolean {
  if (typeof window === 'undefined') return false
  const last = localStorage.getItem(STORAGE_KEY)
  if (!last) return true
  return new Date(last).toDateString() !== new Date().toDateString()
}

function markSpun() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString())
}

interface SpinWheelProps {
  onWin?: (label: string, value: number) => void
}

export function SpinWheel({ onWin }: SpinWheelProps) {
  const [open, setOpen] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ label: string; value: number } | null>(null)
  const [canSpin, setCanSpin] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCanSpin(canSpinToday())
  }, [open])

  function handleSpin() {
    if (spinning || !canSpin) return
    setSpinning(true)
    setResult(null)

    const winIndex = pickSegment()
    // Spin 5 full rotations + land on the winning segment
    // The pointer is at the top (0°). Segment i starts at i * SEGMENT_ANGLE.
    // To land segment i under pointer: rotate so that mid of segment faces 0° (top).
    const targetAngle = 360 * 5 + (360 - (winIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2))
    const newRotation = rotation + targetAngle

    setRotation(newRotation)

    setTimeout(() => {
      const seg = SEGMENTS[winIndex]
      setResult({ label: seg.label, value: seg.value })
      setSpinning(false)
      markSpun()
      setCanSpin(false)
      if (seg.value > 0) {
        onWin?.(seg.label, seg.value)
      }
    }, 4000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-[var(--brand-primary)] shadow-lg shadow-orange-900/40 flex items-center justify-center animate-bounce hover:animate-none transition-all"
        aria-label="Spin to win"
      >
        <Gift className="w-6 h-6 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-2xl p-6 flex flex-col items-center gap-5">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <h2 className="font-bold text-[var(--text-primary)] text-lg">Spin & Win!</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>

        {/* Wheel */}
        <div className="relative w-64 h-64">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-white drop-shadow" />

          {/* Spinning wheel */}
          <div
            ref={wheelRef}
            className="w-64 h-64 rounded-full overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENTS.map((seg, i) => {
                const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180)
                const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180)
                const x1 = 100 + 100 * Math.cos(startAngle)
                const y1 = 100 + 100 * Math.sin(startAngle)
                const x2 = 100 + 100 * Math.cos(endAngle)
                const y2 = 100 + 100 * Math.sin(endAngle)
                const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180)
                const tx = 100 + 68 * Math.cos(midAngle)
                const ty = 100 + 68 * Math.sin(midAngle)

                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={seg.color}
                      stroke="#0A0A0F"
                      strokeWidth="1"
                    />
                    <text
                      x={tx}
                      y={ty}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="9"
                      fontWeight="700"
                      transform={`rotate(${(i + 0.5) * SEGMENT_ANGLE}, ${tx}, ${ty})`}
                    >
                      {seg.label}
                    </text>
                  </g>
                )
              })}
              {/* Center circle */}
              <circle cx="100" cy="100" r="14" fill="#0A0A0F" stroke="#2A2A35" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Result */}
        {result ? (
          <div className="w-full text-center">
            {result.value > 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-400">{result.label}!</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Discount applied at checkout automatically.
                </p>
              </div>
            ) : result.value === 0 ? (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-lg font-bold text-blue-400">Free Shipping!</p>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Free delivery on your next order today.
                </p>
              </div>
            ) : (
              <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl p-4">
                <p className="text-lg font-bold text-[var(--text-secondary)]">Better luck tomorrow!</p>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">Spin again in 24 hours.</p>
              </div>
            )}
            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-orange-600 text-white font-semibold text-sm transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            {canSpin ? (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="w-full py-3 rounded-xl bg-[var(--brand-primary)] hover:bg-orange-600 text-white font-bold transition-colors disabled:opacity-60"
              >
                {spinning ? 'Spinning…' : 'SPIN!'}
              </button>
            ) : (
              <div className="text-center py-3 text-sm text-[var(--text-tertiary)]">
                Come back tomorrow for another spin!
              </div>
            )}
            <p className="text-center text-xs text-[var(--text-tertiary)]">
              One free spin per day. Discounts valid for 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
