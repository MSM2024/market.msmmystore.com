import { NextRequest, NextResponse } from "next/server"
import { ChatRequestSchema } from "@/lib/eliana/core/validation"
import {
  processMessage,
  formatResponseWithSuggestions,
  formatCrossReferences,
} from "@/lib/eliana/core/intelligent-engine"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { ragPipeline, knowledgeSearch, checkInputSafety, checkOutputSafety, extractTopics, detectKnowledgeGaps } from "@/lib/knowledge"
import { loadKnowledgeBase, buildKnowledgeContext } from "@/lib/knowledge"
import { GoogleGenAI } from "@google/genai"

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
const AI_MODEL = "gemini-2.0-flash"

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30
const TIMEOUT_MS = 15_000

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
  } catch (error) {
    return { response: null, confidence: 0, sources: [], topics: [] }
  }
}

async function searchKnowledgeHybrid(query: string): Promise<string | null> {
  try {
    const results = await knowledgeSearch.search({
      query,
      limit: 3,
      threshold: 0.3,
    })

    if (results.length === 0) return null

    const parts = results.map(r => {
      const highlights = r.highlights?.slice(0, 3).join("\n") || r.document.content.slice(0, 500)
      return `**${r.document.title}** (${r.document.doc_type})\n${highlights}`
    })

    return parts.join("\n\n---\n\n")
  } catch (error) {
    return null
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

// --- Fallback Responses ---

const FALLBACK_RESPONSES: Record<string, string> & { default: string } = {
  kashmir: "Los zafiros de Kashmir, extraídos de la cordillera de Zanskar en el Himalaya, son los zafiros azules más codiciados del mundo. Su legendaria tonalidad 'cornflower blue' se atribuye a trazas de hierro y titanio en equilibrio perfecto, combinadas con una textura única 'aterciopelada' causada por seda de rutilo microscópica tan fina que crea un brillo suave y dormido bajo la lupa. Las minas originales se agotaron en gran medida para 1932, haciendo que cada piedra de Kashmir sea una pieza rara de coleccionista.",
  velvet: "El brillo 'aterciopelado' o 'dormido' de los zafiros de Kashmir no es un defecto sino una marca de extrema rareza. Surge de la aglomeración densa de inclusiones de agujas de rutilo ultrafinas, llamadas 'seda', que dispersan la luz dentro del cristal. A diferencia de la seda gruesa que causa asterismo (efectos de estrella), la seda de Kashmir es tan fina que crea una luminosidad suave y brumosa que los refractometros internos describen como una 'translucidez lechosa' sin opacar la saturación azul vívida de la piedra.",
  padparadscha: "Un zafiro Padparadscha es una variedad extremadamente rara de corindón que muestra un tono rosa-naranja o salmón simultáneo. El nombre proviene del sánscrito 'padma ranga' (color del loto). Los estándares gemológicos requieren que la piedra muestre ambos tonos rosa y naranja como colores primarios, sin que un solo tono domine más del sesenta por ciento. La mayoría de los Padparadscha provienen de Sri Lanka o Madagascar.",
  synthetic: "Para diferenciar corindón natural de sintético, busca estos diagnósticos clave bajo magnificación: estrías curvas, los zafiros sintéticos de Verneuil muestran líneas de crecimiento curvas mientras que las piedras naturales tienen bandas angulares y rectas; burbujas de gas, las burbujas redondas y esféricas son características de los sintéticos por fusión de llama; seda, los zafiros naturales tienen seda de rutilo fina, los sintéticos carecen de ella; fluorescencia UV, muchos sintéticos brillan con un azul tiza intenso bajo UV de onda larga.",
  corundum: "El corindón (Al2O3) es una forma cristalina de óxido de aluminio que ocupa el puesto nueve en la escala de Mohs, solo detrás del diamante. Se forma en sistemas cristalinos hexagonales en rocas metamórficas ricas en aluminio y pobres en sílice bajo alta presión y temperatura. La sustitución de elementos traza crea el color: cromo da el rojo (rubí), hierro y titanio da el azul (zafiro), y vanadio produce el raro efecto de cambio de color.",
  pleochroism: "El pleocroismo en el zafiro se refiere al fenómeno donde la gema muestra diferentes colores cuando se ve desde diferentes direcciones cristalográficas. El zafiro azul típicamente muestra dicroísmo azul y azul-verdoso. Esto se detecta usando un dicroscopio y es un diagnóstico crítico para orientar la piedra bruta para la talla.",
  asterism: "El asterismo (efecto de estrella) en los zafiros ocurre cuando inclusiones densas y orientadas de seda de rutilo reflejan la luz en un patrón de estrella de seis rayos. Las agujas de rutilo deben alinearse a lo largo de los tres ejes cristalográficos de la estructura hexagonal del corindón en ángulos de ciento veinte grados. La nitidez de la estrella depende de la finura y densidad de la seda.",
  heat: "El tratamiento térmico es una práctica aceptada en la industria para mejorar el color y la claridad del zafiro. La piedra se calienta a mil seiscientos grados centígrados en condiciones controladas. El calor disuelve las agujas finas de rutilo mejorando la transparencia. Las atmósferas oxidantes o reductoras pueden alterar la transferencia de carga hierro-titanio. Las piedras sin tratamiento ('unheated') tienen primas significativas en subastas.",
  mogok: "El valle de Mogok en Myanmar ha sido una fuente legendaria de los mejores rubíes y zafiros del mundo por más de ochocientos años. Conocido como el 'Valle de los Rubíes', la configuración geológica única de Mogok produce corindón con fluorescencia intensa, dando a los zafiros burmeses un brillo distintivo bajo luz natural.",
  valuation: "La valoración del zafiro sigue una matriz de múltiples factores. El color representa el sesenta por ciento del valor, la pureza el veinte por ciento, la talla el diez por ciento, el peso en quilates el diez por ciento, y el origen es un factor adicional. Kashmir comanda la prima más alta, seguido de Burma y Ceylon.",
  elestial: "El Zafiro Estrella Elestial es un modelo conceptual hipotético que representa un zafiro estrella perfectamente formado con asterismo ideal, una estrella de seis rayos perfectamente centrada con rayos nítidos y definidos que se extienden uniformemente hasta los bordes.",

  default: "Puedo ayudarte con información sobre el ecosistema MSM: productos, precios, pedidos, servicios digitales, marketplace, cursos, álbum de la vida, consejo invisible, referidos, gemología y más. ¿Qué necesitas?"
}

async function getFallbackResponse(message: string, history: Array<{ role: string; text?: string; content?: string }> = []): Promise<string> {
  const lower = message.toLowerCase().trim()

  const prevTopics = (history || [])
    .filter(h => h.role === "user")
    .map(h => (h.text || h.content || "").toLowerCase())
    .join(" ")
  const hasContext = prevTopics.length > 10

  if (/^(hola|buenos|buenas|saludos|hey|hello|hi\b|bendiciones|que tal|como estas)/.test(lower)) {
    if (hasContext) {
      return "Bendiciones. ¿En qué puedo ayudarte ahora? Estoy lista para continuar."
    }
    return "Bendiciones. Soy ELIANA, la Guía Inteligente de MSM y ZAFIRO. Puedo orientarte sobre productos, servicios, pedidos, vender en el marketplace, cursos, servicios digitales y todo el ecosistema MSM. ¿En qué puedo ayudarte hoy?"
  }

  if (/(gracias|thank|agradezco)/.test(lower)) {
    return "Con gusto. Recuerda que siempre estoy aquí para ayudarte. ¿Hay algo más en lo que pueda orientarte?"
  }

  if (/(adios|bye|nos vemos|hasta luego|chao)/.test(lower)) {
    return "Hasta pronto. Que el conocimiento te acompañe. Vuelve cuando necesites orientación."
  }

  if (/(reembolso|queja|disputa|reclamo|estafa|no llegó|dañado|defectuoso)/.test(lower)) {
    return "Voy a conectar con soporte humano.\n\n[ESCALAR_A_HUMANO]"
  }

  const engine = processMessage(message, history)

  if (engine.response && engine.confidence > 0.4) {
    let fullResponse = engine.response
    if (engine.crossReferences.length > 0) {
      const refText = formatCrossReferences(engine.crossReferences)
      if (refText) fullResponse += "\n\n" + refText
    }
    if (engine.suggestedFollowUps.length > 0) {
      fullResponse = formatResponseWithSuggestions(fullResponse, engine.suggestedFollowUps)
    }
    return fullResponse
  }

  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (keyword !== "default" && lower.includes(keyword)) {
      return response
    }
  }

  if (/(producto|nevera|panel|tv|articulo|equipo)/.test(lower)) {
    return "Puedo orientarte sobre nuestros productos. Buscas electrónica, hogar, moda u otra categoría. También puedes visitar nuestro Marketplace en marketplace.msmmystore.com."
  }
  if (/(precio|cuanto|cuesta|costo)/.test(lower)) {
    return "Te ayudo con información de precios. Nuestros servicios digitales incluyen: Marca Personal por 99.50, Kit Esencial por 249.50, Rebranding desde 299.50, Página Web por 349.50, Premium por 580, E-commerce por 999, y Marketplace desde 2,999.50 dolares. Sobre cual necesitas mas detalles?"
  }
  if (/(vender|tienda|vendedor|proveedor|marketplace)/.test(lower)) {
    return "Para vender en el Marketplace MSM: crea tu cuenta en zafiro.msmmystore.com, ve a Marketplace, Crear Mi Tienda, publica tus productos con fotos y precios, y configura envios y pagos. Necesitas ayuda con algun paso especifico?"
  }
  if (/(pedido|orden|comprar|carrito)/.test(lower)) {
    return "Para hacer un pedido: explora productos en Marketplace, agregalos al carrito, procede al checkout, y elige metodo de pago y envio. Ya tienes algo en mente que quieras comprar?"
  }
  if (/(curso|escuela|aprender|estudiar|mentor)/.test(lower)) {
    return "La Escuela MSM ofrece formacion en emprendimiento digital, programacion y desarrollo, marketing y ventas, y gestion de negocios. Proximamente abriremos inscripciones. Te interesa algun tema en particular?"
  }
  if (/(servicio|digital|marca|web|app|diseño|branding)/.test(lower)) {
    return "Nuestros Servicios Digitales MSM incluyen: Marca personal por 99.50, Kit esencial completo por 249.50, Pagina web profesional por 349.50, E-commerce por 999, y Marketplace multivendedor por 2,999.50 dolares. Quieres que te oriente sobre algun servicio especifico?"
  }
  if (/(pago|wallet|billetera|saldo)/.test(lower)) {
    return "MSM Payments esta en desarrollo. Pronto ofrecera cartera digital, transferencias, pagos entre usuarios, e historial de movimientos. Te gustaria saber mas sobre el ecosistema de pagos?"
  }
  if (/(envio|entrega|delivery|transporte)/.test(lower)) {
    return "MSM Delivery ofrecera envios a Cuba y Estados Unidos, seguimiento en tiempo real, multiples transportistas, y entrega express y estandar. Estamos trabajando en integrarlo al Marketplace."
  }
  if (/(zafiro|ecosistema|plataforma)/.test(lower)) {
    return "ZAFIRO es la primera Red Social del Conocimiento impulsada por Inteligencia Artificial. El ecosistema MSM incluye: Marketplace (compra y venta), ELIANA (guia inteligente), Escuela MSM (formacion), Servicios Digitales (construccion de negocios), Album de la Vida (legado familiar), Consejo Invisible (gobernanza), Mente Maestra (inteligencia colectiva), y Sistema de Referidos (crecimiento). Que parte del ecosistema te interesa?"
  }
  if (/(album|vida|familia|legado|genealogia|arbol)/.test(lower)) {
    return "Album de la Vida es tu espacio para preservar el legado familiar. Incluye arbol genealogico interactivo, linea de tiempo familiar, fotos, videos y documentos, tradiciones y recetas, y heredero digital. Planes: Gratis (50 fotos), Pro por 9.99 al mes, y Familia por 19.99 al mes. Te gustaria crear tu album familiar?"
  }
  if (/(consejo|invisible|gobernanza|votar|votacion)/.test(lower)) {
    return "El Consejo Invisible es el organo de gobernanza de MSM. Participan miembros con rango Maestro o superior, con votacion ponderada por rango. Gestiona presupuesto y estrategia, aprueba propuestas de la comunidad. Maximo doce consejeros con mandato de seis meses. Quieres presentar una propuesta o saber como participar?"
  }
  if (/(mente|maestra|conocimiento|colectivo|expert)/.test(lower)) {
    return "Mente Maestra es el motor de inteligencia colectiva. Puedes contribuir con tu conocimiento, la IA organiza y conecta temas, hay un sistema de expertos desde Aprendiz hasta Maestro, y un mapa vivo del conocimiento. Te gustaria contribuir o aprender de la comunidad?"
  }
  if (/(referir|referido|invitar|codigo|comision)/.test(lower)) {
    return "Sistema de Referidos MSM: ganas 200 PTS por cada referido registrado, mas un diez por ciento de comision en sus primeras tres compras. Tu referido gana 100 PTS y un diez por ciento de descuento. Comparte tu codigo unico personalizado. Quieres conocer tu codigo de referido?"
  }
  if (/(seguridad|contraseña|2fa|privacidad|cuenta)/.test(lower)) {
    return "Seguridad de tu cuenta MSM: usa contrasena fuerte con ocho o mas caracteres, mayusculas, minusculas, numeros y simbolos. Activa 2FA con Google Authenticator o Authy. No compartas tus credenciales. Reporta actividad sospechosa. Necesitas ayuda con la seguridad de tu cuenta?"
  }
  if (/(comunidad|social|grupo|circle|conectar)/.test(lower)) {
    return "Comunidad ZAFIRO: publica en tu muro y conecta con otros, unite a Circulos de Gemologia, IA, Marketing o Emprendimiento, usa mensajeria directa con otros miembros, y participa en eventos semanales y webinars. Quieres unirte a algun circulo de interes?"
  }
  if (/(rangos|nivel|pts|puntos|recompensa|reconocimiento)/.test(lower)) {
    return "Rangos del Ecosistema MSM: Miembro (0 PTS), Colaborador (500 PTS), Contribuidor (2,000 PTS), Mentor (5,000 PTS), Expert (10,000 PTS), Maestro (25,000 PTS), y Lider (50,000 PTS). Ganas PTS participando: publicar, comentar, vender e invitar. Cuantos PTS tienes actualmente?"
  }
  if (/(don miguel|soria|fundador|ceo|miguel)/.test(lower)) {
    return "Don Miguel Soria Martinez es el fundador y CEO de MSM MY STORE LLC. Sus valores son conocimiento compartido, empoderamiento digital, legado familiar, excelencia y comunidad. WhatsApp: mas uno 772 301 5523. Te gustaria enviarle un mensaje?"
  }
  if (/(zafiro|rubies|corindon|gema|piedra|diamante|esmeralda|amatista)/.test(lower)) {
    return "Guia de Gemologia MSM: Zafiros (Cornflower blue, Kashmir, Ceylon, Madagascar), Rubies (Pigeon blood, Burma, Vietnam), Diamantes (4 C: Color, Claridad, Corte, Quilates), y Esmeraldas (Colombia, Zambia, Brasil). Tratamientos: Termico (estandar) y Difusion (debe divulgarse). Que piedra te interesa?"
  }

  return FALLBACK_RESPONSES.default
}

// --- Gemini API ---

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGeminiWithRetry(
  message: string,
  history: Array<{ role: string; text?: string; content?: string }>,
  userId?: string,
  maxRetries = 2
): Promise<string | null> {
  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000)
      await sleep(delay)
    }
    try {
      const result = await callGeminiAPI(message, history, userId)
      if (result) return result
      lastError = new Error("Gemini returned empty response")
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown Gemini error")
      const msg = lastError.message.toLowerCase()
      if (msg.includes("not found") || msg.includes("not supported") || msg.includes("not enabled")) break
    }
  }
  return null
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

  try {
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY })
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

    console.error(`Gemini: no content [model=${AI_MODEL}, requestId=${requestId}]`)
    return null
  } catch (error) {
    const errInfo = error instanceof Error
      ? `name=${error.name}, msg=${error.message}`
      : "unknown"
    console.error(`Gemini: error [model=${AI_MODEL}, requestId=${requestId}, err=${errInfo}]`)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check — allow as guest
    const supabase = await getSupabaseServerClient()
    let userId: string | undefined
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    }

    const rateLimitKey = getRateLimitKey(request)
    const { allowed } = checkRateLimit(rateLimitKey)
    if (!allowed) {
      return NextResponse.json({
        text: "Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado. Inténtalo nuevamente en unos segundos.",
        error: "rate_limited",
      })
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

    if (GOOGLE_API_KEY) {
      try {
        const geminiText = await callGeminiWithRetry(safeMessage, validHistory, effectiveUserId)
        if (geminiText) {
          const filteredResponse = filterServerOutput(geminiText)

          detectKnowledgeGaps(safeMessage, filteredResponse, 0.5).catch(() => {})
          knowledgeSearch.search({ query: safeMessage, limit: 1 }).catch(() => {})

          return NextResponse.json({
            text: filteredResponse,
            source: "ai_provider",
            model: AI_MODEL,
          })
        }
      } catch {
        console.error("Gemini temporarily unavailable")
      }
      return NextResponse.json({
        text: "Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado. Inténtalo nuevamente en unos segundos.",
        error: "ai_provider_unavailable",
      }, { status: 503 })
    }

    const fallbackText = await getFallbackResponse(safeMessage, validHistory)
    const filteredFallback = filterServerOutput(fallbackText)
    return NextResponse.json({
      text: filteredFallback,
      source: "knowledge_base",
      model: "engine-v2.0",
    })
  } catch (err) {
    console.error("Chat API error:", err)
    return NextResponse.json({
      text: "Bendiciones. ELIANA está reconectándose. Tu mensaje quedó guardado. Inténtalo nuevamente en unos segundos.",
      error: "server_error",
    }, { status: 500 })
  }
}
