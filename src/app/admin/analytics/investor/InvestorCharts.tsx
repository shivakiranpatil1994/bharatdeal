'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'
import { formatINR } from '@/lib/utils'

interface DayPoint { date: string; gmv: number; orders: number }
interface Spender   { name: string; spendPaise: number }

interface Props {
  dailySeries: DayPoint[]
  topSpenders: Spender[]
}

function GmvTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl p-3 text-xs shadow-xl shadow-black/40">
      <p className="text-[var(--text-tertiary)] mb-2 font-medium">{label}</p>
      {payload.map(p => (
        <p key={p.name} className={p.name === 'gmv' ? 'text-[var(--brand-primary)]' : 'text-emerald-400'}>
          {p.name === 'gmv' ? `GMV: ${formatINR(p.value)}` : `Orders: ${p.value}`}
        </p>
      ))}
    </div>
  )
}

function SpendTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl p-3 text-xs shadow-xl shadow-black/40">
      <p className="text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-[var(--brand-primary)]">{formatINR(payload[0].value)}</p>
    </div>
  )
}

const SPENDER_COLORS = ['#E8450A', '#F5A623', '#10B981', '#3B82F6', '#8B5CF6']

export function InvestorCharts({ dailySeries, topSpenders }: Props) {
  const hasRevenue = dailySeries.some(d => d.gmv > 0)
  const hasSpenders = topSpenders.length > 0

  // Shorten names for bar chart axis
  const spenderData = topSpenders.map(s => ({
    name: s.name.split('·')[0].trim().slice(0, 16),
    spendPaise: s.spendPaise,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

      {/* GMV area chart — full width */}
      <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">GMV Trajectory</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Last 90 days · paid orders only</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--brand-primary)] inline-block rounded" />GMV</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" />Orders</span>
          </div>
        </div>
        {!hasRevenue ? (
          <div className="h-52 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
            No revenue data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={dailySeries} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#E8450A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E8450A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false} tickLine={false}
                interval={Math.floor(dailySeries.length / 8)}
              />
              <YAxis
                yAxisId="gmv"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : `₹${(v / 100).toFixed(0)}`}
              />
              <YAxis
                yAxisId="ord"
                orientation="right"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<GmvTooltip />} />
              <Area
                yAxisId="gmv"
                type="monotone" dataKey="gmv" name="gmv"
                stroke="#E8450A" strokeWidth={2}
                fill="url(#gmvGrad)"
                dot={false} activeDot={{ r: 3, fill: '#E8450A' }}
              />
              <Area
                yAxisId="ord"
                type="monotone" dataKey="orders" name="orders"
                stroke="#10B981" strokeWidth={1.5}
                fill="url(#ordGrad)"
                dot={false} activeDot={{ r: 3, fill: '#10B981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Ad spender bar chart */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <div className="mb-4">
          <p className="font-semibold text-[var(--text-primary)]">Ad Spend by Seller</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Last 30 days · top 5</p>
        </div>
        {!hasSpenders ? (
          <div className="h-52 flex items-center justify-center text-sm text-[var(--text-tertiary)]">
            No ad spend yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={spenderData} layout="vertical" margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 100000 ? `₹${(v / 100000).toFixed(0)}L` : v >= 1000 ? `₹${(v / 100).toFixed(0)}` : ''}
              />
              <YAxis
                type="category" dataKey="name"
                tick={{ fill: '#A1A1AA', fontSize: 10 }}
                axisLine={false} tickLine={false}
                width={80}
              />
              <Tooltip content={<SpendTooltip />} />
              <Bar dataKey="spendPaise" name="spendPaise" radius={[0, 4, 4, 0]}>
                {spenderData.map((_, i) => (
                  <Cell key={i} fill={SPENDER_COLORS[i % SPENDER_COLORS.length]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}
