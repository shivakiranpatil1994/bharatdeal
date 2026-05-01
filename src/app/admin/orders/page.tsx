import { createSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { ShoppingBag, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  confirmed: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  packed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rto: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const PAYMENT_COLORS: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  refunded: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

type SearchParams = {
  status?: string
  payment?: string
  method?: string
  page?: string
  q?: string
}

const PAGE_SIZE = 25

async function getOrders(filters: SearchParams) {
  const supabase = createSupabaseAdmin()
  const page = Math.max(1, parseInt(filters.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('orders')
    .select(
      `
      id, status, payment_method, payment_status, amount_paise,
      buyer_name, buyer_phone, buyer_pincode,
      quantity, created_at, shiprocket_awb, courier_name,
      products ( title ),
      manufacturers ( name )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.payment) query = query.eq('payment_status', filters.payment)
  if (filters.method) query = query.eq('payment_method', filters.method)
  if (filters.q) query = query.ilike('buyer_phone', `%${filters.q}%`)

  const { data, count } = await query
  return { orders: data ?? [], total: count ?? 0, page, pages: Math.ceil((count ?? 0) / PAGE_SIZE) }
}

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const { orders, total, page, pages } = await getOrders(filters)

  function buildUrl(overrides: Partial<SearchParams>) {
    const p = new URLSearchParams()
    const merged = { ...filters, ...overrides }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) p.set(k, v)
    })
    return `/admin/orders?${p.toString()}`
  }

  return (
    <div className="p-6 flex flex-col gap-5 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Orders</h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
          {total.toLocaleString('en-IN')} total orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search by phone */}
        <form method="GET" action="/admin/orders">
          {filters.status && <input type="hidden" name="status" value={filters.status} />}
          {filters.payment && <input type="hidden" name="payment" value={filters.payment} />}
          {filters.method && <input type="hidden" name="method" value={filters.method} />}
          <input
            type="text"
            name="q"
            defaultValue={filters.q ?? ''}
            placeholder="Search by phone…"
            className="h-8 px-3 text-sm rounded-lg bg-[var(--bg-elevated)] border border-[var(--bg-border)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:outline-none"
          />
        </form>

        {/* Status filter */}
        {['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'rto', 'cancelled'].map(
          (s) => (
            <Link
              key={s}
              href={buildUrl({ status: filters.status === s ? undefined : s, page: '1' })}
              className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors duration-200 flex items-center ${
                filters.status === s
                  ? `${STATUS_COLORS[s]} border-current`
                  : 'border-[var(--bg-border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {s}
            </Link>
          )
        )}

        {/* Payment filter */}
        {['paid', 'pending', 'failed'].map((p) => (
          <Link
            key={p}
            href={buildUrl({ payment: filters.payment === p ? undefined : p, page: '1' })}
            className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors duration-200 flex items-center ${
              filters.payment === p
                ? `${PAYMENT_COLORS[p]} border-current`
                : 'border-[var(--bg-border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            {p}
          </Link>
        ))}

        {/* Method filter */}
        {['upi', 'card', 'cod'].map((m) => (
          <Link
            key={m}
            href={buildUrl({ method: filters.method === m ? undefined : m, page: '1' })}
            className={`h-8 px-3 text-xs font-medium rounded-lg border transition-colors duration-200 flex items-center uppercase ${
              filters.method === m
                ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30'
                : 'border-[var(--bg-border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            {m}
          </Link>
        ))}

        {/* Clear */}
        {(filters.status || filters.payment || filters.method || filters.q) && (
          <Link
            href="/admin/orders"
            className="h-8 px-3 text-xs rounded-lg border border-[var(--bg-border)] text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] flex items-center transition-colors duration-200"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <ShoppingBag className="w-10 h-10 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-tertiary)]">No orders match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  {[
                    'Order ID',
                    'Product',
                    'Manufacturer',
                    'Buyer',
                    'Pincode',
                    'Qty',
                    'Amount',
                    'Method',
                    'Payment',
                    'Status',
                    'AWB',
                    'Date',
                    '',
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
                {orders.map((order) => {
                  const product = order.products as { title: string } | null
                  const manufacturer = order.manufacturers as { name: string } | null
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        {order.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)] max-w-[140px] truncate">
                        {product?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[120px] truncate">
                        {manufacturer?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[var(--text-primary)] text-xs">{order.buyer_name ?? '—'}</div>
                        <div className="font-mono text-[10px] text-[var(--text-tertiary)]">{order.buyer_phone}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-secondary)]">
                        {order.buyer_pincode}
                      </td>
                      <td className="px-4 py-3 text-center text-[var(--text-secondary)]">
                        {order.quantity}
                      </td>
                      <td className="px-4 py-3 font-mono text-[var(--brand-primary)] whitespace-nowrap">
                        {formatINR(order.amount_paise)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] uppercase text-xs">
                        {order.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            PAYMENT_COLORS[order.payment_status] ?? PAYMENT_COLORS.pending
                          }`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            STATUS_COLORS[order.status] ?? STATUS_COLORS.placed
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-[var(--text-tertiary)]">
                        {order.shiprocket_awb ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-tertiary)] whitespace-nowrap">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/orders/${order.id}`}
                          target="_blank"
                          className="p-1.5 rounded hover:bg-[var(--bg-base)] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-tertiary)]">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{' '}
            {total.toLocaleString('en-IN')}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
