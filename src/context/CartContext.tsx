'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export interface CartItem {
  productId: string
  title: string
  image: string
  pricePaise: number
  mrpPaise?: number
  quantity: number
  size?: string
  color?: string
}

interface CartContextValue {
  items: CartItem[]
  count: number
  totalPaise: number
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string, size?: string, color?: string) => void
  updateQty: (productId: string, qty: number, size?: string, color?: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const CART_KEY = 'bd_cart'

function itemKey(productId: string, size?: string, color?: string) {
  return `${productId}__${size ?? ''}__${color ?? ''}`
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
  }, [])

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const key = itemKey(item.productId, item.size, item.color)
      const existing = prev.find(
        (i) => itemKey(i.productId, i.size, i.color) === key
      )
      if (existing) {
        return prev.map((i) =>
          itemKey(i.productId, i.size, i.color) === key
            ? { ...i, quantity: Math.min(10, i.quantity + (item.quantity ?? 1)) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string, size?: string, color?: string) => {
    const key = itemKey(productId, size, color)
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.size, i.color) !== key))
  }, [])

  const updateQty = useCallback(
    (productId: string, qty: number, size?: string, color?: string) => {
      const key = itemKey(productId, size, color)
      if (qty < 1) {
        setItems((prev) => prev.filter((i) => itemKey(i.productId, i.size, i.color) !== key))
      } else {
        setItems((prev) =>
          prev.map((i) =>
            itemKey(i.productId, i.size, i.color) === key
              ? { ...i, quantity: Math.min(10, qty) }
              : i
          )
        )
      }
    },
    []
  )

  const clearCart = useCallback(() => setItems([]), [])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const totalPaise = items.reduce((s, i) => s + i.pricePaise * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, totalPaise, addItem, removeItem, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
