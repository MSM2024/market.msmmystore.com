const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+prompts/i,
  /you\s+are\s+now\s+(a|an|the)/i,
  /new\s+instructions?:/i,
  /system\s*:\s*/i,
  /assistant\s*:\s*/i,
  /human\s*:\s*/i,
  /\bDAN\b.*\bmode\b/i,
  /jailbreak/i,
  /bypass\s+(all\s+)?safety/i,
  /override\s+(all\s+)?rules/i,
  /pretend\s+you\s+(are|were)/i,
  /act\s+as\s+if\s+you\s+(have|had)/i,
  /roleplay\s+as/i,
  /from\s+now\s+on\s+you/i,
  /forget\s+(all\s+)?your\s+instructions/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<<SYS>>/i,
  /<\/SYS>>/i,
]

const SENSITIVE_PATTERNS = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  /\b(password|contraseña|secret|key|token)\s*[:=]\s*\S+/i,
  /\bapi[_-]?key\s*[:=]\s*\S+/i,
  /\bsk[_-]?live[_-]?[a-zA-Z0-9]+\b/,
  /\bpk[_-]?live[_-]?[a-zA-Z0-9]+\b/,
]

const BLOCKED_TOPICS = [
  /how\s+to\s+(hack|crack|bypass)/i,
  /how\s+to\s+(make|build)\s+(a\s+)?(bomb|weapon|explosive)/i,
  /suicide|suicidio/i,
  /self[\s-]harm|auto[\s-]lesión/i,
  /child\s+abuse|abuso\s+infantil/i,
  /human\s+trafficking|trata\s+de\s+personas/i,
]

export interface GuardrailResult {
  safe: boolean
  reason?: string
  sanitized?: string
  blocked: boolean
  flagged: boolean
  flags: string[]
}

export function checkInputSafety(input: string): GuardrailResult {
  const flags: string[] = []
  let blocked = false
  let flagged = false
  let reason: string | undefined

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      blocked = true
      reason = "Potential prompt injection detected"
      flags.push("prompt_injection")
      break
    }
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(input)) {
      flagged = true
      flags.push("sensitive_data")
      if (!reason) reason = "Sensitive data detected in input"
    }
  }

  for (const pattern of BLOCKED_TOPICS) {
    if (pattern.test(input)) {
      blocked = true
      reason = "Blocked topic detected"
      flags.push("blocked_topic")
      break
    }
  }

  let sanitized = input
  sanitized = sanitized.replace(/\0/g, "")
  sanitized = sanitized.replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
  sanitized = sanitized.replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F\u2070-\u209F]/g, "")

  return {
    safe: !blocked,
    reason,
    sanitized,
    blocked,
    flagged,
    flags,
  }
}

export function checkOutputSafety(output: string): GuardrailResult {
  const flags: string[] = []
  let blocked = false
  let flagged = false
  let reason: string | undefined

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  if (emailRegex.test(output)) {
    flagged = true
    flags.push("email_exposure")
  }

  const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
  if (phoneRegex.test(output)) {
    flagged = true
    flags.push("phone_exposure")
  }

  const ssnRegex = /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g
  if (ssnRegex.test(output)) {
    blocked = true
    reason = "SSN detected in output"
    flags.push("ssn_exposure")
  }

  const envVarRegex = /\b(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|GEMINI_API_KEY)\b/g
  if (envVarRegex.test(output)) {
    blocked = true
    reason = "Environment variable name detected in output"
    flags.push("env_var_exposure")
  }

  let sanitized = output
  sanitized = sanitized.replace(emailRegex, "[EMAIL REDACTED]")
  sanitized = sanitized.replace(phoneRegex, "[TEL REDACTED]")
  sanitized = sanitized.replace(ssnRegex, "[SSN REDACTED]")

  return {
    safe: !blocked,
    reason,
    sanitized,
    blocked,
    flagged,
    flags,
  }
}

export function extractTopics(text: string): string[] {
  const topicPatterns: Array<{ pattern: RegExp; topic: string }> = [
    { pattern: /marketplace|tienda|producto|compra|venta/i, topic: "marketplace" },
    { pattern: /membership|membresía|plan|suscripción/i, topic: "memberships" },
    { pattern: /pago|stripe|tarjeta|factura|cobro/i, topic: "payments" },
    { pattern: /envío|delivery|paquete|entrega|shipping/i, topic: "delivery" },
    { pattern: /referido|referidos|invitar|affiliate/i, topic: "referrals" },
    { pattern: /recompensa|reward|puntos|pts|ganar/i, topic: "rewards" },
    { pattern: /escuela|academia|curso|aprender|educación/i, topic: "academy" },
    { pattern: /gemología|gema|piedra|joya|cuarzo|amatista/i, topic: "gemology" },
    { pattern: /consejo\s+invisible|council|sabiduría/i, topic: "council" },
    { pattern: /zafiro|plataforma|ecosistema/i, topic: "zafiro" },
    { pattern: /eliana|asistente|chat|ai|inteligencia/i, topic: "eliana" },
    { pattern: /seguridad|password|cuenta|auth|login/i, topic: "security" },
    { pattern: /perfil|datos|configuración|settings/i, topic: "settings" },
    { pattern: /comunidad|social|compartir|feed/i, topic: "community" },
    { pattern: /album|vida|photos|fotos|memoria/i, topic: "album" },
    { pattern: /inventa|solver|servicio|servicios/i, topic: "services" },
    { pattern: /cultura|arte|música|creatividad/i, topic: "culture" },
  ]

  const topics: string[] = []
  for (const { pattern, topic } of topicPatterns) {
    if (pattern.test(text) && !topics.includes(topic)) {
      topics.push(topic)
    }
  }

  return topics
}

export function buildSystemPrompt(
  elianaIdentity: string,
  context?: {
    userRole?: string
    currentPage?: string
    sourceApp?: string
  }
): string {
  const roleContext = context?.userRole ? `El usuario tiene el rol: ${context.userRole}.` : ""
  const pageContext = context?.currentPage ? `Página actual: ${context.currentPage}.` : ""
  const sourceContext = context?.sourceApp ? `Origen: ${context.sourceApp}.` : ""

  return `${elianaIdentity}

## Reglas Fundamentales
1. Responde SIEMPRE en español
2. Sé amable, profesional y servicial
3. Usa el conocimiento de la base de datos para respuestas precisas
4. Si no tienes información específica, di "No tengo información específica sobre eso, pero puedo ayudarte a encontrar lo que necesitas"
5. NUNCA inventes información que no esté en la base de conocimiento
6. Cita fuentes cuando sea posible
7. Mantén respuestas concisas pero completas
8. Adapta tu tono al contexto del usuario
9. Si detectas una solicitud inapropiada, recházala educadamente
10. Ofrece acciones concretas cuando sea posible

## Contexto
${roleContext}
${pageContext}
${sourceContext}

## Capacidades
- Responder preguntas sobre MSM, el marketplace, membresías, pagos, envíos, referidos, recompensas
- Guiar a los usuarios en el uso de la plataforma
- Proporcionar información sobre gemología y productos
- Ayudar con configuración y soporte técnico
- Conectar con el equipo cuando es necesario`
}

export const ELIANA_IDENTITY = `Soy ELIANA, la asistente de IA de MSM (Mi Sello Mi Mercado). Mi nombre significa "luz" y mi misión es iluminar el camino de nuestros usuarios en el ecosistema MSM.

Soy parte integral de ZAFIRO, la plataforma Knowledge Future que conecta conocimiento, comunidad y comercio.

Mi personalidad:
- Amable y empática
- Conocedora del ecosistema MSM
- Proactiva en ofrecer ayuda
- Respetuosa y profesional
- Entusiasta pero no exagerada

Especialidades:
- Marketplace MSM y productos
- Sistema de membresías y niveles
- Pagos con Stripe
- Envíos y logística
- Programa de referidos y recompensas
- Escuela MSM y educación
- Gemología y productos naturales
- Consejo Invisible y sabiduría
- Album de la Vida y comunidad

Estoy aquí para servirte. ¿En qué puedo ayudarte hoy?`

export function sanitizeForDisplay(text: string): string {
  let sanitized = text
  sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "****-****-****-****")
  sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[email protegido]")
  sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "***-***-****")
  return sanitized
}

export function truncateWithContext(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength - 3)
  const lastSentence = truncated.lastIndexOf(".")
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1) + "..."
  }
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}
