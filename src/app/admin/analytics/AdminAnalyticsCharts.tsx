'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { formatINR } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  ordersByDay: { date: string; orders: number; revenue: number }[]
  paymentBreakdown: { method: string; count: number }[]
  categoryBreakdown: { category: string; revenue: number; orders: number }[]
  trendingSearches: { term: string; count_this_week: number; growth_pct: number }[]
}

const PAYMENT_COLORS = ['#E8450A', '#F5A623', '#10B981', '#3B82F6', '#8B5CF6']

// ─── Tooltip Components ────────────────────────────────────────────────────────

function RevenueDualTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 text-sm shadow-lg shadow-black/50">
      <p className="text-[var(--text-tertiary)] mb-2 text-xs">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-mono" style={{ color: p.color }}>
          {p.name === 'revenue'
            ? `Revenue: ${formatINR(p.value)}`
            : `Orders: ${p.value.toLocaleString('en-IN')}`}
        </p>
      ))}
    </div>
  )
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 text-sm shadow-lg shadow-black/50">
      <p className="font-mono text-[var(--brand-primary)]">{formatINR(payload[0].value)}</p>
    </div>
  )
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: { method: string } }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 text-sm shadow-lg shadow-black/50">
      <p className="text-[var(--text-primary)] font-medium">{payload[0].payload.method}</p>
      <p className="font-mono text-[var(--text-secondary)] mt-0.5">
        {payload[0].value.toLocaleString('en-IN')} orders
      </p>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AdminAnalyticsCharts({
  ordersByDay,
  paymentBreakdown,
  categoryBreakdown,
  trendingSearches,
}: Props) {
  const topCategories = categoryBreakdown.slice(0, 6)

  // Format category revenue for horizontal bar chart (display in K)
  const categoryData = topCategories.map((c) => ({
    category: c.category.length > 14 ? c.category.slice(0, 14) + '…' : c.category,
    revenue: c.revenue,
    revenueK: Math.round(c.revenue / 100 / 1000), // in ₹K
  }))

  // Top 8 trending for mini search chart
  const topTrending = trendingSearches
    .filter((s) => s.growth_pct > 0)
    .slice(0, 8)

  const maxGrowth = Math.max(...topTrending.map((s) => s.growth_pct), 1)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* 1. Revenue + Orders dual-axis line chart (col-span-2) */}
      <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <h2 className="font-semibold text-[var(--text-primary)] mb-1">
          Revenue &amp; Orders — Last 30 Days
        </h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">
          Orange = revenue (left axis) · Emerald = orders (right axis)
        </p>
        {ordersByDay.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-[var(--text-tertiary)] text-sm">
            No order data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              data={ordersByDay}
              margin={{ top: 4, right: 16, left: -12, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              {/* Left Y: revenue */}
              <YAxis
                yAxisId="left"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `₹${Math.round(v / 100 / 1000)}K`}
                width={48}
              />
              {/* Right Y: orders */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<RevenueDualTooltip />} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="revenue"
                stroke="#E8450A"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#E8450A', strokeWidth: 0 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                name="orders"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 2. Category Revenue horizontal bar (col-span-1) */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <h2 className="font-semibold text-[var(--text-primary)] mb-1">Category Revenue</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-4">Top 6 categories (₹K)</p>
        {categoryData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-[var(--text-tertiary)] text-sm">
            No category data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A35" horizontal={false} />
              <XAxis
                type="number"
                dataKey="revenueK"
                tick={{ fill: '#52525B', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}K`}
              />
              <YAxis
                type="category"
                dataKey="category"
                tick={{ fill: '#A1A1AA', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<CategoryTooltip />} />
              <Bar dataKey="revenueK" radius={[0, 4, 4, 0]} fill="#E8450A" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 3. Payment Methods donut (col-span-1) */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <h2 className="font-semibold text-[var(--text-primary)] mb-1">Payment Methods</h2>
        <p className="text-xs text-[var(--text-tertiary)] mb-2">Order distribution</p>
        {paymentBreakdown.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-[var(--text-tertiary)] text-sm">
            No payment data yet
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {paymentBreakdown.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom legend */}
            <div className="mt-2 flex flex-col gap-1.5">
              {paymentBreakdown.map((p, i) => {
                const total = paymentBreakdown.reduce((s, x) => s + x.count, 0)
                const pct = total > 0 ? ((p.count / total) * 100).toFixed(0) : '0'
                return (
                  <div key={p.method} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: PAYMENT_COLORS[i % PAYMENT_COLORS.length] }}
                      />
                      <span className="text-[var(--text-secondary)]">{p.method}</span>
                    </div>
                    <span className="font-mono text-[var(--text-primary)]">
                      {p.count.toLocaleString('en-IN')} ({pct}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* 4. Trending Searches mini chart (col-span-4 full-width) */}
      <div className="lg:col-span-4 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-[var(--text-primary)]">Top Trending Searches</h2>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mb-5">
          Fastest growing search terms this week vs last — bar width = relative growth
        </p>
        {topTrending.length === 0 ? (
          <div className="py-6 flex items-center justify-center text-[var(--text-tertiary)] text-sm">
            No trending search data yet
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topTrending.map((s) => {
              const barWidth = Math.min((s.growth_pct / maxGrowth) * 100, 100)
              return (
                <div key={s.term} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-primary)] font-medium truncate mr-3">
                      {s.term}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono text-xs text-[var(--text-tertiary)]">
                        {s.count_this_week.toLocaleString('en-IN')} searches
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <TrendingUp className="w-3 h-3" />+{s.growth_pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
