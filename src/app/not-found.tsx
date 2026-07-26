import Link from "next/link"
import { ArrowLeft, Gem } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00D9FF]/10 to-blue-600/10 border border-[#00D9FF]/20 flex items-center justify-center mx-auto mb-6">
          <Gem className="w-10 h-10 text-[#00D9FF] opacity-50" />
        </div>
        <h1 className="text-6xl font-black mb-2 bg-gradient-to-r from-[#00D9FF] to-purple-400 bg-clip-text text-transparent">404</h1>
        <p className="text-lg font-bold text-white mb-2">Sintonía No Encontrada</p>
        <p className="text-sm text-slate-400 mb-8">La frecuencia que buscas no está disponible en el espectro de ZAFIRO.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Inicio
          </Link>
          <Link href="/help" className="px-5 py-2.5 rounded-xl bg-slate-800/50 text-slate-300 text-xs font-bold hover:bg-slate-700/50 transition-all">
            Centro de Ayuda
          </Link>
        </div>
      </div>
    </div>
  )
}
