'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Package, ShoppingCart, Tag, Wallet,
  TrendingUp, BarChart2, MessageSquare, LogOut, Sparkles,
  ChevronDown, ChevronRight, Star, Settings, Bell
} from 'lucide-react'

interface NavItem {
  href?: string
  label: string
  icon: React.ElementType
  children?: { href: string; label: string }[]
}

const NAV: NavItem[] = [
  { href: '/manufacturer/dashboard', label: 'Homepage', icon: LayoutDashboard },
  {
    label: 'Products', icon: Package,
    children: [
      { href: '/manufacturer/dashboard/products', label: 'My Products' },
      { href: '/manufacturer/dashboard/skus', label: 'SKU Analytics' },
      { href: '/manufacturer/dashboard/skus?tab=search', label: 'Search Trends' },
    ]
  },
  {
    label: 'Orders', icon: ShoppingCart,
    children: [
      { href: '/manufacturer/dashboard/orders', label: 'All Orders' },
      { href: '/manufacturer/dashboard/orders?status=pending', label: 'Pending' },
      { href: '/manufacturer/dashboard/orders?status=shipped', label: 'Shipped' },
      { href: '/manufacturer/dashboard/orders?status=rto', label: 'RTO / Returns' },
    ]
  },
  {
    label: 'Promotions', icon: Tag,
    children: [
      { href: '/manufacturer/dashboard/promotions', label: 'Flash Deals' },
      { href: '/manufacturer/dashboard/promotions?tab=discounts', label: 'Discounts' },
    ]
  },
  {
    label: 'Finances', icon: Wallet,
    children: [
      { href: '/manufacturer/dashboard/finances', label: 'Earnings' },
      { href: '/manufacturer/dashboard/finances?tab=payouts', label: 'Payouts' },
      { href: '/manufacturer/dashboard/finances?tab=statements', label: 'Statements' },
    ]
  },
  {
    label: 'Performance', icon: TrendingUp,
    children: [
      { href: '/manufacturer/dashboard/performance', label: 'Seller Score' },
      { href: '/manufacturer/dashboard/performance?tab=reviews', label: 'Buyer Reviews' },
      { href: '/manufacturer/dashboard/skus?tab=returns', label: 'Return Analysis' },
    ]
  },
  {
    label: 'Analytics', icon: BarChart2,
    children: [
      { href: '/manufacturer/dashboard/skus', label: 'Sales Charts' },
      { href: '/manufacturer/dashboard/skus?tab=pincode', label: 'Pincode Demand' },
    ]
  },
  { href: '/manufacturer/dashboard/ai', label: 'AI Advisor', icon: MessageSquare },
]

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const isChildActive = item.children?.some(c => pathname.startsWith(c.href.split('?')[0]))
  const [open, setOpen] = useState(!!isChildActive)

  if (item.href) {
    const isActive = pathname === item.href
    return (
      <Link href={item.href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive ? 'bg-[#E8450A] text-white shadow-sm shadow-orange-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}>
        <item.icon className="w-4 h-4 flex-shrink-0" />
        {item.label}
      </Link>
    )
  }

  return (
    <div>
      <button onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isChildActive ? 'text-[#E8450A] bg-orange-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}>
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <div className="ml-7 mt-0.5 flex flex-col gap-0.5">
          {item.children?.map(child => {
            const isActive = pathname === child.href.split('?')[0] || pathname.startsWith(child.href.split('?')[0] + '/')
            return (
              <Link key={child.href} href={child.href}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive ? 'text-[#E8450A] font-semibold bg-orange-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}>
                {child.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ManufacturerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 bg-white flex-shrink-0 shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-['Syne',sans-serif] font-extrabold text-gray-900">
              Bharat<span className="text-[#E8450A]">Deal</span>
            </span>
          </Link>
          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
            Seller
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Menu</p>
          {NAV.map((item) => (
            <NavGroup key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <Link href="/manufacturer/dashboard/notifications"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </Link>
          <Link href="/manufacturer/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <Link href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
            <Sparkles className="w-4 h-4" /> View Store
          </Link>
          <form action="/api/manufacturer/logout" method="POST">
            <button type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm">
        <span className="font-['Syne',sans-serif] font-extrabold text-gray-900">
          Bharat<span className="text-[#E8450A]">Deal</span>
        </span>
        <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">Seller</span>
      </div>

      {/* Mobile bottom nav — show top 5 only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex shadow-lg">
        {[
          { href: '/manufacturer/dashboard', label: 'Home', icon: LayoutDashboard },
          { href: '/manufacturer/dashboard/products', label: 'Products', icon: Package },
          { href: '/manufacturer/dashboard/orders', label: 'Orders', icon: ShoppingCart },
          { href: '/manufacturer/dashboard/finances', label: 'Finances', icon: Wallet },
          { href: '/manufacturer/dashboard/ai', label: 'AI', icon: MessageSquare },
        ].map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${isActive ? 'text-[#E8450A]' : 'text-gray-400'}`}>
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
