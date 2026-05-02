'use client'

import { useCart } from '@/context/CartContext'
import { formatINR } from '@/lib/utils'
import { ShieldCheck, Truck, RefreshCw, ShoppingBag } from 'lucide-react'
import Image from 'next/image'

export function CartOrderSummary() {
  const { items, count, totalPaise } = useCart()

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24">
      <div className="p-4 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Order Summary · {count} item{count !== 1 ? 's' : ''}
        </p>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.title} width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug">{item.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.size && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item.size}</span>}
                  {item.color && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{item.color}</span>}
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">×{item.quantity}</span>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 font-['JetBrains_Mono',monospace] flex-shrink-0">
                {formatINR(item.pricePaise * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-2.5">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal ({count} items)</span>
          <span className="font-['JetBrains_Mono',monospace]">{formatINR(totalPaise)}</span>
        </div>
        <div className="flex justify-between text-sm text-green-600">
          <span>Delivery</span>
          <span className="font-semibold">FREE</span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
          <span>Total Amount</span>
          <span className="text-xl font-['JetBrains_Mono',monospace]">{formatINR(totalPaise)}</span>
        </div>
        <p className="text-xs text-green-600 font-medium text-right">Free delivery on all orders</p>
      </div>

      <div className="border-t border-gray-100 p-4 grid grid-cols-3 gap-2">
        {[
          { icon: ShieldCheck, label: 'Secure' },
          { icon: Truck, label: 'Free Ship' },
          { icon: RefreshCw, label: '7-Day Return' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <Icon className="w-4 h-4 text-green-500" />
            <span className="text-[10px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
