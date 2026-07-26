'use client'

import type {
  ElianaChannel,
  ElianaConversation,
  ElianaMessage,
  ElianaIntent,
  RiskLevel,
  ChannelContext,
  ConversationStatus
} from './types'
import { INTENT_RISK_MAP, CHANNEL_CONFIGS } from './types'
import { buildKnowledgeContext } from './knowledge'

// ================================================================
// ELIANA CONVERSATION ENGINE
// Motor central de conversación multi-canal
// ================================================================

const CONVERSATIONS_KEY = 'eliana_conversations'
const MESSAGES_KEY = 'eliana_messages'

// --- Storage helpers ---

function getConversations(): ElianaConversation[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(CONVERSATIONS_KEY) || '[]') } catch { return [] }
}

function saveConversations(convos: ElianaConversation[]) {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convos))
}

function getMessages(): ElianaMessage[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]') } catch { return [] }
}

function saveMessages(msgs: ElianaMessage[]) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs))
}

// --- Intent Classification ---

export function classifyIntent(message: string): ElianaIntent {
  const q = message.toLowerCase()

  // Saludos
  if (/^(hola|hello|hi|hey|bendiciones|buenos|buenas)/.test(q)) return 'greeting'

  // Soporte / humano
  if (/(persona|humano|agente|hablar con|don miguel|escalar)/.test(q)) return 'human_support'

  // Productos
  if (/(producto|nevera|panel|tv|articulo|equipo|dispositivo)/.test(q)) return 'product_inquiry'
  if (/(precio|cuanto|cuesta|costo|valor)/.test(q)) return 'price_check'
  if (/(disponible|hay|stock|inventario|tienen)/.test(q)) return 'availability'

  // Pedidos
  if (/(pedido|orden|comprar|quiero comprar|carrito)/.test(q)) return 'order_create'
  if (/(estado|donde esta|se proceso|llego|envio)/.test(q)) return 'order_status'

  // Remesas
  if (/(enviar dinero|remesa|transferir|envio de dinero)/.test(q)) return 'remittance'

  // Cambio
  if (/(cambio|tasa|dolar|peso|moneda)/.test(q)) return 'currency_exchange'

  // Viajes
  if (/(viaje|viajar|boletos|vuelo|hotel)/.test(q)) return 'travel'

  // Quejas
  if (/(queja|reclamo|no me gusta|mal|problema|defecto)/.test(q)) return 'complaint'
  if (/(reembolso|devolver|devolucion)/.test(q)) return 'refund'

  // Vendedor
  if (/(vender|tienda|mi tienda|vendedor|proveedor)/.test(q)) return 'become_seller'
  if (/(crear negocio|negocio|empresa)/.test(q)) return 'create_business'

  // Servicios digitales
  if (/(pagina web|aplicacion|app|diseño|branding)/.test(q)) return 'digital_services'

  // ZAFIRO
  if (/(zafiro|conocimiento|proyecto|ecosistema)/.test(q)) return 'zafiro_guidance'

  // Consejo Invisible
  if (/(consejo invisible|guia|enseñanza|oracion|meditacion)/.test(q)) return 'council_invisible'

  // Soporte general
  if (/(ayuda|soporte|soy|como)/.test(q)) return 'support'

  return 'unknown'
}

export function getIntentRisk(intent: ElianaIntent): RiskLevel {
  return INTENT_RISK_MAP[intent] || 'low'
}

// --- Conversation Management ---

export function createConversation(contactId: string, channel: ElianaChannel): ElianaConversation {
  const convos = getConversations()
  const newConvo: ElianaConversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    contact_id: contactId,
    channel,
    status: 'active',
    risk_level: 'low',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  convos.push(newConvo)
  saveConversations(convos)
  return newConvo
}

export function getConversation(id: string): ElianaConversation | null {
  return getConversations().find(c => c.id === id) || null
}

export function getActiveConversations(): ElianaConversation[] {
  return getConversations().filter(c => c.status === 'active')
}

export function updateConversation(id: string, updates: Partial<ElianaConversation>): ElianaConversation | null {
  const convos = getConversations()
  const idx = convos.findIndex(c => c.id === id)
  if (idx === -1) return null
  convos[idx] = { ...convos[idx], ...updates, updated_at: new Date().toISOString() }
  saveConversations(convos)
  return convos[idx]
}

// --- Message Management ---

export function addMessage(conversationId: string, role: 'user' | 'eliana' | 'human_agent', content: string, channel: ElianaChannel, metadata?: Record<string, unknown>): ElianaMessage {
  const msgs = getMessages()
  const newMsg: ElianaMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    conversation_id: conversationId,
    role,
    content,
    channel,
    metadata,
    created_at: new Date().toISOString()
  }
  msgs.push(newMsg)
  saveMessages(msgs)
  return newMsg
}

export function getConversationMessages(conversationId: string, limit: number = 20): ElianaMessage[] {
  return getMessages()
    .filter(m => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-limit)
}

// --- Main Processing ---

export interface ProcessResult {
  response: string
  intent: ElianaIntent
  risk_level: RiskLevel
  requires_human: boolean
  knowledge_used: string[]
  suggestions: string[]
}

export function processMessage(
  message: string,
  conversationId: string,
  channel: ElianaChannel,
  context?: ChannelContext
): ProcessResult {
  const intent = classifyIntent(message)
  const risk = getIntentRisk(intent)
  const config = CHANNEL_CONFIGS[channel]

  // Buscar conocimiento relevante
  const knowledgeContext = buildKnowledgeContext(message, channel)
  const knowledgeUsed: string[] = []
  if (knowledgeContext) {
    knowledgeUsed.push(knowledgeContext.slice(0, 100))
  }

  // Determinar si requiere humano
  const requiresHuman = risk === 'high' || risk === 'critical' || intent === 'human_support'

  // Generar respuesta según intención
  let response = ''
  const suggestions: string[] = []

  switch (intent) {
    case 'greeting':
      response = config.welcome_message
      suggestions.push('¿Qué productos tienen?', '¿Cómo puedo vender?', '¿Qué es ZAFIRO?')
      break

    case 'product_inquiry':
      response = knowledgeContext
        ? `Encontré esta información:\n\n${knowledgeContext.slice(0, 500)}\n\n¿Te gustaría saber el precio o disponibilidad de algún producto específico?`
        : 'Puedo ayudarte con productos. ¿Qué estás buscando exactamente?'
      suggestions.push('Ver precios', 'Consultar disponibilidad', 'Hablar con una persona')
      break

    case 'price_check':
      response = knowledgeContext
        ? `Estos son los precios actuales:\n\n${knowledgeContext.slice(0, 500)}\n\n¿Necesitas información sobre algún servicio en particular?`
        : 'Puedo consultarte los precios. ¿Sobre qué producto o servicio necesitas información?'
      break

    case 'human_support':
      response = 'Voy a conectarte con una persona del equipo. Un momento por favor.'
      suggestions.push('Esperar', 'Dejar mensaje')
      break

    case 'unknown':
      response = 'Puedo ayudarte con productos, precios, pedidos, servicios digitales y más. ¿Qué necesitas?'
      suggestions.push('Productos', 'Servicios', 'Pedidos', 'Hablar con alguien')
      break

    default:
      response = knowledgeContext
        ? `Basado en nuestra información:\n\n${knowledgeContext.slice(0, 500)}\n\n¿Hay algo más en lo que pueda ayudarte?`
        : 'Déjame buscarte esa información. ¿Podrías darme más detalles?'
      suggestions.push('Más información', 'Hablar con una persona')
  }

  // Agregar disclaimer si es necesario
  if (risk === 'medium' || risk === 'high') {
    response += '\n\n_' + CHANNEL_CONFIGS[channel].system_prompt_addition + '_'
  }

  return {
    response,
    intent,
    risk_level: risk,
    requires_human: requiresHuman,
    knowledge_used: knowledgeUsed,
    suggestions
  }
}

// --- Stats ---

export function getConversationStats() {
  const convos = getConversations()
  const msgs = getMessages()
  const today = new Date().toISOString().split('T')[0]

  return {
    total_conversations: convos.length,
    active_conversations: convos.filter(c => c.status === 'active').length,
    resolved_today: convos.filter(c => c.resolved_at?.startsWith(today)).length,
    total_messages: msgs.length,
    messages_today: msgs.filter(m => m.created_at.startsWith(today)).length
  }
}
