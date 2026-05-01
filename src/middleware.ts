import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Admin protection — separate admin secret cookie
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return response
    const adminToken = request.cookies.get('admin_token')?.value
    if (adminToken !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return response
  }

  // Manufacturer protection — skip in development for preview
  if (pathname.startsWith('/manufacturer') && pathname !== '/manufacturer/login') {
    if (process.env.NODE_ENV === 'development') return response

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/manufacturer/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/manufacturer/:path*'],
}
