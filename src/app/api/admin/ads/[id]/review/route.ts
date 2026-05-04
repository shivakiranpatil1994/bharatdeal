import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/security'
import { sendWhatsAppText } from '@/lib/interakt'

const ReviewSchema = z.object({
  action: z.enum(['approved', 'rejected', 'needs_changes', 'suspended']),
  reason: z.string().max(500).optional(),
  note:   z.string().max(1000).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = ReviewSchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  const { action, reason, note } = body.data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createSupabaseAdmin() as any

  const newStatus =
    action === 'approved'  ? 'active'
    : action === 'rejected'  ? 'rejected'
    : action === 'suspended' ? 'paused'
    : undefined

  const updateData: Record<string, unknown> = {
    review_status: action,
    reviewed_at:   new Date().toISOString(),
    review_note:   note ?? null,
    reject_reason: reason ?? null,
    updated_at:    new Date().toISOString(),
  }
  if (newStatus) updateData.status = newStatus

  const { data: campaign, error } = await supabase
    .from('ad_campaigns')
    .update(updateData)
    .eq('id', id)
    .select('*, products ( title ), manufacturers ( whatsapp_phone, name )')
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  await supabase.from('ad_review_log').insert({
    campaign_id: campaign.id,
    action,
    reason:      reason ?? null,
    note:        note ?? null,
  })

  const phone       = campaign.manufacturers?.whatsapp_phone as string | undefined
  const productName = campaign.products?.title as string ?? 'your product'

  if (phone) {
    let msg: string
    switch (action) {
      case 'approved':
        msg = `✅ Your BharatDeal campaign "${campaign.name}" for ${productName} is now LIVE!`
        break
      case 'rejected':
        msg = `❌ Your BharatDeal campaign "${campaign.name}" was not approved.\n\nReason: ${reason ?? 'Policy violation'}\n\nPlease fix the issue and resubmit.`
        break
      case 'needs_changes':
        msg = `⚠️ Your BharatDeal campaign "${campaign.name}" needs changes before it can go live.\n\n${note ?? 'Please review and resubmit.'}`
        break
      case 'suspended':
        msg = `⏸ Your BharatDeal campaign "${campaign.name}" has been suspended.\n\nReason: ${reason ?? 'Policy violation'}`
        break
      default:
        msg = ''
    }
    if (msg) sendWhatsAppText(phone, msg).catch(console.error)
  }

  return NextResponse.json({ campaign })
}
