'use client'

import { useCart } from '@/context/CartContext'
import { formatINR } from '@/lib/utils'
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CartPage() {
  const { items, count, totalPaise, removeItem, updateQty, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center">
          <ShoppingBag className="w-9 h-9 text-[#E8450A]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Your cart is empty</h2>
          <p className="text-sm text-gray-500">Add some products to continue.</p>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white font-semibold text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>
      </div>
    )
  }

  const checkoutHref = `/checkout?productId=${items[0].productId}&quantity=${items[0].quantity}${items[0].size ? `&size=${items[0].size}` : ''}${items[0].color ? `&color=${items[0].color}` : ''}`

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-bold text-gray-900 text-lg">
            My Cart <span className="text-gray-400 font-normal text-base">({count})</span>
          </h1>
        </div>
        <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {items.map((item) => (
          <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 p-4">
            <Link href={`/products/${item.productId}`} className="flex-shrink-0">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0 space-y-2">
              <Link href={`/products/${item.productId}`}>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug hover:text-[#E8450A] transition-colors">
                  {item.title}
                </p>
              </Link>
              {(item.size || item.color) && (
                <p className="text-xs text-gray-400">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.productId, item.quantity - 1, item.size, item.color)}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-['JetBrains_Mono',monospace] text-sm font-medium text-gray-800 w-5 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(item.productId, item.quantity + 1, item.size, item.color)}
                    className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#E8450A]">
                      {formatINR(item.pricePaise * item.quantity)}
                    </span>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-gray-400">{formatINR(item.pricePaise)} each</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Free shipping note */}
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
        <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
        <p className="text-xs text-green-700 font-medium">Free delivery on all orders · Factory direct prices</p>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal ({count} items)</span>
            <span className="font-['JetBrains_Mono',monospace]">{formatINR(totalPaise)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Delivery</span>
            <span className="font-['JetBrains_Mono',monospace] font-semibold">FREE</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span className="font-['JetBrains_Mono',monospace] text-base text-[#E8450A]">{formatINR(totalPaise)}</span>
          </div>
        </div>
        <Link
          href={checkoutHref}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#E8450A] hover:bg-orange-700 text-white font-bold text-sm transition-colors"
        >
          Proceed to Checkout <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
