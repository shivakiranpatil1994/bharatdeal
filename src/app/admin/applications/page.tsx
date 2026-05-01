'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Factory, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react'

interface Application {
  id: string; business_name: string; business_type: string; gst_number: string | null
  pan_number: string; city: string; state: string; cluster: string; category: string
  contact_name: string; phone: string; email: string; store_name: string
  description: string | null; monthly_capacity: number; avg_price_paise: number
  payout_schedule: string; status: string; created_at: string; admin_note: string | null
  whatsapp_phone: string; bank_account: { name?: string; number?: string; ifsc?: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 ${className}`} />
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchApps = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/applications')
    const data = await res.json()
    setApps(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchApps() }, [fetchApps])

  async function handleDecision(app: Application, decision: 'approved' | 'rejected') {
    setProcessingId(app.id)
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: app.id, decision, note: noteMap[app.id] ?? '', app }),
      })
      const result = await res.json()
      if (res.ok) {
        toast.success(decision === 'approved' ? `✅ ${app.business_name} approved! Manufacturer account created.` : `❌ Application rejected.`)
        fetchApps()
      } else {
        toast.error(result.error ?? 'Failed')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = apps.filter(a => filter === 'all' || a.status === filter)
  const counts = { all: apps.length, pending: apps.filter(a => a.status === 'pending').length, approved: apps.filter(a => a.status === 'approved').length, rejected: apps.filter(a => a.status === 'rejected').length }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Seller Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve new manufacturer applications</p>
        </div>
        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-sm font-semibold">
              <Clock className="w-4 h-4" /> {counts.pending} pending
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
          <Factory className="w-10 h-10 text-gray-200" />
          <p className="font-semibold text-gray-500">No {filter} applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${app.status === 'pending' ? 'border-amber-100' : 'border-gray-100'}`}>
              {/* Header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Factory className="w-5 h-5 text-[#E8450A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{app.business_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${STATUS_BADGE[app.status]}`}>{app.status}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{app.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{app.cluster}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{app.contact_name} · {app.phone} · {app.email}</p>
                  <p className="text-xs text-gray-400">{app.city}, {app.state} · Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  {expandedId === app.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded details */}
              {expandedId === app.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Store Name', value: app.store_name },
                      { label: 'Business Type', value: app.business_type },
                      { label: 'GST Number', value: app.gst_number ?? 'Not provided' },
                      { label: 'PAN Number', value: app.pan_number },
                      { label: 'WhatsApp', value: app.whatsapp_phone },
                      { label: 'Monthly Capacity', value: `${app.monthly_capacity} units` },
                      { label: 'Avg Product Price', value: `₹${(app.avg_price_paise / 100).toFixed(0)}` },
                      { label: 'Payout Schedule', value: app.payout_schedule },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {app.description && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Store Description</p>
                      <p className="text-sm text-gray-700">{app.description}</p>
                    </div>
                  )}

                  {app.bank_account && (
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Bank Account</p>
                      <p className="text-sm text-gray-700">{app.bank_account.name} · {app.bank_account.number} · IFSC: {app.bank_account.ifsc}</p>
                    </div>
                  )}

                  {app.status === 'pending' && (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-gray-600">Admin Note (optional)</label>
                        <textarea value={noteMap[app.id] ?? ''} onChange={e => setNoteMap(m => ({ ...m, [app.id]: e.target.value }))}
                          placeholder="Add a note for this decision…" rows={2}
                          className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-800 focus:border-[#E8450A] focus:outline-none resize-none" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleDecision(app, 'approved')} disabled={processingId === app.id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                          <CheckCircle2 className="w-4 h-4" /> Approve & Create Account
                        </button>
                        <button onClick={() => handleDecision(app, 'rejected')} disabled={processingId === app.id}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-sm font-semibold transition-colors disabled:opacity-50">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {app.admin_note && (
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600">Admin Note</p>
                      <p className="text-sm text-blue-700 mt-0.5">{app.admin_note}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
