'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store, Package, ShoppingCart, Users, DollarSign, Megaphone, Settings, LayoutDashboard } from "lucide-react"

const DASHBOARD_LINKS = [
  { href: "/dashboard/tienda", label: "Mi Tienda", icon: Store },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/dashboard/clientes", label: "Clientes", icon: Users },
  { href: "/dashboard/ganancias", label: "Ganancias", icon: DollarSign },
  { href: "/dashboard/publicidad", label: "Publicidad", icon: Megaphone },
  { href: "/dashboard/configuracion", label: "Config", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0 border-r border-white/5 bg-slate-900/20 min-h-screen p-4">
          <Link href="/marketplace/vender" className="flex items-center gap-2 mb-6">
            <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-black">Dashboard</span>
          </Link>
          <nav className="space-y-1">
            {DASHBOARD_LINKS.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    isActive
                      ? "bg-[#197BD2]/10 text-[#197BD2] border border-[#197BD2]/20"
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

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
