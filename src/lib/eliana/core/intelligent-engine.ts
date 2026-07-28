import { KNOWLEDGE_DOCS, type KnowledgeDoc } from "@/lib/knowledge-data"

// ================================================================
// ELIANA ADVANCED INTELLIGENT ENGINE v2.0
// Multi-turn context, cross-referencing, sentiment, proactive suggestions
// ================================================================

interface ScoredDoc {
  doc: KnowledgeDoc
  score: number
  matchedTerms: string[]
  relevanceSections: string[]
}

interface ConversationTurn {
  role: "user" | "eliana"
  text: string
  topics: string[]
  sentiment: Sentiment
  timestamp: number
}

type Sentiment =
  | "neutral"
  | "positive"
  | "negative"
  | "confused"
  | "urgent"
  | "curious"
  | "frustrated"
  | "excited"

type IntentType =
  | "greeting"
  | "question"
  | "command"
  | "complaint"
  | "gratitude"
  | "farewell"
  | "search"
  | "comparison"
  | "how_to"
  | "pricing"
  | "verification"
  | "general"

interface ClassifiedIntent {
  type: IntentType
  confidence: number
  entities: string[]
  topicHint: string
}

interface CrossReference {
  doc: KnowledgeDoc
  linkType: "related" | "prerequisite" | "deeper" | "alternative" | "complementary"
  reason: string
}

interface EngineResult {
  response: string
  suggestedFollowUps: string[]
  crossReferences: CrossReference[]
  confidence: number
  sentiment: Sentiment
  intent: ClassifiedIntent
  topics: string[]
}

// --- Tokenization ---

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s.,;:!?¡¿()\[\]{}"'+\-\/\\]+/)
    .filter((t) => t.length > 2)
}

function extractEntities(text: string): string[] {
  const entities: string[] = []
  const lower = text.toLowerCase()

  const productPatterns = [
    { pattern: /nevera|refrigerador|frigorifico/i, entity: "nevera" },
    { pattern: /tv|televisor|pantalla|smart\s*tv/i, entity: "televisor" },
    { pattern: /telefono|celular|movil|iphone|samsung/i, entity: "telefono" },
    { pattern: /laptop|computadora|pc|portatil/i, entity: "computadora" },
    { pattern: /zafiro|sapphire/i, entity: "zafiro" },
    { pattern: /rubi|ruby/i, entity: "rubi" },
    { pattern: /diamante|diamond/i, entity: "diamante" },
    { pattern: /esmeralda|emerald/i, entity: "esmeralda" },
  ]

  const msmPatterns = [
    { pattern: /album|vida|legado|genealogia/i, entity: "album_de_la_vida" },
    { pattern: /consejo.*invisible|gobernanza/i, entity: "consejo_invisible" },
    { pattern: /mente.*maestra|inteligencia.*colectiva/i, entity: "mente_maestra" },
    { pattern: /escuela|curso|certificacion|formacion/i, entity: "escuela" },
    { pattern: /marketplace|tienda.*online|vender.*online/i, entity: "marketplace" },
    { pattern: /referido|invitar|codigo.*referido/i, entity: "referidos" },
    { pattern: /pago|wallet|billetera|stripe|paypal/i, entity: "pagos" },
    { pattern: /envio|delivery|transporte|logistica/i, entity: "envios" },
    { pattern: /eliana|guia.*inteligente/i, entity: "eliana" },
    { pattern: /don.*miguel|miguel.*soria|fundador|ceo/i, entity: "don_miguel" },
    { pattern: /zafiro.*plataforma|red.*social.*conocimiento/i, entity: "plataforma_zafiro" },
    { pattern: /comunidad|social|grupo|circulo/i, entity: "comunidad" },
    { pattern: /rango|nivel|pts|puntos/i, entity: "rangos" },
    { pattern: /seguridad|contraseña|2fa|privacidad/i, entity: "seguridad" },
    { pattern: /marca.*personal|branding|rebranding/i, entity: "servicios_digitales" },
  ]

  for (const { pattern, entity } of [...productPatterns, ...msmPatterns]) {
    if (pattern.test(text)) entities.push(entity)
  }

  return [...new Set(entities)]
}

// --- Sentiment Detection ---

function detectSentiment(text: string, history: ConversationTurn[]): Sentiment {
  const lower = text.toLowerCase()

  // Check for urgency indicators
  if (/urgente|asap|ahora|ya|rapido|necesito.*ya|emergencia/.test(lower)) {
    return "urgent"
  }

  // Check for frustration
  if (
    /no funciona|error|problema|estafa|fraude|reclamo|queja|defectuoso|no llego|no recibi|malo|terrible|pesimo/.test(
      lower
    )
  ) {
    // Check if frustration is escalating from history
    const recentFrustration = history
      .slice(-3)
      .filter(
        (h) =>
          h.role === "user" &&
          h.sentiment === "frustrated"
      ).length
    if (recentFrustration >= 2) return "frustrated"
    return "negative"
  }

  // Check for confusion
  if (
    /no entiendo|no se|que es|como que|como funciona|expliqueme|no me queda|confundido|perdido/.test(
      lower
    )
  ) {
    return "confused"
  }

  // Check for curiosity
  if (
    /me gustaria|quiero saber|cuéntame|cuentame|interesa|curiosidad|que tal|como es/.test(
      lower
    )
  ) {
    return "curious"
  }

  // Check for excitement
  if (
    /genial|increible|fantastico|excelente|brutal|wow|cool|perfecto|me encanta|amazing/.test(
      lower
    )
  ) {
    return "excited"
  }

  // Check for gratitude/positive
  if (/gracias|agradezco|perfecto|bien|bueno|excelente|ok/.test(lower)) {
    return "positive"
  }

  // Check conversation history for mood trajectory
  if (history.length >= 2) {
    const recentSentiments = history.slice(-3).map((h) => h.sentiment)
    const negativeCount = recentSentiments.filter(
      (s) => s === "negative" || s === "frustrated"
    ).length
    if (negativeCount >= 2) return "frustrated"
  }

  return "neutral"
}

// --- Intent Classification ---

function classifyIntent(text: string, entities: string[]): ClassifiedIntent {
  const lower = text.toLowerCase().trim()
  const words = tokenize(text)

  // Greetings
  if (/^(hola|buenos|buenas|saludos|hey|hello|hi\b|bendiciones|que tal)/.test(lower)) {
    return { type: "greeting", confidence: 0.95, entities, topicHint: "general" }
  }

  // Farewells
  if (/(adios|bye|nos vemos|hasta luego|chao|hasta pronto)/.test(lower)) {
    return { type: "farewell", confidence: 0.95, entities, topicHint: "general" }
  }

  // Gratitude
  if (/^(gracias|agradezco|thank)/.test(lower)) {
    return { type: "gratitude", confidence: 0.95, entities, topicHint: "general" }
  }

  // Complaint / negative
  if (
    /no funciona|error|problema|estafa|fraude|reclamo|queja|defectuoso|no llego|no recibi|reembolso|disputa/.test(
      lower
    )
  ) {
    return { type: "complaint", confidence: 0.9, entities, topicHint: "soporte" }
  }

  // Pricing
  if (
    /cuanto|precio|cuesta|costo|tarifa|plan|suscripcion|cuanto vale|a cuanto/.test(lower)
  ) {
    return { type: "pricing", confidence: 0.85, entities, topicHint: "pricing" }
  }

  // How-to
  if (
    /como|como se|como puedo|como hago|pasos|instrucciones|tutorial|guia|paso a paso/.test(
      lower
    )
  ) {
    return { type: "how_to", confidence: 0.85, entities, topicHint: "guide" }
  }

  // Search / browse
  if (
    /buscar|busco|encontrar|ver|mostrar|listar|catalogo|catalogo|disponible/.test(lower)
  ) {
    return { type: "search", confidence: 0.8, entities, topicHint: "search" }
  }

  // Comparison
  if (
    /diferencia|diferente|comparar|comparacion|versus|vs|mejor|peor|cual es mejor/.test(
      lower
    )
  ) {
    return { type: "comparison", confidence: 0.8, entities, topicHint: "comparison" }
  }

  // Verification
  if (
    /confirmar|verificar|es verdad|esta seguro|realmente|de verdad|confirmo/.test(lower)
  ) {
    return { type: "verification", confidence: 0.75, entities, topicHint: "general" }
  }

  // Default: question
  if (/\?/.test(text) || /^(que|quien|cuando|donde|por que|cuantos)/.test(lower)) {
    return { type: "question", confidence: 0.7, entities, topicHint: "question" }
  }

  return { type: "general", confidence: 0.5, entities, topicHint: entities[0] || "general" }
}

// --- Topic Extraction ---

function extractTopics(text: string, entities: string[]): string[] {
  const topics: string[] = []
  const lower = text.toLowerCase()

  // Map entities to topics
  const entityTopicMap: Record<string, string> = {
    album_de_la_vida: "Album de la Vida",
    consejo_invisible: "Consejo Invisible",
    mente_maestra: "Mente Maestra",
    escuela: "Escuela MSM",
    marketplace: "Marketplace MSM",
    referidos: "Sistema de Referidos",
    pagos: "MSM Payments",
    envios: "MSM Delivery",
    eliana: "ELIANA",
    don_miguel: "Don Miguel Soria",
    plataforma_zafiro: "ZAFIRO",
    comunidad: "Comunidad ZAFIRO",
    rangos: "Rangos MSM",
    seguridad: "Seguridad",
    servicios_digitales: "Servicios Digitales",
    nevera: "Productos",
    televisor: "Productos",
    telefono: "Productos",
    computadora: "Productos",
    zafiro: "Gemologia",
    rubi: "Gemologia",
    diamante: "Gemologia",
    esmeralda: "Gemologia",
  }

  for (const entity of entities) {
    const topic = entityTopicMap[entity]
    if (topic) topics.push(topic)
  }

  // Also extract from keywords
  if (/gemologia|piedra|gema|corindon/.test(lower)) topics.push("Gemologia")
  if (/servicio|digital|marca|web|app/.test(lower)) topics.push("Servicios Digitales")
  if (/producto|comprar|equipo/.test(lower)) topics.push("Marketplace MSM")

  return [...new Set(topics)]
}

// --- Cross-Reference Engine ---

const CROSS_REF_MAP: Record<string, string[]> = {
  "Album de la Vida": ["Comunidad ZAFIRO", "Rangos MSM", "Don Miguel Soria"],
  "Consejo Invisible": ["Rangos MSM", "Mente Maestra", "Don Miguel Soria"],
  "Mente Maestra": ["Comunidad ZAFIRO", "Consejo Invisible", "Escuela MSM"],
  "Escuela MSM": ["Servicios Digitales", "Rangos MSM", "Mente Maestra"],
  "Marketplace MSM": ["MSM Payments", "MSM Delivery", "Servicios Digitales", "Sistema de Referidos"],
  "Sistema de Referidos": ["Rangos MSM", "Marketplace MSM", "Comunidad ZAFIRO"],
  "MSM Payments": ["Marketplace MSM", "Seguridad", "MSM Delivery"],
  "MSM Delivery": ["Marketplace MSM", "MSM Payments"],
  "ELIANA": ["ZAFIRO", "Marketplace MSM", "Servicios Digitales"],
  "Don Miguel Soria": ["ZAFIRO", "Consejo Invisible", "Album de la Vida"],
  "ZAFIRO": ["ELIANA", "Comunidad ZAFIRO", "Escuela MSM", "Marketplace MSM"],
  "Comunidad ZAFIRO": ["ZAFIRO", "Mente Maestra", "Rangos MSM"],
  "Rangos MSM": ["Sistema de Referidos", "Escuela MSM", "Comunidad ZAFIRO"],
  "Seguridad": ["MSM Payments", "Comunidad ZAFIRO"],
  "Servicios Digitales": ["Escuela MSM", "Marketplace MSM"],
  "Gemologia": ["ELIANA", "Marketplace MSM"],
  "Productos": ["Marketplace MSM", "MSM Payments", "MSM Delivery"],
}

function getCrossReferences(topics: string[]): CrossReference[] {
  const refs: CrossReference[] = []
  const seen = new Set<string>()

  for (const topic of topics) {
    const relatedTopics = CROSS_REF_MAP[topic] || []
    for (const related of relatedTopics) {
      if (seen.has(related)) continue
      seen.add(related)

      const doc = KNOWLEDGE_DOCS.find(
        (d) =>
          d.title.toLowerCase().includes(related.toLowerCase()) ||
          d.tags.some((t) => t.toLowerCase().includes(related.toLowerCase().slice(0, 5)))
      )

      if (doc) {
        const linkTypes: Array<"related" | "prerequisite" | "deeper" | "alternative" | "complementary"> = [
          "related",
          "complementary",
          "deeper",
        ]
        refs.push({
          doc,
          linkType: linkTypes[refs.length % linkTypes.length],
          reason: related,
        })
      }
    }
  }

  return refs.slice(0, 3)
}

// --- Multi-Document Synthesis ---

function synthesizeResponse(
  query: string,
  scoredDocs: ScoredDoc[],
  intent: ClassifiedIntent,
  sentiment: Sentiment,
  history: ConversationTurn[]
): string {
  if (scoredDocs.length === 0) return ""

  // Build contextual intro based on intent + sentiment
  let intro = ""
  switch (sentiment) {
    case "urgent":
      intro = "Entiendo la urgencia. "
      break
    case "frustrated":
      intro = "Lamento que estés teniendo problemas. "
      break
    case "confused":
      intro = "Con gusto te explico. "
      break
    case "curious":
      intro = "Buena pregunta. "
      break
    case "excited":
      intro = "Me alebra tu interés. "
      break
    case "positive":
      intro = ""
      break
    default:
      intro = ""
  }

  // Build structured response from top docs
  const sections: string[] = []

  for (let i = 0; i < scoredDocs.length; i++) {
    const { doc, score, matchedTerms, relevanceSections } = scoredDocs[i]
    const relevance = score >= 30 ? "alta" : score >= 15 ? "media" : "baja"
    const title =
      i === 0
        ? `**${doc.title}**`
        : `**${doc.title}**`

    // Use pre-extracted relevant sections
    let content = relevanceSections.join("\n").trim()

    // Trim to appropriate length based on position
    const maxLen = i === 0 ? 600 : 400
    if (content.length > maxLen) {
      content = content.slice(0, maxLen) + "..."
    }

    sections.push(`${title}\n${content}`)
  }

  // Compose final response
  const response = intro + sections.join("\n\n---\n\n")

  return response
}

// --- Proactive Follow-Up Suggestions ---

function generateFollowUps(
  topics: string[],
  intent: ClassifiedIntent,
  sentiment: Sentiment,
  scoredDocs: ScoredDoc[]
): string[] {
  const suggestions: string[] = []

  // Based on topics discussed
  for (const topic of topics) {
    switch (topic) {
      case "Marketplace MSM":
        if (!topics.includes("MSM Payments"))
          suggestions.push("¿Quieres conocer los métodos de pago disponibles?")
        if (!topics.includes("MSM Delivery"))
          suggestions.push("¿Necesitas información sobre envíos?")
        suggestions.push("¿Te gustaría crear tu propia tienda en el Marketplace?")
        break
      case "Escuela MSM":
        suggestions.push("¿Qué tema te gustaría aprender primero?")
        suggestions.push("¿Te interesa obtener un certificado MSM?")
        break
      case "Album de la Vida":
        suggestions.push("¿Quieres que te explique los planes disponibles?")
        suggestions.push("¿Te gustaría compartir tu álbum con familiares?")
        break
      case "Consejo Invisible":
        suggestions.push("¿Quieres saber cómo presentar una propuesta?")
        suggestions.push("¿Conoces el sistema de rangos del ecosistema MSM?")
        break
      case "Sistema de Referidos":
        suggestions.push("¿Quieres conocer tu código de referido?")
        suggestions.push("¿Sabías que también ganas comisiones en las primeras compras?")
        break
      case "Servicios Digitales":
        suggestions.push("¿Te gustaría ver el paquete completo de servicios?")
        suggestions.push("¿Quieres que te oriente sobre el servicio ideal para ti?")
        break
      case "Gemologia":
        suggestions.push("¿Te gustaría aprender sobre algún tipo de gema específico?")
        suggestions.push("¿Conoces el Valle de Mogok y sus zafiros legendarios?")
        break
      case "Seguridad":
        suggestions.push("¿Ya tienes activada la autenticación de dos factores?")
        suggestions.push("¿Necesitas ayuda para restablecer tu contraseña?")
        break
      case "ELIANA":
        suggestions.push("¿Qué parte del ecosistema MSM te gustaría explorar?")
        suggestions.push("¿Quieres que te cuente sobre las capacidades de ZAFIRO?")
        break
      case "Don Miguel Soria":
        suggestions.push("¿Quieres conocer los valores fundacionales de MSM?")
        suggestions.push("¿Te gustaría contactar a Don Miguel por WhatsApp?")
        break
      case "ZAFIRO":
        suggestions.push("¿Qué módulo de ZAFIRO te interesa?")
        suggestions.push("¿Quieres unirte a la comunidad ZAFIRO?")
        break
      case "Comunidad ZAFIRO":
        suggestions.push("¿Qué Círculo de interés te gustaría unir?")
        suggestions.push("¿Te gustaría asistir a un evento o webinar?")
        break
      case "Rangos MSM":
        suggestions.push("¿Cuántos PTS tienes actualmente?")
        suggestions.push("¿Sabías que los Maestros pueden ser parte del Consejo Invisible?")
        break
      case "MSM Payments":
        suggestions.push("¿Quieres saber sobre los métodos de pago disponibles?")
        suggestions.push("¿Te gustaría conocer el estado de un pedido?")
        break
      case "MSM Delivery":
        suggestions.push("¿Necesitas hacer seguimiento de un envío?")
        suggestions.push("¿Te gustaría saber los tiempos de entrega estimados?")
        break
    }
  }

  // Based on intent
  if (intent.type === "how_to" && suggestions.length === 0) {
    suggestions.push("¿Necesitas más detalles sobre algún paso específico?")
    suggestions.push("¿Quieres que te lo explique paso a paso?")
  }
  if (intent.type === "pricing" && suggestions.length === 0) {
    suggestions.push("¿Te gustaría ver una comparación de planes?")
    suggestions.push("¿Quieres saber qué incluye cada plan?")
  }
  if (intent.type === "question" && suggestions.length === 0) {
    suggestions.push("¿Necesitas más detalles sobre algún punto?")
    suggestions.push("¿Hay algo específico que quieras profundizar?")
  }
  if (intent.type === "search" && suggestions.length === 0) {
    suggestions.push("¿Qué tipo de producto buscas?")
    suggestions.push("¿Quieres que te recomiende algo?")
  }
  if (intent.type === "comparison" && suggestions.length === 0) {
    suggestions.push("¿Qué opciones quieres comparar específicamente?")
    suggestions.push("¿Qué es lo más importante para ti?")
  }
  if (sentiment === "confused" && suggestions.length === 0) {
    suggestions.push("¿Quieres que te lo explique con más detalle?")
    suggestions.push("¿Hay alguna parte que no te haya quedado clara?")
  }
  if ((sentiment === "negative" || sentiment === "frustrated") && suggestions.length === 0) {
    suggestions.push("¿Puedes contarme más sobre el problema que tienes?")
    suggestions.push("¿Quieres que te conecte con soporte humano?")
  }

  // Catch-all: always provide suggestions if none generated yet
  if (suggestions.length === 0) {
    suggestions.push("¿Qué parte del ecosistema MSM te interesa?")
    suggestions.push("¿Quieres que te recomiende algo?")
  }

  // Limit and return
  return [...new Set(suggestions)].slice(0, 3)
}

// --- Main Engine ---

function scoreDocumentAdvanced(
  query: string,
  doc: KnowledgeDoc,
  intent: ClassifiedIntent
): ScoredDoc {
  const queryTerms = tokenize(query)
  const titleTerms = tokenize(doc.title)
  const contentTerms = tokenize(doc.content)
  const tagTerms = doc.tags.map((t) => t.toLowerCase())

  let score = 0
  const matchedTerms: string[] = []

  for (const term of queryTerms) {
    // Title match (highest weight)
    if (titleTerms.some((t) => t.includes(term) || term.includes(t))) {
      score += 12
      matchedTerms.push(term)
    }
    // Tag match (high weight)
    if (tagTerms.some((t) => t.includes(term) || term.includes(t))) {
      score += 10
      matchedTerms.push(term)
    }
    // Content match (medium weight)
    const contentLower = doc.content.toLowerCase()
    if (contentLower.includes(term)) {
      score += 4
      const count = (contentLower.match(new RegExp(term, "g")) || []).length
      score += Math.min(count, 5)
      matchedTerms.push(term)
    }
  }

  // Bonus for exact phrase match
  const queryLower = query.toLowerCase()
  if (doc.content.toLowerCase().includes(queryLower)) {
    score += 25
  }
  if (doc.title.toLowerCase().includes(queryLower)) {
    score += 20
  }

  // Intent-specific bonuses
  if (intent.type === "pricing" && /precio|costo|plan|tarifa/i.test(doc.content)) {
    score += 8
  }
  if (intent.type === "how_to" && /paso|instruccion|guia|como/i.test(doc.content)) {
    score += 6
  }

  // Bonus for doc_form
  if (doc.doc_form === "qa_model") score += 3

  // Extract relevant sections
  const relevanceSections = extractRelevantSectionsAdvanced(
    doc.content,
    query,
    queryTerms
  )

  return { doc, score, matchedTerms: [...new Set(matchedTerms)], relevanceSections }
}

function extractRelevantSectionsAdvanced(
  content: string,
  query: string,
  queryTerms: string[]
): string[] {
  const lines = content.split("\n").filter((l) => l.trim().length > 0)

  const scoredLines = lines.map((line, idx) => {
    const lineLower = line.toLowerCase()
    let relevance = 0
    for (const term of queryTerms) {
      if (lineLower.includes(term)) relevance += 5
    }
    if (line.startsWith("#")) relevance += 4
    if (line.startsWith("- ") || line.startsWith("* ")) relevance += 1
    return { line, idx, relevance }
  })

  const relevant = scoredLines
    .sort((a, b) => b.relevance - a.relevance)
    .filter((s) => s.relevance > 0)
    .slice(0, 10)
    .sort((a, b) => a.idx - b.idx)

  return relevant.map(({ line }) => {
    return line.replace(/^#{1,4}\s/, "").trim()
  })
}

export function processMessage(
  message: string,
  history: Array<{ role: string; text?: string; content?: string }>
): EngineResult {
  // Build conversation turns from history with full analysis
  const turns: ConversationTurn[] = (history || []).map((h) => {
    const text = h.text || h.content || ""
    const entities = extractEntities(text)
    const topics = extractTopics(text, entities)
    return {
      role: h.role === "model" ? "eliana" : "user",
      text,
      topics,
      sentiment: detectSentiment(text, []),
      timestamp: 0,
    }
  })

  // Extract ALL topics discussed in the conversation (memory)
  const conversationTopics = [...new Set(turns.flatMap((t) => t.topics))]

  // Classify intent and extract entities
  const entities = extractEntities(message)
  const intent = classifyIntent(message, entities)

  // Detect sentiment with context
  const sentiment = detectSentiment(message, turns)

  // Extract topics
  const topics = extractTopics(message, entities)

  // Score all documents
  const scored = KNOWLEDGE_DOCS.map((doc) =>
    scoreDocumentAdvanced(message, doc, intent)
  )
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  // Synthesize response
  const response = synthesizeResponse(message, scored, intent, sentiment, turns)

  // Get cross-references
  const crossReferences = getCrossReferences(topics)

  // Generate follow-up suggestions (with conversation memory)
  const suggestedFollowUps = generateFollowUps(
    [...new Set([...topics, ...conversationTopics])],
    intent,
    sentiment,
    scored
  )

  // Calculate confidence
  const confidence =
    scored.length > 0
      ? Math.min(0.5 + scored[0].score / 100, 0.95)
      : 0.2

  return {
    response,
    suggestedFollowUps,
    crossReferences,
    confidence,
    sentiment,
    intent,
    topics,
  }
}

// --- Formatting helpers for the API ---

export function formatResponseWithSuggestions(
  response: string,
  followUps: string[]
): string {
  if (followUps.length === 0) return response
  const suggestions = followUps.map((s) => `• ${s}`).join("\n")
  return `${response}\n\n**¿Quieres que profundice en algo?**\n${suggestions}`
}

export function formatCrossReferences(refs: CrossReference[]): string {
  if (refs.length === 0) return ""
  const lines = refs.map(
    (r) => `• **${r.doc.title}** — ${r.reason}`
  )
  return `**Temas relacionados que podrían interesarte:**\n${lines.join("\n")}`
}
