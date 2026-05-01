'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart2, MessageSquare, LogOut, Sparkles, Package } from 'lucide-react'

const NAV = [
  { href: '/manufacturer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manufacturer/dashboard/skus', label: 'SKU Analytics', icon: BarChart2 },
  { href: '/manufacturer/dashboard/products', label: 'Products', icon: Package },
  { href: '/manufacturer/dashboard/ai', label: 'AI Advisor', icon: MessageSquare },
]

export default function ManufacturerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 border-r border-gray-200 bg-white flex-shrink-0 shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-['Syne',sans-serif] font-extrabold text-gray-900">
              Bharat<span className="text-[#E8450A]">Deal</span>
            </span>
          </Link>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            MFR
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E8450A] text-white shadow-sm shadow-orange-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            View Store
          </Link>
          <form action="/api/manufacturer/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm">
        <span className="font-['Syne',sans-serif] font-extrabold text-gray-900">
          Bharat<span className="text-[#E8450A]">Deal</span>
        </span>
        <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
          MFR
        </span>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex shadow-lg">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${
                isActive ? 'text-[#E8450A]' : 'text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      <main className="flex-1 min-w-0 md:pt-0 pt-14 pb-16 md:pb-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
