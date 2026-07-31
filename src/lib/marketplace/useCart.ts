'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { getLocalCart, getCartTotal, type LocalCartItem } from "./client"

const noopSubscribe = () => () => {}

export function useCart() {
  const [items, setItems] = useState<LocalCartItem[]>(() =>
    typeof window === "undefined" ? [] : getLocalCart()
  )
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  useEffect(() => {
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
