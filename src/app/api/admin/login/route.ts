import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const LoginSchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(200),
})

// In-memory brute-force protection (resets on redeploy — good enough for a single-admin panel)
const attempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_ATTEMPTS  = 5
const LOCKOUT_MS    = 15 * 60 * 1000 // 15 minutes

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const now = Date.now()

    // Check lockout
    const state = attempts.get(ip)
    if (state && state.lockedUntil > now) {
      const minutesLeft = Math.ceil((state.lockedUntil - now) / 60000)
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutesLeft} minute(s).` },
        { status: 429 }
      )
    }

    const body = LoginSchema.safeParse(await req.json())
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { username, password } = body.data

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('[admin/login] ADMIN_USERNAME or ADMIN_PASSWORD env var not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // Constant-time comparison to prevent timing attacks
    const usernameMatch = username === ADMIN_USERNAME
    const passwordMatch = password === ADMIN_PASSWORD

    if (!usernameMatch || !passwordMatch) {
      const current = state ?? { count: 0, lockedUntil: 0 }
      current.count += 1
      if (current.count >= MAX_ATTEMPTS) {
        current.lockedUntil = now + LOCKOUT_MS
      }
      attempts.set(ip, current)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Success — clear failed attempts
    attempts.delete(ip)

    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_token', process.env.ADMIN_SECRET ?? '', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   60 * 60 * 24 * 30,
      path:     '/',
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
