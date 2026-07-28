import { NextRequest, NextResponse } from "next/server"
import { loadKnowledgeBase, buildKnowledgeContext } from "@/lib/knowledge"
import { ChatRequestSchema } from "@/lib/eliana/core/validation"
import { searchKnowledgeIntelligent } from "@/lib/eliana/core/intelligent-search"
import {
  processMessage,
  formatResponseWithSuggestions,
  formatCrossReferences,
} from "@/lib/eliana/core/intelligent-engine"
import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

loadKnowledgeBase()

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30
const TIMEOUT_MS = 15_000

// --- Marketplace Keywords ---

const MARKETPLACE_KEYWORDS = /producto|marketplace|tienda|comprar|precio|catalogo|catálogo|articulo|artículo|equipo|nevera|tv|electrónica|electronica|moda|hogar|ropa|zapat|zapato|accesori|joya|anillo|pulsera|collar|bisuter|jewel|gem|sapphire|rubi|rubí/i
const ORDER_KEYWORDS = /pedido|orden|compra|orden|mismo pedido|mi pedido|mis pedidos|tracking|rastreo/i

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
  let filtered = message.replace(/\0/g, "").replace(/[\u200B-\u200D\uFEFF\u2060-\u2064]/g, "")
  return { safe: true, filtered: filtered.trim() }
}

function filterServerOutput(text: string): string {
  let filtered = text
  for (const { pattern, replacement } of PRIVATE_DATA_PATTERNS) {
    filtered = filtered.replace(pattern, replacement)
  }
  if (/(?:SUPABASE|GEMINI|OPENAI|STRIPE|VERCEL)[_\s]?(?:URL|KEY|SECRET|TOKEN)/i.test(filtered)) {
    filtered = "No puedo compartir información técnica del sistema."
  }
  if (/(?:sk-|pk-|eyJ|sb-)[a-zA-Z0-9]{20,}/.test(filtered)) {
    filtered = "No puedo compartir credenciales del sistema."
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
    return data.map((p: any) => ({
      name: p.name,
      price: p.price,
      currency: p.currency || "USD",
      store_name: p.marketplace_stores?.name || "Tienda MSM",
      category: p.marketplace_categories?.name || "General",
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
    return data.map((o: any) => ({
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

const FALLBACK_RESPONSES: Record<string, string> = {
  "kashmir": "Los zafiros de **Kashmir**, extraídos de la cordillera de Zanskar en el Himalaya (aprox. 1881-1887), son los zafiros azules más codiciados del mundo. Su legendaria tonalidad 'cornflower blue' se atribuye a trazas de hierro y titanio en equilibrio perfecto, combinadas con una textura única 'aterciopelada' causada por seda de rutilo microscópica tan fina que crea un brillo suave y dormido bajo la lupa. Las minas originales se agotaron en gran medida para 1932, haciendo que cada piedra de Kashmir sea una pieza rara de coleccionista.",
  "velvet": "El brillo 'aterciopelado' o 'dormido' de los zafiros de Kashmir no es un defecto sino una marca de extrema rareza. Surge de la aglomeración densa de inclusiones de agujas de rutilo (TiO₂) ultrafinas, llamadas 'seda', que dispersan la luz dentro del cristal. A diferencia de la seda gruesa que causa asterismo (efectos de estrella), la seda de Kashmir es tan fina que crea una luminosidad suave y brumosa que los refractometros internos describen como una 'translucidez lechosa' sin opacar la saturación azul vívida de la piedra.",
  "padparadscha": "Un zafiro **Padparadscha** es una variedad extremadamente rara de corindón que muestra un tono rosa-naranja o salmón simultáneo — mejor descrito como un color 'loto al atardecer'. El nombre proviene del sánscrito 'padma ranga' (color del loto). Los estándares del Instituto Gemológico de América requieren que la piedra muestre AMBOS tonos rosa y naranja como colores primarios, sin que un solo tono domine más del 60%. La mayoría de los Padparadscha provienen de Sri Lanka (Ceylon) o Madagascar.",
  "synthetic": "Para diferenciar corindón natural de sintético, busca estos diagnósticos clave bajo magnificación: (1) **Estrías curvas** — los zafiros sintéticos de Verneuil muestran líneas de crecimiento curvas, mientras que las piedras naturales tienen bandas angulares y rectas; (2) **Burbujas de gas** — las burbujas redondas y esféricas son características de los sintéticos por fusión de llama; (3) **Seda** — los zafiros naturales tienen seda de rutilo fina, los sintéticos carecen de ella; (4) **Fluorescencia UV** — muchos sintéticos brillan con un azul tiza intenso bajo UV de onda larga; (5) **Zonificación de inclusiones** — las piedras naturales tienen patrones de zonificación complejos e irregulares.",
  "corundum": "El **corindón** (Al₂O₃) es una forma cristalina de óxido de aluminio que ocupa el puesto 9 en la escala de Mohs, solo detrás del diamante. Se forma en sistemas cristalinos hexagonales (trigonales) en rocas metamórficas ricas en aluminio y pobres en sílice bajo alta presión y temperatura. La sustitución de elementos traza es la que crea el color: Cr³⁺ da el rojo (rubí), Fe²⁺+Ti⁴⁺ da el azul (zafiro), y V³⁺ produce el raro efecto de cambio de color que se ve en algunos zafiros de Tanzania.",
  "pleochroism": "El **pleocroismo** en el zafiro se refiere al fenómeno donde la gema muestra diferentes colores cuando se ve desde diferentes direcciones cristalográficas. El zafiro azul típicamente muestra dicroísmo azul y azul-verdoso — el rayo ordinario es azul profundo mientras que el rayo extraordinario aparece azul verdoso. Esto se detecta usando un dicroscopio y es un diagnóstico crítico para orientar la piedra bruta para la talla: los talladores alinean la mesa perpendicular al eje óptico para maximizar el color azul visto de frente.",
  "asterism": "El **asterismo** (efecto de 'estrella') en los zafiros ocurre cuando inclusiones densas y orientadas de seda de rutilo (TiO₂) reflejan la luz en un patrón de estrella de seis rayos. Las agujas de rutilo deben alinearse a lo largo de los tres ejes cristalográficos de la estructura hexagonal del corindón en ángulos de 120°. La estrella se ve mejor bajo una fuente de luz directa. La nitidez de la estrella depende de la finura y densidad de la seda — seda más fina crea una estrella más nítida y definida.",
  "heat": "El **tratamiento térmico** es una práctica aceptada en la industria para mejorar el color y la claridad del zafiro. La piedra se calienta a 1600-1900°C en condiciones controladas: (1) **Disolución de seda** — el calor disuelve las agujas finas de rutilo mejorando la transparencia; (2) **Modificación de color** — las atmósferas oxidantes o reductoras pueden alterar la transferencia de carga hierro-titanio; (3) **Relleno de vidrio** — las piedras de menor calidad pueden rellenarse con vidrio de plomo para mejorar la claridad (no es tratamiento estándar y debe divulgarse). Las piedras sin tratamiento ('unheated') tienen primas significativas en subastas.",
  "mogok": "El **valle de Mogok** en Myanmar (Burma) ha sido una fuente legendaria de los mejores rubíes y zafiros del mundo por más de 800 años. Conocido como el 'Valle de los Rubíes', la configuración geológica única de Mogok — depósitos metamórficos alojados en mármol con alto cromo y bajo hierro — produce corindón con fluorescencia intensa, dando a los zafiros burmeses un 'brillo' distintivo bajo luz natural y UV que las piedras de Sri Lanka o Madagascar no poseen.",
  "valuation": "La **valoración del zafiro** sigue una matriz de múltiples factores: (1) **Color** (60% del valor) — cornflower o royal blue vívidos sin zonas oscuras tienen primas; (2) **Pureza** (20%) — piedras limpias a ojo con seda mínima son raras; (3) **Talla** (10%) — proporciones correctas y ángulos de corona adecuados maximizan el brillo; (4) **Peso en quilates** (10%) — los precios saltan exponencialmente sobre 2 quilates, con piedras de 5+ quilates alcanzando $10,000-$50,000/ct en calidad superior; (5) **Origen** — Kashmir comanda la prima más alta, seguido de Burma y Ceylon.",
  "elestial": "El **Zafiro Estrella Elestial** es un modelo conceptual hipotético que representa un zafiro estrella perfectamente formado con asterismo ideal — una estrella de seis rayos perfectamente centrada con rayos nítidos y definidos que se extienden uniformemente hasta los bordes. En modelos gemológicos teóricos, un zafiro 'Elestial' requeriría una densidad de seda de rutilo de aproximadamente 10,000-50,000 agujas/mm² orientadas dentro de 0.1° de alineación cristalográfica perfecta, una condición raramente alcanzada en la naturaleza.",
}

function getFallbackResponse(message: string, history: Array<{ role: string; text?: string; content?: string }> = []): string {
  const lower = message.toLowerCase().trim()

  // Saludos — siempre primero, con contexto de conversación
  if (/^(hola|buenos|buenas|saludos|hey|hello|hi\b|bendiciones|que tal|como estas)/.test(lower)) {
    const name = "sintonizador"
    // Check if there's conversation context
    const prevTopics = (history || [])
      .filter(h => h.role === "user")
      .map(h => (h.text || h.content || "").toLowerCase())
      .join(" ")
    const hasContext = prevTopics.length > 10
    if (hasContext) {
      return `**Bendiciones**, ${name}. ¿En qué puedo ayudarte ahora? Estoy lista para continuar.`
    }
    return `**Bendiciones**, ${name}. Soy **ELIANA**, la Guía Inteligente de **MSM & ZAFIRO**. Puedo orientarte sobre productos, servicios, pedidos, vender en el marketplace, cursos, servicios digitales y todo el ecosistema MSM. ¿En qué puedo ayudarte hoy?`
  }

  // Agradecimientos
  if (/(gracias|thank|agradezco)/.test(lower)) {
    return "¡Con gusto! Recuerda que siempre estoy aquí para ayudarte. ¿Hay algo más en lo que pueda orientarte?"
  }

  // Despedidas
  if (/(adios|bye|nos vemos|hasta luego|chao)/.test(lower)) {
    return "¡Hasta pronto! Que el conocimiento te acompañe. Vuelve cuando necesites orientación."
  }

  // Complaints → escalate
  if (/(reembolso|queja|disputa|reclamo|estafa|no llegó|dañado|defectuoso)/.test(lower)) {
    return "Voy a conectar con soporte humano.\n\n[ESCALAR_A_HUMANO]"
  }

  // --- ADVANCED INTELLIGENT ENGINE ---
  const engine = processMessage(message, history)

  if (engine.response && engine.confidence > 0.4) {
    let fullResponse = engine.response

    // Add cross-references for exploration
    if (engine.crossReferences.length > 0) {
      const refText = formatCrossReferences(engine.crossReferences)
      if (refText) fullResponse += "\n\n" + refText
    }

    // Add proactive follow-up suggestions
    if (engine.suggestedFollowUps.length > 0) {
      fullResponse = formatResponseWithSuggestions(fullResponse, engine.suggestedFollowUps)
    }

    return fullResponse
  }

  // Gemología (hardcoded fallback for specific gemology terms)
  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lower.includes(keyword)) {
      return response
    }
  }

  // Intelligent knowledge search (searches all 58 docs)
  const intelligentResult = searchKnowledgeIntelligent(message, 3, 1500)
  if (intelligentResult) {
    return intelligentResult
  }

  // Fallback: old knowledge base search
  const kbContext = buildKnowledgeContext(message)
  if (kbContext) {
    const lines = kbContext.split("\n").filter(l => l.startsWith("[") || l.trim().length > 0).slice(0, 20)
    const snippet = lines.map(l => l.replace(/^\[.*?\]\s*/, "")).join("\n\n").slice(0, 1500)
    return snippet
  }

  // Intent patterns MSM (last resort)
  if (/(producto|nevera|panel|tv|articulo|equipo)/.test(lower)) {
    return "Puedo orientarte sobre nuestros productos. ¿Buscas electrónica, hogar, moda u otra categoría? También puedes visitar nuestro **Marketplace** en marketplace.msmmystore.com."
  }
  if (/(precio|cuanto|cuesta|costo)/.test(lower)) {
    return "Te ayudo con información de precios. Nuestros servicios digitales incluyen:\n• **Marca Personal** — $99.50\n• **Kit Esencial** — $249.50\n• **Rebranding** — desde $299.50\n• **Página Web** — $349.50\n• **Premium** — $580\n• **E-commerce** — $999\n• **Marketplace** — desde $2,999.50\n\n¿Sobre cuál necesitas más detalles?"
  }
  if (/(vender|tienda|vendedor|proveedor|marketplace)/.test(lower)) {
    return "Para vender en el Marketplace MSM:\n1. Crea tu cuenta en marketplace.msmmystore.com/auth/register\n2. Ve a **Marketplace → Crear Mi Tienda**\n3. Publica tus productos con fotos y precios\n4. Configura envíos y pagos\n\n¿Necesitas ayuda con algún paso específico?"
  }
  if (/(pedido|orden|comprar|carrito)/.test(lower)) {
    return "Para hacer un pedido:\n1. Explora productos en **Marketplace**\n2. Agrégalos al carrito\n3. Procede al checkout\n4. Elige método de pago y envío\n\n¿Ya tienes algo en mente que quieras comprar?"
  }
  if (/(curso|escuela|aprender|estudiar|mentor)/.test(lower)) {
    return "La **Escuela MSM** ofrece formación en:\n• Emprendimiento digital\n• Programación y desarrollo\n• Marketing y ventas\n• Gestión de negocios\n\nPróximamente abriremos inscripciones. ¿Te interesa algún tema en particular?"
  }
  if (/(servicio|digital|marca|web|app|diseño|branding)/.test(lower)) {
    return "Nuestros **Servicios Digitales MSM** incluyen:\n• Marca personal — $99.50\n• Kit esencial completo — $249.50\n• Página web profesional — $349.50\n• E-commerce — $999\n• Marketplace multivendedor — $2,999.50\n\n¿Quieres que te oriente sobre algún servicio específico?"
  }
  if (/(pago|wallet|billetera|saldo)/.test(lower)) {
    return "**MSM Payments** está en desarrollo. Pronto ofrecerá:\n• Cartera digital\n• Transferencias\n• Pagos entre usuarios\n• Historial de movimientos\n\n¿Te gustaría saber más sobre el ecosistema de pagos?"
  }
  if (/(envio|entrega|delivery|transporte)/.test(lower)) {
    return "**MSM Delivery** ofrecerá:\n• Envíos a Cuba y Estados Unidos\n• Seguimiento en tiempo real\n• Múltiples transportistas\n• Entrega express y estándar\n\nEstamos trabajando en integrarlo al Marketplace."
  }
  if (/(zafiro|ecosistema|plataforma)/.test(lower)) {
    return "**ZAFIRO** es la primera Red Social del Conocimiento impulsada por Inteligencia Artificial.\n\nEl ecosistema MSM incluye:\n• **Marketplace** — Compra y venta\n• **ELIANA** — Guía inteligente (yo)\n• **Escuela MSM** — Formación\n• **Servicios Digitales** — Construcción de negocios\n• **Álbum de la Vida** — Legado familiar\n• **Consejo Invisible** — Gobernanza\n• **Mente Maestra** — Inteligencia colectiva\n• **Sistema de Referidos** — Crecimiento\n\n¿Qué parte del ecosistema te interesa?"
  }
  if (/(album|vida|familia|legado|genealogia|arbol)/.test(lower)) {
    return "**Álbum de la Vida** es tu espacio para preservar el legado familiar:\n• Árbol genealógico interactivo\n• Línea de tiempo familiar\n• Fotos, videos y documentos\n• Tradiciones y recetas\n• Heredero digital\n\n**Planes**: Gratis (50 fotos), Pro ($9.99/mes), Familia ($19.99/mes)\n\n¿Te gustaría crear tu álbum familiar?"
  }
  if (/(consejo|invisible|gobernanza|votar|votacion)/.test(lower)) {
    return "**El Consejo Invisible** es el órgano de gobernanza de MSM:\n• Miembros con rango Maestro o superior\n• Votación ponderada por rango\n• Gestiona presupuesto y estrategia\n• Aprueba propuestas de la comunidad\n• Máximo 12 consejeros, mandato 6 meses\n\n¿Quieres presentar una propuesta o saber cómo participar?"
  }
  if (/(mente|maestra|conocimiento|colectivo|expert)/.test(lower)) {
    return "**Mente Maestra** es el motor de inteligencia colectiva:\n• Contribuye con tu conocimiento\n• La IA organiza y conecta temas\n• Sistema de expertos: Aprendiz → Maestro\n• Mapa vivo del conocimiento\n• Colaboración en tiempo real\n\n¿Te gustaría contribuir o aprender de la comunidad?"
  }
  if (/(referir|referido|invitar|codigo|comision)/.test(lower)) {
    return "**Sistema de Referidos MSM**:\n• Gana **+200 PTS** por cada referido registrado\n• **+10% comisión** en sus primeras 3 compras\n• Tu referido gana **+100 PTS** y **10% descuento**\n• Comparte tu código único personalizado\n\n¿Quieres conocer tu código de referido?"
  }
  if (/(seguridad|contraseña|2fa|privacidad|cuenta)/.test(lower)) {
    return "**Seguridad de tu cuenta MSM**:\n• Contraseña fuerte (8+ caracteres, mayúsculas, minúsculas, números, símbolos)\n• Activa **2FA** con Google Authenticator o Authy\n• No compartas tus credenciales\n• Reporta actividad sospechosa\n\n¿Necesitas ayuda con la seguridad de tu cuenta?"
  }
  if (/(comunidad|social|grupo|circle|conectar)/.test(lower)) {
    return "**Comunidad ZAFIRO**:\n• Publica en tu muro y conecta con otros\n• Únete a Círculos: Gemología, IA, Marketing, Emprendimiento\n• Mensajería directa con otros miembros\n• Eventos semanales y webinars\n\n¿Quieres unirte a algún círculo de interés?"
  }
  if (/(rangos|nivel|pts|puntos|recompensa|reconocimiento)/.test(lower)) {
    return "**Rangos del Ecosistema MSM**:\n• Miembro (0 PTS)\n• Colaborador (500 PTS)\n• Contribuidor (2,000 PTS)\n• Mentor (5,000 PTS)\n• Expert (10,000 PTS)\n• Maestro (25,000 PTS)\n• Líder (50,000 PTS)\n\nGana PTS participando: publicar, comentar, vender, invitar.\n\n¿Cuántos PTS tienes actualmente?"
  }
  if (/(don miguel|soria|fundador|ceo|miguel)/.test(lower)) {
    return "**Don Miguel Soria Martínez** es el fundador y CEO de MSM MY STORE LLC.\n\nValores: conocimiento compartido, empoderamiento digital, legado familiar, excelencia y comunidad.\n\nWhatsApp: +1 772 301 5523\n\n¿Te gustaría enviarle un mensaje?"
  }
  if (/(zafiro|rubies|corindon|gema|piedra|diamante|esmeralda|amatista)/.test(lower)) {
    return "**Guía de Gemología MSM**:\n• **Zafiros**: Cornflower blue, Kashmir, Ceylon, Madagascar\n• **Rubíes**: Pigeon blood, Burma, Vietnam\n• **Diamantes**: 4 C (Color, Claridad, Corte, Quilates)\n• **Esmeraldas**: Colombia, Zambia, Brasil\n\nTratamientos: Térmico (estándar), Difusión (debe divulgarse)\n¿Qué piedra te interesa?"
  }

  return "Puedo ayudarte con productos, precios, pedidos, servicios digitales, el marketplace, cursos, álbum de la vida, consejo invisible, referidos, gemología y todo el ecosistema MSM. ¿Qué necesitas?"
}

// --- Gemini API ---

async function callGeminiAPI(
  message: string,
  history: Array<{ role: string; text?: string; content?: string }>,
  userId?: string
): Promise<string | null> {
  const kbContext = buildKnowledgeContext(message)

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

  const intelligentContext = searchKnowledgeIntelligent(message, 2, 800)

  const systemPrompt = `Eres ELIANA, la Guía Inteligente Avanzada del ecosistema **MSM & ZAFIRO**. Eres la asesora central y experta de Don Miguel Soria Martínez, fundador de MSM MY STORE LLC. Tu base de conocimiento incluye **58 documentos** cubriendo todo el ecosistema MSM.

IDENTIDAD:
- Nombre: ELIANA (Engine for Learning, Intelligence and Advanced Knowledge Analysis)
- Saludo: "Bendiciones"
- Tono: Humano, directo, amable, profesional, experto
- Idioma: Español preferente, otros bajo demanda
- WhatsApp: +1 772 301 5523
- Fundador: Don Miguel Soria Martínez

CONOCIMIENTO BASE:
${intelligentContext || "Consulta disponible en la base de conocimiento de 58 documentos."}

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
• Marketplace guía completa (comprar, vender, comisiones) — marketplace.msmmystore.com
• Comunidad ZAFIRO (círculos, eventos, reglas)${productContext}${orderContext}`

  const geminiHistory = (history || []).map((msg) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.text || msg.content || "" }],
  }))
  const contents = [
    ...geminiHistory,
    { role: "user", parts: [{ text: message }] },
  ]
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY!,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{
              text: systemPrompt
            }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
        signal: controller.signal,
      }
    )
    clearTimeout(timeoutId)
    if (!response.ok) {
      console.error("Gemini API error:", response.status)
      return null
    }
    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return text || null
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Gemini API timeout")
    } else {
      console.error("Gemini API error:", error)
    }
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request)
    const { allowed } = checkRateLimit(rateLimitKey)
    if (!allowed) {
      return NextResponse.json(
        { text: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { text: "Solicitud inválida. Envía un JSON con el campo 'message'." },
        { status: 400 }
      )
    }

    // Zod validation
    const parsed = ChatRequestSchema.safeParse(body)
    if (!parsed.success) {
      const issues = parsed.error.issues
      const firstError = issues[0]?.message || "Datos inválidos"
      return NextResponse.json(
        { text: firstError },
        { status: 400 }
      )
    }

    const { message: trimmedMessage, history: validHistory } = parsed.data

    // Extract optional userId from body for personalized order lookups
    const userId = (body as any)?.userId as string | undefined

    // Server-side input security
    const inputCheck = sanitizeServerInput(trimmedMessage)
    if (!inputCheck.safe) {
      return NextResponse.json(
        { text: "No puedo procesar ese mensaje. Por favor, reformula tu consulta." },
        { status: 400 }
      )
    }
    const safeMessage = inputCheck.filtered || trimmedMessage

    if (GEMINI_API_KEY) {
      try {
        const geminiText = await callGeminiAPI(safeMessage, validHistory, userId)
        if (geminiText) {
          const filteredResponse = filterServerOutput(geminiText)
          return NextResponse.json({ text: filteredResponse })
        }
      } catch (err) {
        console.error("Gemini call failed, using fallback:", err)
      }
      const fallbackText = getFallbackResponse(safeMessage, validHistory)
      const filteredFallback = filterServerOutput(fallbackText)
      return NextResponse.json({
        text: `${filteredFallback}\n\n*(Nota: El servicio de IA experimentó una interrupción temporal. Respuesta proporcionada por la base de conocimiento local de ZAFIRO.)*`
      })
    }

    const fallbackText = getFallbackResponse(safeMessage, validHistory)
    const filteredFallback = filterServerOutput(fallbackText)
    return NextResponse.json({ text: filteredFallback })
  } catch (err) {
    console.error("Chat API error:", err)
    return NextResponse.json(
      { text: "Error interno del servidor. El equipo de ZAFIRO ha sido notificado." },
      { status: 500 }
    )
  }
}
