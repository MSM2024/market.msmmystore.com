import type { ElianaContext, ElianaResponse } from "./types"
import { addShortTermMemory, addLongTermFact, getContextSummary } from "./memory"
import { generateAggregatedSummary } from "./analysis"
import { getPersonalizedRecommendations, getContextualSuggestions } from "./recommendations"
import { getKnowledgeGraph, getRelatedNodes } from "./knowledge"
import { getSession } from "@/lib/auth"
import { getPTSAccount, getStreak } from "@/lib/rewards"

function getPageContext(page: string, userId: string): Record<string, string> {
  const ctx: Record<string, string> = { page }
  const session = getSession()
  if (session) ctx.user = session.name || ""

  if (userId) {
    const acc = getPTSAccount(userId)
    ctx.pts = String(acc.balance)
    ctx.level = String(acc.level)
    ctx.streak = String(getStreak(userId))
  }

  ctx.universe = generateAggregatedSummary(userId)
  return ctx
}

function getFallbackResponse(query: string, ctx: ElianaContext, userId: string): ElianaResponse {
  const q = query.toLowerCase()
  const recs = getPersonalizedRecommendations(userId, ctx.page)
  const suggestions = getContextualSuggestions(userId, ctx.page, query)

  if (q.includes("pts") || q.includes("puntos") || q.includes("rewards") || q.includes("nivel")) {
    const acc = getPTSAccount(userId)
    return {
      text: `Tienes **${acc.balance.toLocaleString()} PTS** (Nivel ${acc.level}). Sigue participando para subir de nivel. Haz preguntas, responde, conecta plataformas y recomienda ZAFIRO para ganar más.`,
      suggestions: ["¿Cómo ganar más PTS?", "Ver recompensas disponibles", "Mi progreso"],
    }
  }

  if (q.includes("racha") || q.includes("streak") || q.includes("días")) {
    const streak = getStreak(userId)
    return {
      text: `Llevas **${streak} días** de racha activa. ¡No la pierdas! Inicia sesión diariamente para mantenerla y ganar PTS extra.`,
      suggestions: ["¿Qué logros tengo?", "Ver mi racha", "¿Cómo extender mi racha?"],
    }
  }

  if (q.includes("perfil") || q.includes("universo") || q.includes("plataforma")) {
    const summary = generateAggregatedSummary(userId)
    return {
      text: summary,
      suggestions: ["Conectar nueva plataforma", "Analizar mi perfil", "Recomiéndame qué conectar"],
    }
  }

  if (q.includes("recomienda") || q.includes("sugiere") || q.includes("qué hacer")) {
    if (recs.length > 0) {
      return {
        text: `Basado en tu actividad, te recomiendo:\n${recs.slice(0, 3).map(r => `• **${r.label}**: ${r.reason}`).join("\n")}`,
        suggestions: suggestions,
      }
    }
  }

  if (q.includes("hola") || q.includes("buenas") || q.includes("saludos")) {
    const session = getSession()
    const name = session?.name || "explorador"
    return {
      text: `**Bendiciones**, ${name}. Soy **ELIANA**, la Guía Inteligente de **MSM & ZAFIRO**. Puedo orientarte sobre productos, servicios, pedidos, vender en el marketplace, cursos, servicios digitales y todo el ecosistema MSM. ¿En qué puedo ayudarte hoy?`,
      suggestions: ["Explorar marketplace", "Ver cursos de la Escuela", "Conocer servicios digitales"],
    }
  }

  if (q.includes("gracias") || q.includes("thanks")) {
    return {
      text: "¡Con gusto! Recuerda que siempre estoy aquí para ayudarte. ¿Hay algo más en lo que pueda orientarte?",
      suggestions: ["¿Qué más puedo hacer?", "Ver productos", "Explorar cursos"],
    }
  }

  return {
    text: `Entiendo que preguntas sobre "${query.slice(0, 60)}". Puedo ayudarte a:\n${suggestions.map(s => `• ${s}`).join("\n")}\n\n¿Qué te gustaría explorar?`,
    suggestions,
  }
}

export async function processElianaRequest(
  message: string,
  history: { role: string; content: string }[],
  context: ElianaContext,
): Promise<ElianaResponse> {
  const userId = context.userId || "guest"
  addShortTermMemory(userId, { role: "user", text: message, page: context.page, timestamp: Date.now() })

  const knowledge = getContextSummary(userId)
  const pageCtx = getPageContext(context.page, userId)
  const graph = getKnowledgeGraph(userId)
  const relatedToUser = getRelatedNodes(graph, `user:${userId}`, 1)
  const topics = relatedToUser.filter(n => n.type === "concept").map(n => n.label).slice(0, 5)
  const pageSuggestions = getContextualSuggestions(userId, context.page, message)

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.slice(-10),
        userId: context.userId || undefined,
      }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      const err = new Error(data.text || "Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado. Inténtalo nuevamente en unos segundos.")
      err.name = data.error === "rate_limited" ? "RATE_LIMITED" : "API_ERROR"
      if (data.error === "rate_limited") {
        (err as Error & { code: string }).code = "RATE_LIMITED"
      }
      throw err
    }

    if (data.error === "rate_limited") {
      const err = new Error("Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado. Inténtalo nuevamente en unos segundos.")
      err.name = "RATE_LIMITED"
      ;(err as Error & { code: string }).code = "RATE_LIMITED"
      throw err
    }

    const responseText = data.text || ""
    if (!responseText.trim()) {
      const err = new Error("Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado. Inténtalo nuevamente en unos segundos.")
      err.name = "EMPTY_RESPONSE"
      throw err
    }

    const response: ElianaResponse = {
      text: responseText,
      suggestions: pageSuggestions,
    }
    addShortTermMemory(userId, { role: "eliana", text: response.text, page: context.page, timestamp: Date.now() })
    addLongTermFact(userId, { fact: `Usuario preguntó: ${message.slice(0, 80)}`, category: "query", confidence: 0.5 })
    return response
  } catch (err: unknown) {
    const e = err as Error
    if (e.name === "API_ERROR" || e.name === "EMPTY_RESPONSE") {
      throw err
    }
    const netErr = new Error("Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado. Inténtalo nuevamente en unos segundos.")
    netErr.name = "NETWORK_ERROR"
    throw netErr
  }
}

export function getElianaContext(page: string, section?: string, itemId?: string): ElianaContext {
  const session = getSession()
  return {
    userId: session?.id || "",
    page,
    section,
    itemId,
  }
}
