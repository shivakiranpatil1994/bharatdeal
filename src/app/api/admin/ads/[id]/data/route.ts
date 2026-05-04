import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import { verifyAdminToken } from '@/lib/security'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createSupabaseAdmin()

  const { data: campaign, error } = await supabase
    .from('ad_campaigns')
    .select('*, products ( id, title, images, price_paise, category ), manufacturers ( id, name, cluster, whatsapp_phone )')
    .eq('id', id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  return NextResponse.json({ campaign })
}
