'use client'

import { usePathname } from "next/navigation"
import Footer from "@/components/Footer"
import ElianaFloatingButton from "@/components/ElianaFloatingButton"
import NetworkBackground from "@/components/ui/NetworkBackground"
import { CartProvider } from "@/contexts/CartContext"

function useIsMarketplaceDomain(): boolean {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  return host === "market.msmmystore.com"
}

function useIsElianaDomain(): boolean {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  return host === "eliana.msmmystore.com"
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === "/" || pathname.startsWith("/api/")
  const isMarketplace = useIsMarketplaceDomain()
  const isEliana = useIsElianaDomain()

  return (
    <CartProvider>
      <NetworkBackground />
      <div className="relative z-10">
        {children}
      </div>
      {!isHome && !isMarketplace && !isEliana && <Footer />}
      {!isMarketplace && <ElianaFloatingButton />}
    </CartProvider>
  )
}
