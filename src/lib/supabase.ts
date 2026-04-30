// THE ONLY FILE where Supabase clients are created.
// Import these functions everywhere — never create clients inline.

import { createServerClient } from '@supabase/ssr'
import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use in Client Components ('use client') — safe to import in client bundles
export const createSupabaseBrowser = () =>
  createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON)

// Use in Server Components and Server Actions.
// 'next/headers' is dynamically imported so it is never bundled client-side.
export const createSupabaseServer = async () => {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}

// Use in API routes, webhooks, Edge Functions — bypasses RLS
export const createSupabaseAdmin = () =>
  createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
