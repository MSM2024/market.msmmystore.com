'use client'

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ShoppingCart, Package } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { useCart } from "@/contexts/CartContext"

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  usePageTitle("Marketplace — MSM")
  const router = useRouter()
  const { itemCount } = useCart()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/marketplace/productos?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="sticky top-0 z-40 bg-[#050816]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="text-[#197BD2] font-black text-lg">MSM</Link>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar productos, tiendas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#197BD2]/50 transition-colors"
              />
            </div>
            <Link href="/marketplace/pedidos" className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 hover:border-[#197BD2]/30 transition-colors relative">
              <ShoppingCart className="w-5 h-5 text-slate-300" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#197BD2] rounded-full text-[9px] font-bold flex items-center justify-center px-1">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {children}
      </div>
    </div>
  )
}
