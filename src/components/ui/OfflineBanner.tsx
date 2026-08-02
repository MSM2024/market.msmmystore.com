"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine)

  useEffect(() => {
    if (typeof window === "undefined") return
    let active = true

    const probe = async () => {
      if (!active) return
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOffline(true)
        return
      }
      try {
        const res = await fetch("/api/health", {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        })
        if (active) setOffline(!res.ok)
      } catch {
        if (active) setOffline(true)
      }
    }

    const onOffline = () => setOffline(true)
    const onOnline = () => {
      setOffline(false)
      probe()
    }

    window.addEventListener("offline", onOffline)
    window.addEventListener("online", onOnline)

    probe()
    const id = setInterval(probe, 30000)

    return () => {
      active = false
      window.removeEventListener("offline", onOffline)
      window.removeEventListener("online", onOnline)
      clearInterval(id)
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
