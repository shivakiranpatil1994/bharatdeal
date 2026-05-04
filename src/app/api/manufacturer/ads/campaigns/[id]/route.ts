import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer } from '@/lib/supabase'

const UpdateCampaignSchema = z.object({
  status:           z.enum(['active', 'paused']).optional(),
  maxBidPaise:      z.number().int().min(100).optional(),
  dailyBudgetPaise: z.number().int().min(10000).optional(),
}).refine(d => Object.values(d).some(v => v !== undefined), {
  message: 'At least one field required',
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseServer() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = UpdateCampaignSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('ad_campaigns')
    .select('id, manufacturer_id, review_status')
    .eq('id', id)
    .eq('manufacturer_id', user.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.data.status !== undefined) {
    if (existing.review_status !== 'approved') {
      return NextResponse.json({ error: 'Can only pause/resume approved campaigns' }, { status: 409 })
    }
    update.status = body.data.status
  }
  if (body.data.maxBidPaise      !== undefined) update.max_bid_paise      = body.data.maxBidPaise
  if (body.data.dailyBudgetPaise !== undefined) update.daily_budget_paise = body.data.dailyBudgetPaise

  const { data, error } = await supabase
    .from('ad_campaigns')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data })
}
