import type { ElianaContext, ElianaResponse } from "./types"
import { addShortTermMemory, addLongTermFact, getElianaMemory, getContextSummary } from "./memory"
import { generateAggregatedSummary } from "./analysis"
import { getPersonalizedRecommendations, getContextualSuggestions } from "./recommendations"
import { getKnowledgeGraph, getRelatedNodes } from "./knowledge"
import { getSession } from "@/lib/auth"
import { getPTSAccount, getStreak } from "@/lib/rewards"

const SYSTEM_PROMPT = `Eres ELIANA, el copiloto inteligente de ZAFIRO, una Red Social del Conocimiento.
Tu misión es ayudar al usuario a navegar, aprender, conectar y crecer en el ecosistema.
Eres concisa, precisa y proactiva. Siempre ofreces valor en cada interacción.
Conoces el perfil del usuario, sus plataformas conectadas, sus PTS, su racha, sus intereses.
NO eres un chatbot genérico. Eres un copiloto contextual que acompaña al usuario en toda la plataforma.`

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
      text: `¡Hola, ${name}! Soy ELIANA, tu copiloto en ZAFIRO. Puedo ayudarte a explorar conocimiento, conectar plataformas, encontrar comunidades y mucho más. ¿Qué te gustaría hacer hoy?`,
      suggestions: ["Explorar temas de interés", "Conectar mi Universo Digital", "Ver mis estadísticas"],
    }
  }

  if (q.includes("gracias") || q.includes("thanks")) {
    return {
      text: "¡De nada! Recuerda que siempre estoy aquí para ayudarte. Sigue explorando y construyendo conocimiento.",
      suggestions: ["¿Qué más puedo hacer?", "Explorar el Mapa Vivo", "Ver comunidades activas"],
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

  const systemMessage = `${SYSTEM_PROMPT}\n\nContexto del usuario:\n${knowledge}\n\nPágina actual: ${context.page}\nPTS: ${pageCtx.pts || "N/A"}\nNivel: ${pageCtx.level || "N/A"}\nRacha: ${pageCtx.streak || "N/A"} días\nTemas de interés: ${topics.join(", ") || "Sin datos aún"}\n${pageCtx.universe || ""}`

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: [{ role: "system", content: systemMessage }, ...history.slice(-10)],
        userId: context.userId || undefined,
      }),
    })
    const data = await res.json()
    const response: ElianaResponse = {
      text: data.text || "No pude procesar tu solicitud. Intenta de nuevo.",
      suggestions: pageSuggestions,
    }
    addShortTermMemory(userId, { role: "eliana", text: response.text, page: context.page, timestamp: Date.now() })
    addLongTermFact(userId, { fact: `Usuario preguntó: ${message.slice(0, 80)}`, category: "query", confidence: 0.5 })
    return response
  } catch {
    return getFallbackResponse(message, context, userId)
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
