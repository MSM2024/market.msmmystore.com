"use client"

import ZafiroParticles from "@/components/zafiro101/ZafiroParticles"
import ZafiroModuleHub from "@/components/zafiro101/ZafiroModuleHub"

interface Props {
  onEnter: () => void
}

export default function ElianaEntrance({ onEnter }: Props) {
  return (
    <div className="zaf101-starfield relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#050A1A] text-white">
      {/* Fondo: partículas doradas + resplandores suaves */}
      <ZafiroParticles className="zaf101-glows" density={48} />
      <div
        className="zaf101-glows zaf101-drift-a pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-[#DAA520] opacity-[0.08] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="zaf101-glows zaf101-drift-b pointer-events-none absolute -right-28 top-1/3 h-[380px] w-[380px] rounded-full bg-[#B8860B] opacity-[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="zaf101-glows zaf101-drift-c pointer-events-none absolute -bottom-32 left-1/4 h-[360px] w-[360px] rounded-full bg-[#F9E7B0] opacity-[0.05] blur-3xl"
        aria-hidden="true"
      />

      {/* Cabecera mínima */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
        <div className="zaf101-rise flex items-center gap-2">
          <span className="zaf101-gold-text text-sm font-black tracking-[0.3em] sm:text-base">ZAFIRO</span>
          <span className="hidden rounded-full border border-[#DAA520]/30 bg-[#DAA520]/5 px-2 py-0.5 text-[9px] font-medium tracking-widest text-[#E8C766] sm:inline-block">
            1.0.1
          </span>
        </div>
        <div className="zaf101-rise zaf101-rise-delay-1 flex items-center gap-1.5 text-[10px] text-neutral-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[#DAA520]" />
          Ecosistema MSM · MSM MY STORE LLC
        </div>
      </header>

      {/* Contenido central: núcleo ELIANA + constelación de módulos */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-6 text-center">
        <div className="zaf101-rise zaf101-rise-delay-1 relative">
          <p className="text-[10px] font-medium uppercase tracking-[0.42em] text-[#E8C766] sm:text-xs">
            Bienvenido al mundo soberano
          </p>
          <h1 className="zaf101-gold-text mt-2 text-5xl font-black uppercase tracking-[0.16em] sm:text-7xl sm:tracking-[0.24em]">
            ZAFIRO
          </h1>
          <p className="mt-2 text-sm font-medium tracking-[0.5em] text-neutral-300 sm:text-base">
            ELIANA
          </p>
          <p className="mt-1 text-[10px] text-neutral-500 sm:text-[11px]">
            Guía Inteligente del Ecosistema MSM
          </p>
        </div>

        <div className="zaf101-rise zaf101-rise-delay-2 mt-6 w-full">
          <ZafiroModuleHub onEnter={onEnter} />
        </div>

        <div className="zaf101-rise zaf101-rise-delay-3 mt-2 flex flex-col items-center">
          <button
            type="button"
            onClick={onEnter}
            aria-label="Entrar a ELIANA Viva"
            className="zaf101-btn inline-flex cursor-pointer items-center justify-center rounded-full border border-[#FFF3C4]/60 bg-gradient-to-b from-[#F1C75B] via-[#DAA520] to-[#B8860B] px-10 py-3.5 text-sm font-black uppercase tracking-[0.3em] text-[#0B0A02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF3C4]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050A1A] sm:px-14 sm:py-4"
          >
            Entrar
          </button>
          <p className="mt-4 text-[10px] tracking-widest text-neutral-500 sm:text-[11px]">
            Orientación inteligente · Voz según tu dispositivo · Conversación privada
          </p>
          <p className="mt-1 text-[9px] tracking-wider text-neutral-600">
            Toca una esfera para abrir su plataforma · pide a ELIANA que te lleve · la esfera central abre el chat
          </p>
        </div>
      </main>

      {/* Pie sobrio */}
      <footer className="relative z-10 flex items-center justify-center px-6 pb-5 text-[10px] tracking-wider text-neutral-600">
        <span>MSM MY STORE LLC · El conocimiento te pertenece</span>
      </footer>
    </div>
  )
}