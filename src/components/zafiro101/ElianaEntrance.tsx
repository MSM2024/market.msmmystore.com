'use client'

import ZafiroParticles from "@/components/zafiro101/ZafiroParticles"

interface Props {
  onEnter: () => void
}

export default function ElianaEntrance({ onEnter }: Props) {
  return (
    <div className="relative flex min-h-svh w-full flex-col overflow-hidden bg-[#050A1A] text-white">
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

      {/* Contenido central */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="zaf101-rise zaf101-rise-delay-1 text-[10px] font-medium uppercase tracking-[0.42em] text-[#E8C766] sm:text-xs">
          Bienvenido al mundo soberano
        </p>

        <h1 className="zaf101-rise zaf101-rise-delay-2 zaf101-gold-text mt-4 text-6xl font-black uppercase tracking-[0.18em] sm:text-8xl sm:tracking-[0.28em]">
          ZAFIRO
        </h1>

        <p className="zaf101-rise zaf101-rise-delay-2 mt-3 text-sm font-medium tracking-[0.5em] text-neutral-300 sm:text-base">
          ELIANA
        </p>
        <p className="zaf101-rise zaf101-rise-delay-3 mt-1 text-[11px] text-neutral-500 sm:text-xs">
          Guía Inteligente del Ecosistema MSM
        </p>

        <hr className="zaf101-rise zaf101-rise-delay-3 zaf101-line mt-7 w-40 sm:w-56" />

        <button
          type="button"
          onClick={onEnter}
          aria-label="Entrar a ELIANA"
          className="zaf101-rise zaf101-rise-delay-4 zaf101-btn mt-10 inline-flex cursor-pointer items-center justify-center rounded-full border border-[#FFF3C4]/60 bg-gradient-to-b from-[#F1C75B] via-[#DAA520] to-[#B8860B] px-12 py-4 text-sm font-black uppercase tracking-[0.32em] text-[#0B0A02] sm:px-16 sm:py-5 sm:text-base"
        >
          Entrar
        </button>

        <p className="zaf101-rise zaf101-rise-delay-4 mt-6 text-[10px] tracking-widest text-neutral-500 sm:text-[11px]">
          Chat en vivo · Voz disponible · Tu conversación es privada
        </p>
      </main>

      {/* Pie sobrio */}
      <footer className="relative z-10 flex items-center justify-center px-6 pb-5 text-[10px] tracking-wider text-neutral-600">
        <span>MSM MY STORE LLC · El conocimiento te pertenece</span>
      </footer>
    </div>
  )
}