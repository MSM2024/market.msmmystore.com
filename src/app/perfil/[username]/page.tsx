'use client'

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft, ExternalLink, Gem, MessageSquare, User as UserIcon, Award, Flame,
  Calendar, MapPin, Users, Star, Shield, Mail, Globe, CheckCircle, Share2,
  Link2, Video, BookOpen, Code2, ShoppingCart, Music, FileText, Heart, Send,
  Plus, Settings, TrendingUp, Eye, Activity, Clock, Target, Zap, Bot, Cpu,
  Sparkles, Layers, Trophy, Gift, CreditCard, DollarSign, Bell, MessageCircle,
  MoreHorizontal, ChevronRight, X, Edit3, Camera, Briefcase, Music2, Podcast, Store,
} from "lucide-react"
import ElianaDiamond from "@/components/ElianaDiamond"
import { usePageTitle } from "@/lib/usePageTitle"

function renderSafeMessage(msg: string) {
  if (msg.startsWith("ELIANA:")) {
    return (<><strong className="text-[#00D9FF]">ELIANA:</strong>{msg.slice("ELIANA:".length)}</>)
  }
  if (msg.startsWith("Tú:")) {
    return (<><strong className="text-slate-400">Tú:</strong>{msg.slice("Tú:".length)}</>)
  }
  return msg
}
import { getCreatorProfile, PLATFORM_META, CONTENT_LABELS, getPlatforms, type ConnectedPlatform } from "@/lib/universo"
import { DEFAULT_ECOSYSTEM, type EcosystemProject } from "@/lib/ecosistema"
import { getDefaultPublicaciones, getPublicaciones, type Publicacion } from "@/lib/comentarios"

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  youtube: Video, instagram: Camera, twitter: MessageCircle, linkedin: Briefcase,
  github: Code2, facebook: Globe, podcast: Podcast, music: Music2, store: Store,
  tiktok: Music2, telegram: Send, whatsapp: MessageSquare,
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export default function PublicCreatorProfile() {
  const params = useParams()
  const username = params.username as string
  const [profile, setProfile] = useState<ReturnType<typeof getCreatorProfile>>(() => getCreatorProfile(username))
  const [following, setFollowing] = useState(() => {
    if (typeof window === "undefined") return false
    const stored = JSON.parse(localStorage.getItem("zafiro_following") || "[]")
    return stored.includes(username)
  })
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>(() => getDefaultPublicaciones(username))
  const [showEliana, setShowEliana] = useState(false)
  const [elianaChat, setElianaChat] = useState<string[]>([])
  const [elianaInput, setElianaInput] = useState("")
  const [activeSection, setActiveSection] = useState("universo")

  const toggleFollowP = () => {
    const stored = JSON.parse(localStorage.getItem("zafiro_following") || "[]")
    const idx = stored.indexOf(username)
    if (idx === -1) { stored.push(username); setFollowing(true) }
    else { stored.splice(idx, 1); setFollowing(false) }
    localStorage.setItem("zafiro_following", JSON.stringify(stored))
  }

  const handleCopyProfile = () => {
    navigator.clipboard?.writeText(window.location.href)
    const btn = document.getElementById("copy-btn")
    if (btn) { btn.textContent = "✓ Copiado"; setTimeout(() => btn.textContent = "Compartir", 2000) }
  }

  const handleElianaSend = () => {
    if (!elianaInput.trim()) return
    setElianaChat(prev => [...prev, `Tú: ${elianaInput}`])
    const q = elianaInput.toLowerCase()
    let r = ""
    if (q.includes("perfil") || q.includes("profile")) r = `🔍 **Análisis de Perfil**: @${username} tiene ${profile?.points?.toLocaleString() || 0} PTS, ${profile?.followers?.toLocaleString() || 0} seguidores y ${profile?.platforms?.length || 0} plataformas conectadas. Su ecosistema abarca ${profile?.platforms?.filter(p => p.elianaAnalysis).flatMap(p => p.elianaAnalysis!.categories).filter((v, i, a) => a.indexOf(v) === i).length || 0} categorías de contenido.`
    else if (q.includes("recomienda") || q.includes("recomendar")) r = `💡 **Recomendaciones para @${username}**: Conectar con comunidades de IA y tecnología, explorar proyectos como MSM Mente Maestra, y seguir a creadores afines en el ecosistema MSM.`
    else if (q.includes("estadística") || q.includes("stat")) r = `📊 **Estadísticas de @${username}**: PTS: ${profile?.points?.toLocaleString() || 0} | Seguidores: ${profile?.followers?.toLocaleString() || 0} | Rachas: ${profile?.streak || 0} días | Logros: ${profile?.achievements || 0}/12 | Comunidades: ${profile?.communities || 0}`
    else r = `🤖 **ELIANA**: Soy el asistente inteligente de ZAFIRO. Puedo analizar perfiles, recomendar conexiones, responder preguntas y ayudar a administrar tu presencia digital. ¿Qué deseas saber sobre @${username}?`
    setTimeout(() => setElianaChat(prev => [...prev, `ELIANA: ${r}`]), 500)
    setElianaInput("")
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <p className="text-sm text-slate-400">Perfil no encontrado</p>
          <p className="text-xs text-slate-500 mt-1">El usuario @{username} no existe en ZAFIRO</p>
          <Link href="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-slate-800/40 text-xs font-bold text-slate-300 hover:bg-slate-700/40 transition-all">Volver a ZAFIRO</Link>
        </div>
      </div>
    )
  }

  const platformTypes = [...new Set(profile.platforms.map(p => p.type))]
  const ecosystem = DEFAULT_ECOSYSTEM

  const allStats = [
    { icon: Flame, label: "Racha", value: `${profile.streak} días`, color: "text-amber-400" },
    { icon: Gem, label: "PTS", value: formatNumber(profile.points), color: "text-[#00D9FF]" },
    { icon: Award, label: "Nivel", value: "Diamante", color: "text-purple-400" },
    { icon: Users, label: "Seguidores", value: formatNumber(profile.followers), color: "text-emerald-400" },
    { icon: Heart, label: "Siguiendo", value: "28", color: "text-rose-400" },
    { icon: MessageSquare, label: "Preguntas", value: "47", color: "text-blue-400" },
    { icon: MessageCircle, label: "Respuestas", value: "156", color: "text-amber-400" },
    { icon: Globe, label: "Comunidades", value: `${profile.communities}`, color: "text-indigo-400" },
    { icon: Trophy, label: "Logros", value: `${profile.achievements}/12`, color: "text-yellow-400" },
    { icon: Star, label: "Sponsors", value: "3", color: "text-pink-400" },
    { icon: Layers, label: "Proyectos", value: `${ecosystem.length}`, color: "text-cyan-400" },
    { icon: Eye, label: "Visitas", value: "8.2K", color: "text-slate-400" },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* ELIANA Floating Assistant */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">
        {showEliana && (
          <div className="w-72 sm:w-80 rounded-2xl border border-[#00D9FF]/20 glass-strong shadow-2xl shadow-[#00D9FF]/10 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-700/50 bg-gradient-to-r from-[#00D9FF]/10 to-blue-600/10">
              <div className="flex items-center gap-2">
                <ElianaDiamond size={20} />
                <span className="text-[10px] font-bold text-white">ELIANA</span>
              </div>
              <button onClick={() => setShowEliana(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="h-48 overflow-y-auto p-3 space-y-2 bg-[#050816]/60">
              <p className="text-[9px] text-slate-400 leading-relaxed bg-slate-800/30 rounded-lg p-2">
                🤖 Hola, soy ELIANA. Puedo analizar el perfil de @{username}, recomendar personas y comunidades, responder preguntas y ayudarte a administrar tu presencia digital.
              </p>
              {elianaChat.map((msg, i) => (
                <p key={i} className={`text-[9px] leading-relaxed rounded-lg p-2 ${msg.startsWith("Tú:") ? "bg-[#00D9FF]/5 text-slate-300" : "bg-slate-800/40 text-slate-400"}`}>
                  {renderSafeMessage(msg)}
                </p>
              ))}
            </div>
            <div className="flex gap-1.5 p-2 border-t border-slate-700/50">
              <input type="text" value={elianaInput} onChange={e => setElianaInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleElianaSend()}
                placeholder="Pregunta a ELIANA..." className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 text-[9px] text-white placeholder-slate-600 outline-none focus:border-[#00D9FF]/30 transition-colors" />
              <button onClick={handleElianaSend} className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[9px] font-bold hover:opacity-90 transition-all cursor-pointer"><Send className="w-3 h-3" /></button>
            </div>
          </div>
        )}
        <button onClick={() => setShowEliana(!showEliana)}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00D9FF] to-blue-600 flex items-center justify-center shadow-lg shadow-[#00D9FF]/20 hover:shadow-[#00D9FF]/40 transition-all cursor-pointer animate-float">
          <Bot className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a ZAFIRO
        </Link>

        {/* HEADER — Identity Card */}
        <div className="relative rounded-3xl border border-slate-700/50 bg-gradient-to-b from-[#0F1A2E]/80 to-[#050816] overflow-hidden backdrop-blur-sm shadow-xl mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF]/5 via-transparent to-purple-600/5 pointer-events-none" />
          <div className="h-40 sm:h-48 bg-gradient-to-r from-[#00D9FF]/10 via-indigo-600/15 to-purple-600/15 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMEQ5RkYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          </div>

          <div className="px-4 sm:px-6 pb-6 -mt-20 sm:-mt-24 relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-4">
              <div className="relative shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-[#00D9FF] via-blue-500 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(0,217,255,0.2)]">
                  <div className="w-full h-full rounded-2xl bg-[#050816] flex items-center justify-center overflow-hidden backdrop-blur-sm">
                    {profile.image ? (
                      <img src={profile.image} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl sm:text-4xl font-black text-white/80">
                        {profile.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#050816] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1 pt-2 sm:pt-14">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{profile.name}</h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                    <Shield className="w-3 h-3 text-[#00D9FF]" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mb-1">@{profile.username} · {profile.title}</p>
                <p className="text-[10px] sm:text-xs text-slate-300 mb-3 max-w-xl whitespace-pre-line leading-relaxed">{profile.bio}</p>
                <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Miembro desde {profile.joinedAt}</span>
                  <a href="https://msmmystore.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#00D9FF] hover:underline">
                    <Globe className="w-3 h-3" /> msmmystore.com
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[9px] font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Mensaje
                  </button>
                  <button onClick={toggleFollowP}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      following ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50"
                    }`}>
                    <UserIcon className="w-3 h-3" /> {following ? "Siguiendo" : "Seguir"}
                  </button>
                  <button id="copy-btn" onClick={handleCopyProfile}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 text-[9px] font-bold hover:bg-slate-700/50 transition-all cursor-pointer flex items-center gap-1 border border-slate-700/50">
                    <Share2 className="w-3 h-3" /> Compartir
                  </button>
                  <Link href="/settings"
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 text-[9px] font-bold hover:bg-slate-700/50 transition-all cursor-pointer flex items-center gap-1 border border-slate-700/50">
                    <Edit3 className="w-3 h-3" /> Editar Perfil
                  </Link>
                  <button onClick={() => setShowEliana(true)}
                    className="px-3 py-1.5 rounded-lg bg-[#00D9FF]/10 text-[#00D9FF] text-[9px] font-bold hover:bg-[#00D9FF]/20 transition-all cursor-pointer flex items-center gap-1 border border-[#00D9FF]/20">
                    <ElianaDiamond size={12} /> Preguntar a ELIANA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
          {allStats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="p-2.5 rounded-xl glass card-3d glass-hover text-center">
                <Icon className={`w-3.5 h-3.5 ${s.color} mx-auto mb-1`} />
                <p className="text-xs sm:text-sm font-black text-white">{s.value}</p>
                <p className="text-[7px] sm:text-[8px] text-slate-500 truncate">{s.label}</p>
              </div>
            )
          })}
        </div>

        {/* SECTION TABS (mobile) */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {[
            { id: "universo", label: "Universo", icon: Globe },
            { id: "actividad", label: "Actividad", icon: Activity },
            { id: "comunidades", label: "Comunidades", icon: Users },
            { id: "proyectos", label: "Proyectos", icon: Layers },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setActiveSection(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeSection === t.id
                    ? "bg-gradient-to-r from-[#00D9FF]/15 to-blue-600/10 text-[#00D9FF] border border-[#00D9FF]/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/30 border border-transparent"
                }`}>
                <Icon className="w-3 h-3" /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-5">

            {/* MI UNIVERSO DIGITAL */}
            {activeSection === "universo" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00D9FF]" /> Mi Universo Digital
                  </h2>
                  <Link href="/universo" className="text-[9px] font-mono text-[#00D9FF] hover:underline flex items-center gap-1">
                    Administrar <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                {profile.platforms.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-slate-800 bg-[#0B1220]/40">
                    <Globe className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-500 mb-3">Conecta tus redes y plataformas</p>
                    <Link href="/universo" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[9px] font-bold hover:opacity-90 transition-all">
                      <Plus className="w-3 h-3" /> Conectar ahora
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {profile.platforms.map(p => {
                      const meta = PLATFORM_META[p.type]
                      const PIcon = PLATFORM_ICONS[p.type] || Globe
                      return (
                        <div key={p.id} className="group relative rounded-2xl border border-slate-800 bg-[#0B1220]/40 hover:border-slate-700 transition-all overflow-hidden backdrop-blur-sm">
                          {p.image && (
                            <div className="h-20 sm:h-24 bg-slate-800/30 overflow-hidden">
                              <img src={p.image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                            </div>
                          )}
                          <div className="p-3.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center text-sm ${meta.color} shrink-0`}>
                                  <PIcon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-white truncate">{p.title}</p>
                                    {p.isVerified && <Shield className="w-3 h-3 text-[#00D9FF] shrink-0" />}
                                  </div>
                                  <p className="text-[8px] text-slate-500">{meta.label}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a href={p.url} target="_blank" rel="noopener noreferrer" title="Ver contenido"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-all cursor-pointer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <a href={p.url} target="_blank" rel="noopener noreferrer" title="Abrir plataforma"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-all cursor-pointer">
                                  <Link2 className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                            {p.description && <p className="text-[9px] text-slate-400 mt-1.5 line-clamp-2">{p.description}</p>}
                            <div className="flex items-center gap-2 mt-1.5">
                              {p.lastSync && <span className="text-[7px] text-slate-600">Actualizado: {new Date(p.lastSync).toLocaleDateString()}</span>}
                              {Object.keys(p.stats).length > 0 && Object.entries(p.stats).slice(0, 2).map(([k, v]) => (
                                <span key={k} className="text-[7px] text-slate-500">{k}: <strong className="text-slate-300">{v.toLocaleString()}</strong></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ACTIVIDAD — Timeline */}
            {activeSection === "actividad" && (
              <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00D9FF]" /> Actividad Reciente
                </h2>
                <div className="space-y-2">
                  {publicaciones.slice(0, 5).map(pub => {
                    const meta = PLATFORM_META[pub.platformType as keyof typeof PLATFORM_META]
                    return (
                      <div key={pub.id} className="flex gap-3 px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0B1220]/40 hover:border-slate-700 transition-all">
                        {pub.image && (
                          <div className="w-14 h-14 rounded-xl bg-slate-700/50 shrink-0 overflow-hidden hidden sm:block">
                            <img src={pub.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {meta && <span className={`text-[8px] ${meta.color}`}>{meta.icon} {meta.label}</span>}
                            <span className="text-[6px] text-slate-600">{new Date(pub.publishedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] font-bold text-white truncate">{pub.title}</p>
                          <p className="text-[8px] text-slate-400 line-clamp-1">{pub.description}</p>
                          <div className="flex gap-2 mt-1">
                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-[7px] font-mono text-slate-500 hover:text-white transition-colors">
                              <ExternalLink className="w-2 h-2" /> Abrir
                            </a>
                            <Link href={`/?ask=${encodeURIComponent(pub.title)}`} className="flex items-center gap-0.5 text-[7px] font-mono text-slate-500 hover:text-[#00D9FF] transition-colors">
                              <ElianaDiamond size={8} /> ELIANA
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {[
                    { type: "question", text: "¿Cómo funciona la criptografía de red cristalina?", date: "hace 3 días", icon: MessageSquare, color: "text-blue-400" },
                    { type: "answer", text: "Respuesta sobre sistemas holográficos en IA", date: "hace 5 días", icon: MessageCircle, color: "text-amber-400" },
                    { type: "project", text: "Nuevo proyecto: MSM Music en desarrollo", date: "hace 1 semana", icon: Layers, color: "text-cyan-400" },
                    { type: "reward", text: "Logro desbloqueado: 'Maestro del Conocimiento'", date: "hace 1 semana", icon: Trophy, color: "text-yellow-400" },
                    { type: "achievement", text: "Ganó +500 PTS por campaña sponsor", date: "hace 2 semanas", icon: Gem, color: "text-[#00D9FF]" },
                  ].map((a, i) => {
                    const AIcon = a.icon
                    return (
                      <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-slate-800 bg-[#0B1220]/40 hover:border-slate-700 transition-all">
                        <AIcon className={`w-3.5 h-3.5 ${a.color} mt-0.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-slate-300">{a.text}</p>
                          <p className="text-[7px] text-slate-600 mt-0.5">{a.date}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* COMUNIDADES */}
            {activeSection === "comunidades" && (
              <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00D9FF]" /> Comunidades
                </h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { name: "MSM Mente Maestra", role: "Creador", members: 342, color: "from-purple-600/20 to-purple-800/20" },
                    { name: "Ecosistema Digital", role: "Administrador", members: 189, color: "from-[#00D9FF]/10 to-blue-600/10" },
                    { name: "Círculo de Creadores", role: "Miembro", members: 521, color: "from-emerald-600/20 to-teal-800/20" },
                    { name: "Cuba Tech Hub", role: "Miembro", members: 76, color: "from-amber-600/20 to-orange-800/20" },
                  ].map((c, i) => (
                    <div key={i} className={`p-3.5 rounded-2xl border border-slate-800 bg-gradient-to-br ${c.color} hover:border-slate-700 transition-all`}>
                      <p className="text-xs font-bold text-white mb-0.5">{c.name}</p>
                      <p className="text-[8px] text-slate-400">{c.role} · {c.members} miembros</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-xl bg-slate-800/20 border border-slate-700/30 text-center">
                  <p className="text-[9px] text-slate-500">Creadas: <strong className="text-white">1</strong> · Administradas: <strong className="text-white">1</strong> · Participa en: <strong className="text-white">4</strong></p>
                </div>
              </div>
            )}

            {/* PROYECTOS */}
            {activeSection === "proyectos" && (
              <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00D9FF]" /> Proyectos del Ecosistema
                </h2>
                <div className="grid gap-2">
                  {ecosystem.map(p => {
                    const statusColors: Record<string, string> = {
                      activo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      beta: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                    }
                    return (
                      <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border border-slate-800 bg-[#0B1220]/40 hover:border-slate-700 transition-all group">
                        <div className={`w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center text-sm ${p.color} shrink-0`}>
                          {p.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white group-hover:text-[#00D9FF] transition-colors">{p.name}</p>
                            <span className={`text-[6px] font-mono px-1 py-0.5 rounded-full border ${statusColors[p.status] || "bg-slate-500/10 text-slate-500 border-slate-500/20"}`}>{p.status}</span>
                          </div>
                          <p className="text-[8px] text-slate-400 truncate">{p.description}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL — Widgets */}
          <div className="space-y-4">
            {/* MSM Rewards */}
            <div className="p-4 rounded-2xl glass">
              <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Award className="w-3 h-3 text-amber-400" /> MSM Rewards
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400">PTS</span>
                <span className="text-sm font-black text-[#00D9FF]">{formatNumber(profile.points)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400">Nivel</span>
                <span className="text-xs font-bold text-purple-400">Diamante</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-400">Membresía</span>
                <Link href="/memberships" className="text-xs font-bold text-amber-400 hover:underline">Pro</Link>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#00D9FF] to-purple-600" />
              </div>
              <p className="text-[7px] text-slate-600 mt-1">2,450 PTS para próximo nivel</p>
            </div>

            {/* Sponsors */}
            <div className="p-4 rounded-2xl glass">
              <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star className="w-3 h-3 text-pink-400" /> Sponsors
              </h3>
              <div className="space-y-2">
                {[
                  { name: "Farmasi", type: "Partner oficial", color: "text-pink-400" },
                  { name: "ZAFIRO", type: "Plataforma", color: "text-[#00D9FF]" },
                  { name: "MSM Marketplace", type: "Próximamente", color: "text-amber-400" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.color.replace("text-", "bg-")} bg-opacity-50 shrink-0`} />
                    <div>
                      <p className="text-[9px] font-bold text-white">{s.name}</p>
                      <p className="text-[7px] text-slate-500">{s.type}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/sponsors-page" className="block text-center text-[7px] font-mono text-[#00D9FF] hover:underline mt-2">Ver todos</Link>
            </div>

            {/* Referidos */}
            <div className="p-4 rounded-2xl glass">
              <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Gift className="w-3 h-3 text-emerald-400" /> Referidos
              </h3>
              <p className="text-[9px] text-slate-400">Has invitado a <strong className="text-white">24</strong> personas</p>
              <p className="text-[8px] text-slate-500">+2,400 PTS ganados por referidos</p>
              <Link href="/referidos" className="text-[7px] font-mono text-[#00D9FF] hover:underline mt-1 inline-block">Mis referidos →</Link>
            </div>

            {/* Resumen Financiero */}
            <div className="p-4 rounded-2xl glass">
              <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-emerald-400" /> Resumen Financiero
              </h3>
              <div className="space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="text-slate-400">Ganancias (este mes)</span><span className="text-emerald-400 font-bold">+$847.50</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Membresías activas</span><span className="text-white font-bold">3</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Sponsors activos</span><span className="text-white font-bold">2</span></div>
              </div>
            </div>

            {/* Objetivos */}
            <div className="p-4 rounded-2xl glass">
              <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3 h-3 text-amber-400" /> Objetivos
              </h3>
              <div className="space-y-1.5">
                {[
                  { label: "Alcanzar 5,000 seguidores", progress: "25%", w: "w-1/4" },
                  { label: "Ganar 50,000 PTS", progress: "36%", w: "w-1/3" },
                  { label: "Crear 3 Círculos nuevos", progress: "33%", w: "w-1/3" },
                ].map((o, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                      <span>{o.label}</span><span>{o.progress}</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${o.w} rounded-full bg-gradient-to-r from-[#00D9FF] to-purple-600`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendario / Próximos eventos */}
            <div className="p-4 rounded-2xl glass">
              <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#00D9FF]" /> Próximos Eventos
              </h3>
              <div className="space-y-1.5">
                {[
                  { event: "Webinar: Criptografía Cuántica", date: "15 Jul" },
                  { event: "Lanzamiento MSM Music", date: "22 Jul" },
                  { event: "Meetup Círculo Creadores", date: "28 Jul" },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                    <span className="text-slate-300">{e.event}</span>
                    <span className="text-[7px] text-slate-500 ml-auto">{e.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actividad de ELIANA */}
            <div className="p-4 rounded-2xl border border-[#00D9FF]/10 bg-[#00D9FF]/5 backdrop-blur-sm">
              <h3 className="text-[9px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> Actividad de ELIANA
              </h3>
              <div className="space-y-1 text-[8px] text-slate-400">
                <p className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-emerald-400" /> Análisis de perfil completado</p>
                <p className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-amber-400" /> 12 conexiones encontradas</p>
                <p className="flex items-center gap-1"><Users className="w-2.5 h-2.5 text-blue-400" /> 4 comunidades recomendadas</p>
                <p className="flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-purple-400" /> +8% engagement este mes</p>
              </div>
              <button onClick={() => setShowEliana(true)} className="w-full mt-2 py-1.5 rounded-lg bg-[#00D9FF]/10 text-[9px] font-bold text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-all cursor-pointer border border-[#00D9FF]/20">
                Abrir ELIANA
              </button>
            </div>
          </div>
        </div>

        {/* REDES FOOTER */}
        <div className="mt-6 p-4 rounded-2xl border border-slate-800 bg-[#0B1220]/40">
          <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Redes</h3>
          <div className="flex flex-wrap gap-1.5">
            {platformTypes.slice(0, 12).map(t => {
              const meta = PLATFORM_META[t]
              return (
                <span key={t} className={`px-2 py-1 rounded-lg text-[8px] font-mono border ${meta.color} bg-slate-800/40 border-slate-700/50 flex items-center gap-1`}>
                  {meta.icon} {meta.label}
                </span>
              )
            })}
            {platformTypes.length > 12 && (
              <span className="px-2 py-1 rounded-lg text-[8px] font-mono bg-slate-800/40 text-slate-500 border border-slate-700/50">+{platformTypes.length - 12}</span>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-4 text-center text-[7px] text-slate-600">
          <p>Perfil de ZAFIRO · <Link href="/" className="text-[#00D9FF] hover:underline">Red Social del Conocimiento</Link></p>
        </div>
      </div>
    </div>
  )
}
