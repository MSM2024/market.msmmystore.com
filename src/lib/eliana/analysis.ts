import type { PlatformAnalysis } from "./types"
import { addLongTermFact } from "./memory"

const STORAGE_KEY = "zafiro_eliana_analysis"

interface PlatformInput {
  id: string; type: string; url: string; title?: string; userId?: string
}

const PLATFORM_ANALYZERS: Record<string, (p: PlatformInput) => PlatformAnalysis> = {
  youtube: (p) => ({
    platformId: p.id, platformType: "youtube", userId: p.userId || "",
    categories: ["Video", "Tutorial", "Tecnología"],
    tags: ["contenido audiovisual", "suscripción", "playlist"],
    topics: extractTopics(p.title || p.url),
    summary: `Canal de YouTube con contenido en video. Análisis automático de metadatos: ${p.title || "sin nombre"}.`,
    keywords: [p.title || "youtube", "video", "contenido digital"],
    sentiment: "positive", contentTypes: ["video"], language: "es", analyzedAt: Date.now(),
  }),
  instagram: (p) => ({
    platformId: p.id, platformType: "instagram", userId: p.userId || "",
    categories: ["Red Social", "Imagen", "Estilo de Vida"],
    tags: ["contenido visual", "historias", "reels"],
    topics: extractTopics(p.title || p.url),
    summary: `Perfil de Instagram con contenido visual. Análisis de publicaciones y engagement.`,
    keywords: [p.title || "instagram", "imagen", "social"],
    sentiment: "positive", contentTypes: ["image", "video"], language: "es", analyzedAt: Date.now(),
  }),
  twitter: (p) => ({
    platformId: p.id, platformType: "twitter", userId: p.userId || "",
    categories: ["Red Social", "Microblogging", "Noticias"],
    tags: ["contenido textual", "hilos", "trending"],
    topics: extractTopics(p.title || p.url),
    summary: `Perfil de X (Twitter) con microcontenido y participación en tendencias.`,
    keywords: [p.title || "twitter", "microblogging", "social"],
    sentiment: "neutral", contentTypes: ["text"], language: "es", analyzedAt: Date.now(),
  }),
  linkedin: (p) => ({
    platformId: p.id, platformType: "linkedin", userId: p.userId || "",
    categories: ["Profesional", "Negocios", "Carrera"],
    tags: ["contenido profesional", "red de contactos", "artículos"],
    topics: extractTopics(p.title || p.url),
    summary: `Perfil profesional de LinkedIn con experiencia laboral y red de contactos.`,
    keywords: [p.title || "linkedin", "profesional", "negocios"],
    sentiment: "positive", contentTypes: ["text", "article"], language: "es", analyzedAt: Date.now(),
  }),
  github: (p) => ({
    platformId: p.id, platformType: "github", userId: p.userId || "",
    categories: ["Desarrollo", "Código", "Tecnología"],
    tags: ["repositorios", "código abierto", "colaboración"],
    topics: extractTopics(p.title || p.url),
    summary: `Perfil de GitHub con repositorios de código y proyectos de desarrollo.`,
    keywords: [p.title || "github", "código", "desarrollo"],
    sentiment: "positive", contentTypes: ["code"], language: "es", analyzedAt: Date.now(),
  }),
  telegram: (p) => ({
    platformId: p.id, platformType: "telegram", userId: p.userId || "",
    categories: ["Mensajería", "Comunidad", "Contenido"],
    tags: ["canales", "grupos", "mensajería"],
    topics: extractTopics(p.title || p.url),
    summary: `Canal de Telegram con contenido y comunidad.`,
    keywords: [p.title || "telegram", "mensajería", "canal"],
    sentiment: "neutral", contentTypes: ["text", "media"], language: "es", analyzedAt: Date.now(),
  }),
  tiktok: (p) => ({
    platformId: p.id, platformType: "tiktok", userId: p.userId || "",
    categories: ["Video Corto", "Entretenimiento", "Tendencias"],
    tags: ["videos cortos", "trends", "contenido viral"],
    topics: extractTopics(p.title || p.url),
    summary: `Perfil de TikTok con videos cortos y participación en tendencias.`,
    keywords: [p.title || "tiktok", "video corto", "trending"],
    sentiment: "positive", contentTypes: ["video"], language: "es", analyzedAt: Date.now(),
  }),
  facebook: (p) => ({
    platformId: p.id, platformType: "facebook", userId: p.userId || "",
    categories: ["Red Social", "Comunidad", "Contenido"],
    tags: ["perfil", "página", "grupos"],
    topics: extractTopics(p.title || p.url),
    summary: `Perfil de Facebook con contenido social y conexiones.`,
    keywords: [p.title || "facebook", "social", "comunidad"],
    sentiment: "neutral", contentTypes: ["text", "image", "video"], language: "es", analyzedAt: Date.now(),
  }),
  website: (p) => ({
    platformId: p.id, platformType: "website", userId: p.userId || "",
    categories: ["Web", "Blog", "Contenido"],
    tags: ["sitio web", "blog", "artículos"],
    topics: extractTopics(p.title || p.url),
    summary: `Sitio web con contenido propio y presencia en Internet.`,
    keywords: [p.title || "web", "contenido", "blog"],
    sentiment: "positive", contentTypes: ["text", "media"], language: "es", analyzedAt: Date.now(),
  }),
}

function extractTopics(name: string): string[] {
  const words = name.toLowerCase().replace(/[^a-záéíóú0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3)
  return [...new Set(words)].slice(0, 5)
}

export function analyzePlatform(platform: PlatformInput): PlatformAnalysis {
  const analyzer = PLATFORM_ANALYZERS[platform.type] || PLATFORM_ANALYZERS.website
  const analysis = analyzer(platform)
  if (platform.userId) {
    addLongTermFact(platform.userId, {
      fact: `Plataforma conectada: ${platform.type} - ${platform.title || platform.url}`,
      category: "platform", confidence: 0.8,
    })
    analysis.categories.forEach(c => {
      addLongTermFact(platform.userId!, { fact: `Interés en categoría: ${c}`, category: "interest", confidence: 0.6 })
    })
  }
  if (typeof window !== "undefined") {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
      stored[analysis.platformId] = analysis
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    } catch { /* persist analysis silently */ }
  }
  return analysis
}

export function getPlatformAnalysis(platformId: string): PlatformAnalysis | null {
  if (typeof window === "undefined") return null
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    return all[platformId] || null
  } catch { return null }
}

export function getAllPlatformAnalyses(userId: string): PlatformAnalysis[] {
  if (typeof window === "undefined") return []
  try {
    const all: Record<string, PlatformAnalysis> = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    return Object.values(all).filter(a => a.userId === userId)
  } catch { return [] }
}

export function generateAggregatedSummary(userId: string): string {
  const analyses = getAllPlatformAnalyses(userId)
  if (analyses.length === 0) return "No hay plataformas conectadas para analizar."
  const allCategories = [...new Set(analyses.flatMap(a => a.categories))]
  const allTopics = [...new Set(analyses.flatMap(a => a.topics))]
  const types = [...new Set(analyses.map(a => a.platformType))]
  return `Resumen de Universo Digital:\n• ${analyses.length} plataformas conectadas: ${types.join(", ")}\n• ${allCategories.length} categorías: ${allCategories.join(", ")}\n• ${allTopics.length} temas: ${allTopics.join(", ")}`
}
