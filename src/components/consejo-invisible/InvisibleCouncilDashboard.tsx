'use client'

import { useEffect, useState } from 'react'
import GlassCard from '@/components/ui/GlassCard'
import { COUNCIL_THEMES, GOD_FIRST_VERSES, AI_DISCLAIMER, SESSION_PURPOSES } from '@/lib/consejo-invisible/types'
import type { CouncilGuide, CouncilSession, CouncilGoal, CouncilPrayer, CouncilJournalEntry, SessionType } from '@/lib/consejo-invisible/types'
import { getGuides, getSessions, getGoals, getApprovedPrayer, getJournalEntries } from '@/lib/consejo-invisible/queries'

export default function InvisibleCouncilDashboard() {
  const [guides, setGuides] = useState<CouncilGuide[]>([])
  const [sessions, setSessions] = useState<CouncilSession[]>([])
  const [goals, setGoals] = useState<CouncilGoal[]>([])
  const [prayer, setPrayer] = useState<CouncilPrayer | null>(null)
  const [journal, setJournal] = useState<CouncilJournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 'guides' | 'sessions' | 'guide-detail'>('dashboard')
  const [selectedGuide, setSelectedGuide] = useState<CouncilGuide | null>(null)

  useEffect(() => {
    async function load() {
      const [g, s, gl, p, j] = await Promise.all([
        getGuides(),
        getSessions(),
        getGoals(),
        getApprovedPrayer(),
        getJournalEntries()
      ])
      setGuides(g)
      setSessions(s)
      setGoals(gl)
      setPrayer(p)
      setJournal(j.slice(0, 3))
      setLoading(false)
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'
  const confirmedGuides = guides.filter(g => g.is_confirmed)
  const activeGoals = goals.filter(g => g.status === 'active')
  const activeSessions = sessions.filter(s => s.status === 'in_progress' || s.status === 'draft')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#D4AF37] text-sm">Cargando Consejo Invisible...</p>
        </div>
      </div>
    )
  }

  // --- GUIDES VIEW ---
  if (activeView === 'guides') {
    return (
      <div className="min-h-screen zafiro-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setActiveView('dashboard')} className="text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm mb-6 flex items-center gap-2">
            ← Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Los 22 Guías</h1>
          <p className="text-[#657786] mb-8">Espacios reservados para cada guía espiritual del Consejo Invisible</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {guides.map((guide) => (
              <GlassCard
                key={guide.id}
                hover
                onClick={() => { setSelectedGuide(guide); setActiveView('guide-detail') }}
                className="p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl font-bold text-[#D4AF37]">
                    {String(guide.guide_number).padStart(2, '0')}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    guide.is_confirmed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {guide.is_confirmed ? 'Confirmado' : 'Pendiente'}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-1">{guide.display_name}</h3>
                <p className="text-[#657786] text-xs capitalize">{guide.category}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // --- GUIDE DETAIL VIEW ---
  if (activeView === 'guide-detail' && selectedGuide) {
    return (
      <div className="min-h-screen zafiro-page p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setActiveView('guides')} className="text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm mb-6 flex items-center gap-2">
            ← Volver a los 22 Guías
          </button>

          <GlassCard className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-4xl font-bold text-[#D4AF37]">
                  {String(selectedGuide.guide_number).padStart(2, '0')}
                </span>
                <h1 className="text-2xl font-bold text-white mt-2">{selectedGuide.display_name}</h1>
                <p className="text-[#657786] text-sm mt-1 capitalize">Categoría: {selectedGuide.category}</p>
              </div>
              <span className={`text-sm px-3 py-1 rounded-full ${
                selectedGuide.is_confirmed
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {selectedGuide.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-[#D4AF37] font-medium mb-2">Descripción</h3>
                <p className="text-[#E6E7E8] text-sm">{selectedGuide.short_description || 'Pendiente de agregar descripción.'}</p>
              </div>

              <div>
                <h3 className="text-[#D4AF37] font-medium mb-2">Biografía</h3>
                <p className="text-[#E6E7E8] text-sm">{selectedGuide.biography_summary || 'Pendiente de agregar biografía.'}</p>
              </div>

              <div>
                <h3 className="text-[#D4AF37] font-medium mb-2">Relación con Miguel</h3>
                <p className="text-[#E6E7E8] text-sm">{selectedGuide.relationship_to_miguel || 'Pendiente de definir.'}</p>
              </div>

              <div>
                <h3 className="text-[#D4AF37] font-medium mb-2">Temas Principales</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGuide.themes.length > 0 ? (
                    selectedGuide.themes.map((t) => (
                      <span key={t} className="text-xs px-2 py-1 rounded-full bg-[#197BD2]/20 text-[#197BD2]">{t}</span>
                    ))
                  ) : (
                    <span className="text-[#657786] text-sm">Sin temas asignados</span>
                  )}
                </div>
              </div>

              {!selectedGuide.is_confirmed && (
                <div className="mt-6 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <p className="text-[#D4AF37] text-sm font-medium mb-1">Este guía está pendiente de confirmar</p>
                  <p className="text-[#657786] text-xs">Miguel debe confirmar el nombre, categoría y detalles antes de que este guía sea activado.</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  // --- SESSIONS VIEW ---
  if (activeView === 'sessions') {
    return (
      <div className="min-h-screen zafiro-page p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => setActiveView('dashboard')} className="text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm mb-6 flex items-center gap-2">
            ← Volver al Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Sesiones del Consejo</h1>
          <p className="text-[#657786] mb-8">Prácticas guiadas de reflexión basadas en contenidos registrados</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {(Object.keys(SESSION_PURPOSES) as SessionType[]).map((type) => (
              <GlassCard key={type} hover className="p-4 cursor-pointer">
                <h3 className="text-white font-medium capitalize mb-1">{type.replace('_', ' ')}</h3>
                <p className="text-[#657786] text-xs">{SESSION_PURPOSES[type]}</p>
              </GlassCard>
            ))}
          </div>

          {activeSessions.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Sesiones Activas</h2>
              <div className="space-y-3">
                {activeSessions.map((s) => (
                  <GlassCard key={s.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{s.session_title}</h3>
                        <p className="text-[#657786] text-xs capitalize">{s.session_type.replace('_', ' ')} · {s.status}</p>
                      </div>
                      <span className="text-[#D4AF37] text-xs">
                        {new Date(s.created_at).toLocaleDateString('es')}
                      </span>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen zafiro-page p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[#657786] text-sm">CONSEJO INVISIBLE MSM</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">
            {greeting}, <span className="text-[#D4AF37]">Miguel</span>
          </h1>
          <p className="text-[#657786] mt-2 text-sm">
            MSM MY STORE LLC — Módulo Privado
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 p-4 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
          <p className="text-[#657786] text-xs leading-relaxed">{AI_DISCLAIMER}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-[#D4AF37]">{confirmedGuides.length}/22</p>
            <p className="text-[#657786] text-xs mt-1">Guías Confirmados</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-[#197BD2]">{sessions.length}</p>
            <p className="text-[#657786] text-xs mt-1">Sesiones</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-[#7c3aed]">{activeGoals.length}</p>
            <p className="text-[#657786] text-xs mt-1">Metas Activas</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{journal.length}</p>
            <p className="text-[#657786] text-xs mt-1">Entradas Recientes</p>
          </GlassCard>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Start Session Button */}
            <GlassCard hover glow="cyan" className="p-6 cursor-pointer" onClick={() => setActiveView('sessions')}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center text-2xl">
                  ✦
                </div>
                <div className="flex-1">
                  <h2 className="text-white font-bold text-lg">Iniciar Sesión del Consejo</h2>
                  <p className="text-[#657786] text-sm mt-1">Reflexión, oración, escritura, metas y más</p>
                </div>
                <span className="text-[#D4AF37] text-2xl">→</span>
              </div>
            </GlassCard>

            {/* Guides Quick Access */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold">Los 22 Guías</h2>
                <button onClick={() => setActiveView('guides')} className="text-[#197BD2] text-sm hover:underline">
                  Ver todos →
                </button>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {guides.slice(0, 12).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGuide(g); setActiveView('guide-detail') }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                      g.is_confirmed
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30'
                        : 'bg-[#14171A] text-[#657786] hover:bg-[#1a1f2e]'
                    }`}
                  >
                    {String(g.guide_number).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <GlassCard className="p-6">
                <h2 className="text-white font-bold mb-4">Metas Activas</h2>
                <div className="space-y-3">
                  {activeGoals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{goal.title}</p>
                        <p className="text-[#657786] text-xs capitalize">{goal.category}</p>
                      </div>
                      <div className="w-20">
                        <div className="h-2 rounded-full bg-[#14171A] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#D4AF37] transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <p className="text-[#657786] text-xs text-right mt-1">{goal.progress}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Prayer of the Day */}
            {prayer && (
              <GlassCard className="p-6 border-[#D4AF37]/20">
                <p className="text-[#D4AF37] text-xs font-medium mb-3 uppercase tracking-wider">Oración del Día</p>
                <p className="text-[#E6E7E8] text-sm leading-relaxed italic whitespace-pre-line">
                  {prayer.content}
                </p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {(prayer.biblical_references as string[] || []).map((ref) => (
                    <span key={ref} className="text-xs px-2 py-0.5 rounded bg-[#197BD2]/20 text-[#197BD2]">{ref}</span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* God First Mode */}
            <GlassCard className="p-6">
              <p className="text-[#D4AF37] text-xs font-medium mb-3 uppercase tracking-wider">Modo Dios Delante</p>
              <p className="text-[#E6E7E8] text-xs leading-relaxed mb-3">
                Abre una sesión con oración, versículos y discernimiento.
              </p>
              <div className="flex flex-wrap gap-1 mb-4">
                {GOD_FIRST_VERSES.map((v) => (
                  <span key={v} className="text-xs px-2 py-0.5 rounded bg-[#7c3aed]/20 text-[#7c3aed]">{v}</span>
                ))}
              </div>
              <button className="w-full py-2 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium hover:bg-[#D4AF37]/30 transition-all">
                Iniciar con Dios Delante
              </button>
            </GlassCard>

            {/* Themes */}
            <GlassCard className="p-6">
              <p className="text-[#197BD2] text-xs font-medium mb-3 uppercase tracking-wider">Temas</p>
              <div className="flex flex-wrap gap-2">
                {COUNCIL_THEMES.slice(0, 12).map((t) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-[#0C3F6A]/40 text-[#197BD2] capitalize">
                    {t}
                  </span>
                ))}
              </div>
            </GlassCard>

            {/* Recent Journal */}
            {journal.length > 0 && (
              <GlassCard className="p-6">
                <p className="text-emerald-400 text-xs font-medium mb-3 uppercase tracking-wider">Última Entrada del Diario</p>
                <div className="space-y-2">
                  {journal.slice(0, 2).map((entry) => (
                    <div key={entry.id} className="p-3 rounded-lg bg-[#14171A]">
                      <p className="text-white text-sm font-medium">{entry.title || entry.entry_type}</p>
                      <p className="text-[#657786] text-xs mt-1">
                        {new Date(entry.date).toLocaleDateString('es')} · {entry.entry_type}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[#657786] text-xs">
            CONSEJO INVISIBLE MSM — MSM MY STORE LLC — Privado
          </p>
          <p className="text-[#657786] text-xs mt-1">
            Dios guía la fe · Miguel discierne · El Consejo reúne enseñanzas · La IA organiza
          </p>
        </div>
      </div>
    </div>
  )
}
