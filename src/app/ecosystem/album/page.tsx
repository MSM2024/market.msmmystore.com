'use client'

import Link from "next/link"
import { ArrowLeft, BookOpen, TreePine, FileText, Heart, Clock, Users, Shield, Globe, Lock, Sparkles } from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"

export default function AlbumDeLaVidaPage() {
  usePageTitle("Álbum de la Vida — Tu Legado")

  const features = [
    { icon: TreePine, title: "Árbol Genealógico", desc: "Construye y visualiza tu árbol familiar con fotos, documentos y relatos de cada generación.", color: "text-[#00D9FF]" },
    { icon: FileText, title: "Bóveda de Documentos", desc: "Almacena de forma segura actas de nacimiento, certificados, cartas y documentos importantes de tu familia.", color: "text-emerald-400" },
    { icon: Heart, title: "Recuerdos y Memorias", desc: "Guarda fotos, videos, grabaciones de audio y relatos que preserven los momentos más importantes de tu vida.", color: "text-pink-400" },
    { icon: Clock, title: "Línea de Tiempo", desc: "Organiza tu historia familiar en una línea de tiempo visual que conecta generaciones y eventos significativos.", color: "text-amber-400" },
    { icon: Users, title: "Colaboración Familiar", desc: "Invita a miembros de tu familia a contribuir con recuerdos, documentos y relatos al árbol familiar.", color: "text-purple-400" },
    { icon: Sparkles, title: "ELIANA Preserva", desc: "ELIANA analiza y organiza los documentos, genera resúmenes y ayuda a preservar la información clave.", color: "text-blue-400" },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Álbum de la Vida</h1>
            <p className="text-sm text-slate-400">Tu Legado — Preserva la Historia de Tu Familia</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <Clock className="w-3 h-3" /> Próximamente
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800/60 glass-strong p-6 glow-border mb-8">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <span className="text-pink-400 font-bold">Álbum de la Vida</span> es la plataforma de preservación familiar
            del ecosistema MSM. Un espacio seguro y privado donde puedes documentar la historia de tu familia:
            desde los abuelos bisabuelos hasta las nuevas generaciones.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            No es solo un álbum de fotos. Es una bóveda digital donde conviven árboles genealógicos,
            documentos importantes, relatos orales, grabaciones de audio y recuerdos que merecen ser
            preservados para siempre. Porque cada familia tiene una historia que contar.
          </p>
        </div>

        {/* Concept */}
        <h2 className="text-sm font-mono font-bold text-pink-400 uppercase tracking-wider mb-4">El Concepto</h2>
        <div className="rounded-2xl glass p-6 mb-8">
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            En muchas familias, la historia se pierde con el tiempo. Los abuelos se van sin que nadie
            haya escuchado sus historias. Los documentos se pierden en mudanzas. Las fotos se desvanecen.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            <strong className="text-white">Álbum de la Vida</strong> cambia eso. Es una plataforma diseñada para que
            cada generación pueda preservar y transmitir lo más valioso: su historia, sus documentos
            y sus recuerdos.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Integrado con <strong className="text-[#00D9FF]">ZAFIRO</strong> y potenciado por <strong className="text-[#00D9FF]">ELIANA</strong>,
            cada pieza de información es organizada, preservada y conectada con el resto de tu árbol familiar.
          </p>
        </div>

        {/* Features */}
        <h2 className="text-sm font-mono font-bold text-pink-400 uppercase tracking-wider mb-4">Características</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {features.map((f, i) => (
            <div key={i} className="p-5 rounded-2xl glass hover:border-slate-700 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center">
                  <f.icon className={`w-4 h-4 ${f.color}`} />
                </div>
                <h3 className="text-xs font-bold text-white">{f.title}</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Privacy */}
        <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] p-5 mb-8">
          <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Privacidad y Seguridad
          </h2>
          <ul className="space-y-2 text-[11px] text-slate-400">
            <li className="flex items-start gap-2">
              <Lock className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <span>Tu información familiar es <strong className="text-white">100% privada</strong>. Solo tú y los miembros que invites pueden verla.</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <span>Encriptación de extremo a extremo para todos los documentos y archivos almacenados.</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <span>Tú decides quién tiene acceso a cada sección: árbol genealógico, documentos o memorias.</span>
            </li>
            <li className="flex items-start gap-2">
              <Lock className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <span>ELIANA procesa la información pero nunca la comparte con terceros ni la utiliza para entrenamiento.</span>
            </li>
          </ul>
        </div>

        {/* Family Tree Mockup */}
        <h2 className="text-sm font-mono font-bold text-pink-400 uppercase tracking-wider mb-4">Vista Previa</h2>
        <div className="rounded-2xl border border-slate-800/60 glass-strong p-6 mb-8">
          <div className="text-center mb-6">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Árbol Familiar García López</p>
            <p className="text-[9px] text-slate-500">3 generaciones · 24 miembros · 156 documentos</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-3">
              {["Abuelo Pedro", "Abuela Rosa"].map((name, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 min-w-[100px]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center mx-auto mb-1 text-[10px]">
                    <Users className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-[9px] font-bold text-white">{name}</p>
                  <p className="text-[7px] text-slate-500">n. 1940</p>
                </div>
              ))}
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex gap-3">
              {["Carlos García", "María García", "Luis García"].map((name, i) => (
                <div key={i} className="text-center p-3 rounded-xl bg-slate-800/30 border border-[#00D9FF]/10 min-w-[100px]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D9FF]/20 to-blue-900/40 flex items-center justify-center mx-auto mb-1 text-[10px]">
                    <Users className="w-4 h-4 text-[#00D9FF]" />
                  </div>
                  <p className="text-[9px] font-bold text-white">{name}</p>
                  <p className="text-[7px] text-slate-500">n. 1968</p>
                </div>
              ))}
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex gap-2">
              {["Ana García", "Pedro García", "Sofía García", "Diego García"].map((name, i) => (
                <div key={i} className="text-center p-2 rounded-xl bg-slate-800/20 border border-pink-500/10 min-w-[80px]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500/20 to-rose-900/30 flex items-center justify-center mx-auto mb-1 text-[8px]">
                    <Heart className="w-3 h-3 text-pink-400" />
                  </div>
                  <p className="text-[8px] font-bold text-white">{name}</p>
                  <p className="text-[7px] text-slate-500">n. 1995</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center py-6 border-t border-slate-800">
          <p className="text-xs text-slate-500">Parte del <Link href="/ecosystem" className="text-pink-400 hover:underline">Ecosistema MSM</Link></p>
        </div>
      </div>
    </div>
  )
}
