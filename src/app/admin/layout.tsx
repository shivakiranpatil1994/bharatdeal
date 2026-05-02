import Link from 'next/link'
import { LayoutDashboard, ShoppingBag, Factory, Users, BarChart3, LogOut, ClipboardList, Package } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/manufacturers', label: 'Manufacturers', icon: Factory },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-[var(--bg-border)] bg-[var(--bg-surface)] flex-shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-[var(--bg-border)]">
          <span className="font-bold text-[var(--text-primary)]">
            Bharat<span className="text-[var(--brand-primary)]">Deal</span>
          </span>
          <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors duration-200"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-[var(--bg-border)]">
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-red-500/5 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-[var(--bg-surface)] border-b border-[var(--bg-border)] flex items-center justify-between px-4">
        <span className="font-bold text-[var(--text-primary)]">
          Bharat<span className="text-[var(--brand-primary)]">Deal</span>
          <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border border-[var(--brand-primary)]/20">
            Admin
          </span>
        </span>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-surface)] border-t border-[var(--bg-border)] flex">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-200"
          >
            <Icon className="w-4 h-4" />
            <span className="text-[9px]">{label}</span>
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14 pb-16 md:pb-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
