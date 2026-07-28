'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import {
  getLocalCart, addToLocalCart, removeFromLocalCart,
  updateLocalCartQuantity, clearLocalCart, getCartTotal,
  type LocalCartItem,
} from "@/lib/marketplace/client"

interface CartContextType {
  items: LocalCartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: LocalCartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  isInCart: (productId: string, variantId?: string) => boolean
  getItemQuantity: (productId: string, variantId?: string) => number
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<LocalCartItem[]>(() => getLocalCart())

  const addItem = useCallback((item: LocalCartItem) => {
    setItems(prev => {
      const existing = prev.find(c => c.productId === item.productId && c.variantId === item.variantId)
      let next: LocalCartItem[]
      if (existing) {
        next = prev.map(c =>
          c.productId === item.productId && c.variantId === item.variantId
            ? { ...c, quantity: Math.min(c.quantity + item.quantity, c.stock) }
            : c
        )
      } else {
        next = [...prev, item]
      }
      saveLocalCart(next)
      return next
    })
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev => {
      const next = prev.filter(c => !(c.productId === productId && c.variantId === variantId))
      saveLocalCart(next)
      return next
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    setItems(prev => {
      let next: LocalCartItem[]
      if (quantity <= 0) {
        next = prev.filter(c => !(c.productId === productId && c.variantId === variantId))
      } else {
        next = prev.map(c =>
          c.productId === productId && c.variantId === variantId
            ? { ...c, quantity: Math.min(quantity, c.stock) }
            : c
        )
      }
      saveLocalCart(next)
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    clearLocalCart()
    setItems([])
  }, [])

  const isInCart = useCallback((productId: string, variantId?: string) => {
    return items.some(c => c.productId === productId && c.variantId === variantId)
  }, [items])

  const getItemQuantity = useCallback((productId: string, variantId?: string) => {
    const item = items.find(c => c.productId === productId && c.variantId === variantId)
    return item?.quantity || 0
  }, [items])

  const { subtotal, itemCount } = getCartTotal(items)

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart, isInCart, getItemQuantity }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}

function saveLocalCart(items: LocalCartItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem("zafiro_marketplace_cart", JSON.stringify(items))
}
