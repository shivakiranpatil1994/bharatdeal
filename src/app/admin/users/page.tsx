import { createSupabaseAdmin } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { Users, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAGE_SIZE = 25

interface BuyerRow {
  id: string
  phone: string
  name: string | null
  default_pincode: string | null
  rto_count: number
  order_count: number
  is_blocked: boolean
  created_at: string
  totalSpent: number
  lastOrderAt: string | null
}

async function getBuyers(search: string, page: number): Promise<{ buyers: BuyerRow[]; total: number }> {
  const supabase = createSupabaseAdmin()
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('buyers')
    .select('id, phone, name, default_pincode, rto_count, order_count, is_blocked, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (search) {
    query = query.ilike('phone', `%${search}%`)
  }

  const { data: buyers, count } = await query
  if (!buyers || buyers.length === 0) return { buyers: [], total: count ?? 0 }

  // Fetch spend data per buyer
  const results: BuyerRow[] = await Promise.all(
    buyers.map(async (b) => {
      const { data: orders } = await supabase
        .from('orders')
        .select('amount_paise, created_at')
        .eq('buyer_phone', b.phone)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })

      const totalSpent = (orders ?? []).reduce((s, o) => s + (o.amount_paise ?? 0), 0)
      const lastOrderAt = orders?.[0]?.created_at ?? null

      return { ...b, totalSpent, lastOrderAt }
    })
  )

  return { buyers: results, total: count ?? 0 }
}

function getRiskLevel(rtoCount: number): {
  label: string
  className: string
} {
  if (rtoCount >= 3) return { label: 'High Risk', className: 'bg-red-500/10 text-red-400 border-red-500/20' }
  if (rtoCount >= 1) return { label: 'Medium', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' }
  return { label: 'Low', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  const { buyers, total } = await getBuyers(search, page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Users</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          {total.toLocaleString('en-IN')} registered buyers
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by phone number..."
          className="flex-1 max-w-sm bg-[var(--bg-elevated)] border border-[var(--bg-border)] focus:border-[var(--brand-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
        >
          Search
        </button>
        {search && (
          <a
            href="/admin/users"
            className="px-4 py-2 border border-[var(--bg-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      {buyers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-12 flex flex-col items-center gap-3">
          <Users className="w-10 h-10 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)] font-medium">No users found</p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {search ? `No buyers matching "${search}"` : 'No buyers registered yet'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  {[
                    'Phone',
                    'Name',
                    'Pincode',
                    'Orders',
                    'Total Spent',
                    'RTOs',
                    'RTO Rate',
                    'Risk',
                    'Last Order',
                    'Status',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => {
                  const risk = getRiskLevel(b.rto_count)
                  const rtoRate =
                    b.order_count > 0
                      ? ((b.rto_count / b.order_count) * 100).toFixed(1)
                      : '0.0'

                  return (
                    <tr
                      key={b.id}
                      className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-[var(--text-primary)] whitespace-nowrap">
                        {b.phone}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {b.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                        {b.default_pincode ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                        {b.order_count}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--brand-primary)] whitespace-nowrap">
                        {formatINR(b.totalSpent)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                        {b.rto_count}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                        {rtoRate}%
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${risk.className}`}
                        >
                          {risk.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                        {b.lastOrderAt
                          ? new Date(b.lastOrderAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {b.is_blocked ? (
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-xs text-red-400">Blocked</span>
                          </div>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-[var(--bg-border)] flex items-center justify-between">
              <p className="text-xs text-[var(--text-tertiary)]">
                Page {page} of {totalPages} · {total.toLocaleString('en-IN')} total
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <a
                    href={`?search=${search}&page=${page - 1}`}
                    className="px-3 py-1.5 text-xs border border-[var(--bg-border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`?search=${search}&page=${page + 1}`}
                    className="px-3 py-1.5 text-xs border border-[var(--bg-border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
