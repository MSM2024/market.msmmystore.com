import Link from "next/link"
import { Gem } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/60 bg-[#050816]/95 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gem className="w-5 h-5 text-[#00D9FF]" />
              <span className="text-sm font-black">ZAFIRO</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">La primera Red Social del Conocimiento impulsada por Inteligencia Artificial.</p>
            <p className="text-[9px] text-slate-600 mt-2 italic">Internet es el almacenamiento. ZAFIRO es la inteligencia.</p>
          </div>
          <div>
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">ZAFIRO</h4>
            <div className="space-y-1.5">
              <Link href="/about" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Quiénes Somos</Link>
              <Link href="/what-we-do" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Qué Hacemos</Link>
              <Link href="/how-it-works" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Cómo Funciona</Link>
              <Link href="/vision" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Nuestra Visión</Link>
              <Link href="/mission" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Nuestra Misión</Link>
              <Link href="/values" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Nuestros Valores</Link>
              <Link href="/gemologia" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Gemología</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Plataforma</h4>
            <div className="space-y-1.5">
              <Link href="/eliana" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">ELIANA (IA)</Link>
              <Link href="/ecosystem" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Ecosistema MSM</Link>
              <Link href="/universo" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Mi Universo Digital</Link>
              <Link href="/memberships" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Membresías</Link>
              <Link href="/rewards" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">MSM Rewards</Link>
              <Link href="/referidos" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Mis Referidos</Link>
              <Link href="/sponsors-page" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Sponsors</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Comunidad</h4>
            <div className="space-y-1.5">
              <Link href="/help" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Centro de Ayuda</Link>
              <Link href="/rules" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Reglas de la Comunidad</Link>
              <Link href="/contact" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Contacto</Link>
              <Link href="/messages" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Mensajes</Link>
              <Link href="/profile-page" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Mi Perfil</Link>
              <Link href="/settings" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Configuración</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Admin</h4>
            <div className="space-y-1.5">
              <Link href="/admin" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Automation Center</Link>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Legal</h4>
            <div className="space-y-1.5">
              <Link href="/terms" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Términos y Condiciones</Link>
              <Link href="/privacy" className="block text-[11px] text-slate-500 hover:text-[#00D9FF] transition-colors">Política de Privacidad</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-800/40 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[9px] text-slate-600">© 2026 ZAFIRO — MSM. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-[9px] text-slate-500 hover:text-[#00D9FF] transition-colors">Iniciar Sesión</Link>
            <Link href="/auth/register" className="text-[9px] px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#00D9FF]/10 to-blue-600/10 text-[#00D9FF] border border-[#00D9FF]/20 hover:from-[#00D9FF]/20 hover:to-blue-600/20 transition-all">Registrarse</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
