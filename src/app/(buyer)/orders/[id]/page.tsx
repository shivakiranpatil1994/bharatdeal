import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Clock, Package, Truck, Home, XCircle, ArrowLeft } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type OrderStatus = 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'rto' | 'cancelled'

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'placed', label: 'Order Placed', icon: CheckCircle2 },
  { status: 'confirmed', label: 'Confirmed', icon: Clock },
  { status: 'packed', label: 'Packed', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Home },
]

const STATUS_ORDER: OrderStatus[] = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

function formatINR(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function getOrder(id: string) {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, payment_method, payment_status, amount_paise,
      buyer_name, buyer_address, buyer_pincode,
      cod_deposit_amount, cod_deposit_paid,
      shiprocket_awb, courier_name, tracking_url,
      created_at, delivered_at,
      products ( title, images ),
      order_events ( event_type, description, created_at )
    `)
    .eq('id', id)
    .order('created_at', { referencedTable: 'order_events', ascending: true })
    .single()
  return data
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ placed?: string }>
}) {
  const { id } = await params
  const { placed } = await searchParams

  const order = await getOrder(id)
  if (!order) notFound()

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status as OrderStatus)
  const isTerminal = order.status === 'delivered' || order.status === 'rto' || order.status === 'cancelled'

  const product = order.products as { title: string; images: string[] } | null
  const events = (order.order_events as { event_type: string; description: string | null; created_at: string }[]) ?? []

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <header className="sticky top-0 z-40 bg-[var(--bg-base)]/90 backdrop-blur border-b border-[var(--bg-border)]">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--text-secondary)]" />
          </Link>
          <h1 className="font-bold text-[var(--text-primary)]">Order Tracking</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 pb-16 flex flex-col gap-5">

        {/* Placed confirmation banner */}
        {placed === '1' && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-400">Order placed successfully!</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                You&apos;ll receive a WhatsApp confirmation shortly.
              </p>
            </div>
          </div>
        )}

        {/* Order ID + date */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                Order ID
              </p>
              <p className="font-mono text-sm text-[var(--text-primary)]">
                {order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                order.status === 'delivered'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : order.status === 'cancelled' || order.status === 'rto'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-2">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        {/* Product */}
        {product && (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4 flex gap-4 items-center">
            {product.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text-primary)] leading-snug">
                {product.title}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                {' · '}
                <span className="font-mono text-[var(--brand-primary)]">
                  {formatINR(order.amount_paise)}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Status tracker */}
        {!isTerminal && (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-5">Tracking</h2>
            <div className="flex items-start justify-between gap-1">
              {STATUS_STEPS.map(({ status, label, icon: Icon }, i) => {
                const done = i <= currentStatusIndex
                const active = i === currentStatusIndex
                return (
                  <div key={status} className="flex flex-col items-center gap-1.5 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        done
                          ? active
                            ? 'bg-[var(--brand-primary)] text-white'
                            : 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-center text-[10px] leading-tight ${
                        done ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'
                      }`}
                    >
                      {label}
                    </span>
                    {/* Connector line (not on last) */}
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`absolute h-0.5 w-full -z-10 ${
                          i < currentStatusIndex ? 'bg-emerald-500/40' : 'bg-[var(--bg-border)]'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Terminal states */}
        {order.status === 'cancelled' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-400">Order Cancelled</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Your refund will be processed within 5–7 business days.
              </p>
            </div>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3">
            <Home className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-400">Delivered!</p>
              {order.delivered_at && (
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  Delivered on {formatDate(order.delivered_at)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Courier info */}
        {order.shiprocket_awb && (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4">
            <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
              Courier
            </p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {order.courier_name ?? 'In Transit'}
                </p>
                <p className="font-mono text-xs text-[var(--text-secondary)] mt-0.5">
                  AWB: {order.shiprocket_awb}
                </p>
              </div>
              {order.tracking_url && (
                <a
                  href={order.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--brand-primary)] text-[var(--brand-primary)] hover:bg-orange-500/10 transition-colors duration-200"
                >
                  Track
                </a>
              )}
            </div>
          </div>
        )}

        {/* Delivery address */}
        <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4">
          <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
            Delivery Address
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{order.buyer_name}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{order.buyer_address}</p>
          <p className="text-sm text-[var(--text-secondary)]">Pincode: {order.buyer_pincode}</p>
        </div>

        {/* COD deposit info */}
        {order.payment_method === 'cod' && (order.cod_deposit_amount ?? 0) > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs text-amber-400 uppercase tracking-wide mb-1">COD Deposit</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {order.cod_deposit_paid
                ? `₹${((order.cod_deposit_amount ?? 0) / 100).toFixed(0)} deposit paid — adjusted on delivery.`
                : `₹${((order.cod_deposit_amount ?? 0) / 100).toFixed(0)} deposit required at delivery.`}
            </p>
          </div>
        )}

        {/* Timeline */}
        {events.length > 0 && (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Order Timeline</h2>
            <div className="flex flex-col gap-3">
              {[...events].reverse().map((ev, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {ev.description ?? ev.event_type}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {formatDate(ev.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue shopping */}
        <Link
          href="/"
          className="block text-center py-3 rounded-xl border border-[var(--bg-border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors duration-200 text-sm font-medium"
        >
          Continue Shopping
        </Link>
      </main>
    </div>
  )
}
