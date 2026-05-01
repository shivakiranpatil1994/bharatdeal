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
  Legend,
} from 'recharts'
import { formatINR } from '@/lib/utils'

interface OrderDay {
  date: string
  orders: number
  revenue: number
}

interface PaymentMethod {
  method: string
  count: number
}

interface Props {
  ordersByDay: OrderDay[]
  paymentBreakdown: PaymentMethod[]
}

const PAYMENT_COLORS = ['#E8450A', '#F5A623', '#10B981', '#3B82F6', '#8B5CF6']

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 text-sm shadow-lg">
      <p className="text-[var(--text-tertiary)] mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-[var(--brand-primary)]">
          {p.name === 'revenue' ? `Revenue: ${formatINR(p.value)}` : `Orders: ${p.value}`}
        </p>
      ))}
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
    <div className="bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg p-3 text-sm shadow-lg">
      <p className="text-[var(--text-primary)] font-medium">{payload[0].payload.method}</p>
      <p className="text-[var(--text-secondary)] mt-0.5">{payload[0].value} orders</p>
    </div>
  )
}

export function AdminAnalyticsCharts({ ordersByDay, paymentBreakdown }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Orders/Revenue line chart */}
      <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">
          Orders & Revenue — Last 30 Days
        </h2>
        {ordersByDay.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[var(--text-tertiary)] text-sm">
            No order data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ordersByDay} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Line
                type="monotone"
                dataKey="orders"
                name="orders"
                stroke="var(--brand-primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'var(--brand-primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Payment method pie */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
        <h2 className="font-semibold text-[var(--text-primary)] mb-4">Payment Methods</h2>
        {paymentBreakdown.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-[var(--text-tertiary)] text-sm">
            No payment data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={paymentBreakdown}
                dataKey="count"
                nameKey="method"
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={75}
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
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
