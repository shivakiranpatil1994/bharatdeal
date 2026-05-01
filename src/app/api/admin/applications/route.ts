import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/security'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createSupabaseAdmin()
  const { data } = await supabase.from('manufacturer_applications').select('*').order('created_at', { ascending: false })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, decision, note, app } = await req.json()
  const supabase = createSupabaseAdmin()

  if (decision === 'approved') {
    // Create Supabase Auth user
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: app.email,
      password: app.password_hash,
      email_confirm: true,
    })
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })

    // Create manufacturer record
    const { error: mfrErr } = await supabase.from('manufacturers').insert({
      id: authUser.user.id,
      name: app.business_name,
      cluster: app.cluster,
      city: app.city,
      state: app.state,
      whatsapp_phone: app.whatsapp_phone,
      login_email: app.email,
      category: app.category,
      gst_number: app.gst_number ?? null,
      bank_account: app.bank_account ?? {},
      seller_score: 50,
      verified: true,
      active: true,
      payout_schedule: app.payout_schedule,
    })
    if (mfrErr) return NextResponse.json({ error: mfrErr.message }, { status: 500 })
  }

  // Update application status
  await supabase.from('manufacturer_applications').update({
    status: decision,
    admin_note: note ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq('id', id)

  return NextResponse.json({ success: true })
}
