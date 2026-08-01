import type { ElianaContext, ElianaResponse } from "./types"
import { addShortTermMemory, addLongTermFact } from "./memory"
import { getContextualSuggestions } from "./recommendations"
import { getSession } from "@/lib/auth"

export async function processElianaRequest(
  message: string,
  history: { role: string; content: string }[],
  context: ElianaContext,
  requestId?: string,
): Promise<ElianaResponse> {
  const userId = context.userId || "guest"
  addShortTermMemory(userId, { role: "user", text: message, page: context.page, timestamp: Date.now() })

  const pageSuggestions = getContextualSuggestions(userId, context.page, message)

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history.slice(-10),
        userId: context.userId || undefined,
        requestId,
      }),
    })

    let data: { text?: string; error?: string } = {}
    try {
      data = await res.json()
    } catch {
      data = {}
    }

    if (!res.ok || data.error) {
      const code = data.error || "API_ERROR"
      const err = new Error(data.text || "Bendiciones. No pude obtener una respuesta en este momento.")
      err.name = code === "rate_limited"
        ? "RATE_LIMITED"
        : code === "ai_provider_not_configured"
          ? "NOT_CONFIGURED"
          : code === "ai_provider_unavailable"
            ? "API_ERROR"
            : code === "ai_provider_permanent"
              ? "API_ERROR"
              : code === "ai_provider_empty"
                ? "EMPTY_RESPONSE"
                : "API_ERROR"
      const withMeta = err as Error & { code?: string; status?: number }
      withMeta.code = code
      withMeta.status = res.status
      throw err
    }

    const responseText = data.text || ""
    if (!responseText.trim()) {
      const err = new Error("Bendiciones. No pude generar una respuesta en este momento. Pulsa Reintentar.")
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
    const e = err as Error & { code?: string }
    const known = e.name === "API_ERROR"
      || e.name === "EMPTY_RESPONSE"
      || e.name === "RATE_LIMITED"
      || e.name === "NOT_CONFIGURED"
      || e.name === "UNAUTHORIZED"
      || e.name === "AbortError"
    if (known) throw err
    const netErr = new Error("Bendiciones. Sin conexión con el servidor. Revisa tu internet e inténtalo de nuevo.")
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
