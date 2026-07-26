'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Sparkles, Gem, Sun, Moon, Wifi, Battery, Search, Flame, MessageSquare, Users, Award,
  Plus, Send, X, Eye, MessageCircle, Signal, Globe, User, Heart,
  CheckCircle, BookOpen, CreditCard, Sliders, Activity,
  Home as HomeIcon, FlaskConical, ScrollText, Settings
} from "lucide-react"
import Link from "next/link"

import {
  stories as defaultStories, questions as defaultQuestions, trends, communities, experts,
  defaultSponsors, nobleSponsors, getContextualAdMatch, loadPersistedSponsors,
  saveSponsors, loadPersistedQuestions, saveQuestions,
  type Question, type SponsorCampaign, type Story
} from "@/lib/zafiro-data"
import ParticlesBackground from "@/components/ParticlesBackground"
import NotificationsDropdown from "@/components/NotificationsDropdown"
import GemLab from "@/components/gemology/GemLab"
import Handbook from "@/components/gemology/Handbook"
import AiAssistant from "@/components/gemology/AiAssistant"
import LoreExplorer from "@/components/gemology/LoreExplorer"
import StoriesBar from "@/components/StoriesBar"
import StoryViewer from "@/components/StoryViewer"
import DailyBrief from "@/components/DailyBrief"
import KnowledgeGraphView from "@/components/KnowledgeGraph"
import TrendsSection from "@/components/TrendsSection"
import ExpertLeaderboard from "@/components/ExpertLeaderboard"
import AddQuestionModal from "@/components/AddQuestionModal"
import { StripeModal } from "@/components/StripeModal"
import SponsorFloatingBar from "@/components/SponsorFloatingBar"
import SponsorDetailModal from "@/components/SponsorDetailModal"
import SponsorAnalyticsChart from "@/components/SponsorAnalyticsChart"
import BottomNav from "@/components/BottomNav"
import { getSession } from "@/lib/auth"
import { openElianaChat } from "@/components/ElianaFloatingButton"

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("zafiro_dark") !== "false"
    return true
  })
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("zafiro_dark", String(isDarkMode)) }, [isDarkMode])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("Todas")
  const [activeNav, setActiveNav] = useState("Inicio")
  const [currentTime, setCurrentTime] = useState("18:30")
  const [userSession, setUserSession] = useState<{ name: string; email: string } | null>(() => getSession())

  const [streak] = useState(18)
  const [points, setPoints] = useState(4820)
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>(["c1"])
  const [likedQuestions, setLikedQuestions] = useState<string[]>([])

  const [sponsors, setSponsors] = useState<SponsorCampaign[]>(() => loadPersistedSponsors())
  const [sponsorError, setSponsorError] = useState("")
  const [selectedSponsorForModal, setSelectedSponsorForModal] = useState<SponsorCampaign | null>(null)
  const [activeSponsorTab, setActiveSponsorTab] = useState<"analytics" | "create" | "campaigns">("analytics")

  const [sponsorCampCompanyName, setSponsorCampCompanyName] = useState("")
  const [sponsorCampTitle, setSponsorCampTitle] = useState("")
  const [sponsorCampDetails, setSponsorCampDetails] = useState("")
  const [sponsorCampCategory, setSponsorCampCategory] = useState("Inteligencia Artificial")
  const [sponsorCampBudget, setSponsorCampBudget] = useState(500)
  const [sponsorCampLogo, setSponsorCampLogo] = useState("✨")

  const [qs, setQs] = useState<Question[]>(() => loadPersistedQuestions())
  const [showStripeModal, setShowStripeModal] = useState(false)

  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [activeStoryIdx, setActiveStoryIdx] = useState(0)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)

  const [gemTab, setGemTab] = useState<"lab" | "handbook" | "ai" | "lore">("lab")
  const [showNotificationBadge] = useState(true)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [notifications] = useState<Array<{ id: string; text: string; time: string }>>([
    { id: "1", text: "Dr. Alejandro R. respondió a tu consulta cuántica", time: "hace 5 min" },
    { id: "2", text: "Ganaste 50 PTS por sintonizar con la comunidad IA", time: "hace 1 hora" }
  ])

  const [isElianaExpanded, setIsElianaExpanded] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "model"; text: string; time: string }>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("zafiro_chat_messages")
        if (saved) return JSON.parse(saved)
      } catch { /* ignore */ }
    }
    return [{ role: "model", text: "¡Saludos sintonizador! Soy **ELIANA**, el núcleo sintético de **ZAFIRO**. ¿Qué misterio de la ciencia sintonizaremos hoy?", time: "18:30" }]
  })

  useEffect(() => {
    localStorage.setItem("zafiro_chat_messages", JSON.stringify(chatMessages))
  }, [chatMessages])
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const [newCommentText, setNewCommentText] = useState("")
  const [lastScrollTop, setLastScrollTop] = useState(0)
  const [isSponsorBarVisible, setIsSponsorBarVisible] = useState(true)
  const feedScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateTime = () => {
      const date = new Date()
      setCurrentTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
    }
    updateTime()
    const interval = setInterval(updateTime, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isChatLoading])

  const handleFeedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    if (scrollTop > lastScrollTop && scrollTop > 40) {
      setIsSponsorBarVisible(false)
    } else {
      setIsSponsorBarVisible(true)
    }
    setLastScrollTop(scrollTop)
  }

  const handleSponsorClick = (sponsor: SponsorCampaign) => {
    const updated = sponsors.map(s =>
      s.id === sponsor.id ? { ...s, clicks: s.clicks + 1, impressions: s.impressions + 1 } : s
    )
    setSponsors(updated)
    saveSponsors(updated)
    setSelectedSponsorForModal(sponsor)
  }

  const toggleLikeQuestion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedQuestions(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const toggleCommunityJoin = (id: string) => {
    setJoinedCommunities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSendChatMessage = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault()
    const text = overrideText || chatInput
    if (!text.trim() || isChatLoading) return

    setChatMessages(prev => [...prev, { role: "user", text, time: currentTime }])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: chatMessages.filter(m => m.role === "user" || m.role === "model").map(m => ({ role: m.role, text: m.text }))
        }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, {
        role: "model",
        text: data.text || "Lo siento, no pude procesar tu consulta en este momento.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      }])
    } catch {
      setChatMessages(prev => [...prev, {
        role: "model",
        text: "Lo siento, hubo un error de conexión. Por favor intenta de nuevo.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleAskEliana = (message: string) => {
    openElianaChat()
    handleSendChatMessage(undefined, message)
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentText.trim() || !selectedQuestion) return
    const updatedQuestion = {
      ...selectedQuestion,
      replies: [...selectedQuestion.replies, {
        author: "Tú",
        avatar: "",
        title: "Sintonizador",
        time: "ahora",
        text: newCommentText,
        likes: 0
      }]
    }
    setSelectedQuestion(updatedQuestion)
    const updatedQs = qs.map(q => q.id === selectedQuestion.id ? updatedQuestion : q)
    setQs(updatedQs)
    saveQuestions(updatedQs)
    setNewCommentText("")
  }

  const handleCreateQuestion = (data: { title: string; category: string; details: string }) => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      author: { name: userSession?.name || "Tú", avatar: "", title: "Sintonizador", verified: false },
      title: data.title,
      details: data.details,
      category: data.category,
      time: "ahora",
      views: 0,
      repliesCount: 0,
      rating: 0,
      tagColor: "text-[#00D9FF]",
      tagBg: "bg-[#00D9FF]/10",
      replies: [],
    }
    const updated = [newQ, ...qs]
    setQs(updated)
    saveQuestions(updated)
    setShowAddQuestionModal(false)
    setPoints(prev => prev + 100)
  }

  const handleCreateCampaignPreSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSponsorError("")
    if (!sponsorCampCompanyName.trim() || !sponsorCampTitle.trim()) {
      setSponsorError("Completa todos los campos obligatorios.")
      return
    }
    setShowStripeModal(true)
  }

  const handleStripeSuccess = () => {
    const newCampaign: SponsorCampaign = {
      id: `sp-${Date.now()}`,
      companyName: sponsorCampCompanyName,
      campaignName: sponsorCampTitle,
      tagline: sponsorCampTitle,
      details: sponsorCampDetails || "Anuncio patrocinado premium sintonizado por autogestión asíncrona.",
      logo: sponsorCampLogo,
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600",
      targetCategory: sponsorCampCategory,
      targetAudience: "Todos los Sintonizadores",
      countries: ["Global"],
      languages: ["Español"],
      budget: sponsorCampBudget,
      spent: 0,
      duration: "30 días",
      ctaText: "Conocer más",
      impressions: 1,
      clicks: 0,
      conversions: 0,
      status: "Activa"
    }
    setSponsors(prev => { const s = [newCampaign, ...prev]; saveSponsors(s); return s })
    setShowStripeModal(false)
    setPoints(prev => prev + 500)
    setSponsorCampCompanyName("")
    setSponsorCampTitle("")
    setSponsorCampDetails("")
    setActiveSponsorTab("campaigns")
  }

  const handleExploreSponsor = (sponsor: SponsorCampaign) => {
    const updated = sponsors.map(s =>
      s.id === sponsor.id ? { ...s, conversions: s.conversions + 1 } : s
    )
    setSponsors(updated)
    saveSponsors(updated)
    setPoints(prev => prev + 50)
    setSelectedSponsorForModal(null)
  }

  const handleToggleCampaignStatus = (id: string) => {
    setSponsors(prev => { const s = prev.map(sp => sp.id === id ? { ...sp, status: (sp.status === "Activa" ? "Pausada" : "Activa") as "Activa" | "Pausada" } : sp); saveSponsors(s); return s })
  }

  const filteredQuestions = useMemo(() => {
    return qs.filter(q => {
      if (selectedTag !== "Todas" && q.category !== selectedTag) return false
      if (searchQuery.trim()) {
        const ql = searchQuery.toLowerCase()
        return q.title.toLowerCase().includes(ql) || q.details.toLowerCase().includes(ql)
      }
      return true
    })
  }, [selectedTag, searchQuery, qs])

  const sortedSponsors = useMemo(() => {
    return [...sponsors].sort((a, b) => {
      return getContextualAdMatch(b, selectedTag, searchQuery, joinedCommunities).percentage -
        getContextualAdMatch(a, selectedTag, searchQuery, joinedCommunities).percentage
    })
  }, [sponsors, selectedTag, searchQuery, joinedCommunities])

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-hidden relative">

      <ParticlesBackground isDarkMode={isDarkMode} />

      {/* TOP BAR */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b border-slate-800/50 bg-[#050816]/80 backdrop-blur-xl glow-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#050816] flex items-center justify-center border border-cyan-500/30">
            <Gem className="w-4 h-4 text-[#00D9FF]" />
          </div>
          <div className="hidden sm:block leading-none">
            <span className="text-sm font-black font-display tracking-widest text-gradient uppercase block leading-none">ZAFIRO</span>
            <span className="text-[7.5px] font-mono tracking-wider font-extrabold text-[#00D9FF] block uppercase mt-0.5">Knowledge Future</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1.5 mr-2 text-[9px] font-mono text-slate-500">
            <Wifi className="w-3 h-3 text-emerald-400" />
            <Signal className="w-3 h-3 text-emerald-400" />
            <Battery className="w-3 h-3 text-emerald-400" />
          </div>

          <Link href="/universo" className="flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all" title="Mi Universo Digital">
            <Globe className="w-4 h-4" />
          </Link>

          <Link href="/messages" className="flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all" title="Mensajes">
            <MessageSquare className="w-4 h-4" />
          </Link>

          <Link href="/profile-page" className="flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all" title="Perfil">
            <User className="w-4 h-4" />
          </Link>

          <Link href="/settings" className="flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all" title="Configuración">
            <Settings className="w-4 h-4" />
          </Link>

          <div className="relative">
            <NotificationsDropdown
              notifications={notifications}
              showBadge={showNotificationBadge}
              isOpen={showNotificationsDropdown}
              onToggle={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            />
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)]">

        {/* DESKTOP TOP NAV */}
        <nav className="hidden lg:flex items-center gap-1 px-4 py-2 border-b border-slate-900 overflow-x-auto shrink-0">
          {[
            { id: "Inicio", label: "Inicio", icon: HomeIcon },
            { id: "Explorar", label: "Explorar", icon: Globe },
            { id: "Comunidades", label: "Círculos", icon: Users },
            { id: "Gemología", label: "Gemología", icon: Gem },
            { id: "Sponsors", label: "Sponsors", icon: Award },
            { id: "Universo", label: "Universo", icon: Activity, href: "/universo" },
            { id: "Perfil", label: "Mi Perfil", icon: User },
          ].map(item => {
            const Icon = item.icon
            const isActive = activeNav === item.id
            const classes = `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0 ${
              isActive
                ? "bg-gradient-to-r from-[#00D9FF]/15 to-blue-600/10 text-[#00D9FF] border-[#00D9FF]/20 glow-cyan"
                : "text-slate-400 hover:text-white hover:bg-slate-900/40 border-transparent"
            }`
            const inner = <><Icon className="w-3.5 h-3.5 shrink-0" /><span>{item.label}</span></>
            if (item.href) return <Link key={item.id} href={item.href} className={classes}>{inner}</Link>
            return (
              <button key={item.id} onClick={() => { setActiveNav(item.id); setSelectedQuestion(null) }} className={classes}>
                {inner}
              </button>
            )
          })}
          <div className="ml-auto flex items-center gap-2 text-[9px] font-mono text-slate-500 shrink-0">
            <Flame className="w-3 h-3 text-amber-500" />
            <span>{streak} días</span>
            <span className="text-[#00D9FF]">{points.toLocaleString()} PTS</span>
          </div>
        </nav>

        {/* MIDDLE FEED */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

          {/* SPONSOR FLOATING BAR */}
          <SponsorFloatingBar
            sponsors={sponsors}
            selectedTag={selectedTag}
            searchQuery={searchQuery}
            joinedCommunities={joinedCommunities}
            onSponsorClick={handleSponsorClick}
            isVisible={isSponsorBarVisible}
          />

          {/* SCROLLABLE FEED */}
          <div ref={feedScrollRef} onScroll={handleFeedScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 z-10 pb-20">

            {/* STORIES */}
            {activeNav === "Inicio" && (
              <StoriesBar
                stories={defaultStories}
                onViewStory={(story, idx) => { setActiveStory(story); setActiveStoryIdx(idx) }}
              />
            )}

            {/* HOME VIEW */}
            {activeNav === "Inicio" && (
              <div className="space-y-6 animate-in fade-in duration-300">

                {/* HERO */}
                <div className="text-left space-y-2">
                  <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-black font-display tracking-tight leading-none text-white uppercase"
                  >
                    Cada pregunta <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00D9FF] via-[#2563EB] to-[#7C3AED] animate-pulse-glow">
                      construye el futuro
                    </span>
                  </motion.h1>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    La red social del conocimiento impulsada por Inteligencia Artificial.
                  </p>
                </div>

                {/* SEARCH */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00D9FF] via-[#2563EB] to-[#7C3AED] rounded-2xl blur opacity-30 group-hover:opacity-65 transition duration-500" />
                  <div className="relative flex items-center rounded-2xl p-3 border bg-[#050816]/95 border-[#00D9FF]/20">
                    <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#00D9FF]/10 to-blue-500/10 text-[#00D9FF] mr-3">
                      <Gem className="w-5 h-5 animate-pulse" />
                    </div>
                    <input type="text" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="¿Qué quieres aprender hoy?"
                      className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-white placeholder-slate-400"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="mr-2 text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => { if (searchQuery.trim()) setShowAddQuestionModal(true) }}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#2563EB] hover:opacity-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-[#00D9FF]/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* DAILY BRIEF */}
                <DailyBrief onAskEliana={handleAskEliana} />

                <KnowledgeGraphView />

                <TrendsSection trends={trends} onSearch={(q) => setSearchQuery(q)} />

                {/* QUESTIONS */}
                <div className="space-y-3.5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-800/20 pb-1">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      <span>Preguntas Recomendadas</span>
                    </span>
                    <button onClick={() => { setSelectedTag("Todas"); setSearchQuery("") }}
                      className="text-[9.5px] font-mono text-blue-400 hover:underline"
                    >
                      Reiniciar filtros
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredQuestions.length > 0 ? filteredQuestions.map(q => (
                      <article key={q.id} onClick={() => setSelectedQuestion(q)}
                        className="p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left bg-[#0b1220]/40 hover:bg-[#0b1220]/80 border-slate-800/80"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <img src={q.author.avatar} alt={q.author.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                            <div className="leading-tight">
                              <div className="flex items-center space-x-1">
                                <h4 className="text-[11px] font-bold text-white">{q.author.name}</h4>
                                {q.author.verified && <CheckCircle className="w-3 h-3 text-emerald-400 fill-current" />}
                              </div>
                              <p className="text-[9px] text-slate-500 font-semibold">{q.time}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[8.5px] font-mono rounded-md font-bold border ${q.tagBg} ${q.tagColor}`}>
                            {q.category}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold leading-snug text-white mb-2">{q.title}</h3>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/30 pt-2.5">
                          <div className="flex space-x-3.5">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>{q.views} sintonías</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
                              <span>{q.repliesCount}</span>
                            </span>
                          </div>
                          <button onClick={(e) => toggleLikeQuestion(q.id, e)}
                            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition-all ${
                              likedQuestions.includes(q.id)
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${likedQuestions.includes(q.id) ? "fill-current" : ""}`} />
                            <span>{q.rating}%</span>
                          </button>
                        </div>
                      </article>
                    )) : (
                      <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
                        <p className="text-xs text-slate-400">Ninguna pregunta coincide con la búsqueda.</p>
                        <button onClick={() => { setSelectedTag("Todas"); setSearchQuery("") }}
                          className="text-[10px] text-[#00D9FF] font-mono mt-2"
                        >
                          Mostrar todos los canales
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* NOBLE SPONSORS */}
                <div className="space-y-3.5 text-left">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase flex items-center gap-1.5 border-b border-slate-800/20 pb-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Patrocinadores del Conocimiento</span>
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {nobleSponsors.map((s, i) => (
                      <div key={i} className="p-3 rounded-xl border bg-slate-950/40 border-slate-800 flex flex-col justify-between text-left h-24">
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-white font-display">{s.name}</span>
                            <span className="text-[7px] font-mono text-slate-500 bg-slate-900 px-1 py-0.5 rounded">PATROCINADO</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-tight mt-1">{s.support}</p>
                        </div>
                        <span className="text-[7.5px] font-mono text-[#00D9FF] uppercase tracking-wider font-bold">{s.tag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/sponsors-page"
                  className="w-full py-2 px-3 rounded-xl border border-slate-800 bg-slate-950/30 text-[9px] font-mono font-bold text-[#00D9FF] hover:bg-slate-900/60 transition-all flex items-center justify-center gap-2"
                >
                  <Award className="w-3 h-3" /> Ver Dashboard Completo
                </Link>

              </div>
            )}

            {/* EXPLORE VIEW */}
            {activeNav === "Explorar" && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#00D9FF] uppercase">Buscador Inteligente</span>
                  <h2 className="text-xl font-black text-white font-display uppercase">Sintonizar Canales</h2>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar palabras clave, física, IA..."
                    className="w-full py-2 pl-9 pr-8 rounded-xl text-xs font-semibold outline-none border transition-all bg-[#0B1220]/60 border-slate-800 text-white focus:border-[#00D9FF]"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Todas", "Ciberseguridad", "Economía de Datos", "Ciencia Espacial"].map(tag => (
                    <button key={tag} onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                        selectedTag === tag
                          ? "bg-gradient-to-r from-blue-600 to-[#7C3AED] text-white"
                          : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white"
                      }`}
                    >{tag}</button>
                  ))}
                </div>
                <div className="space-y-3">
                  {filteredQuestions.map(q => (
                    <div key={q.id} onClick={() => setSelectedQuestion(q)}
                      className="p-4 rounded-xl glass hover:bg-[#0B1220]/60 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[8px] font-mono text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded">{q.category}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{q.time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{q.title}</h4>
                    </div>
                    ))}
                </div>
                <Link href="/help"
                  className="text-[9px] font-mono text-[#00D9FF] hover:underline text-center block mt-2"
                >
                  Ver más resultados →
                </Link>
              </div>
            )}

            {/* COMMUNITIES VIEW */}
            {activeNav === "Comunidades" && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#00D9FF] uppercase">Círculos de Estudio</span>
                  <h2 className="text-xl font-black text-white font-display uppercase">Comunidades de Elite</h2>
                </div>
                <div className="space-y-3.5">
                  {communities.map(c => {
                    const isJoined = joinedCommunities.includes(c.id)
                    return (
                      <div key={c.id} className="p-4 rounded-2xl glass text-left flex items-start gap-3">
                        <img src={c.avatar} alt={c.name} className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0" />
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-white">{c.name}</h4>
                            <span className={`px-2 py-0.5 text-[8.5px] font-mono rounded font-bold border ${c.color}`}>{c.tag}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">{c.description}</p>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-[9px] font-mono text-slate-500">{c.members}</span>
                            <button onClick={() => toggleCommunityJoin(c.id)}
                              className={`px-3 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                                isJoined
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-blue-600 hover:bg-blue-500 text-white"
                              }`}
                            >{isJoined ? "Sintonizado" : "Sintonizar Círculo"}</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Link href="/memberships"
                  className="text-[9px] font-mono text-[#00D9FF] hover:underline text-center block mt-2"
                >
                  Explorar más Círculos →
                </Link>
              </div>
            )}

            {/* PROFILE VIEW */}
            {activeNav === "Perfil" && (
              <div className="space-y-5 animate-in fade-in duration-300 text-left">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono font-bold tracking-wider text-[#00D9FF] uppercase">Sintonizador Certificado</span>
                  <h2 className="text-xl font-black text-white font-display uppercase">{userSession?.name || "Miguel Solano"}</h2>
                </div>
                <div className="p-4 rounded-2xl glass flex items-center gap-4">
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120" className="w-14 h-14 rounded-2xl object-cover border border-slate-700" alt="" />
                  <div className="space-y-1 leading-tight">
                    <h4 className="text-sm font-bold text-white">{userSession?.name || "Miguel Solano"}</h4>
                    <p className="text-xs text-slate-400 font-semibold">Socio Platino de ZAFIRO</p>
                    <p className="text-[10px] font-mono text-[#00D9FF]">ID: #9283-KNOWLEDGE</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-left">
                    <span className="text-[9px] font-mono text-slate-500">RESISTENCIA</span>
                    <p className="text-lg font-black text-white">{streak} Días de Racha</p>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-left">
                    <span className="text-[9px] font-mono text-slate-500">ACUMULACIÓN</span>
                    <p className="text-lg font-black text-[#00D9FF]">{points.toLocaleString()} PTS</p>
                  </div>
                </div>

                <ExpertLeaderboard experts={experts} />

                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-slate-950/60 p-4 shadow-[0_0_15px_rgba(0,217,255,0.06)]">
                  <div className="absolute top-[-25%] right-[-15%] w-36 h-36 bg-[#00D9FF]/10 blur-2xl rounded-full" />
                  <div className="flex items-center space-x-3 relative z-10">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-[#00D9FF]">
                      <Award className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white font-mono tracking-wider uppercase">Portal de Sponsors Premium</h4>
                      <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">Anúnciate asíncronamente con Stripe</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed font-semibold relative z-10">
                    Crea campañas segmentadas con IA, define presupuesto, sintoniza tu audiencia ideal.
                  </p>
                  <button onClick={() => { setActiveNav("Sponsors"); setActiveSponsorTab("analytics") }}
                    className="w-full mt-3.5 py-2 bg-gradient-to-r from-[#00D9FF] to-[#2563EB] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md relative z-10"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Administrar Campañas</span>
                  </button>
                  <Link href="/profile-page"
                    className="w-full mt-2 py-2 border border-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900/60 transition-all flex items-center justify-center gap-2"
                  >
                    <User className="w-3.5 h-3.5" /> Ver Perfil Completo
                  </Link>
                </div>
              </div>
            )}

            {/* GEMOLOGIA VIEW */}
            {activeNav === "Gemología" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                  <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/40">
                    <Gem className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-lg font-bold font-serif text-slate-100">Gemología</h2>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {[
                    { key: "lab" as const, label: "Laboratorio", icon: FlaskConical },
                    { key: "handbook" as const, label: "Handbook", icon: BookOpen },
                    { key: "ai" as const, label: "Zafiro AI", icon: Sparkles },
                    { key: "lore" as const, label: "Lore", icon: ScrollText },
                  ].map(tab => {
                    const Icon = tab.icon
                    const isActive = gemTab === tab.key
                    return (
                      <button key={tab.key} onClick={() => setGemTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                          isActive
                            ? "bg-indigo-950/40 text-indigo-300 border-indigo-800/40"
                            : "text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
                <motion.div key={gemTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  {gemTab === "lab" && <GemLab />}
                  {gemTab === "handbook" && <Handbook />}
                  {gemTab === "ai" && <AiAssistant />}
                  {gemTab === "lore" && <LoreExplorer />}
                </motion.div>
                <Link href="/gemologia"
                  className="text-[9px] font-mono text-[#00D9FF] hover:underline text-center block"
                >
                  Explorar Gemología completa →
                </Link>
              </div>
            )}

            {/* SPONSORS VIEW */}
            {activeNav === "Sponsors" && (
              <div className="space-y-5 animate-in fade-in duration-300 text-left">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-[#00D9FF] uppercase flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Portal de Sponsors Premium</span>
                    </span>
                    <h2 className="text-xl font-black text-white font-display uppercase leading-none">Panel de Control</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/sponsors-page"
                      className="px-2.5 py-1 text-[9px] font-mono border border-[#00D9FF]/30 rounded-lg text-[#00D9FF] hover:bg-[#00D9FF]/10 transition-all"
                    >
                      Dashboard Completo
                    </Link>
                    <button onClick={() => setActiveNav("Perfil")}
                      className="px-2.5 py-1 text-[9px] font-mono border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/60 rounded-xl border border-slate-800/40">
                  {[
                    { id: "analytics" as const, label: "Métricas", icon: Activity },
                    { id: "create" as const, label: "Anunciarse", icon: Plus },
                    { id: "campaigns" as const, label: "Campañas", icon: Sliders }
                  ].map(tab => {
                    const Icon = tab.icon
                    const isTabActive = activeSponsorTab === tab.id
                    return (
                      <button key={tab.id} onClick={() => setActiveSponsorTab(tab.id)}
                        className={`py-1.5 rounded-lg text-[9px] font-bold tracking-wide uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isTabActive
                            ? "bg-gradient-to-r from-blue-600 to-[#7C3AED] text-white shadow-md shadow-blue-500/10"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                {activeSponsorTab === "analytics" && <SponsorAnalyticsChart />}

                {activeSponsorTab === "create" && (
                  <form onSubmit={handleCreateCampaignPreSubmit} className="space-y-4">
                    <div className="space-y-3 p-4 rounded-2xl border border-slate-800 bg-slate-950/40">
                      <h4 className="text-[11px] font-mono font-bold text-[#00D9FF] uppercase tracking-widest border-b border-slate-800 pb-1 mb-2">
                        Configuración del Anuncio
                      </h4>
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-wider">Empresa / Marca</label>
                        <input type="text" value={sponsorCampCompanyName} onChange={(e) => setSponsorCampCompanyName(e.target.value)}
                          placeholder="Ej. Tesla Motors, SpaceX, Vercel" maxLength={25} required
                          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold outline-none border transition-all bg-[#0B1220]/60 border-slate-800 text-white focus:border-[#00D9FF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-wider">Mensaje Publicitario</label>
                        <input type="text" value={sponsorCampTitle} onChange={(e) => setSponsorCampTitle(e.target.value)}
                          placeholder="Ej. Inferencia cuántica instantánea" maxLength={65} required
                          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-semibold outline-none border transition-all bg-[#0B1220]/60 border-slate-800 text-white focus:border-[#00D9FF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-wider">Detalles</label>
                        <textarea value={sponsorCampDetails} onChange={(e) => setSponsorCampDetails(e.target.value)}
                          placeholder="Describe tu propuesta..." maxLength={220}
                          className="w-full h-16 py-1.5 px-3 rounded-lg text-[11px] font-semibold outline-none border transition-all bg-[#0B1220]/60 border-slate-800 text-white focus:border-[#00D9FF] resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
                          <select value={sponsorCampCategory} onChange={(e) => setSponsorCampCategory(e.target.value)}
                            className="w-full py-1.5 px-2 rounded-lg text-[11px] font-bold outline-none border bg-slate-900 border-slate-800 text-white focus:border-[#00D9FF] cursor-pointer"
                          >
                            <option>Inteligencia Artificial</option>
                            <option>Ciberseguridad</option>
                            <option>Economía de Datos</option>
                            <option>Ciencia Espacial</option>
                            <option>Biotecnología</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-wider">Logo</label>
                          <select value={sponsorCampLogo} onChange={(e) => setSponsorCampLogo(e.target.value)}
                            className="w-full py-1.5 px-2 rounded-lg text-[11px] font-bold outline-none border bg-slate-900 border-slate-800 text-white focus:border-[#00D9FF] cursor-pointer"
                          >
                            <option value="✨">✨ Destello</option>
                            <option value="🚀">🚀 Cohete</option>
                            <option value="🤖">🤖 Robot</option>
                            <option value="🧬">🧬 Adn</option>
                            <option value="💳">💳 Tarjeta</option>
                            <option value="▲">▲ Delta</option>
                            <option value="🛰️">🛰️ Satélite</option>
                            <option value="🛡️">🛡️ Escudo</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9.5px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider">Presupuesto Diario</label>
                        <span className="text-sm font-black font-mono text-white">${sponsorCampBudget} USD</span>
                      </div>
                      <input type="range" min="50" max="2000" step="50" value={sponsorCampBudget}
                        onChange={(e) => setSponsorCampBudget(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 rounded-lg bg-slate-800"
                      />
                      <div className="grid grid-cols-2 gap-3.5 pt-1">
                        <div className="p-2 rounded-xl bg-slate-950/65 leading-tight">
                          <span className="text-[7.5px] font-mono text-slate-500 block uppercase font-semibold">Impresiones Est. / Día</span>
                          <span className="text-xs font-black font-mono text-cyan-400 mt-0.5 block">
                            {((sponsorCampBudget * 24.5).toFixed(0))} sintonías
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950/65 leading-tight">
                          <span className="text-[7.5px] font-mono text-slate-500 block uppercase font-semibold">Clics Proyectados</span>
                          <span className="text-xs font-black font-mono text-purple-400 mt-0.5 block">
                            {((sponsorCampBudget * 2.25).toFixed(0))} clics
                          </span>
                        </div>
                      </div>
                      {sponsorError && (
                        <p className="text-[9px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-2">{sponsorError}</p>
                      )}
                      <button type="submit"
                        className="w-full py-2.5 bg-gradient-to-r from-[#00D9FF] to-[#2563EB] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
                      >
                        <CreditCard className="w-4 h-4 animate-bounce" />
                        <span>Pagar Campaña con Stripe</span>
                      </button>
                    </div>
                  </form>
                )}

                {activeSponsorTab === "campaigns" && (
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-900">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Tus Campañas</span>
                      <span className="text-[9px] font-mono text-cyan-400 font-bold">{sponsors.length} en total</span>
                    </div>
                    <div className="space-y-3">
                      {sponsors.map(camp => (
                        <div key={camp.id} className="p-3.5 rounded-2xl border border-slate-800 bg-slate-950/40 text-left">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-5 h-5 rounded-full bg-[#1E293B] text-xs flex items-center justify-center text-white font-bold">
                                {camp.logo}
                              </div>
                              <div className="leading-none">
                                <h4 className="text-xs font-black text-white">{camp.companyName}</h4>
                                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest">ID: {camp.id}</span>
                              </div>
                            </div>
                            <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              camp.status === "Activa"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-800 text-slate-500 border border-slate-700/50"
                            }`}>
                              {camp.status} ●
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-300 font-semibold leading-tight mb-2.5">&ldquo;{camp.tagline}&rdquo;</p>
                          <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950/60 rounded-xl mb-3">
                            <div className="text-left leading-tight">
                              <span className="text-[7px] font-mono text-slate-500 uppercase font-semibold">Impresiones</span>
                              <span className="text-[11.5px] font-mono font-bold text-slate-300">{camp.impressions.toLocaleString()}</span>
                            </div>
                            <div className="text-left leading-tight">
                              <span className="text-[7px] font-mono text-slate-500 uppercase font-semibold">Clics</span>
                              <span className="text-[11.5px] font-mono font-bold text-slate-300">{camp.clicks.toLocaleString()}</span>
                            </div>
                            <div className="text-left leading-tight">
                              <span className="text-[7px] font-mono text-slate-500 uppercase font-semibold">Presupuesto</span>
                              <span className="text-[11.5px] font-mono font-bold text-cyan-400">${camp.budget}</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-mono text-slate-500">Segmentado: <b className="text-purple-400">{camp.targetCategory}</b></span>
                            <button onClick={() => handleToggleCampaignStatus(camp.id)}
                              className="text-[9px] font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg px-2.5 py-1 cursor-pointer"
                            >
                              {camp.status === "Activa" ? "Pausar" : "Reactivar"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* BOTTOM NAV (mobile) */}
      <BottomNav
        activeNav={activeNav}
        onNavChange={(nav) => { setActiveNav(nav); setSelectedQuestion(null) }}
        onAddQuestion={() => setShowAddQuestionModal(true)}
      />

      {/* MODALS */}

      <StoryViewer
        story={activeStory}
        stories={defaultStories}
        index={activeStoryIdx}
        onClose={() => setActiveStory(null)}
        onNext={() => {
          if (activeStoryIdx < defaultStories.length - 1) {
            const nextIdx = activeStoryIdx + 1
            setActiveStoryIdx(nextIdx)
            setActiveStory(defaultStories[nextIdx])
          }
        }}
        onPrev={() => {
          if (activeStoryIdx > 0) {
            const prevIdx = activeStoryIdx - 1
            setActiveStoryIdx(prevIdx)
            setActiveStory(defaultStories[prevIdx])
          }
        }}
      />

      <AddQuestionModal
        isOpen={showAddQuestionModal}
        onClose={() => setShowAddQuestionModal(false)}
        onSubmit={handleCreateQuestion}
      />

      <SponsorDetailModal
        sponsor={selectedSponsorForModal}
        selectedTag={selectedTag}
        searchQuery={searchQuery}
        joinedCommunities={joinedCommunities}
        onClose={() => setSelectedSponsorForModal(null)}
        onExplore={handleExploreSponsor}
      />

      <StripeModal
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
        budget={sponsorCampBudget}
        companyName={sponsorCampCompanyName}
        onSuccess={handleStripeSuccess}
      />

      {/* QUESTION DETAIL MODAL */}
      <AnimatePresence>
        {selectedQuestion && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md text-left"
          >
            <motion.div initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 30 }}
              className="w-full max-w-lg h-[650px] rounded-3xl border border-slate-800 bg-[#050816]/98 p-5 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-slate-900 pb-2.5 mb-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <img src={selectedQuestion.author.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <h4 className="text-xs font-black text-white">{selectedQuestion.author.name}</h4>
                    <span className="text-[9px] text-slate-500 font-semibold">{selectedQuestion.time}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedQuestion(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-3 scrollbar-none">
                <span className={`px-2 py-0.5 text-[8.5px] font-mono rounded-md font-bold border inline-block ${selectedQuestion.tagBg} ${selectedQuestion.tagColor}`}>
                  {selectedQuestion.category}
                </span>
                <h2 className="text-sm font-black text-white leading-snug">{selectedQuestion.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed font-semibold">{selectedQuestion.details}</p>

                <div className="space-y-3 pt-3 border-t border-slate-900">
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Respuestas ({selectedQuestion.replies.length})
                  </span>
                  {selectedQuestion.replies.map((reply, idx) => (
                    <div key={idx}
                      className={`p-3 rounded-2xl text-[11px] leading-relaxed ${
                        reply.isAi
                          ? "bg-[#00D9FF]/5 border border-[#00D9FF]/20"
                          : "bg-slate-900/60 border border-slate-800"
                      }`}
                    >
                      {reply.isAi && (
                        <div className="text-[#00D9FF] text-[6.5px] font-mono px-2 py-0.5 rounded-bl font-black tracking-wider uppercase mb-1">
                          Respuesta IA Oficial
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mb-2">
                        {reply.isAi ? (
                          <div className="w-6 h-6 rounded-md bg-[#00D9FF]/15 flex items-center justify-center border border-[#00D9FF]/30">
                            <Gem className="w-3.5 h-3.5 text-[#00D9FF]" />
                          </div>
                        ) : (
                          <img src={reply.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <div>
                          <h5 className="text-[10px] font-extrabold text-white">{reply.author}</h5>
                          <span className="text-[8px] text-slate-500 font-mono">{reply.time}</span>
                        </div>
                      </div>
                      <p className="text-slate-300 font-semibold">{reply.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleAddComment} className="pt-2.5 border-t border-slate-900 flex gap-2 shrink-0 bg-[#050816]">
                <input type="text" required value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Añade tu respuesta al consenso..."
                  className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs font-semibold outline-none text-white focus:border-[#00D9FF]"
                />
                <button type="submit"
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-[#7C3AED] hover:opacity-95 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Sintonizar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
