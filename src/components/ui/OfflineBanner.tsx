"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine)

  useEffect(() => {
    if (typeof window === "undefined") return
    const onOffline = () => setOffline(true)
    const onOnline = () => setOffline(false)
    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)
    return () => {
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
    }
  }, [])

  if (!offline) return null

  return (
    <div role="status" aria-live="polite" className="fixed top-0 inset-x-0 z-[90] px-4 py-2 bg-amber-500/90 text-[#050816] text-[11px] font-bold text-center shadow-lg">
      <span className="inline-flex items-center gap-1.5">
        <WifiOff className="w-3.5 h-3.5" /> Sin conexión — algunos datos podrían no actualizarse.
      </span>
    </div>
  )
}
