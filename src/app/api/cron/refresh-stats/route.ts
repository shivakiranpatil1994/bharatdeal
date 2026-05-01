import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('x-cron-secret')
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseAdmin()
    const { error } = await supabase.rpc('refresh_manufacturer_stats')

    if (error) {
      console.error('[cron/refresh-stats] error:', error)
      return NextResponse.json({ error: 'Refresh failed', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      refreshed_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/refresh-stats] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
