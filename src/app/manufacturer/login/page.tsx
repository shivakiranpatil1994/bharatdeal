'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Factory, Mail, CheckCircle2 } from 'lucide-react'

export default function ManufacturerLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const supabase = createSupabaseBrowser()
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: `${window.location.origin}/api/manufacturer/auth-callback`,
        },
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4">
            <Factory className="w-7 h-7 text-[#E8450A]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Manufacturer Portal</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">BharatDeal Intelligence Dashboard</p>
        </div>

        {sent ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Check your email</p>
              <p className="text-sm text-gray-500 mt-1">
                We sent a magic link to <span className="text-gray-800 font-medium">{email}</span>. Click it to sign in.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Didn&apos;t receive it? Check spam or{' '}
              <button onClick={() => setSent(false)} className="text-[#E8450A] hover:underline">try again</button>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Your registered email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@factory.com" autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>
            <button type="submit" disabled={loading || !email.trim()}
              className="py-2.5 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
              {loading ? 'Sending…' : 'Send Magic Link'}
            </button>
            <p className="text-center text-xs text-gray-400">No password needed. We&apos;ll send a secure link.</p>
          </form>
        )}
      </div>
    </div>
  )
}
