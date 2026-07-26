'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Store, Package, Truck, ShoppingCart, DollarSign, AlertTriangle, Settings, ArrowLeft } from "lucide-react"

const ADMIN_LINKS = [
  { href: "/admin/marketplace", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/marketplace/tiendas", label: "Tiendas", icon: Store },
  { href: "/admin/marketplace/productos", label: "Productos", icon: Package },
  { href: "/admin/marketplace/proveedores", label: "Proveedores", icon: Truck },
  { href: "/admin/marketplace/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/marketplace/margenes", label: "Márgenes", icon: DollarSign },
  { href: "/admin/marketplace/disputas", label: "Disputas", icon: AlertTriangle },
]

export default function AdminMarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex">
        <aside className="hidden md:block w-56 shrink-0 border-r border-white/5 bg-slate-900/20 min-h-screen p-4">
          <Link href="/admin" className="flex items-center gap-2 mb-1 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> <span className="text-[9px]">Volver al Admin</span>
          </Link>
          <h2 className="text-xs font-black text-[#D4AF37] mb-4 mt-3">Marketplace Admin</h2>
          <nav className="space-y-1">
            {ADMIN_LINKS.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    isActive
                      ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
