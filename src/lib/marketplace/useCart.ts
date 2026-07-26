'use client'

import { useState, useEffect, useCallback } from "react"
import { getLocalCart, getCartTotal, type LocalCartItem } from "./client"

export function useCart() {
  const [items, setItems] = useState<LocalCartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(getLocalCart())
    setMounted(true)

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "zafiro_marketplace_cart") {
        setItems(getLocalCart())
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const refresh = useCallback(() => {
    setItems(getLocalCart())
  }, [])

  const { subtotal, itemCount } = getCartTotal(items)

  return { items, subtotal, itemCount, refresh, mounted }
}
