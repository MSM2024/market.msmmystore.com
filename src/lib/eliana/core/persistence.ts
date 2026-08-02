'use client'

// ================================================================
// ELIANA PERSISTENCE LAYER
// localStorage for visitors, Supabase for authenticated users
// ================================================================

import { getSupabaseClient, isSupabaseAvailable } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const MESSAGES_KEY = 'eliana_chat_messages'
const CONVERSATION_KEY = 'eliana_chat_conversation_id'
const MAX_LOCAL_MESSAGES = 100

export interface PersistedMessage {
  id: string
  role: 'user' | 'eliana'
  text: string
  timestamp: number
}

// --- LocalStorage Helpers ---

function getLocalMessages(): PersistedMessage[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]')
  } catch {
    return []
  }
}

function saveLocalMessages(messages: PersistedMessage[]) {
  if (typeof window === 'undefined') return
  const trimmed = messages.slice(-MAX_LOCAL_MESSAGES)
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(trimmed))
}

function getLocalConversationId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CONVERSATION_KEY)
}

function setLocalConversationId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CONVERSATION_KEY, id)
}

// --- Supabase Helpers ---

function getSupabase() {
  if (!isSupabaseAvailable()) return null
  return getSupabaseClient()
}

async function getOrCreateSupabaseConversation(userId: string): Promise<string> {
  const supabase = getSupabase()
  if (!supabase) return ''

  // Check existing conversation
  const { data: existing } = await supabase
    .from('eliana_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('channel', 'eliana_domain')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  // Create new conversation
  const { data: newConvo } = await supabase
    .from('eliana_conversations')
    .insert({
      user_id: userId,
      channel: 'eliana_domain',
      status: 'active',
      risk_level: 'low',
      metadata: { user_id: userId },
    })
    .select('id')
    .maybeSingle()

  return newConvo?.id || ''
}

// --- Public API ---

export async function loadMessages(): Promise<PersistedMessage[]> {
  const session = getSession()

  if (session) {
    // Authenticated: try Supabase first
    const supabase = getSupabase()
    if (supabase) {
      try {
        const conversationId = getLocalConversationId()
        if (conversationId) {
          const { data } = await supabase
            .from('eliana_messages')
            .select('id, role, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
            .limit(MAX_LOCAL_MESSAGES)

          if (data && data.length > 0) {
            return data.map((m: { id: string; role: string; content: string; created_at: string }) => ({
              id: m.id,
              role: m.role as 'user' | 'eliana',
              text: m.content,
              timestamp: new Date(m.created_at).getTime(),
            }))
          }
        }
      } catch {
        // Fall through to localStorage
      }
    }
  }

  // Visitor or Supabase unavailable: use localStorage
  return getLocalMessages()
}

export async function saveMessage(message: PersistedMessage): Promise<void> {
  const session = getSession()

  // Always save locally for immediate UI access
  const local = getLocalMessages()
  const exists = local.find(m => m.id === message.id)
  if (!exists) {
    local.push(message)
    saveLocalMessages(local)
  }

  // If authenticated, also save to Supabase
  if (session) {
    const supabase = getSupabase()
    if (supabase) {
      try {
        let conversationId = getLocalConversationId()
        if (!conversationId) {
          conversationId = await getOrCreateSupabaseConversation(session.id)
          if (conversationId) {
            setLocalConversationId(conversationId)
          }
        }

        if (conversationId) {
          await supabase.from('eliana_messages').insert({
            conversation_id: conversationId,
            user_id: session.id,
            role: message.role,
            content: message.text,
            channel: 'eliana_domain',
          })
        }
      } catch {
        // localStorage backup is sufficient
      }
    }
  }
}

export async function clearHistory(): Promise<void> {
  // Clear local
  if (typeof window !== 'undefined') {
    localStorage.removeItem(MESSAGES_KEY)
    localStorage.removeItem(CONVERSATION_KEY)
  }

  // Mark Supabase conversation as resolved (don't delete)
  const session = getSession()
  if (session) {
    const supabase = getSupabase()
    if (supabase) {
      try {
        const conversationId = getLocalConversationId()
        if (conversationId) {
          await supabase
            .from('eliana_conversations')
            .update({ status: 'resolved', resolved_at: new Date().toISOString() })
            .eq('id', conversationId)
        }
      } catch {
        // Best effort
      }
    }
  }
}

export function getVisitorMessageCount(): number {
  return getLocalMessages().length
}

export function canSendMessage(): { allowed: boolean; reason?: string } {
  const messages = getLocalMessages()
  const userMessages = messages.filter(m => m.role === 'user')

  // Visitor limit: 50 messages per session
  if (userMessages.length >= 50) {
    return {
      allowed: false,
      reason: 'Has alcanzado el límite de mensajes como visitante. Inicia sesión para continuar.',
    }
  }

  return { allowed: true }
}
