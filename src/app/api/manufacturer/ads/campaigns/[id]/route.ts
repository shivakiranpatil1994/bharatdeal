import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase'

const UpdateCampaignSchema = z.object({
  status:           z.enum(['active', 'paused']).optional(),
  maxBidPaise:      z.number().int().min(100).optional(),
  dailyBudgetPaise: z.number().int().min(10000).optional(),
}).refine(d => Object.values(d).some(v => v !== undefined), {
  message: 'At least one field required',
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServer()
  const admin    = createSupabaseAdmin()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: mfr } = await admin
    .from('manufacturers')
    .select('id')
    .eq('login_email', user.email)
    .single()

  if (!mfr) return NextResponse.json({ error: 'Manufacturer not found' }, { status: 403 })

  const body = UpdateCampaignSchema.safeParse(await req.json())
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 })
  }

  const mfrData = mfr as { id: string }

  const { data: existing } = await admin
    .from('ad_campaigns')
    .select('id, manufacturer_id, review_status')
    .eq('id', id)
    .eq('manufacturer_id', mfrData.id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.data.status !== undefined) {
    if (existing.review_status !== 'approved') {
      return NextResponse.json({ error: 'Can only pause/resume approved campaigns' }, { status: 409 })
    }
  }

  const { data, error } = await admin
    .from('ad_campaigns')
    .update({
      ...(body.data.status          !== undefined && { status:            body.data.status }),
      ...(body.data.maxBidPaise     !== undefined && { max_bid_paise:     body.data.maxBidPaise }),
      ...(body.data.dailyBudgetPaise !== undefined && { daily_budget_paise: body.data.dailyBudgetPaise }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaign: data })
}
