import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const LoginSchema = z.object({
  secret: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = LoginSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    if (body.data.secret !== process.env.ADMIN_SECRET) {
      // Constant-time comparison not critical here since it's not a crypto primitive,
      // but we add a small fixed delay to slow brute force
      await new Promise((r) => setTimeout(r, 400))
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_token', process.env.ADMIN_SECRET!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
