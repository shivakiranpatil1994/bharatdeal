import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/security'
import { invalidateConfigCache } from '@/lib/adAuction'

const ConfigSchema = z.object({
  weight_bid:              z.number().min(0).max(1),
  weight_quality:          z.number().min(0).max(1),
  weight_relevance:        z.number().min(0).max(1),
  weight_pctr:             z.number().min(0).max(1),
  qs_weight_return_rate:   z.number().min(0).max(1),
  qs_weight_seller_score:  z.number().min(0).max(1),
  qs_weight_listing:       z.number().min(0).max(1),
  qs_weight_rating:        z.number().min(0).max(1),
  qs_weight_fulfillment:   z.number().min(0).max(1),
  min_quality_score:       z.number().min(0).max(1),
  min_relevance_score:     z.number().min(0).max(1),
  min_bid_search_paise:    z.number().int().positive(),
  min_bid_card_paise:      z.number().int().positive(),
  min_bid_banner_cpm:      z.number().int().positive(),
  max_rto_pct:             z.number().min(0).max(100),
  auto_approve_min_qs:     z.number().min(0).max(1),
  auto_approve_max_rto:    z.number().min(0).max(100),
  attribution_days:        z.number().int().min(1).max(30),
  fraud_cooldown_hours:    z.number().int().min(1).max(168),
  max_clicks_per_ip_day:   z.number().int().min(1).max(100),
  change_reason:           z.string().min(5).max(500),
  revert_at:               z.string().optional(),
})

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('algorithm_config')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ config: data })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = ConfigSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const d = body.data

  const adScoreSum = d.weight_bid + d.weight_quality + d.weight_relevance + d.weight_pctr
  if (Math.abs(adScoreSum - 1.0) > 0.001) {
    return NextResponse.json({
      error: `Ad Score weights must sum to 1.0. Current sum: ${adScoreSum.toFixed(3)}`
    }, { status: 400 })
  }

  const qsSum = d.qs_weight_return_rate + d.qs_weight_seller_score +
                d.qs_weight_listing + d.qs_weight_rating + d.qs_weight_fulfillment
  if (Math.abs(qsSum - 1.0) > 0.001) {
    return NextResponse.json({
      error: `Quality Score weights must sum to 1.0. Current sum: ${qsSum.toFixed(3)}`
    }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()

  const { data: current } = await supabase
    .from('algorithm_config')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (current) {
    await supabase.from('algorithm_config').update({ is_active: false }).eq('id', current.id)
  }

  const { data: newConfig, error } = await supabase
    .from('algorithm_config')
    .insert({
      ...d,
      changed_by:   'admin',
      effective_at: new Date().toISOString(),
      revert_at:    d.revert_at ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (current && newConfig) {
    const changedFields = Object.keys(d).filter(
      key => key !== 'change_reason' && key !== 'revert_at' &&
             (d as Record<string, unknown>)[key] !== (current as Record<string, unknown>)[key]
    )
    if (changedFields.length > 0) {
      await supabase.from('algorithm_change_log').insert(
        changedFields.map(field => ({
          config_id:     newConfig.id,
          field_name:    field,
          old_value:     String((current as Record<string, unknown>)[field]),
          new_value:     String((d as Record<string, unknown>)[field]),
          change_reason: d.change_reason,
          changed_by:    'admin',
        }))
      )
    }
  }

  invalidateConfigCache()

  return NextResponse.json({ config: newConfig })
}
