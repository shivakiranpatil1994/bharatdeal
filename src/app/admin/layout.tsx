'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, Factory, Users, BarChart3,
  LogOut, ClipboardList, Package, Megaphone, Settings2, TrendingUp,
  Zap,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Platform',
    items: [
      { href: '/admin',              label: 'Overview',      icon: LayoutDashboard, exact: true },
      { href: '/admin/orders',       label: 'Orders',        icon: ShoppingBag },
      { href: '/admin/products',     label: 'Products',      icon: Package },
    ],
  },
  {
    label: 'Sellers',
    items: [
      { href: '/admin/manufacturers',  label: 'Manufacturers', icon: Factory },
      { href: '/admin/applications',   label: 'Applications',  icon: ClipboardList },
      { href: '/admin/users',          label: 'Users',         icon: Users },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/admin/analytics',          label: 'Analytics',     icon: BarChart3, exact: true },
      { href: '/admin/analytics/investor', label: 'Investor View', icon: TrendingUp },
      { href: '/admin/ads',                label: 'Ad Review',     icon: Megaphone },
      { href: '/admin/algorithm',          label: 'Algorithm',     icon: Settings2 },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0" style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo strip */}
        <div className="h-[60px] flex items-center px-5 gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #E8450A 0%, #F5A623 100%)' }}>
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight">BharatDeal</span>
            <div className="text-[10px] font-semibold" style={{ color: '#E8450A' }}>Admin Console</div>
          </div>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-5 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map(({ href, label, icon: Icon, exact }) => {
                  const active = isActive(href, exact)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        active ? 'text-white shadow-lg' : 'hover:text-white'
                      }`}
                      style={active
                        ? { background: 'linear-gradient(135deg, #E8450A 0%, #d93d08 100%)', boxShadow: '0 4px 12px rgba(232,69,10,0.35)' }
                        : { color: 'rgba(255,255,255,0.5)' }
                      }
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 hover:text-red-400"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4" style={{ background: '#111111', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8450A, #F5A623)' }}>
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white text-sm">BharatDeal</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(232,69,10,0.15)', color: '#E8450A' }}>Admin</span>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex" style={{ background: '#111111', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { href: '/admin', label: 'Home', icon: LayoutDashboard, exact: true },
          { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
          { href: '/admin/manufacturers', label: 'Sellers', icon: Factory },
          { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
          { href: '/admin/ads', label: 'Ads', icon: Megaphone },
        ].map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact as boolean | undefined)
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors"
              style={{ color: active ? '#E8450A' : 'rgba(255,255,255,0.35)' }}>
              <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14 pb-16 md:pb-0 overflow-auto" style={{ background: '#0D0D0D' }}>
        {children}
      </main>
    </div>
  )
}
