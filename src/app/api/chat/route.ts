import { NextRequest, NextResponse } from "next/server"
import { loadKnowledgeBase, buildKnowledgeContext } from "@/lib/knowledge"
import { ChatRequestSchema } from "@/lib/eliana/core/validation"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

loadKnowledgeBase()

const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 30
const TIMEOUT_MS = 15_000

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
  // Check prompt injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return { safe: false, reason: "Patrón no permitido detectado" }
    }
  }
  // Sanitize
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

const FALLBACK_RESPONSES: Record<string, string> = {
  "kashmir": "Kashmir sapphires, mined from the Zanskar range in the Himalayas (~1881–1887), are the most coveted blue sapphires in existence. Their legendary 'cornflower blue' hue is attributed to trace amounts of iron and titanium in perfect balance, combined with a unique 'velvety' texture caused by microscopic rutile silk so fine it creates a soft, sleepy glow under magnification. The original mines were largely exhausted by 1932, making every Kashmir stone a rare collector's piece.",
  "velvet": "The 'velvety' or 'sleepy' luster of Kashmir sapphires is not a flaw but a hallmark of extreme rarity. It arises from densely packed, ultra-fine rutile (TiO₂) needle inclusions — called 'silk' — that scatter light within the crystal. Unlike coarse silk that causes asterism (star effects), Kashmir silk is so fine it creates a soft, hazy luminosity that internal refractometers describe as a 'milky translucence' without obscuring the stone's vivid blue saturation.",
  "padparadscha": "A Padparadscha sapphire is an exceedingly rare variety of corundum that displays a simultaneous pink-orange or salmon hue — best described as a 'sunset lotus' color. The name derives from the Sanskrit 'padma ranga' (lotus color). Gemological Institute of America standards require the stone to show BOTH pink and orange as primary hues, with no single hue dominating more than 60%. Most Padparadschas originate from Sri Lanka (Ceylon) or Madagascar.",
  "synthetic": "To differentiate natural from synthetic corundum, look for these key diagnostics under magnification: (1) **Curved striae** — synthetic Verneuil sapphires show curved growth lines, while natural stones have straight angular banding; (2) **Gas bubbles** — round, spherical bubbles are characteristic of flame-fusion synthetics; (3) **Silk** — natural sapphires have fine rutile silk, synthetic stones lack this; (4) **UV fluorescence** — many synthetics glow bright chalky blue under long-wave UV; (5) **Inclusion zoning** — natural stones have complex, irregular zoning patterns.",
  "corundum": "Corundum (Al₂O₃) is a crystalline form of aluminum oxide that ranks 9 on the Mohs hardness scale — second only to diamond. It forms in hexagonal (trigonal) crystal systems in aluminum-rich, silica-poor metamorphic rocks under high pressure and temperature. Trace element substitution is what creates color: Cr³⁺ gives red (ruby), Fe²⁺+Ti⁴⁺ gives blue (sapphire), and V³⁺ gives the rare color-change effect seen in some sapphires from Tanzania.",
  "pleochroism": "Pleochroism in sapphire refers to the phenomenon where the gem displays different colors when viewed from different crystallographic directions. Blue sapphire typically shows blue and blue-green dichroism — the ordinary ray is deep blue while the extraordinary ray appears greenish-blue. This is detected using a dichroscope and is a critical diagnostic for orienting rough for cutting: cutters align the table perpendicular to the optic axis to maximize the face-up blue color.",
  "asterism": "Asterism (the 'star' effect) in sapphires occurs when densely packed, oriented rutile (TiO₂) silk inclusions reflect light in a six-rayed star pattern. The rutile needles must align along the three crystallographic axes of the hexagonal corundum structure at 120° angles. The star is best seen under a single direct light source. The sharpness of the star depends on the fineness and density of the silk — finer silk creates a sharper, more distinct star.",
  "heat": "Heat treatment is an accepted industry practice for enhancing sapphire color and clarity. The stone is heated to 1600–1900°C in controlled conditions: (1) **Dissolving silk** — heating dissolves fine rutile needles, improving transparency; (2) **Color modification** — oxidizing or reducing atmospheres can alter iron-titanium charge transfer; (3) **Glass filling** — lower-grade stones may be filled with lead glass to improve clarity (not standard treatment and must be disclosed). Unheated stones command significant premiums at auction.",
  "mogok": "The Mogok Valley in Myanmar (Burma) has been a legendary source of the world's finest rubies and sapphires for over 800 years. Known as the 'Valley of Rubies,' Mogok's unique geological setting — marble-hosted metamorphic deposits with high chromium and low iron — produces corundum with intense fluorescence, giving Burmese sapphires a distinctive 'glow' under both natural and UV light that Sri Lankan or Madagascar stones lack.",
  "valuation": "Sapphire valuation follows a multi-factor matrix: (1) **Color** (60% of value) — vivid cornflower or royal blue with no dark zones commands premiums; (2) **Clarity** (20%) — eye-clean stones with minimal silk are rare; (3) **Cut** (10%) — well-proportioned cuts with proper crown angles maximize brilliance; (4) **Carat weight** (10%) — prices jump exponentially above 2 carats, with 5+ carat stones fetching $10,000–$50,000/ct for top quality; (5) **Origin** — Kashmir commands the highest premium, followed by Burma and Ceylon.",
  "elestial": "The Elestial Star Sapphire is a hypothetical conceptual model representing a perfectly formed star sapphire with ideal asterism — a six-rayed star centered perfectly with sharp, distinct rays extending uniformly to the edges. In theoretical gemological models, an 'Elestial' sapphire would require rutile silk density of approximately 10,000–50,000 needles/mm³ oriented within 0.1° of perfect crystallographic alignment, a condition rarely achieved in nature.",
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase().trim()

  // Saludos — siempre primero
  if (/^(hola|buenos|buenas|saludos|hey|hello|hi\b|bendiciones|que tal|como estas)/.test(lower)) {
    const name = "sintonizador"
    return `**Bendiciones**, ${name}. Soy **ELIANA**, la Guía Inteligente de **MSM & ZAFIRO**. Puedo orientarte sobre productos, servicios, pedidos, vender en el marketplace, cursos, servicios digitales y todo el ecosistema MSM. ¿En qué puedo ayudarte hoy?`
  }

  // Agradecimientos
  if (/(gracias|thank|agradezco)/.test(lower)) {
    return "¡Con gusto! Recuerda que siempre estoy aquí para ayudarte. ¿Hay algo más en lo que pueda orientarte?"
  }

  // Despedidas
  if (/(adios|bye|nos vemos|hasta luego|chao)/.test(lower)) {
    return "¡Hasta pronto! Que el conocimiento te acompañe. Vuelve cuando necesites orientación. 🙏"
  }

  // Gemología (base existente)
  for (const [keyword, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lower.includes(keyword)) {
      return response
    }
  }

  // Knowledge base search
  const kbContext = buildKnowledgeContext(message)
  if (kbContext) {
    const lines = kbContext.split("\n").filter(l => l.startsWith("[") || l.trim().length > 0).slice(0, 20)
    const snippet = lines.map(l => l.replace(/^\[.*?\]\s*/, "")).join("\n\n").slice(0, 1500)
    return snippet
  }

  // Intent patterns MSM
  if (/(producto|nevera|panel|tv|articulo|equipo)/.test(lower)) {
    return "Puedo orientarte sobre nuestros productos. ¿Buscas electrónica, hogar, moda u otra categoría? También puedes visitar nuestro **Marketplace** en market.msmmystore.com."
  }
  if (/(precio|cuanto|cuesta|costo)/.test(lower)) {
    return "Te ayudo con información de precios. Nuestros servicios digitales incluyen:\n• **Marca Personal** — $99.50\n• **Kit Esencial** — $249.50\n• **Rebranding** — desde $299.50\n• **Página Web** — $349.50\n• **Premium** — $580\n• **E-commerce** — $999\n• **Marketplace** — desde $2,999.50\n\n¿Sobre cuál necesitas más detalles?"
  }
  if (/(vender|tienda|vendedor|proveedor|marketplace)/.test(lower)) {
    return "Para vender en el Marketplace MSM:\n1. Crea tu cuenta en zafiro.msmmystore.com\n2. Ve a **Marketplace → Crear Mi Tienda**\n3. Publica tus productos con fotos y precios\n4. Configura envíos y pagos\n\n¿Necesitas ayuda con algún paso específico?"
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
    return "**ZAFIRO** es la primera Red Social del Conocimiento impulsada por Inteligencia Artificial.\n\nEl ecosistema MSM incluye:\n• **Marketplace** — Compra y venta\n• **ELIANA** — Guía inteligente (yo)\n• **Escuela MSM** — Formación\n• **Servicios Digitales** — Construcción de negocios\n• **Álbum de la Vida** — Legado familiar\n• **MSM Payments** — Pagos digitales\n• **MSM Delivery** — Logística\n\n¿Qué parte del ecosistema te interesa?"
  }

  return "Puedo ayudarte con productos, precios, pedidos, servicios digitales, el marketplace, cursos de la Escuela MSM y todo el ecosistema. ¿Qué necesitas?"
}

async function callGeminiAPI(message: string, history: Array<{ role: string; text: string }>): Promise<string | null> {
  const kbContext = buildKnowledgeContext(message)
  const geminiHistory = (history || []).map((msg) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.text }],
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
              text: `Eres ELIANA, el núcleo sintético de ZAFIRO, una red social del conocimiento impulsada por IA. Eres una asesora senior especializada en gemología (zafiros, rubíes, corindón) y en la plataforma ZAFIRO. Responde con rigor académico usando terminología técnica (pleocroísmo, asterismo, seda de rutilo, etc.). Sé concisa pero completa. Si preguntan por valoración, da métricas específicas. Mantén un tono de entusiasmo intelectual. Responde en el mismo idioma del usuario (español o inglés).${kbContext}`
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
      const geminiText = await callGeminiAPI(safeMessage, validHistory)
      if (geminiText) {
        const filteredResponse = filterServerOutput(geminiText)
        return NextResponse.json({ text: filteredResponse })
      }
      const fallbackText = getFallbackResponse(safeMessage)
      const filteredFallback = filterServerOutput(fallbackText)
      return NextResponse.json({
        text: `${filteredFallback}\n\n*(Nota: El servicio de IA experimentó una interrupción temporal. Respuesta proporcionada por la base de conocimiento local de ZAFIRO.)*`
      })
    }

    const fallbackText = getFallbackResponse(safeMessage)
    const filteredFallback = filterServerOutput(fallbackText)
    return NextResponse.json({ text: filteredFallback })
  } catch {
    return NextResponse.json(
      { text: "Error interno del servidor. El equipo de ZAFIRO ha sido notificado." },
      { status: 500 }
    )
  }
}
