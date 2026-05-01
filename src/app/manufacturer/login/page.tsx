'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createSupabaseBrowser } from '@/lib/supabase'
import { Factory, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function ManufacturerLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Enter a valid email address')
      return
    }
    if (!password.trim()) {
      toast.error('Enter your password')
      return
    }

    setLoading(true)
    try {
      const supabase = createSupabaseBrowser()
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: password.trim(),
      })

      if (error) {
        toast.error(error.message === 'Invalid login credentials'
          ? 'Wrong email or password. Try again.'
          : error.message)
        return
      }

      // Full page reload so middleware picks up the new session cookie
      window.location.href = '/manufacturer/dashboard'
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

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@factory.com"
                autoFocus
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#E8450A] focus:bg-white focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !email.trim() || !password.trim()}
            className="py-2.5 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-1">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {/* Dummy credentials hint — remove in production */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 space-y-0.5">
            <p className="font-semibold">Demo credentials</p>
            <p>Email: <span className="font-mono">manufacturer@bharatdeal.in</span></p>
            <p>Password: <span className="font-mono">bharatdeal@123</span></p>
          </div>
        </form>
      </div>
    </div>
  )
}
