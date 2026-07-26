'use client'

import Link from "next/link"
import { ArrowLeft, Gem, Globe, Microscope, Network, BookOpen, Sparkles, Zap, Users, Target, Search, Shield, ExternalLink } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import ElianaDiamond from "@/components/ElianaDiamond"
import ElianaStandaloneChat from "@/components/eliana/ElianaStandaloneChat"

export default function ElianaPage() {
  usePageTitle("ELIANA — Guía Inteligente MSM")

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
          </Link>
          <Link href="/admin/eliana" className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-[#00D9FF] transition-colors">
            Admin Panel <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        {/* Hero + Chat */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-6 mb-10">
          {/* Left: Hero */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D9FF] via-[#2563eb] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#00D9FF]/20">
                <ElianaDiamond size={32} variant="animated" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">ELIANA</h1>
                <p className="text-sm text-slate-400">Guía Inteligente de MSM & ZAFIRO</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800/60 glass-strong p-5 mb-5">
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                <span className="text-[#00D9FF] font-bold">Bendiciones.</span> Soy ELIANA, la Guía Inteligente del ecosistema MSM.
                Puedo orientarte sobre productos, servicios, pedidos, vender en el marketplace, cursos de la Escuela MSM,
                servicios digitales y todo lo que necesites saber.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                No soy un chatbot genérico. Conozco todo el ecosistema MSM: Market, ZAFIRO, Escuela,
                Servicios Digitales, Álbum de la Vida y más. Estoy aquí para acompañarte.
              </p>
            </div>

            {/* Capabilities Grid */}
            <h2 className="text-[10px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-3">Mis Capacidades</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: Globe, title: "Ecosistema MSM", desc: "Orientación sobre todo MSM" },
                { icon: Gem, title: "Productos", desc: "Información y precios" },
                { icon: Users, title: "Marketplace", desc: "Tiendas y vendedores" },
                { icon: BookOpen, title: "Escuela", desc: "Cursos y mentores" },
                { icon: Sparkles, title: "Servicios", desc: "Marcas y desarrollo" },
                { icon: Search, title: "Conocimiento", desc: "Respuestas inteligentes" },
              ].map((c, i) => (
                <div key={i} className="p-3 rounded-xl glass border border-slate-800/30 hover:border-[#00D9FF]/20 transition-all">
                  <c.icon className="w-4 h-4 text-[#00D9FF]/60 mb-1.5" />
                  <p className="text-[11px] font-bold text-white">{c.title}</p>
                  <p className="text-[9px] text-slate-500">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Chat */}
          <div className="rounded-2xl border border-slate-800/60 glass-strong overflow-hidden lg:sticky lg:top-6 lg:self-start" style={{ maxHeight: "min(700px, calc(100vh - 100px))" }}>
            <ElianaStandaloneChat />
          </div>
        </div>

        {/* Info Sections */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          <div className="rounded-2xl border border-[#00D9FF]/10 bg-[#00D9FF]/[0.03] p-5">
            <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#00D9FF]" /> Cómo Funciona
            </h2>
            <div className="space-y-2">
              {[
                { step: "1", text: "Escribes tu pregunta o solicitud" },
                { step: "2", text: "ELIANA procesa usando IA + conocimiento MSM" },
                { step: "3", text: "Recibes una respuesta contextual y precisa" },
                { step: "4", text: "Si necesitas algo más, sigo aquí para ti" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/10 border border-slate-700/20">
                  <div className="w-5 h-5 rounded bg-[#00D9FF]/10 flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-[#00D9FF]">{f.step}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/40 glass p-5">
            <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Ética y Transparencia
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              ELIANA no almacena conversaciones privadas ni comparte datos personales.
              Las respuestas provienen de la base de conocimiento de MSM y modelos de IA.
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Las decisiones financieras, legales o médicas deben ser examinadas responsablemente.
              ELIANA orienta, tú decides.
            </p>
          </div>
        </div>

        {/* Ecosystem Links */}
        <div className="rounded-2xl glass border border-slate-800/30 p-5">
          <h2 className="text-xs font-bold text-white mb-3">Ecosistema MSM</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/", label: "ZAFIRO", desc: "Plataforma principal" },
              { href: "/marketplace", label: "Marketplace", desc: "Tiendas y productos" },
              { href: "/admin/eliana", label: "Admin ELIANA", desc: "Panel de control" },
              { href: "/auth/login", label: "Mi Cuenta", desc: "Acceder o registrarse" },
            ].map((link, i) => (
              <Link key={i} href={link.href} className="p-3 rounded-xl bg-[#14171A] border border-slate-800/30 hover:border-[#00D9FF]/30 transition-all group">
                <p className="text-[11px] font-bold text-white group-hover:text-[#00D9FF] transition-colors">{link.label}</p>
                <p className="text-[9px] text-slate-500">{link.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
