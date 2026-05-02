'use client'

import { useCart } from '@/context/CartContext'
import { formatINR } from '@/lib/utils'
import { X, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, count, totalPaise, removeItem, updateQty, clearCart } = useCart()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-900">
              Cart {count > 0 && <span className="text-[#E8450A]">({count})</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded">
                Clear all
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Your cart is empty</p>
              <button onClick={onClose} className="text-sm text-[#E8450A] hover:underline">
                Continue shopping →
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className="flex gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 leading-snug line-clamp-2">{item.title}</p>
                  {(item.size || item.color) && (
                    <p className="text-[10px] text-gray-400 mt-0.5">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                  )}
                  <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#E8450A]">
                    {formatINR(item.pricePaise)}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1, item.size, item.color)}
                      className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="font-['JetBrains_Mono',monospace] text-sm text-gray-800 w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1, item.size, item.color)}
                      className="w-6 h-6 rounded border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId, item.size, item.color)}
                      className="ml-auto p-1 rounded hover:text-red-500 text-gray-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 space-y-3 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Subtotal ({count} items)</span>
              <span className="font-['JetBrains_Mono',monospace] font-bold text-lg text-gray-900">
                {formatINR(totalPaise)}
              </span>
            </div>
            <p className="text-xs text-green-600 font-medium">✓ Free delivery on all orders</p>
            <Link
              href="/checkout?cart=1"
              onClick={onClose}
              className="block w-full py-3 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white font-bold text-center transition-colors"
            >
              Checkout — {formatINR(totalPaise)}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
