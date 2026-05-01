'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { CartDrawer } from './CartDrawer'
import { Search, ShoppingCart, User, X, Menu, Zap, MapPin } from 'lucide-react'

export function BuyerHeader() {
  const router = useRouter()
  const { count } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    setSearchOpen(false)
    setMobileMenuOpen(false)
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-[#E8450A] text-white text-[11px] font-medium text-center py-1.5 tracking-wide">
        🇮🇳 Free delivery on all orders &nbsp;·&nbsp; COD available &nbsp;·&nbsp; Factory direct prices
      </div>

      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4">
          <div className="h-14 flex items-center gap-3">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 mr-1">
              <span className="font-['Syne',sans-serif] text-xl font-extrabold text-[#E8450A] tracking-tight">
                Bharat<span className="text-gray-900">Deal</span>
              </span>
            </Link>

            {/* Search bar — desktop */}
            <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-2xl">
              <div className="flex w-full items-center bg-gray-100 border border-gray-200 rounded-full overflow-hidden focus-within:border-[#E8450A] focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-gray-400 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, brands, categories…"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} className="p-1.5 mr-1 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button type="submit" className="px-5 py-2.5 bg-[#E8450A] hover:bg-orange-700 text-white text-sm font-semibold transition-colors flex-shrink-0 rounded-r-full">
                  Search
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-0.5">
              {/* Mobile search toggle */}
              <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2.5 rounded-full hover:bg-gray-100 transition-colors">
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              {/* Account */}
              <Link href="/account" className="hidden sm:flex flex-col items-center px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors min-w-[56px]">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-[10px] text-gray-500 mt-0.5">Account</span>
              </Link>

              {/* Cart */}
              <button onClick={() => setCartOpen(true)} className="relative flex flex-col items-center px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors min-w-[48px] sm:min-w-[56px]">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#E8450A] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 hidden sm:block">Cart</span>
              </button>

              {/* Mobile menu */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2.5 rounded-full hover:bg-gray-100 transition-colors">
                {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search expand */}
        {searchOpen && (
          <div className="sm:hidden px-3 pb-3 border-t border-gray-100 bg-white">
            <form onSubmit={handleSearch} className="flex gap-2 pt-3">
              <div className="flex flex-1 items-center bg-gray-100 border border-gray-200 rounded-full overflow-hidden focus-within:border-[#E8450A] transition-colors">
                <Search className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-[#E8450A] text-white text-sm font-semibold rounded-full">
                Go
              </button>
            </form>
          </div>
        )}

        {/* Category strip — desktop */}
        <div className="hidden sm:block border-t border-gray-100 bg-white">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-hide">
              {[
                { label: 'All', href: '/' },
                { label: 'Cotton Knitwear', href: '/?category=Cotton+Knitwear' },
                { label: 'Sarees', href: '/?category=Sarees' },
                { label: 'Brass Decor', href: '/?category=Brass+Home+Decor' },
                { label: 'New Arrivals', href: '/' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex-shrink-0 px-3 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/?flash=1"
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1 text-xs text-[#E8450A] hover:bg-orange-50 rounded-md transition-colors font-semibold"
              >
                <Zap className="w-3 h-3 fill-current" />
                Flash Deals
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-800">My Account / Orders</span>
            </Link>
            <Link href="/track" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-800">Track Order</span>
            </Link>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
