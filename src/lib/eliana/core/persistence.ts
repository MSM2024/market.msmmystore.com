'use client'

// ================================================================
// ELIANA PERSISTENCE — SOLO ESTADO TEMPORAL DE SESIÓN
// ZAFIRO NO almacena historial permanente de conversaciones.
// - Sin Supabase: no escribe en eliana_conversations/eliana_messages.
// - sessionStorage: efímero, vive solo durante la pestaña de sesión
//   y se limpia al cerrar la pestaña/navegador (o al resetear chat).
// - Al cargar, se eliminan los datos permanentes legados de
//   localStorage (limpieza del archivo antiguo).
// - Límite de mensajes por sesión para visitantes (50).
// ================================================================

const SESSION_MESSAGES_KEY = "eliana_session_chat_messages_v2"
const LEGACY_LOCAL_KEYS = ["eliana_chat_messages", "eliana_chat_conversation_id"]
const MAX_SESSION_MESSAGES = 60

export interface PersistedMessage {
  id: string
  role: 'user' | 'eliana'
  text: string
  timestamp: number
}

// --- Session-scoped helpers ---

function getSessionMessages(): PersistedMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(SESSION_MESSAGES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSessionMessages(messages: PersistedMessage[]) {
  if (typeof window === 'undefined') return
  try {
    const trimmed = messages.slice(-MAX_SESSION_MESSAGES)
    window.sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(trimmed))
  } catch {
    // sessionStorage no disponible: la conversación vive solo en memoria
  }
}

// Limpieza del historial permanente legado (localStorage) al arrancar.
function cleanupLegacyHistory() {
  if (typeof window === 'undefined') return
  try {
    for (const key of LEGACY_LOCAL_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // ignorar
  }
}

// --- Public API (firma idéntica para todos los chats) ---

export async function loadMessages(): Promise<PersistedMessage[]> {
  cleanupLegacyHistory()
  return getSessionMessages()
}

export async function saveMessage(message: PersistedMessage): Promise<void> {
  const messages = getSessionMessages()
  const exists = messages.find(m => m.id === message.id)
  if (!exists) {
    messages.push(message)
    saveSessionMessages(messages)
  }
}

export async function clearHistory(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(SESSION_MESSAGES_KEY)
  } catch {
    // best effort
  }
}

export function getVisitorMessageCount(): number {
  return getSessionMessages().length
}

export function canSendMessage(): { allowed: boolean; reason?: string } {
  const messages = getSessionMessages()
  const userMessages = messages.filter(m => m.role === 'user')

  // Límite por sesión del visitante: 50 mensajes (efímeros, se reinician
  // al cerrar la pestaña). Los usuarios con sesión no tienen límite.
  if (userMessages.length >= 50) {
    return {
      allowed: false,
      reason: 'Has alcanzado el límite de esta sesión. Cierra la pestaña o espera a una sesión nueva.',
    }
  }

  return { allowed: true }
}