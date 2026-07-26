import type { ElianaContext, ElianaResponse } from "./types"
import { addShortTermMemory, addLongTermFact, getElianaMemory, getContextSummary } from "./memory"
import { generateAggregatedSummary } from "./analysis"
import { getPersonalizedRecommendations, getContextualSuggestions } from "./recommendations"
import { getKnowledgeGraph, getRelatedNodes } from "./knowledge"
import { getSession } from "@/lib/auth"
import { getPTSAccount, getStreak } from "@/lib/rewards"

const SYSTEM_PROMPT = `Eres ELIANA, la Guía Inteligente de MSM & ZAFIRO y el Marketplace MSM (market.msmmystore.com).
Tu misión es orientar al comprador, consultar productos, ayudar con pedidos, cotizaciones, envíos y soporte.
NO confirmes pagos sin verificación real. NO inventes inventario ni precios. NO reveles datos privados.
El equipo humano revisa, aprueba y ejecuta las acciones críticas.
Eres concisa, precisa y proactiva. Siempre ofreces valor en cada interacción.`

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

  // Marketplace-specific intents
  if (q.includes("producto") || q.includes("buscar") || q.includes("comprar")) {
    return {
      text: "Puedo ayudarte a encontrar productos en el Marketplace. ¿Qué estás buscando? Puedo filtrar por categoría, precio, país y más.",
      suggestions: ["Buscar productos", "Ver categorías", "Productos populares", "¿Cómo compro?"],
    }
  }

  if (q.includes("precio") || q.includes("cuánto cuesta") || q.includes("cotización")) {
    return {
      text: "Para obtener un precio exacto, necesito que me indiques qué producto buscas. El precio puede variar según la tienda, el proveedor y la ubicación de entrega. ¿Qué producto necesitas?",
      suggestions: ["Consultar precio", "Comparar precios", "Solicitar cotización"],
    }
  }

  if (q.includes("pedido") || q.includes("orden") || q.includes("compra")) {
    return {
      text: "Si ya tienes un pedido, puedo consultarlo si me proporcionas el número de orden. Si quieres hacer uno nuevo, visita el Marketplace y agrega productos al carrito. ¿Qué necesitas?",
      suggestions: ["Consultar mi pedido", "Nuevo pedido", "Estados del pedido", "Mi carrito"],
    }
  }

  if (q.includes("envío") || q.includes("entrega") || q.includes("shipping")) {
    return {
      text: "Los métodos de entrega varían según el producto y la tienda. Puedes ver las opciones de envío en la ficha de producto. ¿Necesitas información sobre algún producto específico?",
      suggestions: ["Opciones de envío", "Política de envíos", "Seguimiento de pedido"],
    }
  }

  if (q.includes("vender") || q.includes("tienda") || q.includes("vendedor")) {
    return {
      text: "Para vender en el Marketplace MSM:\n1. Crea tu cuenta en zafiro.msmmystore.com\n2. Ve a Marketplace → Crear Mi Tienda\n3. Publica tus productos con fotos y precios\n4. Configura envíos y pagos\n\n¿Necesitas ayuda con algún paso?",
      suggestions: ["Crear mi tienda", "Publicar producto", "Configurar envíos", "Configurar pagos"],
    }
  }

  if (q.includes("soporte") || q.includes("ayuda") || q.includes("problema")) {
    return {
      text: "Estoy aquí para ayudarte. Si tu consulta requiere intervención de soporte humano (disputa, devolución, reembolso, problema con un pedido), puedo escalarla. ¿Qué problema tienes?",
      suggestions: ["Hablar con soporte", "Disputa con pedido", "Solicitar devolución", "Reportar problema"],
    }
  }

  if (q.includes("pago") || q.includes("cobro") || q.includes("factura")) {
    return {
      text: "Los pagos se procesan de forma segura a través de Stripe. **IMPORTANTE**: Una captura de pantalla no confirma el pago. El pago se verifica únicamente a través del procesador oficial. Si tienes dudas sobre un pago, puedo escalar tu consulta a soporte.",
      suggestions: ["Métodos de pago", "Pago no registrado", "Factura", "Soporte de pago"],
    }
  }

  if (q.includes("hola") || q.includes("buenas") || q.includes("saludos")) {
    const session = getSession()
    const name = session?.name || "explorador"
    return {
      text: `¡Hola, ${name}! Soy ELIANA, tu guía en el Marketplace MSM. Puedo ayudarte a encontrar productos, consultar precios, hacer pedidos y resolver dudas. ¿Qué te gustaría hacer hoy?`,
      suggestions: ["Buscar productos", "Ver precios", "Hacer un pedido", "Consultar mi pedido"],
    }
  }

  if (q.includes("gracias") || q.includes("thanks")) {
    return {
      text: "¡De nada! Recuerda que siempre estoy aquí para ayudarte. Si necesitas algo más, no dudes en preguntar.",
      suggestions: ["¿Qué más puedo hacer?", "Buscar productos", "Consultar pedido", "Hablar con soporte"],
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

  const systemMessage = `${SYSTEM_PROMPT}\n\nContexto del usuario:\n${knowledge}\n\nPágina actual: ${context.page}\nSección: ${context.section || "general"}\nPTS: ${pageCtx.pts || "N/A"}\nNivel: ${pageCtx.level || "N/A"}\nRacha: ${pageCtx.streak || "N/A"} días\nTemas de interés: ${topics.join(", ") || "Sin datos aún"}\nDominio: market.msmmystore.com\n${pageCtx.universe || ""}`

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: [{ role: "system", content: systemMessage }, ...history.slice(-10)],
      }),
    })
    const data = await res.json()
    const text = data.text || "No pude procesar tu solicitud. Intenta de nuevo."
    const escalatePatterns = /(?:escalar|escalado|soporte humano|hablar con soporte|atención humana|agente humano|representante|supervisor)/i
    const response: ElianaResponse = {
      text,
      suggestions: pageSuggestions,
      escalate: escalatePatterns.test(text),
      escalateReason: escalatePatterns.test(text) ? "Solicitud de escalado detectada" : undefined,
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
