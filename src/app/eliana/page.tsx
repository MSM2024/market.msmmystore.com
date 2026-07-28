'use client'

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Gem, Globe, Microscope, Network, BookOpen, Sparkles, Zap, Users, Target, Search, Shield, ExternalLink, Brain, Activity, Eye, Cpu, Database, MessageSquare, TrendingUp, Clock, Bot } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { usePageTitle } from "@/lib/usePageTitle"
import ElianaDiamond from "@/components/ElianaDiamond"
import ElianaAdvancedChat from "@/components/eliana/ElianaAdvancedChat"

const KNOWLEDGE_NODES = [
  { id: "eliana", label: "ELIANA", x: 50, y: 50, size: 40, color: "#00D9FF", pulse: true },
  { id: "marketplace", label: "Marketplace", x: 20, y: 25, size: 24, color: "#7c3aed" },
  { id: "escuela", label: "Escuela", x: 80, y: 25, size: 24, color: "#10b981" },
  { id: "album", label: "Álbum", x: 15, y: 75, size: 20, color: "#f59e0b" },
  { id: "consejo", label: "Consejo", x: 85, y: 75, size: 20, color: "#ef4444" },
  { id: "gemologia", label: "Gemología", x: 35, y: 15, size: 18, color: "#06b6d4" },
  { id: "servicios", label: "Servicios", x: 65, y: 15, size: 18, color: "#8b5cf6" },
  { id: "referidos", label: "Referidos", x: 30, y: 85, size: 16, color: "#22c55e" },
  { id: "pagos", label: "Pagos", x: 70, y: 85, size: 16, color: "#f97316" },
  { id: "mente", label: "Mente Maestra", x: 50, y: 90, size: 16, color: "#ec4899" },
]

const EDGES = [
  ["eliana", "marketplace"], ["eliana", "escuela"], ["eliana", "album"],
  ["eliana", "consejo"], ["eliana", "gemologia"], ["eliana", "servicios"],
  ["eliana", "referidos"], ["eliana", "pagos"], ["eliana", "mente"],
  ["marketplace", "pagos"], ["escuela", "mente"], ["consejo", "referidos"],
]

const CAPABILITIES = [
  { icon: Brain, title: "Razonamiento Contextual", desc: "Entiendo el contexto de cada conversación y adapto mis respuestas", level: 95 },
  { icon: Database, title: "Base de Conocimiento", desc: "58 documentos sobre todo el ecosistema MSM", level: 100 },
  { icon: MessageSquare, title: "Multi-idioma", desc: "Respondo en español, inglés y otros idiomas", level: 85 },
  { icon: Eye, title: "Análisis de Productos", desc: "Busco y comparo productos del marketplace", level: 90 },
  { icon: Cpu, title: "Procesamiento en Tiempo Real", desc: "Respuestas instantáneas con IA avanzada", level: 88 },
  { icon: Shield, title: "Seguridad Avanzada", desc: "Protección contra inyección de prompts y datos sensibles", level: 100 },
]

const METRICS = [
  { label: "Documentos", value: "58", icon: Database, color: "#00D9FF" },
  { label: "Categorías", value: "16", icon: Network, color: "#7c3aed" },
  { label: "Capacidades", value: "12", icon: Zap, color: "#10b981" },
  { label: "Idiomas", value: "3", icon: Globe, color: "#f59e0b" },
]

export default function ElianaPage() {
  usePageTitle("ELIANA — Guía Inteligente MSM")
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [activityLog, setActivityLog] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  // Animate knowledge graph
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    let time = 0
    const animate = () => {
      time += 0.015
      ctx.clearRect(0, 0, rect.width, rect.height)

      // Draw edges
      EDGES.forEach(([fromId, toId]) => {
        const from = KNOWLEDGE_NODES.find(n => n.id === fromId)
        const to = KNOWLEDGE_NODES.find(n => n.id === toId)
        if (!from || !to) return
        const fx = (from.x / 100) * rect.width
        const fy = (from.y / 100) * rect.height
        const tx = (to.x / 100) * rect.width
        const ty = (to.y / 100) * rect.height

        const gradient = ctx.createLinearGradient(fx, fy, tx, ty)
        gradient.addColorStop(0, from.color + "40")
        gradient.addColorStop(1, to.color + "40")
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        ctx.lineTo(tx, ty)
        ctx.stroke()

        // Animated particle along edge
        const t = (Math.sin(time * 2 + fx * 0.01) + 1) / 2
        const px = fx + (tx - fx) * t
        const py = fy + (ty - fy) * t
        ctx.fillStyle = from.color + "80"
        ctx.beginPath()
        ctx.arc(px, py, 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw nodes
      KNOWLEDGE_NODES.forEach(node => {
        const x = (node.x / 100) * rect.width
        const y = (node.y / 100) * rect.height
        const pulse = node.pulse ? Math.sin(time * 3) * 3 : 0
        const isActive = activeNode === node.id

        // Glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, node.size + pulse + 10)
        glow.addColorStop(0, node.color + "30")
        glow.addColorStop(1, "transparent")
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(x, y, node.size + pulse + 10, 0, Math.PI * 2)
        ctx.fill()

        // Node circle
        ctx.fillStyle = isActive ? node.color + "40" : node.color + "20"
        ctx.strokeStyle = isActive ? node.color : node.color + "60"
        ctx.lineWidth = isActive ? 2 : 1
        ctx.beginPath()
        ctx.arc(x, y, node.size / 2 + pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Label
        ctx.fillStyle = isActive ? "#ffffff" : "#94a3b8"
        ctx.font = `${node.pulse ? "bold " : ""}${node.size > 24 ? 11 : 9}px system-ui`
        ctx.textAlign = "center"
        ctx.fillText(node.label, x, y + node.size / 2 + 14)
      })

      animFrameRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [activeNode])

  // Simulate activity feed
  useEffect(() => {
    const activities = [
      "Analizando consulta sobre zafiros de Kashmir...",
      "Buscando productos en categoría Electrónica...",
      "Consultando precios del Marketplace...",
      "Procesando información de cursos disponibles...",
      "Verificando disponibilidad de servicios...",
      "Construyendo respuesta con contexto MSM...",
      "Aplicando filtro de seguridad...",
      "Optimizando respuesta para el usuario...",
    ]
    let idx = 0
    const interval = setInterval(() => {
      setActivityLog(prev => {
        const next = [...prev, activities[idx % activities.length]]
        return next.slice(-6)
      })
      idx++
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver a ZAFIRO
          </Link>
          <Link href="/admin/eliana" className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-[#00D9FF] transition-colors">
            Admin Panel <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-6 mb-8">
          {/* Left: AI Brain + Visualization */}
          <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D9FF] via-[#2563eb] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#00D9FF]/30">
                  <ElianaDiamond size={36} variant="animated" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Activity className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                  ELIANA <span className="text-[#00D9FF]">v2.0</span>
                </h1>
                <p className="text-sm text-slate-400">Guía Inteligente Avanzada · MSM & ZAFIRO</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-medium">Sistema Activo · Procesando en tiempo real</span>
                </div>
              </div>
            </div>

            {/* Knowledge Graph Canvas */}
            <div className="rounded-2xl border border-slate-800/60 glass-strong overflow-hidden mb-5 relative">
              <div className="absolute top-3 left-3 z-10">
                <p className="text-[9px] font-mono text-[#00D9FF] uppercase tracking-wider">Mapa de Conocimiento en Vivo</p>
              </div>
              <canvas
                ref={canvasRef}
                className="w-full h-[280px] cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - rect.left) / rect.width) * 100
                  const y = ((e.clientY - rect.top) / rect.height) * 100
                  const closest = KNOWLEDGE_NODES.reduce((best, node) => {
                    const dist = Math.hypot(node.x - x, node.y - y)
                    return dist < 8 ? node : best
                  }, KNOWLEDGE_NODES[0])
                  setActiveNode(Math.hypot(closest.x - x, closest.y - y) < 8 ? closest.id : null)
                }}
                onMouseLeave={() => setActiveNode(null)}
              />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {METRICS.map((m, i) => (
                <div key={i} className="p-3 rounded-xl glass border border-slate-800/30 text-center">
                  <m.icon className="w-4 h-4 mx-auto mb-1" style={{ color: m.color }} />
                  <p className="text-lg font-black text-white">{m.value}</p>
                  <p className="text-[9px] text-slate-500">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Capabilities */}
            <h2 className="text-[10px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-3 h-3" /> Capacidades del Sistema
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {CAPABILITIES.map((c, i) => (
                <div key={i} className="p-3 rounded-xl glass border border-slate-800/30 hover:border-[#00D9FF]/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className="w-4 h-4 text-[#00D9FF]/60" />
                    <p className="text-[11px] font-bold text-white">{c.title}</p>
                  </div>
                  <p className="text-[9px] text-slate-500 mb-2">{c.desc}</p>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${c.level}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, #00D9FF, #7c3aed)` }}
                    />
                  </div>
                  <p className="text-[8px] text-slate-600 mt-1 text-right">{c.level}%</p>
                </div>
              ))}
            </div>

            {/* Activity Feed */}
            <h2 className="text-[10px] font-mono font-bold text-[#00D9FF] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Actividad en Tiempo Real
            </h2>
            <div className="rounded-xl glass border border-slate-800/30 p-3 max-h-[160px] overflow-y-auto">
              <AnimatePresence>
                {activityLog.map((log, i) => (
                  <motion.div
                    key={`${log}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 py-1.5 border-b border-slate-800/20 last:border-0"
                  >
                    <Clock className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                    <p className="text-[10px] text-slate-400">{log}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activityLog.length === 0 && (
                <p className="text-[10px] text-slate-600 text-center py-4">Esperando actividad...</p>
              )}
            </div>
          </div>

          {/* Right: Advanced Chat */}
          <div className="rounded-2xl border border-slate-800/60 glass-strong overflow-hidden lg:sticky lg:top-6 lg:self-start" style={{ maxHeight: "min(800px, calc(100vh - 100px))" }}>
            <ElianaAdvancedChat />
          </div>
        </div>

        {/* Info Sections */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="rounded-2xl border border-[#00D9FF]/10 bg-[#00D9FF]/[0.03] p-5">
            <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Brain className="w-3.5 h-3.5 text-[#00D9FF]" /> Razonamiento Avanzado
            </h2>
            <div className="space-y-2">
              {[
                "Análisis contextual de cada pregunta",
                "Memoria de conversación persistente",
                "Conexión entre temas del ecosistema",
                "Respuestas adaptadas al perfil del usuario",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/10 border border-slate-700/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                  <p className="text-[11px] text-slate-400">{f}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/40 glass p-5">
            <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Seguridad y Ética
            </h2>
            <div className="space-y-2">
              {[
                "Protección contra prompt injection",
                "Filtrado de datos sensibles",
                "Rate limiting por cliente",
                "Sin almacenamiento de conversaciones privadas",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/10 border border-slate-700/20">
                  <Shield className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <p className="text-[11px] text-slate-400">{f}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/40 glass p-5">
            <h2 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Próximamente
            </h2>
            <div className="space-y-2">
              {[
                "Análisis de imágenes de productos",
                "Integración con WhatsApp Business",
                "Consultas de pedidos en tiempo real",
                "Modo voz avanzado con ElevenLabs",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/10 border border-slate-700/20">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                  <p className="text-[11px] text-slate-400">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ecosystem Links */}
        <div className="rounded-2xl glass border border-slate-800/30 p-5">
          <h2 className="text-xs font-bold text-white mb-3">Ecosistema MSM</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { href: "/", label: "ZAFIRO", desc: "Plataforma principal", color: "#00D9FF" },
              { href: "https://marketplace.msmmystore.com", label: "Marketplace", desc: "Tiendas y productos", color: "#7c3aed", external: true },
              { href: "/escuela", label: "Escuela", desc: "Cursos y mentores", color: "#10b981" },
              { href: "/album", label: "Álbum", desc: "Legado familiar", color: "#f59e0b" },
              { href: "/referidos", label: "Referidos", desc: "Invita y gana", color: "#22c55e" },
              { href: "/admin/eliana", label: "Admin", desc: "Panel de control", color: "#ef4444" },
            ].map((link, i) => (
              <Link key={i} href={link.href} {...('external' in link && link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="p-3 rounded-xl bg-[#14171A] border border-slate-800/30 hover:border-[#00D9FF]/30 transition-all group">
                <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: link.color }} />
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
