'use client'

import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function PrivacidadPage() {
  usePageTitle("Privacidad — ELIANA")

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/eliana/configuracion" className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Configuración
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/eliana" className="text-slate-400 hover:text-white transition-colors text-xs">ELIANA</Link>
        </div>

        <h1 className="text-xl font-black mb-1">Privacidad</h1>
        <p className="text-xs text-slate-400 mb-6">Controla qué datos conserva ELIANA</p>

        <div className="space-y-4">
          {[
            { label: "Recordar preferencias", desc: "ELIANA recuerda tus configuraciones", default: true },
            { label: "Recordar contexto de productos", desc: "Recuerda productos que consultaste", default: true },
            { label: "Recordar conversaciones", desc: "Conserva historial de conversaciones", default: true },
            { label: "Usar contexto empresarial", desc: "Accede a datos autorizados del ecosistema", default: false },
            { label: "Compartir datos con soporte", desc: "Permite escalación con contexto", default: true },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl glass border border-slate-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button className={`w-10 h-6 rounded-full border relative cursor-pointer ${
                  item.default
                    ? "bg-[#00D9FF]/20 border-[#00D9FF]/30"
                    : "bg-slate-800 border-slate-700"
                }`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full transition-all ${
                    item.default ? "left-5 bg-[#00D9FF]" : "left-1 bg-slate-500"
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
