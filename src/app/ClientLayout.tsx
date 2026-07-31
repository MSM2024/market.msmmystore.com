'use client'

import { usePathname } from "next/navigation"
import Footer from "@/components/Footer"
import ElianaUniversalLauncher from "@/components/ElianaUniversalLauncher"
import NetworkBackground from "@/components/ui/NetworkBackground"
import { CartProvider } from "@/contexts/CartContext"
import { AuthProvider } from "@/lib/AuthContext"
import { useMemo } from "react"

function useIsMarketplaceDomain(): boolean {
  if (typeof window === "undefined") return false
  return window.location.hostname === "market.msmmystore.com"
}

function useIsElianaDomain(): boolean {
  if (typeof window === "undefined") return false
  return window.location.hostname === "eliana.msmmystore.com"
}

function getContextFromPath(pathname: string) {
  if (pathname.startsWith("/marketplace/productos")) return { source_app: "marketplace", source_module: "products", resource_type: "product" }
  if (pathname.startsWith("/marketplace/tiendas")) return { source_app: "marketplace", source_module: "stores", resource_type: "store" }
  if (pathname.startsWith("/marketplace/pedidos")) return { source_app: "marketplace", source_module: "orders", resource_type: "order" }
  if (pathname.startsWith("/marketplace/vender")) return { source_app: "marketplace", source_module: "seller" }
  if (pathname.startsWith("/marketplace")) return { source_app: "marketplace", source_module: "home" }
  if (pathname.startsWith("/memberships")) return { source_app: "zafiro", source_module: "memberships" }
  if (pathname.startsWith("/rewards")) return { source_app: "zafiro", source_module: "rewards" }
  if (pathname.startsWith("/referidos")) return { source_app: "zafiro", source_module: "referrals" }
  if (pathname.startsWith("/admin")) return { source_app: "zafiro", source_module: "admin" }
  if (pathname.startsWith("/settings")) return { source_app: "zafiro", source_module: "settings" }
  if (pathname.startsWith("/eliana")) return { source_app: "eliana", source_module: "home" }
  return { source_app: "zafiro", source_module: "home" }
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === "/" || pathname.startsWith("/api/")
  const isMarketplace = useIsMarketplaceDomain()
  const isEliana = useIsElianaDomain()

  const context = useMemo(() => getContextFromPath(pathname), [pathname])

  const showLauncher = !isEliana && !pathname.startsWith("/auth/")

  return (
    <AuthProvider>
    <CartProvider>
      <NetworkBackground />
      <div className="relative z-10">
        {children}
      </div>
      {!isHome && !isMarketplace && !isEliana && <Footer />}
      {showLauncher && (
        <ElianaUniversalLauncher
          context={context}
          variant="floating"
          label={isMarketplace ? "Asistencia Marketplace" : "Hablar con ELIANA"}
        />
      )}
    </CartProvider>
    </AuthProvider>
  )
}
