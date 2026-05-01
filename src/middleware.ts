import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Admin protection — separate admin secret cookie
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next()
    const adminToken = request.cookies.get('admin_token')?.value
    if (adminToken !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // Manufacturer auth disabled — dashboard uses DB fallback to load first manufacturer


  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/manufacturer/:path*'],
}
