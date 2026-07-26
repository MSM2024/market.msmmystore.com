'use client'

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Settings, MessageSquare, User, Award, Flame, Gem, Calendar, MapPin, Globe, Users, Star, BookOpen, Share2, Mail, ExternalLink, Plus, Shield, Heart, MessageCircle, Trophy, Layers, Eye, TrendingUp, Sparkles, Zap, Cpu, Target, Clock, Gift, DollarSign, Bot, Edit3, Camera, ChevronRight, Activity, CheckCircle, X, Send
} from "lucide-react"
import { usePageTitle } from "@/lib/usePageTitle"
import { getSession } from "@/lib/auth"
import { getProfile, getProfileByUsername, updateProfile, seedMiguelProfile, type UserProject, type SocialLink, type UserProfile } from "@/lib/profile"
import { type ConnectedPlatform, getPlatforms, PLATFORM_META } from "@/lib/universo"
import { getPTSAccount, getStreak } from "@/lib/rewards"
import { DEFAULT_ECOSYSTEM } from "@/lib/ecosistema"
import ElianaDiamond from "@/components/ElianaDiamond"

function renderSafeMessage(msg: string) {
  if (msg.startsWith("ELIANA:")) {
    return (<><strong className="text-[#00D9FF]">ELIANA:</strong>{msg.slice("ELIANA:".length)}</>)
  }
  if (msg.startsWith("Tú:")) {
    return (<><strong className="text-slate-400">Tú:</strong>{msg.slice("Tú:".length)}</>)
  }
  return msg
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K"
  return n.toString()
}

export default function ProfileFullPage() {
  usePageTitle("Mi Perfil")
  const router = useRouter()
  const [profileInit] = useState(() => {
    if (typeof window === "undefined") return { profile: null, platforms: [], ptsAccount: { balance: 0, level: 1, levelProgress: 0 }, currentStreak: 0, following: false }
    const session = getSession()
    if (session) {
      let p = getProfile(session.id)
      if (!p) {
        p = getProfileByUsername(session.name.toLowerCase().replace(/\s+/g, ""))
      }
      if (!p) {
        const seeded = seedMiguelProfile()
        if (seeded.userId === session.id || session.email === "msmmystore@gmail.com") {
          p = seeded
        } else {
          p = getProfile(session.id) || null
        }
      }
      if (p) {
        const pts = getPTSAccount(p.userId)
        const stored = JSON.parse(localStorage.getItem("zafiro_following") || "[]")
        return {
          profile: p,
          platforms: getPlatforms(p.userId),
          ptsAccount: { balance: pts.balance, level: pts.level, levelProgress: pts.levelProgress } as { balance: number; level: number; levelProgress: number },
          currentStreak: getStreak(p.userId),
          following: stored.includes(p.username),
        }
      }
    }
    const seeded = seedMiguelProfile()
    const pts = getPTSAccount(seeded.userId)
    return {
      profile: seeded,
      platforms: getPlatforms(seeded.userId),
      ptsAccount: { balance: pts.balance, level: pts.level, levelProgress: pts.levelProgress } as { balance: number; level: number; levelProgress: number },
      currentStreak: getStreak(seeded.userId),
      following: false,
    }
  })
  const [profile, setProfile] = useState<UserProfile | null>(profileInit.profile)
  const [platforms, setPlatforms] = useState<ConnectedPlatform[]>(profileInit.platforms)
  const [activeSection, setActiveSection] = useState("resumen")
  const [following, setFollowing] = useState(profileInit.following)
  const [showEliana, setShowEliana] = useState(false)
  const [elianaChat, setElianaChat] = useState<string[]>([])
  const [elianaInput, setElianaInput] = useState("")
  const [ptsAccount, setPtsAccount] = useState<{ balance: number; level: number; levelProgress: number } | null>(profileInit.ptsAccount)
  const [currentStreak, setCurrentStreak] = useState(profileInit.currentStreak)
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleFollow = () => {
    if (!profile) return
    const stored = JSON.parse(localStorage.getItem("zafiro_following") || "[]")
    const idx = stored.indexOf(profile.username)
    if (idx === -1) { stored.push(profile.username); setFollowing(true) }
    else { stored.splice(idx, 1); setFollowing(false) }
    localStorage.setItem("zafiro_following", JSON.stringify(stored))
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const updated = updateProfile(profile.userId, { avatar: dataUrl })
      if (updated) setProfile(updated)
      setShowAvatarUpload(false)
    }
    reader.readAsDataURL(file)
  }

  const handleCopyProfile = () => {
    navigator.clipboard?.writeText(window.location.href)
    const btn = document.getElementById("copy-btn")
    if (btn) { btn.textContent = "✓ Copiado"; setTimeout(() => btn.textContent = "Compartir", 2000) }
  }

  const handleElianaSend = () => {
    if (!elianaInput.trim() || !profile) return
    setElianaChat(prev => [...prev, `Tú: ${elianaInput}`])
    const q = elianaInput.toLowerCase()
    let r = ""
    if (q.includes("perfil")) r = `🔍 **Análisis de Perfil**: ${profile.publicName} tiene ${formatNumber(profile.points)} PTS, ${formatNumber(profile.followers)} seguidores y ${profile.socialLinks.length} enlaces conectados.`
    else if (q.includes("pts") || q.includes("puntos")) r = `💎 **PTS**: ${formatNumber(profile.points)} puntos · Nivel ${ptsAccount?.level || profile.level} · Racha de ${currentStreak || profile.streak} días`
    else if (q.includes("proyecto")) r = `🚀 **Proyectos**: ${profile.customProjects.length} proyectos activos: ${profile.customProjects.map(p => p.name).join(", ")}`
    else r = `🤖 **ELIANA**: Soy tu asistente inteligente. Puedo analizar tu perfil, recomendarte conexiones y ayudarte a crecer en ZAFIRO. ¿Qué deseas saber?`
    setTimeout(() => setElianaChat(prev => [...prev, `ELIANA: ${r}`]), 500)
    setElianaInput("")
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050816] text-white flex items-center justify-center">
        <div className="text-center">
          <Gem className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-slate-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  const allStats = [
    { icon: Flame, label: "Racha", value: `${currentStreak || profile.streak} días`, color: "text-amber-400" },
    { icon: Gem, label: "PTS", value: formatNumber(ptsAccount?.balance || profile.points), color: "text-[#00D9FF]" },
    { icon: Award, label: "Nivel", value: profile.level, color: "text-purple-400" },
    { icon: Users, label: "Seguidores", value: formatNumber(profile.followers), color: "text-emerald-400" },
    { icon: Heart, label: "Siguiendo", value: `${profile.following}`, color: "text-rose-400" },
    { icon: MessageSquare, label: "Preguntas", value: `${profile.questions}`, color: "text-blue-400" },
    { icon: MessageCircle, label: "Respuestas", value: `${profile.answers}`, color: "text-amber-400" },
    { icon: Globe, label: "Comunidades", value: `${profile.communities}`, color: "text-indigo-400" },
    { icon: Trophy, label: "Logros", value: `${profile.achievements}/12`, color: "text-yellow-400" },
    { icon: Star, label: "Sponsors", value: `${profile.sponsors}`, color: "text-pink-400" },
    { icon: Layers, label: "Proyectos", value: `${profile.customProjects.length}`, color: "text-cyan-400" },
    { icon: Eye, label: "Visitas", value: formatNumber(profile.visits), color: "text-slate-400" },
  ]

  const sections = [
    { id: "resumen", label: "Resumen", icon: Gem },
    { id: "actividad", label: "Actividad", icon: Activity },
    { id: "proyectos", label: "Proyectos", icon: Layers },
    { id: "conexiones", label: "Conexiones", icon: Globe },
    { id: "rewards", label: "Rewards", icon: Award },
  ]

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* ELIANA widget */}
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
                🤖 Hola, soy ELIANA. Puedo analizar tu perfil, recomendarte conexiones y ayudarte a crecer en ZAFIRO.
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

        {/* HEADER */}
        <div className="relative rounded-3xl border border-slate-700/50 bg-gradient-to-b from-[#0F1A2E]/80 to-[#050816] overflow-hidden backdrop-blur-sm shadow-xl mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D9FF]/5 via-transparent to-purple-600/5 pointer-events-none" />
          <div className="h-40 sm:h-48 bg-gradient-to-r from-[#00D9FF]/10 via-indigo-600/15 to-purple-600/15 relative">
            {profile.coverImage && (
              <img src={profile.coverImage} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMEQ5RkYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          </div>

          <div className="px-4 sm:px-6 pb-6 -mt-20 sm:-mt-24 relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-4">
              <div className="relative shrink-0 group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-[#00D9FF] via-blue-500 to-purple-600 p-0.5 shadow-[0_0_30px_rgba(0,217,255,0.2)]">
                  <div className="w-full h-full rounded-2xl bg-[#050816] flex items-center justify-center overflow-hidden backdrop-blur-sm relative">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl sm:text-4xl font-black text-white/80 select-none">
                        {profile.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => fileInputRef.current?.click()} title="Cambiar foto"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#00D9FF] border-2 border-[#050816] flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="flex-1 pt-2 sm:pt-14">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-white">{profile.publicName || profile.name}</h1>
                  <span className="px-1.5 py-0.5 rounded-md bg-[#00D9FF]/10 border border-[#00D9FF]/20">
                    <Shield className="w-3 h-3 text-[#00D9FF]" />
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mb-1">@{profile.username} · {profile.title}</p>
                <p className="text-[10px] sm:text-xs text-slate-300 mb-3 max-w-xl whitespace-pre-line leading-relaxed">{profile.bioShort}</p>
                <div className="flex flex-wrap items-center gap-2 text-[9px] sm:text-[10px] text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Miembro desde {new Date(profile.joinedAt).getFullYear()}</span>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#00D9FF] hover:underline">
                    <Globe className="w-3 h-3" /> {new URL(profile.website).hostname}
                  </a>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[9px] font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Mensaje
                  </button>
                  <button onClick={toggleFollow}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      following ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50"
                    }`}>
                    <User className="w-3 h-3" /> {following ? "Siguiendo" : "Seguir"}
                  </button>
                  <button id="copy-btn" onClick={handleCopyProfile}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-300 text-[9px] font-bold hover:bg-slate-700/50 transition-all cursor-pointer flex items-center gap-1 border border-slate-700/50">
                    <Share2 className="w-3 h-3" /> Compartir
                  </button>
                  <Link href="/profile-page/edit"
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

        {/* SECTION TABS */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {sections.map((t) => {
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
          {/* MAIN */}
          <div className="lg:col-span-2 space-y-5">

            {/* RESUMEN */}
            {activeSection === "resumen" && (
              <div className="space-y-5">
                {/* Bio larga */}
                <div className="p-5 rounded-2xl glass">
                  <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#00D9FF]" /> Acerca de</h2>
                  <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">{profile.bioLong}</p>
                </div>

                {/* Roles / tags */}
                {profile.roles.length > 0 && (
                  <div className="p-5 rounded-2xl glass">
                    <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Roles</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.roles.map((r, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg text-[9px] font-mono bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/20">{r}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enlaces principales */}
                <div className="p-5 rounded-2xl glass">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Enlaces</h3>
                    <Link href="/profile-page/connections" className="text-[9px] font-mono text-[#00D9FF] hover:underline flex items-center gap-1">
                      Administrar <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    {profile.socialLinks.map(link => (
                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-800/20 hover:bg-slate-800/40 transition-all group">
                        <Globe className="w-3 h-3 text-[#00D9FF] shrink-0" />
                        <span className="text-[10px] text-white flex-1 min-w-0 truncate">{link.label}</span>
                        <span className="text-[7px] text-slate-500 hidden sm:inline">{link.platform}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                      </a>
                    ))}
                    {profile.socialLinks.length === 0 && (
                      <Link href="/profile-page/connections" className="flex items-center justify-center gap-1 py-3 text-[9px] text-slate-500 hover:text-white transition-colors">
                        <Plus className="w-3 h-3" /> Agregar enlaces
                      </Link>
                    )}
                  </div>
                </div>

                {/* Información extra */}
                <div className="p-5 rounded-2xl glass">
                  <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">Información</h3>
                  <div className="grid grid-cols-2 gap-2.5 text-[10px]">
                    <div><span className="text-slate-400">Empresa</span><p className="text-white font-bold">{profile.company}</p></div>
                    <div><span className="text-slate-400">Ubicación</span><p className="text-white font-bold">{profile.location}</p></div>
                    <div><span className="text-slate-400">Membresía</span><Link href="/memberships" className="text-amber-400 font-bold hover:underline block">Pro</Link></div>
                    <div><span className="text-slate-400">Linktree</span><a href={profile.linktree} target="_blank" rel="noopener noreferrer" className="text-[#00D9FF] font-bold hover:underline block truncate">linktr.ee/msmmystore</a></div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVIDAD */}
            {activeSection === "actividad" && (
              <div>
                <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00D9FF]" /> Actividad Reciente
                </h2>
                <div className="space-y-2">
                  {[
                    { type: "question", text: "¿Cómo se integra la IA con el comercio digital?", date: "hace 2 días", icon: MessageSquare, color: "text-blue-400" },
                    { type: "answer", text: "Respuesta sobre el ecosistema MSM y ZAFIRO", date: "hace 4 días", icon: MessageCircle, color: "text-amber-400" },
                    { type: "project", text: "Nuevo proyecto: ZAFIRO en desarrollo activo", date: "hace 5 días", icon: Layers, color: "text-cyan-400" },
                    { type: "reward", text: "Logro desbloqueado: 'Explorador del Conocimiento'", date: "hace 6 días", icon: Trophy, color: "text-yellow-400" },
                    { type: "achievement", text: "Ganó +500 PTS por campaña sponsor", date: "hace 1 semana", icon: Gem, color: "text-[#00D9FF]" },
                    { type: "connection", text: "Nueva conexión: Canal WhatsApp Capacitación MSM", date: "hace 1 semana", icon: Globe, color: "text-indigo-400" },
                    { type: "community", text: "Se unió a la comunidad MSM Mente Maestra", date: "hace 2 semanas", icon: Users, color: "text-emerald-400" },
                    { type: "referral", text: "Nuevo referido registrado +200 PTS", date: "hace 2 semanas", icon: Gift, color: "text-emerald-500" },
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

            {/* PROYECTOS */}
            {activeSection === "proyectos" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00D9FF]" /> Proyectos
                  </h2>
                  <Link href="/profile-page/projects" className="text-[9px] font-mono text-[#00D9FF] hover:underline flex items-center gap-1">
                    Administrar <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid gap-2">
                  {profile.customProjects.map(p => {
                    const statusColors: Record<string, string> = {
                      activo: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      beta: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      próximamente: "bg-purple-500/10 text-purple-400 border-purple-500/20",
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
                <Link href="/profile-page/projects" className="block text-center text-[9px] font-mono text-[#00D9FF] hover:underline mt-2">
                  + Agregar proyecto
                </Link>
              </div>
            )}

            {/* CONEXIONES */}
            {activeSection === "conexiones" && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#00D9FF]" /> Mi Universo Digital
                  </h2>
                  <Link href="/profile-page/connections" className="text-[9px] font-mono text-[#00D9FF] hover:underline flex items-center gap-1">
                    Administrar <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                {platforms.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl border border-slate-800 bg-[#0B1220]/40">
                    <Globe className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-500 mb-3">Conecta tus redes y plataformas</p>
                    <Link href="/universo" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-blue-600 text-white text-[9px] font-bold hover:opacity-90 transition-all">
                      <Plus className="w-3 h-3" /> Conectar ahora
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {platforms.map(p => {
                      const meta = PLATFORM_META[p.type]
                      return (
                        <div key={p.id} className="group relative rounded-2xl border border-slate-800 bg-[#0B1220]/40 hover:border-slate-700 transition-all backdrop-blur-sm">
                          <div className="p-3 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-sm ${meta.color} shrink-0`}>
                              {meta.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[11px] font-bold text-white truncate">{p.title}</p>
                                {p.isVerified && <Shield className="w-3 h-3 text-[#00D9FF] shrink-0" />}
                              </div>
                              <p className="text-[8px] text-slate-500">{meta.label}</p>
                            </div>
                            <a href={p.url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-all cursor-pointer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* REWARDS */}
            {activeSection === "rewards" && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl glass">
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> MSM Rewards
                  </h2>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400">PTS</span>
                    <span className="text-lg font-black text-[#00D9FF]">{formatNumber(ptsAccount?.balance || profile.points)}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400">Nivel</span>
                    <span className="text-sm font-bold text-purple-400">{ptsAccount?.level || profile.level}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#00D9FF] to-purple-600 transition-all" style={{ width: `${ptsAccount?.levelProgress || 0}%` }} />
                  </div>
                  <p className="text-[8px] text-slate-600 mt-1">{ptsAccount?.levelProgress || 0}% hacia el siguiente nivel</p>
                  <div className="mt-3 flex gap-2">
                    <Link href="/rewards" className="flex-1 text-center py-1.5 rounded-lg bg-slate-800/40 text-[9px] text-slate-300 hover:bg-slate-700/40 transition-all border border-slate-700/50">
                      Ver Rewards
                    </Link>
                    <Link href="/dashboard" className="flex-1 text-center py-1.5 rounded-lg bg-slate-800/40 text-[9px] text-slate-300 hover:bg-slate-700/40 transition-all border border-slate-700/50">
                      Dashboard
                    </Link>
                  </div>
                </div>
                <div className="p-5 rounded-2xl glass">
                  <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-amber-400" /> Objetivos
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Alcanzar 5,000 seguidores", progress: 25, current: profile.followers, target: 5000 },
                      { label: "Ganar 50,000 PTS", progress: Math.min(100, Math.round((profile.points / 50000) * 100)), current: profile.points, target: 50000 },
                      { label: "Crear 5 proyectos activos", progress: Math.min(100, Math.round((profile.customProjects.length / 5) * 100)), current: profile.customProjects.length, target: 5 },
                    ].map((o, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                          <span>{o.label}</span><span>{o.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#00D9FF] to-purple-600 transition-all" style={{ width: `${o.progress}%` }} />
                        </div>
                        <p className="text-[7px] text-slate-600">{formatNumber(o.current)} / {formatNumber(o.target)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-4">
            {/* Sponsor */}
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
                    <div className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-white">{s.name}</p>
                      <p className="text-[7px] text-slate-500">{s.type}</p>
                    </div>
                  </div>
                ))}
              </div>
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

            {/* Próximos Eventos */}
            <div className="p-4 rounded-2xl glass">
              <h3 className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#00D9FF]" /> Próximos Eventos
              </h3>
              <div className="space-y-1.5">
                {[
                  { event: "Lanzamiento ZAFIRO v2", date: "15 Jul" },
                  { event: "Webinar: Ecosistema MSM", date: "22 Jul" },
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

            {/* Actividad ELIANA */}
            <div className="p-4 rounded-2xl border border-[#00D9FF]/10 bg-[#00D9FF]/5">
              <h3 className="text-[9px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> Actividad de ELIANA
              </h3>
              <div className="space-y-1 text-[8px] text-slate-400">
                <p className="flex items-center gap-1"><Zap className="w-2.5 h-2.5 text-emerald-400" /> Análisis de perfil completado</p>
                <p className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-amber-400" /> {profile.socialLinks.length} enlaces encontrados</p>
                <p className="flex items-center gap-1"><Users className="w-2.5 h-2.5 text-blue-400" /> {profile.communities} comunidades detectadas</p>
                <p className="flex items-center gap-1"><TrendingUp className="w-2.5 h-2.5 text-purple-400" /> +8% engagement este mes</p>
              </div>
              <button onClick={() => setShowEliana(true)} className="w-full mt-2 py-1.5 rounded-lg bg-[#00D9FF]/10 text-[9px] font-bold text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-all cursor-pointer border border-[#00D9FF]/20">
                Abrir ELIANA
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 p-4 rounded-2xl border border-slate-800 bg-[#0B1220]/40">
          <p className="text-[8px] text-slate-500 text-center">
            Perfil de ZAFIRO · <Link href="/" className="text-[#00D9FF] hover:underline">Red Social del Conocimiento</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
