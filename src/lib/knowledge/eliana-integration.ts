import { ragPipeline, knowledgeSearch } from "./search"
import { checkInputSafety, checkOutputSafety, extractTopics, buildSystemPrompt, ELIANA_IDENTITY } from "./guardrails"
import { knowledgeRepo } from "./repository"
import type { KnowledgeDocument, SearchResult } from "./types"

export interface ElianaKnowledgeContext {
  query: string
  topics: string[]
  rag_context?: {
    text: string
    sources: Array<{ title: string; slug: string; doc_type: string }>
    confidence: number
  }
  documents: KnowledgeDocument[]
  confidence: number
}

export async function getElianaKnowledge(
  query: string,
  options: {
    max_results?: number
    include_rag?: boolean
    topics?: string[]
  } = {}
): Promise<ElianaKnowledgeContext> {
  const maxResults = options.max_results || 5
  const topics = options.topics || extractTopics(query)

  const inputSafety = checkInputSafety(query)
  if (inputSafety.blocked) {
    return {
      query,
      topics,
      documents: [],
      confidence: 0,
    }
  }

  const searchResults = await knowledgeSearch.search({
    query: inputSafety.sanitized || query,
    limit: maxResults,
    threshold: 0.3,
  })

  const documents = searchResults.map((r: SearchResult) => r.document)
  const avgScore = searchResults.length > 0
    ? searchResults.reduce((sum: number, r: SearchResult) => sum + r.score, 0) / searchResults.length
    : 0

  let ragContext: ElianaKnowledgeContext["rag_context"] | undefined

  if (options.include_rag !== false) {
    try {
      const rag = await ragPipeline.retrieveContext(inputSafety.sanitized || query, {
        max_results: maxResults,
        max_tokens: 4000,
      })

      ragContext = {
        text: rag.context_text,
        sources: rag.sources,
        confidence: rag.confidence,
      }
    } catch (error) {
      // RAG failed, continue with basic search results
    }
  }

  return {
    query,
    topics,
    rag_context: ragContext,
    documents,
    confidence: Math.round(avgScore * 100) / 100,
  }
}

export function buildElianaKnowledgePrompt(
  context: ElianaKnowledgeContext,
  userQuery: string,
  conversationHistory?: Array<{ role: string; content: string }>
): string {
  const systemPrompt = buildSystemPrompt(ELIANA_IDENTITY)

  let knowledgeSection = ""

  if (context.rag_context && context.rag_context.text) {
    knowledgeSection = `
## Conocimiento Recuperado (RAG)
${context.rag_context.text}

### Fuentes
${context.rag_context.sources.map(s => `- ${s.title} (${s.doc_type})`).join("\n")}

### Confianza: ${Math.round(context.rag_context.confidence * 100)}%
`
  } else if (context.documents.length > 0) {
    knowledgeSection = `
## Documentos Relevantes
${context.documents.map(doc => `
### ${doc.title}
Tipo: ${doc.doc_type} | Estado: ${doc.status}
${doc.summary ? `Resumen: ${doc.summary}` : ""}
Contenido: ${doc.content.substring(0, 500)}...
`).join("\n")}
`
  }

  const topicsSection = context.topics.length > 0
    ? `\n## Temas Detectados: ${context.topics.join(", ")}\n`
    : ""

  let historySection = ""
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-5)
    historySection = `
## Historial Reciente
${recentHistory.map(m => `${m.role}: ${m.content}`).join("\n")}
`
  }

  return `${systemPrompt}
${knowledgeSection}
${topicsSection}
${historySection}

## Consulta del Usuario
${userQuery}

## Instrucciones de Respuesta
1. Responde en español
2. Usa el conocimiento recuperado cuando sea relevante
3. Si no tienes información específica, indica que no tienes esa información
4. Sé conciso pero completo
5. Ofrece acciones concretas cuando sea posible
6. Si detectas un gap en el conocimiento, sugiere reportarlo`
}

export async function processElianaKnowledgeRequest(
  query: string,
  conversationHistory?: Array<{ role: string; content: string }>,
  options: {
    max_results?: number
    include_rag?: boolean
    user_role?: string
    current_page?: string
  } = {}
): Promise<{
  response: string
  context: ElianaKnowledgeContext
  confidence: number
  topics: string[]
}> {
  const context = await getElianaKnowledge(query, {
    max_results: options.max_results || 5,
    include_rag: options.include_rag !== false,
  })

  const prompt = buildElianaKnowledgePrompt(context, query, conversationHistory)

  let response = ""

  if (context.documents.length > 0) {
    const topDoc = context.documents[0]
    response = `Basado en mi conocimiento, puedo ayudarte con eso.\n\n`

    if (context.rag_context) {
      response += context.rag_context.text.substring(0, 1000)
      if (context.rag_context.text.length > 1000) {
        response += "\n\n[Respuesta truncada - puedo darte más detalles si necesitas]"
      }
    } else {
      response += topDoc.content.substring(0, 1000)
      if (topDoc.content.length > 1000) {
        response += "\n\n[Respuesta truncada - puedo darte más detalles si necesitas]"
      }
    }

    if (context.rag_context && context.rag_context.sources.length > 0) {
      response += `\n\nFuentes: ${context.rag_context.sources.map(s => s.title).join(", ")}`
    }
  } else {
    response = "No encontré información específica en mi base de conocimiento sobre eso. ¿Podrías reformular tu pregunta o darme más contexto?"
  }

  const outputSafety = checkOutputSafety(response)
  if (outputSafety.blocked) {
    response = "No puedo proporcionar esa información. ¿Hay algo más en lo que pueda ayudarte?"
  } else if (outputSafety.sanitized) {
    response = outputSafety.sanitized
  }

  await knowledgeRepo.logQuery({
    query,
    results_count: context.documents.length,
    top_score: context.confidence,
    source: "eliana_chat",
    channel: "web",
  })

  return {
    response,
    context,
    confidence: context.confidence,
    topics: context.topics,
  }
}

export async function detectKnowledgeGaps(
  query: string,
  response: string,
  confidence: number
): Promise<boolean> {
  if (confidence < 0.3 && query.length > 10) {
    try {
      await knowledgeRepo.createGap({
        gap_type: "missing_topic",
        title: `Knowledge gap detected: ${query.substring(0, 100)}`,
        description: `Low confidence (${Math.round(confidence * 100)}%) for query: ${query}`,
        related_query: query,
        priority: 5,
      })
      return true
    } catch (error) {
      // Silent fail for gap detection
    }
  }
  return false
}

export async function getKnowledgeSuggestions(
  currentContext: string,
  userRole?: string
): Promise<string[]> {
  const suggestions: string[] = []

  const topics = extractTopics(currentContext)

  const topicSuggestions: Record<string, string[]> = {
    marketplace: ["¿Cómo funcionan los envíos?", "¿Cómo creo mi tienda?", "¿Qué productos puedo vender?"],
    memberships: ["¿Qué planes hay?", "¿Cómo me suscribo?", "¿Cuáles son los beneficios?"],
    payments: ["¿Cómo pago?", "¿Aceptan tarjeta?", "¿Cómo funciona Stripe?"],
    delivery: ["¿Cuánto tarda el envío?", "¿Hacen envíos internacionales?", "¿Cómo rastreo mi pedido?"],
    referrals: ["¿Cómo invite amigos?", "¿Cuánto gano por referido?", "¿Dónde veo mis referidos?"],
    rewards: ["¿Cómo gano puntos?", "¿Qué puedo canjear?", "¿Cuántos puntos tengo?"],
    gemology: ["¿Qué es el cuarzo rosa?", "¿Cómo identifico gemas genuinas?", "¿Cuál es el valor del amatista?"],
    academy: ["¿Qué cursos hay?", "¿Cómo me inscribo?", "¿Hay certificados?"],
  }

  for (const topic of topics.slice(0, 3)) {
    const topicSugs = topicSuggestions[topic]
    if (topicSugs) {
      suggestions.push(...topicSugs.slice(0, 2))
    }
  }

  if (suggestions.length < 3) {
    suggestions.push(
      "¿Qué es MSM?",
      "¿Cómo funciona el Marketplace?",
      "¿Qué es el Consejo Invisible?"
    )
  }

  return suggestions.slice(0, 5)
}
