'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Globe, ShoppingCart, CreditCard, BookOpen, Code2, Store, BarChart3, Users, Zap, MessageSquare, Brain, Shield, Link2, Truck, GraduationCap } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function EcosystemPage() {
  usePageTitle("Ecosistema MSM — ZAFIRO")

  const projects = [
    { icon: Store, name: "MSM My Store", desc: "Tienda online multi-categoría con envíos internacionales, incluyendo productos Farmasi, tecnología, hogar y más.", color: "text-emerald-400", url: "https://msmmystore.com" },
    { icon: Gem, name: "ZAFIRO", desc: "Red Social del Conocimiento impulsada por IA. El centro del ecosistema donde converge todo el conocimiento.", color: "text-[#00D9FF]", url: "/" },
    { icon: ShoppingCart, name: "MSM Marketplace", desc: "Marketplace descentralizado para creadores y vendedores independientes. Próximamente.", color: "text-amber-400", url: "/about" },
    { icon: BookOpen, name: "Álbum de la Vida", desc: "Plataforma para documentar y compartir historias de vida, memorias y legados familiares.", color: "text-pink-400", url: "/ecosystem/album" },
    { icon: Brain, name: "MSM Mente Maestra", desc: "Comunidad exclusiva para mentes creativas, emprendedores y visionarios del ecosistema digital.", color: "text-purple-400", url: "/about" },
    { icon: BarChart3, name: "ELIANA", desc: "Motor de IA que analiza, organiza y relaciona el conocimiento en todo el ecosistema MSM.", color: "text-cyan-400", url: "/eliana" },
    { icon: MessageSquare, name: "MSM Blog", desc: "Contenido editorial sobre tecnología, negocios digitales, envíos a Cuba y estilo de vida.", color: "text-sky-400", url: "https://msmmystore.com/blog" },
    { icon: CreditCard, name: "Remesas a Cuba", desc: "Servicio de envío de remesas a Cuba con múltiples métodos de pago y seguimiento en tiempo real.", color: "text-green-400", url: "https://msmmystore.com" },
    { icon: Zap, name: "Farmasi", desc: "Línea de cosméticos y productos de bienestar distribuidos a través de MSM My Store con envío a Cuba.", color: "text-pink-500", url: "https://msmmystore.com" },
    { icon: Users, name: "Redes Sociales", desc: "Presencia unificada en YouTube, Instagram, TikTok, Facebook, X, Telegram y WhatsApp.", color: "text-blue-400", url: "/universo" },
    { icon: BarChart3, name: "Marketing Digital", desc: "Estrategias de crecimiento, embudos de conversión y automatización para el ecosistema MSM.", color: "text-orange-400", url: "/what-we-do" },
    { icon: Shield, name: "MSM Payment", desc: "Sistema de pagos integrado para transacciones dentro del ecosistema MSM. Próximamente.", color: "text-indigo-400", url: "/ecosystem/payments" },
    { icon: Truck, name: "MSM Delivery", desc: "Logística inteligente con envíos a Cuba, USA y Latinoamérica. Tracking en tiempo real.", color: "text-emerald-400", url: "/ecosystem/delivery" },
    { icon: GraduationCap, name: "Escuela MSM", desc: "Cursos de emprendimiento, programación, marketing y gestión de negocios para creadores digitales.", color: "text-amber-400", url: "/ecosystem/escuela" },
  ]

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Ecosistema MSM</h1>
            <p className="text-sm text-slate-400">Un universo de proyectos interconectados que potencian el conocimiento, el comercio y la comunidad</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <span className="text-white font-bold">MSM</span> no es una sola plataforma. Es un ecosistema de proyectos 
            que trabajan juntos para ofrecer una experiencia integrada de comercio, conocimiento y comunidad. 
            <span className="text-[#00D9FF]"> ZAFIRO</span> es el centro neural de este ecosistema: el lugar donde 
            convergen todos los proyectos, plataformas y comunidades.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Cada proyecto del ecosistema MSM puede conectarse a ZAFIRO a través de Mi Universo Digital. 
            Esto permite que un creador tenga su tienda, su blog, sus redes sociales y sus comunidades 
            centralizadas en un único perfil inteligente.
          </p>
        </div>

        <h2 className="text-sm font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-4">Proyectos del Ecosistema</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {projects.map((p, i) => {
            const Icon = p.icon
            return (
              <Link key={i} href={p.url} target={p.url.startsWith("http") ? "_blank" : undefined}
                className="p-4 rounded-2xl glass hover:border-slate-700 transition-all group">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className={`w-5 h-5 ${p.color}`} />
                  <h3 className="text-xs font-bold text-white group-hover:text-[#00D9FF] transition-colors">{p.name}</h3>
                </div>
                <p className="text-[9px] text-slate-400 leading-relaxed">{p.desc}</p>
              </Link>
            )
          })}
        </div>

        <div className="rounded-2xl glass p-6">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-[#00D9FF]" /> Sinergia del Ecosistema</h2>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            La fortaleza del ecosistema MSM está en la integración. Un usuario puede:
          </p>
          <ul className="space-y-2 text-[10px] text-slate-400">
            <li className="flex items-start gap-2">• Comprar productos en <strong className="text-white">MSM My Store</strong> y compartir su experiencia en <strong className="text-white">ZAFIRO</strong>.</li>
            <li className="flex items-start gap-2">• Conectar su <strong className="text-white">YouTube</strong> y <strong className="text-white">blog</strong> a su perfil de ZAFIRO para que ELIANA los analice.</li>
            <li className="flex items-start gap-2">• Unirse a <strong className="text-white">MSM Mente Maestra</strong> y ganar PTS que puede usar en el <strong className="text-white">Marketplace</strong>.</li>
            <li className="flex items-start gap-2">• Enviar <strong className="text-white">Remesas a Cuba</strong> y documentar la experiencia en el <strong className="text-white">Álbum de la Vida</strong>.</li>
            <li className="flex items-start gap-2">• Ser <strong className="text-white">Sponsor</strong> de un Círculo de conocimiento y conectar con una audiencia calificada.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
