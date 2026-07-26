import type { Recommendation } from "./types"
import { getElianaMemory } from "./memory"
import { getAllPlatformAnalyses } from "./analysis"
import { getKnowledgeGraph } from "./knowledge"
import { questions, experts, communities as defaultCommunities, defaultSponsors } from "@/lib/zafiro-data"
import { getSession } from "@/lib/auth"

const STORAGE_KEY = "zafiro_recommendations_cache"

export function getPersonalizedRecommendations(userId: string, page: string): Recommendation[] {
  const session = getSession()
  const memory = getElianaMemory(userId)
  const analyses = getAllPlatformAnalyses(userId)
  const graph = getKnowledgeGraph(userId)
  const interests = analyses.flatMap(a => a.categories)
  const topics = analyses.flatMap(a => a.topics)
  const cacheKey = `${userId}:${page}`

  const recs: Recommendation[] = []

  if (page === "home" || page === "explore") {
    const unanswered = questions
      .filter(q => !q.replies?.length)
      .map(q => ({
        id: `q-${q.id}`, type: "question" as const, label: q.title, description: q.details || q.title,
        score: interests.some(i => q.category?.toLowerCase().includes(i.toLowerCase())) ? 85 : 60,
        reason: "Pregunta sin responder en tu área de interés",
      }))
    recs.push(...unanswered.slice(0, 3).map(r => ({ ...r, image: "" })))

    const topExperts = experts
      .slice(0, 2)
      .map((e, idx) => ({
        id: `expert-${e.rank || idx}`, type: "user" as const, label: e.name, description: `${e.title} • ${e.pts} PTS`,
        score: parseInt(e.pts) || 50, reason: `Experto recomendado`,
        image: e.avatar,
      }))
    recs.push(...topExperts)
  }

  if (page === "communities" || page === "home") {
    const suggested = defaultCommunities
      .filter(c => !memory.preferences[`joined_${c.id}`])
      .map(c => ({
        id: `c-${c.id}`, type: "community" as const, label: c.name,
        description: `${c.members || "N/A"} miembros • ${c.tag || "General"}`,
        score: interests.some(i => c.tag?.toLowerCase().includes(i.toLowerCase())) ? 80 : 50,
        reason: "Comunidad alineada con tus intereses",
        image: c.avatar,
      }))
    recs.push(...suggested.slice(0, 2))
  }

  if (page === "sponsors") {
    const suggested = defaultSponsors
      .filter(s => s.status === "Activa")
      .map(s => ({
        id: `sp-${s.id}`, type: "content" as const, label: s.campaignName,
        description: s.tagline || s.details,
        score: topics.some(t => s.targetCategory?.toLowerCase().includes(t.toLowerCase())) ? 75 : 50,
        reason: "Campaña patrocinada relevante para ti",
        image: s.image,
      }))
    recs.push(...suggested.slice(0, 3))
  }

  if (page === "universo") {
    const types = ["youtube", "instagram", "twitter", "linkedin", "github", "tiktok", "telegram"]
    const connected = analyses.map(a => a.platformType)
    const missing = types.filter(t => !connected.includes(t)).slice(0, 3)
    missing.forEach(t => {
      recs.push({
        id: `connect-${t}`, type: "platform", label: `Conectar ${t}`,
        description: `Expande tu Universo Digital conectando ${t}`,
        score: 70, reason: "Plataforma no conectada aún",
        image: "",
      })
    })
  }

  const sorted = recs.sort((a, b) => b.score - a.score).slice(0, 6)
  cacheResults(cacheKey, sorted)
  return sorted
}

export function getContextualSuggestions(userId: string, page: string, query?: string): string[] {
  const suggestions: string[] = []
  if (page === "home") {
    suggestions.push("¿Qué temas te interesan hoy?", "Explora comunidades activas", "¿Cómo ganar más PTS?")
  } else if (page === "universo") {
    suggestions.push("Analiza mis plataformas conectadas", "¿Qué dice mi perfil digital?", "Recomiéndame qué conectar")
  } else if (page === "sponsors") {
    suggestions.push("¿Qué campañas son relevantes para mí?", "¿Cómo crear una campaña?", "Analiza mis campañas activas")
  } else if (page === "communities") {
    suggestions.push("¿Qué comunidades me recomiendas?", "Comunidades sobre IA y tecnología", "¿Cómo crear un Círculo?")
  } else if (page === "profile") {
    suggestions.push("Analiza mi perfil", "¿Cómo mejorar mi presencia?", "¿Qué dicen mis estadísticas?")
  } else if (page === "dashboard") {
    suggestions.push("Resume mi actividad", "¿Qué métricas mejorar?", "Proyecta mi crecimiento")
  }
  if (query) {
    suggestions.push(`Explícame más sobre: ${query.slice(0, 40)}`)
  }
  return suggestions.slice(0, 4)
}

function cacheResults(key: string, recs: Recommendation[]) {
  if (typeof window === "undefined") return
  const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  cache[key] = { recs, ts: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}

export function getCachedRecommendations(key: string): Recommendation[] | null {
  if (typeof window === "undefined") return null
  try {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    const entry = cache[key]
    if (entry && Date.now() - entry.ts < 300000) return entry.recs
    return null
  } catch { return null }
}
