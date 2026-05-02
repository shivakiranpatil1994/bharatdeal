import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/security'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const { data } = await supabase
    .from('products')
    .select('*, manufacturers(name, cluster, city, category)')
    .eq('approval_status', status)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, decision, note } = await req.json()
  const supabase = createSupabaseAdmin()

  await supabase.from('products').update({
    approval_status: decision,
    approval_note: note ?? null,
    approval_reviewed_at: new Date().toISOString(),
    active: decision === 'approved',
  }).eq('id', id)

  return NextResponse.json({ success: true })
}
