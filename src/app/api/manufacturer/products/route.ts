import { NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseAdmin()
  const { data: mfr } = await admin
    .from('manufacturers')
    .select('id')
    .eq('login_email', user.email)
    .single()

  if (!mfr) return NextResponse.json({ error: 'Manufacturer not found' }, { status: 403 })

  const { data, error } = await admin
    .from('products')
    .select('id, title, price_paise, images, category')
    .eq('manufacturer_id', mfr.id)
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data ?? [] })
}
