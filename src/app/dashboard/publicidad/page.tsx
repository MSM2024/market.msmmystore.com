'use client'

import { Megaphone } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function DashboardPublicidadPage() {
  usePageTitle("Publicidad — Dashboard")

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Megaphone className="w-5 h-5 text-purple-400" />
        <h1 className="text-lg font-black text-white">Publicidad</h1>
      </div>

      <div className="p-6 rounded-xl bg-slate-900/30 border border-slate-800/50 text-center">
        <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-white mb-1">Próximamente</h3>
        <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
          Promociona tus productos dentro del marketplace. Campañas, banners y destacados.
        </p>
      </div>
    </div>
  )
}
