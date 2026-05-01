import { createSupabaseAdmin } from '@/lib/supabase'
import { formatINR } from '@/lib/utils'
import { Factory, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type FilterStatus = 'all' | 'active' | 'inactive'

interface ManufacturerRow {
  id: string
  name: string
  cluster: string
  city: string
  state: string
  category: string
  seller_score: number
  verified: boolean
  active: boolean
  payout_schedule: string
  created_at: string
  productCount: number
  gmvThisMonth: number
  orderCount: number
}

async function getManufacturers(
  search: string,
  status: FilterStatus
): Promise<ManufacturerRow[]> {
  const supabase = createSupabaseAdmin()

  let query = supabase
    .from('manufacturers')
    .select('id, name, cluster, city, state, category, seller_score, verified, active, payout_schedule, created_at')
    .order('created_at', { ascending: false })

  if (status === 'active') query = query.eq('active', true)
  if (status === 'inactive') query = query.eq('active', false)
  if (search) query = query.ilike('name', `%${search}%`)

  const { data: mfrs } = await query
  if (!mfrs || mfrs.length === 0) return []

  // Fetch products count and GMV for each manufacturer
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const results: ManufacturerRow[] = await Promise.all(
    mfrs.map(async (m) => {
      const [prodRes, ordersRes] = await Promise.all([
        supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('manufacturer_id', m.id)
          .eq('active', true),

        supabase
          .from('orders')
          .select('amount_paise')
          .eq('manufacturer_id', m.id)
          .eq('payment_status', 'paid')
          .gte('created_at', monthStart),
      ])

      const gmv = (ordersRes.data ?? []).reduce((s, o) => s + (o.amount_paise ?? 0), 0)

      return {
        ...m,
        productCount: prodRes.count ?? 0,
        gmvThisMonth: gmv,
        orderCount: ordersRes.data?.length ?? 0,
      }
    })
  )

  return results
}

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  return 'text-red-400 bg-red-500/10 border-red-500/20'
}

export default async function AdminManufacturersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const params = await searchParams
  const search = params.search ?? ''
  const status = (params.status ?? 'all') as FilterStatus

  const manufacturers = await getManufacturers(search, status)

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Manufacturers</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-0.5">
            {manufacturers.length} manufacturer{manufacturers.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form method="GET" className="flex gap-3 flex-1">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name..."
            className="flex-1 min-w-0 bg-[var(--bg-elevated)] border border-[var(--bg-border)] focus:border-[var(--brand-primary)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-all duration-200"
          />
          <input type="hidden" name="status" value={status} />
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            Search
          </button>
        </form>

        {/* Status tabs */}
        <div className="flex gap-1 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-1">
          {(['all', 'active', 'inactive'] as FilterStatus[]).map((s) => (
            <a
              key={s}
              href={`?search=${search}&status=${s}`}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all duration-200 ${
                status === s
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {s}
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      {manufacturers.length === 0 ? (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-12 flex flex-col items-center gap-3">
          <Factory className="w-10 h-10 text-[var(--text-tertiary)]" />
          <p className="text-[var(--text-secondary)] font-medium">No manufacturers found</p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {search ? `No results for "${search}"` : 'No manufacturers registered yet'}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)]">
                  {[
                    'Name',
                    'Cluster',
                    'Category',
                    'Products',
                    'GMV This Month',
                    'Orders',
                    'Score',
                    'Verified',
                    'Status',
                    'Payout',
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
                {manufacturers.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[var(--bg-border)] last:border-0 hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text-primary)]">{m.name}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                        {m.city}, {m.state}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {m.cluster}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {m.category}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                      {m.productCount}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--brand-primary)] whitespace-nowrap">
                      {formatINR(m.gmvThisMonth)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--text-primary)]">
                      {m.orderCount}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-mono ${SCORE_COLOR(m.seller_score)}`}
                      >
                        {m.seller_score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.verified ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[var(--text-tertiary)]" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          m.active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {m.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs whitespace-nowrap">
                      {m.payout_schedule}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
