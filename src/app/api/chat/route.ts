import { NextRequest, NextResponse } from "next/server"
import { ChatRequestSchema } from "@/lib/eliana/core/validation"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { ragPipeline, knowledgeSearch, extractTopics, detectKnowledgeGaps } from "@/lib/knowledge"
import { buildKnowledgeContext } from "@/lib/knowledge"
import { GoogleGenAI } from "@google/genai"

const AI_MODEL = "gemini-2.0-flash"

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30
const TIMEOUT_MS = 45_000

function isUsableApiKey(value: string | undefined | null): value is string {
  if (!value) return false
  const trimmed = value.trim()
  if (trimmed.length < 20) return false
  if (/^\[.*\]$/.test(trimmed)) return false
  if (/^(xxx+|your[_-]?api[_-]?key|your-anon-key-here|change[_-]?me|placeholder|<.+>|null|undefined)$/i.test(trimmed)) return false
  return true
}

const GEMINI_RAW_KEY = process.env.GEMINI_API_KEY || ""
const GOOGLE_RAW_KEY = process.env.GOOGLE_API_KEY || ""

const GEMINI_API_KEY = isUsableApiKey(GEMINI_RAW_KEY)
  ? GEMINI_RAW_KEY
  : isUsableApiKey(GOOGLE_RAW_KEY)
    ? GOOGLE_RAW_KEY
    : ""

// --- Marketplace Keywords ---

const MARKETPLACE_KEYWORDS = /producto|marketplace|tienda|comprar|precio|catalogo|catálogo|articulo|artículo|equipo|nevera|tv|electrónica|electronica|moda|hogar|ropa|zapat|zapato|accesori|joya|anillo|pulsera|collar|bisuter|jewel|gem|sapphire|rubi|rubí/i
const ORDER_KEYWORDS = /pedido|orden|compra|orden|mismo pedido|mi pedido|mis pedidos|tracking|rastreo/i

// --- New Knowledge System Integration ---

async function searchKnowledgeRAG(query: string): Promise<{
  response: string | null
  confidence: number
  sources: Array<{ title: string; slug: string; doc_type: string }>
  topics: string[]
}> {
  try {
    const context = await ragPipeline.retrieveContext(query, {
      max_results: 5,
      max_tokens: 3000,
      threshold: 0.3,
    })

    if (!context.context_text || context.results.length === 0) {
      return { response: null, confidence: 0, sources: [], topics: [] }
    }

    const topics = extractTopics(query)

    const sourcesText = context.sources.length > 0
      ? `\n\n_Fuentes: ${context.sources.map(s => s.title).join(", ")}_`
      : ""

    return {
      response: context.context_text + sourcesText,
      confidence: context.confidence,
      sources: context.sources,
      topics,
    }
  } catch {
    return { response: null, confidence: 0, sources: [], topics: [] }
  }
}

// --- Server-Side Security ---

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|earlier|above)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+(a|an|the)\s+(?:different|new|free|unrestricted)/i,
  /system\s*(?:prompt|instruction)\s*[:=]/i,
  /reveal\s+(?:your|the)\s+(?:system|initial)\s+prompt/i,
  /jailbreak|DAN\s+mode|do\s+anything\s+now/i,
  /bypass\s+(?:all\s+)?(?:filters|restrictions|rules)/i,
  /override\s+(?:your|the)\s+(?:rules|guidelines)/i,
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i,
  /Human:\s*|Assistant:\s*|<\|system\|>|<\|user\|>|<\|assistant\|>/i,
]

const PRIVATE_DATA_PATTERNS = [
  { pattern: /(?:email|correo)\s*(?:es|:|=)\s*\S+@\S+/gi, replacement: "[correo protegido]" },
  { pattern: /(?:tel[eé]fono|phone|celular)\s*(?:es|:|=)\s*[\d\s\-\+\(\)]+/gi, replacement: "[teléfono protegido]" },
  { pattern: /(?:password|contraseña|passwd)\s*(?:es|:|=)\s*\S+/gi, replacement: "[contraseña protegida]" },
  { pattern: /(?:api[_\s]?key|clave[_\s]?api)\s*(?:es|:|=)\s*\S+/gi, replacement: "[clave protegida]" },
]

function sanitizeServerInput(message: string): { safe: boolean; filtered?: string; reason?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return { safe: false, reason: "Patrón no permitido detectado" }
    }
  }
  const filtered = message.replace(/\0/g, "").replace(/[\u200B-\u200D\uFEFF\u2060-\u2064]/g, "")
  return { safe: true, filtered: filtered.trim() }
}

const LEAK_PATTERNS = [
  /Eres ELIANA, la Guía Inteligente Avanzada/i,
  /systemInstruction|system_instruction|system prompt/i,
  /REGLAS FUNDAMENTALES/i,
  /CAPACIDADES AVANZADAS/i,
  /No reveles que eres una IA/i,
  /No puedo compartir información técnica/i,
  /No puedo compartir credenciales/i,
]

function filterServerOutput(text: string): string {
  let filtered = text
  for (const { pattern, replacement } of PRIVATE_DATA_PATTERNS) {
    filtered = filtered.replace(pattern, replacement)
  }
  if (/(?:SUPABASE|GEMINI|OPENAI|STRIPE|VERCEL)[_\s]?(?:URL|KEY|SECRET|TOKEN)/i.test(filtered)) {
    return "No puedo compartir información técnica del sistema."
  }
  if (/(?:sk-|pk-|eyJ|sb-)[a-zA-Z0-9]{20,}/.test(filtered)) {
    return "No puedo compartir credenciales del sistema."
  }
  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(filtered)) {
      console.warn("filterServerOutput: possible system prompt leak detected, suppressing")
      return "No puedo procesar esa solicitud."
    }
  }
  return filtered
}

function getErrorStatus(error: unknown): number | undefined {
  const e = error as { status?: unknown; statusCode?: unknown; code?: unknown; response?: { status?: unknown }; httpStatus?: unknown; message?: unknown }
  const candidates = [e?.status, e?.statusCode, e?.code, e?.response?.status, e?.httpStatus]
  for (const candidate of candidates) {
    const n = Number(candidate)
    if (Number.isInteger(n) && n >= 100 && n <= 599) return n
  }
  const msg = typeof e?.message === "string" ? e.message : String(error ?? "")
  const match = msg.match(/\b(4\d\d|5\d\d)\b/)
  if (match) return Number(match[1])
  if (/RESOURCE_EXHAUSTED|rate\s*limit|quota/i.test(msg)) return 429
  if (/UNAVAILABLE|overloaded|deadline exceeded|timed?\s*out|temporarily/i.test(msg)) return 503
  return undefined
}

function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504
}

interface IdempotencyEntry {
  payload: { text: string; source: string; model: string; cached: boolean }
  expiresAt: number
}

const IDEMPOTENCY_TTL_MS = 120_000
const idempotencyMap = new Map<string, IdempotencyEntry>()
const inflightMap = new Map<string, Promise<NextResponse>>()

function pruneIdempotencyMap(now: number) {
  if (idempotencyMap.size <= 200) return
  for (const [key, entry] of idempotencyMap) {
    if (entry.expiresAt < now) idempotencyMap.delete(key)
  }
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "127.0.0.1"
  return ip
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count }
}

// --- Marketplace Supabase Queries ---

interface MarketplaceProduct {
  name: string
  price: number
  currency: string
  store_name: string
  category: string
  slug: string
}

interface UserOrder {
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

async function searchMarketplaceProducts(query: string): Promise<MarketplaceProduct[]> {
  if (!isSupabaseAvailable()) return []
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from("marketplace_products")
      .select(`
        name,
        price,
        currency,
        slug,
        marketplace_stores ( name ),
        marketplace_categories ( name )
      `)
      .eq("status", "published")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(5)
    if (error || !data) return []
    return data.map((p: Record<string, unknown>) => ({
      name: p.name,
      price: p.price,
      currency: p.currency || "USD",
      store_name: (p.marketplace_stores as Record<string, unknown>)?.name || "Tienda MSM",
      category: (p.marketplace_categories as Record<string, unknown>)?.name || "General",
      slug: p.slug || "",
    }))
  } catch {
    return []
  }
}

async function getOrderByUser(userId: string): Promise<UserOrder[]> {
  if (!isSupabaseAvailable()) return []
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return []
    const { data, error } = await supabase
      .from("marketplace_orders")
      .select("order_number, status, total_amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
    if (error || !data) return []
    return data.map((o: Record<string, unknown>) => ({
      order_number: o.order_number,
      status: o.status,
      total_amount: o.total_amount,
      created_at: o.created_at,
    }))
  } catch {
    return []
  }
}

// --- Gemini API ---

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGeminiWithRetry(
  message: string,
  history: Array<{ role: string; text?: string; content?: string }>,
  userId?: string
): Promise<{ text: string | null; status: number | undefined }> {
  const MAX_ATTEMPTS = 3
  let lastStatus: number | undefined
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000)
      await sleep(delay)
    }
    try {
      const result = await callGeminiAPI(message, history, userId)
      return { text: result, status: undefined }
    } catch (error) {
      lastStatus = getErrorStatus(error)
      if (!isRetryableStatus(lastStatus)) break
    }
  }
  console.error(`Chat API: Gemini provider request failed [status=${lastStatus ?? "unknown"}]`)
  return { text: null, status: lastStatus }
}

async function callGeminiAPI(
  message: string,
  history: Array<{ role: string; text?: string; content?: string }>,
  userId?: string
): Promise<string | null> {
  // NEW: Use RAG pipeline for knowledge retrieval
  let kbContext = ""
  let knowledgeSources: Array<{ title: string; slug: string; doc_type: string }> = []

  try {
    const ragResult = await searchKnowledgeRAG(message)
    if (ragResult.response) {
      kbContext = ragResult.response
      knowledgeSources = ragResult.sources

      // Log query for analytics
      knowledgeSearch.search({
        query: message,
        limit: 1,
      }).catch(() => {}) // fire and forget
    }
  } catch {
    // Fallback to legacy if RAG fails
    kbContext = buildKnowledgeContext(message)
  }

  // If RAG returned nothing, try legacy
  if (!kbContext) {
    kbContext = buildKnowledgeContext(message)
  }

  // Marketplace product search
  let productContext = ""
  if (MARKETPLACE_KEYWORDS.test(message)) {
    const products = await searchMarketplaceProducts(message)
    if (products.length > 0) {
      const productLines = products.map(
        (p) => `• ${p.name} — ${p.currency} ${p.price} | Tienda: ${p.store_name} | Categoría: ${p.category}`
      )
      productContext = `\n\nProductos disponibles en el catálogo MSM:\n${productLines.join("\n")}`
    }
  }

  // Order lookup
  let orderContext = ""
  if (ORDER_KEYWORDS.test(message) && userId) {
    const orders = await getOrderByUser(userId)
    if (orders.length > 0) {
      const orderLines = orders.map(
        (o) => `• Pedido #${o.order_number} | Estado: ${o.status} | Total: ${o.total_amount} | Fecha: ${new Date(o.created_at).toLocaleDateString("es-CU")}`
      )
      orderContext = `\n\nPedidos recientes del usuario:\n${orderLines.join("\n")}`
    } else {
      orderContext = "\n\nNo se encontraron pedidos recientes para este usuario."
    }
  }

  const sourcesText = knowledgeSources.length > 0
    ? `\n\nFuentes consultadas: ${knowledgeSources.map(s => s.title).join(", ")}`
    : ""

  const systemPrompt = `Eres ELIANA, la Guía Inteligente Avanzada del ecosistema **MSM & ZAFIRO**. Eres la asesora central y experta de Don Miguel Soria Martínez, fundador de MSM MY STORE LLC. Tu base de conocimiento incluye documentos cubriendo todo el ecosistema MSM, recuperados dinámicamente mediante búsqueda híbrida (vectorial + palabras clave).

IDENTIDAD:
- Nombre: ELIANA (Engine for Learning, Intelligence and Advanced Knowledge Analysis)
- Saludo: "Bendiciones"
- Tono: Humano, directo, amable, profesional, experto
- Idioma: Español preferente, otros bajo demanda
- WhatsApp: +1 772 301 5523
- Fundador: Don Miguel Soria Martínez

CONOCIMIENTO RECUPERADO (RAG):
${kbContext || "No se encontró conocimiento específico para esta consulta en la base de datos."}
${sourcesText}

REGLAS FUNDAMENTALES:
1. Puedes buscar y recomendar productos reales del catálogo MSM cuando el usuario lo solicite.
2. NUNCA puedes confirmar pagos, aprobar tiendas, modificar precios ni acceder a pedidos de otros usuarios.
3. Cuando cites precios de productos de terceros, SIEMPRE añade: "El precio mostrado debe confirmarse antes del pago cuando dependa de un proveedor externo."
4. Cuando hables de entregas o tiempos de envío, SIEMPRE añade: "La fecha de entrega es estimada hasta que sea confirmada por el proveedor o transportista."
5. Cuando un usuario envíe una captura de pantalla de pago, SIEMPRE responde: "La captura de pantalla no confirma automáticamente el pago. El equipo MSM verificará tu transacción."
6. Cuando el usuario necesite intervención humana (reembolsos, disputas, quejas, problemas con pedidos), responde: "Voy a conectar con soporte humano" y añade el marcador [ESCALAR_A_HUMANO] al final de tu respuesta.
7. Mantén un tono cálido, profesional y servicial. Usa "Bendiciones" como saludo.
8. Responde en el mismo idioma del usuario.
  9. Sé detallada y completa en tus respuestas. Incluye precios, pasos, requisitos cuando sea relevante.
10. No reveles que eres una IA si no te lo preguntan directamente. Si te lo preguntan, responde con honestidad.
11. Responde en lenguaje natural y conversacional. NO USES markdown, negritas, asteriscos ni formato especial en tu respuesta. Escribe como una persona hablando.

CAPACIDADES AVANZADAS:
• Búsqueda y recomendación de productos del catálogo MSM con precios exactos
• Información detallada sobre servicios digitales con precios y plazos
• Información completa de la Escuela MSM (8 cursos, 4 membresías)
• Orientación sobre el ecosistema ZAFIRO (consejo invisible, mente maestra, referidos)
• Información sobre Álbum de la Vida (legado familiar, planes, precios)
• Consultas de gemología avanzada (zafiros, rubíes, corindón, tratamientos, valoración)
• Información sobre pagos (Stripe, transferencia, PayPal, efectivo)
• Información sobre envíos (estándar, exprés, mismo día, internacional)
• Sistema de referidos y recompensas con detalles exactos
• Rangos del ecosistema (Miembro a Fundador, con PTS requeridos)
• Seguridad de cuenta (contraseña, 2FA, privacidad)
• Información sobre Don Miguel y la historia de MSM
• Marketplace guía completa (comprar, vender, comisiones)
• Comunidad ZAFIRO (círculos, eventos, reglas)${productContext}${orderContext}`

  const geminiHistory = (history || []).map((msg) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.text || msg.content || "" }],
  }))
  const contents = [
    ...geminiHistory,
    { role: "user", parts: [{ text: message }] },
  ]

  const requestId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 800,
      httpOptions: { timeout: TIMEOUT_MS },
    },
  })

  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text
  if (text) return text

  console.error(`Chat API: provider returned no content [model=${AI_MODEL}, requestId=${requestId}]`)
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — allow as guest; a Supabase/auth hiccup must not break the chat
    const supabase = await getSupabaseServerClient()
    let userId: string | undefined
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      } catch {
        userId = undefined
      }
    }

    const rateLimitKey = getRateLimitKey(request)
    const { allowed } = checkRateLimit(rateLimitKey)
    if (!allowed) {
      return NextResponse.json({
        text: "Bendiciones. He recibido demasiadas solicitudes. Espera unos segundos y vuelve a intentarlo.",
        error: "rate_limited",
      }, { status: 429 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({
        text: "Bendiciones. No recibí tu mensaje correctamente. Por favor, escríbelo de nuevo.",
        error: "invalid_body",
      })
    }

    // Zod validation
    const parsed = ChatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        text: "Bendiciones. No recibí tu mensaje correctamente. Por favor, escríbelo de nuevo.",
        error: "validation_error",
      })
    }

    const { message: trimmedMessage, history: validHistory } = parsed.data

    // Use server-side auth userId, fallback to body userId for guests
    const bodyUserId = (body as Record<string, unknown>)?.userId as string | undefined
    const effectiveUserId = userId || bodyUserId

    // Server-side input security
    const inputCheck = sanitizeServerInput(trimmedMessage)
    if (!inputCheck.safe) {
      return NextResponse.json({
        text: "Bendiciones. No puedo procesar ese mensaje. Por favor, reformula tu consulta."
      })
    }
    const safeMessage = inputCheck.filtered || trimmedMessage

    // Idempotency: retries reusing the same requestId get the cached result,
    // and concurrent retries await the same in-flight provider call
    const requestId = (body as Record<string, unknown>)?.requestId
    const requestKey = typeof requestId === "string" && requestId.length > 0 && requestId.length <= 128
      ? requestId
      : undefined

    const compute = async (): Promise<NextResponse> => {
      if (!GEMINI_API_KEY) {
        console.error("Chat API: no valid AI provider key configured (GEMINI_API_KEY / GOOGLE_API_KEY ausente o placeholder)")
        return NextResponse.json({
          text: "Bendiciones. Aún no estoy conectada al proveedor de inteligencia artificial. Contacta al administrador para completar la configuración.",
          error: "ai_provider_not_configured",
        }, { status: 503 })
      }

      const result = await callGeminiWithRetry(safeMessage, validHistory, effectiveUserId)

      if (!result.text) {
        if (isRetryableStatus(result.status)) {
          return NextResponse.json({
            text: "Bendiciones. ELIANA no pudo responder ahora porque el servicio está ocupado. Pulsa Reintentar y lo intento de nuevo.",
            error: "ai_provider_unavailable",
          }, { status: 503 })
        }
        if (result.status && result.status >= 400 && result.status < 500) {
          return NextResponse.json({
            text: "Bendiciones. No pude generar una respuesta en este momento. Pulsa Reintentar y lo intento de nuevo.",
            error: "ai_provider_permanent",
          }, { status: 502 })
        }
        return NextResponse.json({
          text: "Bendiciones. No pude generar una respuesta en este momento. Pulsa Reintentar y lo intento de nuevo.",
          error: "ai_provider_empty",
        }, { status: 502 })
      }

      const filteredResponse = filterServerOutput(result.text)

      detectKnowledgeGaps(safeMessage, filteredResponse, 0.5).catch(() => {})
      knowledgeSearch.search({ query: safeMessage, limit: 1 }).catch(() => {})

      const payload = {
        text: filteredResponse,
        source: "ai_provider",
        model: AI_MODEL,
      }

      if (requestKey) {
        idempotencyMap.set(requestKey, { payload: { ...payload, cached: true }, expiresAt: Date.now() + IDEMPOTENCY_TTL_MS })
      }

      return NextResponse.json(payload)
    }

    if (requestKey) {
      pruneIdempotencyMap(Date.now())
      const cached = idempotencyMap.get(requestKey)
      if (cached && cached.expiresAt > Date.now()) {
        return NextResponse.json(cached.payload)
      }
      idempotencyMap.delete(requestKey)

      const inFlight = inflightMap.get(requestKey)
      if (inFlight) return inFlight

      const promise = compute().finally(() => {
        inflightMap.delete(requestKey)
      })
      inflightMap.set(requestKey, promise)
      return promise
    }

    return compute()
  } catch (err) {
    console.error("Chat API error:", err instanceof Error ? err.message : String(err))
    return NextResponse.json({
      text: "Bendiciones. Ocurrió un error inesperado. Pulsa Reintentar e inténtalo de nuevo.",
      error: "server_error",
    }, { status: 500 })
  }
}
