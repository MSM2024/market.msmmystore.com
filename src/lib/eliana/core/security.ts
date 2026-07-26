'use client'

// ================================================================
// ELIANA SECURITY LAYER
// Input filtering, output filtering, prompt injection protection
// ================================================================

const MAX_INPUT_LENGTH = 2000
const MAX_OUTPUT_LENGTH = 4000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_MESSAGES = 20
const SPAM_COOLDOWN_MS = 1_500

// --- Prompt Injection Patterns ---
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|earlier|above)\s+(instructions|prompts|rules|guidelines)/i,
  /you\s+are\s+now\s+(a|an|the)\s+(?:different|new|free|unrestricted)/i,
  /system\s*(?:prompt|instruction|message)\s*[:=]/i,
  /reveal\s+(?:your|the)\s+(?:system|initial|original)\s+prompt/i,
  /what\s+(?:is|are)\s+your\s+(?:system|initial|original)\s+(?:prompt|instructions)/i,
  /act\s+as\s+(?:if|though)\s+you\s+(?:have|are|can)/i,
  /pretend\s+(?:you\s+)?(?:are|have|can|do\s+not\s+have)/i,
  /developer\s+mode\s*(?:on|enabled|activate)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
  /do\s+anything\s+now/i,
  /bypass\s+(?:all\s+)?(?:filters|restrictions|rules|guidelines|limitations)/i,
  /override\s+(?:your|the)\s+(?:rules|guidelines|instructions|programming)/i,
  /(?:now|from\s+now\s+on)\s+(?:you\s+)?(?:will|must|should|shall)\s+(?:not|never)\s+(?:follow|obey|apply)/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /Human:\s*/i,
  /Assistant:\s*/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
]

// --- Private Data Patterns ---
const PRIVATE_DATA_PATTERNS = [
  { pattern: /(?:email|correo)\s*(?:es|:|=)\s*\S+@\S+/i, replacement: "[correo protegido]" },
  { pattern: /(?:tel[eé]fono|phone|celular|m[oó]vil)\s*(?:es|:|=)\s*[\d\s\-\+\(\)]+/i, replacement: "[teléfono protegido]" },
  { pattern: /(?:password|contraseña|passwd|pwd)\s*(?:es|:|=)\s*\S+/i, replacement: "[contraseña protegida]" },
  { pattern: /(?:api[_\s]?key|clave[_\s]?api)\s*(?:es|:|=)\s*\S+/i, replacement: "[clave protegida]" },
  { pattern: /(?:secret|token|Bearer)\s*(?:es|:|=)\s*\S+/i, replacement: "[token protegido]" },
]

// --- Sensitive Topics (ELIANA must never reveal) ---
const SENSITIVE_TOPICS = [
  /(?:nombre|name)\s+(?:privado|personal)\s+(?:del?\s*)?(?:dueño|owner|proprietario|miguel)/i,
  /(?:dirección|address|domicilio)\s+(?:del?\s*)?(?:dueño|owner|miguel)/i,
  /(?:credenciales?|credentials?|claves?|keys?|contraseñas?)\s+(?:del?\s*)?(?:sistema|supabase|vercel|api)/i,
  /(?:variables?\s+de\s+entorno|env\s+vars?|environment\s+variables?)/i,
  /(?:datos?\s+bancari?o?s?|bank\s+(?:data|details|account))/i,
  /(?:información\s+financiera|financial\s+(?:info|data|details))/i,
  /(?:número\s+de\s+(?:tarjeta|cuenta)|account\s+number|card\s+number)/i,
  /(?:SSN|social\s+security)/i,
]

// --- Spam Detection ---
let lastMessageTime = 0
let consecutiveIdentical = 0
let lastMessageText = ''

// --- Rate Limiting ---
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export interface SecurityCheckResult {
  allowed: boolean
  reason?: string
  filteredMessage?: string
  riskLevel: 'safe' | 'warning' | 'blocked'
}

export interface OutputFilterResult {
  filtered: string
  wasModified: boolean
  blockedTopics: string[]
}

// --- Input Validation ---

export function validateInput(message: string, userId?: string): SecurityCheckResult {
  const trimmed = message.trim()

  // Empty check
  if (!trimmed) {
    return { allowed: false, reason: 'Mensaje vacío', riskLevel: 'blocked' }
  }

  // Length check
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      allowed: false,
      reason: `El mensaje excede ${MAX_INPUT_LENGTH} caracteres`,
      riskLevel: 'blocked',
    }
  }

  // Rate limiting
  if (userId) {
    const rl = checkRateLimit(userId)
    if (!rl.allowed) {
      return {
        allowed: false,
        reason: 'Demasiadas solicitudes. Espera un momento.',
        riskLevel: 'blocked',
      }
    }
  }

  // Spam detection
  const spamCheck = checkSpam(trimmed)
  if (!spamCheck.allowed) {
    return {
      allowed: false,
      reason: spamCheck.reason || 'Mensaje detectado como spam',
      riskLevel: 'blocked',
    }
  }

  // Prompt injection detection
  const injectionCheck = detectPromptInjection(trimmed)
  if (injectionCheck.detected) {
    return {
      allowed: false,
      reason: 'Tu mensaje contiene patrones no permitidos.',
      riskLevel: 'blocked',
    }
  }

  // Sensitive topic detection
  const sensitiveCheck = detectSensitiveTopics(trimmed)
  if (sensitiveCheck.detected) {
    return {
      allowed: true,
      filteredMessage: trimmed,
      reason: 'Tu solicitud contiene información sensible. No puedo procesar eso.',
      riskLevel: 'warning',
    }
  }

  // Input sanitization
  const sanitized = sanitizeInput(trimmed)

  return { allowed: true, filteredMessage: sanitized, riskLevel: 'safe' }
}

// --- Prompt Injection Detection ---

function detectPromptInjection(message: string): { detected: boolean; pattern?: string } {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      return { detected: true, pattern: pattern.source }
    }
  }
  return { detected: false }
}

// --- Sensitive Topic Detection ---

function detectSensitiveTopics(message: string): { detected: boolean; topics: string[] } {
  const topics: string[] = []
  for (const pattern of SENSITIVE_TOPICS) {
    if (pattern.test(message)) {
      topics.push(pattern.source)
    }
  }
  return { detected: topics.length > 0, topics }
}

// --- Spam Detection ---

function checkSpam(message: string): { allowed: boolean; reason?: string } {
  const now = Date.now()

  // Cooldown check
  if (now - lastMessageTime < SPAM_COOLDOWN_MS) {
    consecutiveIdentical++
    if (consecutiveIdentical >= 3) {
      return { allowed: false, reason: 'Estás enviando mensajes muy rápido. Espera un momento.' }
    }
  } else {
    consecutiveIdentical = 0
  }

  // Identical message spam
  if (message === lastMessageText) {
    consecutiveIdentical++
    if (consecutiveIdentical >= 3) {
      return { allowed: false, reason: 'Has enviado el mismo mensaje varias veces.' }
    }
  }

  lastMessageTime = now
  lastMessageText = message
  return { allowed: true }
}

// --- Rate Limiting ---

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(userId)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_MESSAGES - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX_MESSAGES) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_MESSAGES - entry.count }
}

// --- Input Sanitization ---

function sanitizeInput(message: string): string {
  let sanitized = message

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '')

  // Normalize whitespace
  sanitized = sanitized.replace(/\s{4,}/g, '   ')

  // Remove invisible Unicode characters (except normal spaces)
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF\u2060-\u2064]/g, '')

  return sanitized.trim()
}

// --- Output Filtering ---

export function filterOutput(response: string): OutputFilterResult {
  let filtered = response
  let wasModified = false
  const blockedTopics: string[] = []

  // Filter private data patterns
  for (const { pattern, replacement } of PRIVATE_DATA_PATTERNS) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, replacement)
      wasModified = true
      blockedTopics.push('private_data')
    }
  }

  // Block responses that contain env vars or secrets
  if (/(?:SUPABASE|GEMINI|OPENAI|STRIPE|VERCEL)[_\s]?(?:URL|KEY|SECRET|TOKEN)/i.test(filtered)) {
    filtered = 'No puedo compartir información técnica del sistema.'
    wasModified = true
    blockedTopics.push('env_vars')
  }

  // Block responses that look like they contain API keys
  if (/(?:sk-|pk-|eyJ|sb-)[a-zA-Z0-9]{20,}/.test(filtered)) {
    filtered = 'No puedo compartir credenciales del sistema.'
    wasModified = true
    blockedTopics.push('api_keys')
  }

  // Truncate if too long
  if (filtered.length > MAX_OUTPUT_LENGTH) {
    filtered = filtered.slice(0, MAX_OUTPUT_LENGTH) + '\n\n... (respuesta truncada)'
    wasModified = true
  }

  // Ensure disclaimer is present for financial/medical/legal topics
  const needsDisclaimer = /(financ|médic|legal|banco|invers|préstamo|crédito|salud)/i.test(filtered)
  if (needsDisclaimer && !filtered.includes('orientación')) {
    filtered += '\n\n_Recuerda: Esta información es solo orientación. Consulta con un profesional para decisiones importantes._'
  }

  return { filtered, wasModified, blockedTopics }
}

// --- Client-Side Rate Limit for UI ---

const clientRateLimit = { count: 0, resetAt: 0 }

export function clientRateCheck(): { allowed: boolean; waitMs?: number } {
  const now = Date.now()

  if (now > clientRateLimit.resetAt) {
    clientRateLimit.count = 1
    clientRateLimit.resetAt = now + RATE_LIMIT_WINDOW_MS
    return { allowed: true }
  }

  if (clientRateLimit.count >= RATE_LIMIT_MAX_MESSAGES) {
    const waitMs = clientRateLimit.resetAt - now
    return { allowed: false, waitMs }
  }

  clientRateLimit.count++
  return { allowed: true }
}

// --- Get remaining messages ---

export function getRemainingMessages(): number {
  const now = Date.now()
  if (now > clientRateLimit.resetAt) return RATE_LIMIT_MAX_MESSAGES
  return Math.max(0, RATE_LIMIT_MAX_MESSAGES - clientRateLimit.count)
}
