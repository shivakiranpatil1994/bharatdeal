'use client'

import { useEffect, useState } from 'react'
import { Save, RefreshCw, AlertTriangle } from 'lucide-react'

interface Config {
  id: string
  weight_bid: number; weight_quality: number; weight_relevance: number; weight_pctr: number
  qs_weight_return_rate: number; qs_weight_seller_score: number; qs_weight_listing: number
  qs_weight_rating: number; qs_weight_fulfillment: number
  min_quality_score: number; min_relevance_score: number
  min_bid_search_paise: number; min_bid_card_paise: number; min_bid_banner_cpm: number
  max_rto_pct: number; auto_approve_min_qs: number; auto_approve_max_rto: number
  attribution_days: number; fraud_cooldown_hours: number; max_clicks_per_ip_day: number
  change_reason: string; effective_at: string
}

function NumField({ label, hint, value, onChange, step = 0.001, min = 0, max = 1 }: {
  label: string; hint?: string; value: number
  onChange: (v: number) => void; step?: number; min?: number; max?: number
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-tertiary)] mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        step={step} min={min} max={max}
        className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] font-mono"
      />
      {hint && <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{hint}</p>}
    </div>
  )
}

export default function AlgorithmConfigPage() {
  const [config, setConfig]       = useState<Config | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [changeReason, setChangeReason] = useState('')

  useEffect(() => {
    fetch('/api/admin/algorithm/config')
      .then(r => r.json())
      .then(d => { setConfig(d.config); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function update(k: keyof Config, v: number | string) {
    setConfig(prev => prev ? { ...prev, [k]: v } : null)
  }

  const adScoreSum = config
    ? config.weight_bid + config.weight_quality + config.weight_relevance + config.weight_pctr
    : 0
  const qsSum = config
    ? config.qs_weight_return_rate + config.qs_weight_seller_score +
      config.qs_weight_listing + config.qs_weight_rating + config.qs_weight_fulfillment
    : 0

  async function save() {
    if (!config || !changeReason.trim()) { setError('Please provide a reason for this change'); return }
    if (Math.abs(adScoreSum - 1.0) > 0.001) { setError('Ad Score weights must sum to 1.0'); return }
    if (Math.abs(qsSum - 1.0) > 0.001) { setError('Quality Score weights must sum to 1.0'); return }

    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/algorithm/config', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...config, change_reason: changeReason }),
    })
    const data = await res.json()
    if (res.ok) {
      setConfig(data.config)
      setSuccess(true)
      setChangeReason('')
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(typeof data.error === 'string' ? data.error : 'Save failed')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-4">
      <div className="h-8 bg-[var(--bg-elevated)] rounded w-48" />
      <div className="h-64 bg-[var(--bg-elevated)] rounded-xl" />
    </div>
  )

  if (!config) return (
    <div className="p-6 max-w-4xl mx-auto text-center py-20 text-[var(--text-tertiary)]">
      <p>Could not load algorithm config.</p>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Algorithm Config</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Live-tune the auction and quality scoring weights. Changes apply immediately.
          </p>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">
          Last changed: {new Date(config.effective_at).toLocaleDateString('en-IN')}
        </span>
      </div>

      {/* Ad Score weights */}
      <section className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">Ad Score Weights</h2>
          <span className={`text-sm font-mono font-semibold ${Math.abs(adScoreSum - 1.0) <= 0.001 ? 'text-emerald-400' : 'text-red-400'}`}>
            Sum: {adScoreSum.toFixed(3)}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NumField label="Bid weight"      value={config.weight_bid}       onChange={v => update('weight_bid', v)}       hint="How much bidding matters" />
          <NumField label="Quality weight"  value={config.weight_quality}   onChange={v => update('weight_quality', v)}   hint="Quality score importance" />
          <NumField label="Relevance weight" value={config.weight_relevance} onChange={v => update('weight_relevance', v)} hint="Keyword relevance" />
          <NumField label="pCTR weight"     value={config.weight_pctr}      onChange={v => update('weight_pctr', v)}      hint="Predicted click-through rate" />
        </div>
        {Math.abs(adScoreSum - 1.0) > 0.001 && (
          <p className="text-xs text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Weights must sum to exactly 1.0</p>
        )}
      </section>

      {/* Quality Score weights */}
      <section className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text-primary)]">Quality Score Weights</h2>
          <span className={`text-sm font-mono font-semibold ${Math.abs(qsSum - 1.0) <= 0.001 ? 'text-emerald-400' : 'text-red-400'}`}>
            Sum: {qsSum.toFixed(3)}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <NumField label="Return rate"    value={config.qs_weight_return_rate}  onChange={v => update('qs_weight_return_rate', v)}  />
          <NumField label="Seller score"   value={config.qs_weight_seller_score} onChange={v => update('qs_weight_seller_score', v)} />
          <NumField label="Listing quality" value={config.qs_weight_listing}      onChange={v => update('qs_weight_listing', v)}      />
          <NumField label="Buyer rating"   value={config.qs_weight_rating}       onChange={v => update('qs_weight_rating', v)}       />
          <NumField label="Fulfillment speed" value={config.qs_weight_fulfillment} onChange={v => update('qs_weight_fulfillment', v)} />
        </div>
      </section>

      {/* Thresholds */}
      <section className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Thresholds & Floors</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <NumField label="Min quality score" value={config.min_quality_score} onChange={v => update('min_quality_score', v)} hint="Campaigns below this are blocked" />
          <NumField label="Min relevance score" value={config.min_relevance_score} onChange={v => update('min_relevance_score', v)} />
          <NumField label="Max RTO %" value={config.max_rto_pct} onChange={v => update('max_rto_pct', v)} step={0.5} min={0} max={100} hint="Block ads above this return rate" />
          <NumField label="Auto-approve min QS" value={config.auto_approve_min_qs} onChange={v => update('auto_approve_min_qs', v)} hint="QS needed to skip review queue" />
          <NumField label="Auto-approve max RTO" value={config.auto_approve_max_rto} onChange={v => update('auto_approve_max_rto', v)} step={0.5} min={0} max={100} />
          <NumField label="Attribution days" value={config.attribution_days} onChange={v => update('attribution_days', Math.round(v))} step={1} min={1} max={30} hint="Days to attribute conversions" />
        </div>
      </section>

      {/* Bid floors */}
      <section className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Bid Floors (paise)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <NumField label="Search min bid" value={config.min_bid_search_paise} onChange={v => update('min_bid_search_paise', Math.round(v))} step={50} min={50} max={10000} hint="₹ per click for search ads" />
          <NumField label="Card min bid"   value={config.min_bid_card_paise}   onChange={v => update('min_bid_card_paise', Math.round(v))}   step={50} min={50} max={10000} />
          <NumField label="Banner min CPM" value={config.min_bid_banner_cpm}   onChange={v => update('min_bid_banner_cpm', Math.round(v))}   step={500} min={1000} max={100000} hint="₹ per 1000 impressions" />
        </div>
      </section>

      {/* Fraud */}
      <section className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Fraud Protection</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumField label="Fraud cooldown hours" value={config.fraud_cooldown_hours} onChange={v => update('fraud_cooldown_hours', Math.round(v))} step={1} min={1} max={168} hint="Window for click frequency check" />
          <NumField label="Max clicks per IP/day" value={config.max_clicks_per_ip_day} onChange={v => update('max_clicks_per_ip_day', Math.round(v))} step={1} min={1} max={100} hint="Clicks above this are fraud" />
        </div>
      </section>

      {/* Change reason + save */}
      <section className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text-primary)]">Save Changes</h2>
        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Reason for change *</label>
          <textarea
            value={changeReason}
            onChange={e => setChangeReason(e.target.value)}
            rows={2}
            placeholder="e.g. Increasing bid weight to improve revenue per impression"
            className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] resize-none"
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-400">✓ Configuration saved and applied immediately.</p>
        )}
        <button
          onClick={save}
          disabled={saving || !changeReason.trim()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold text-sm hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Configuration'}
        </button>
      </section>
    </div>
  )
}
