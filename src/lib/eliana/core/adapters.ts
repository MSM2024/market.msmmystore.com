'use client'

import type {
  ElianaChannel,
  ChannelContext,
  ElianaConversation,
  ElianaIntake
} from './types'
import { CHANNEL_CONFIGS } from './types'
import {
  createConversation,
  getConversation,
  addMessage,
  processMessage,
  getConversationMessages,
  updateConversation
} from './conversation'

// ================================================================
// ELIANA CHANNEL ADAPTERS
// Adaptadores separados para cada canal de comunicación
// ================================================================

export interface AdapterResponse {
  conversation_id: string
  message: string
  suggestions: string[]
  requires_human: boolean
  intake?: ElianaIntake
}

// --- Base Adapter ---

class BaseAdapter {
  protected channel: ElianaChannel

  constructor(channel: ElianaChannel) {
    this.channel = channel
  }

  protected getConfig() {
    return CHANNEL_CONFIGS[this.channel]
  }

  protected ensureConversation(contactId: string): ElianaConversation {
    // Buscar conversación activa existente o crear nueva
    const existing = getConversationMessages(`conv_${contactId}_${this.channel}`, 1)
    if (existing.length > 0) {
      const convId = existing[0].conversation_id
      const conv = getConversation(convId)
      if (conv && conv.status === 'active') return conv
    }
    return createConversation(contactId, this.channel)
  }

  async processMessage(
    contactId: string,
    message: string,
    context?: ChannelContext
  ): Promise<AdapterResponse> {
    const conv = this.ensureConversation(contactId)

    // Guardar mensaje del usuario
    addMessage(conv.id, 'user', message, this.channel)

    // Procesar con el motor central
    const result = processMessage(message, conv.id, this.channel, context)

    // Guardar respuesta de ELIANA
    addMessage(conv.id, 'eliana', result.response, this.channel)

    // Si requiere humano, crear handoff
    if (result.requires_human) {
      updateConversation(conv.id, { status: 'waiting_human' })
    }

    return {
      conversation_id: conv.id,
      message: result.response,
      suggestions: result.suggestions,
      requires_human: result.requires_human
    }
  }

  getHistory(conversationId: string): Array<{ role: string; content: string }> {
    return getConversationMessages(conversationId).map(m => ({
      role: m.role === 'human_agent' ? 'assistant' : m.role,
      content: m.content
    }))
  }
}

// --- Web Adapter ---

export class WebAdapter extends BaseAdapter {
  constructor() {
    super('web')
  }

  async processWithContext(
    contactId: string,
    message: string,
    page: string,
    section?: string,
    itemId?: string
  ): Promise<AdapterResponse> {
    const context: ChannelContext = {
      channel: 'web',
      page,
      section,
      item_id: itemId
    }
    return this.processMessage(contactId, message, context)
  }
}

// --- WhatsApp Adapter ---

export class WhatsAppAdapter extends BaseAdapter {
  constructor() {
    super('whatsapp')
  }

  async processWhatsAppMessage(
    phone: string,
    message: string
  ): Promise<AdapterResponse> {
    const contactId = `wa_${phone}`
    const context: ChannelContext = {
      channel: 'whatsapp'
    }

    // WhatsApp: respuestas más cortas
    const result = await this.processMessage(contactId, message, context)

    // Truncar si es muy largo para WhatsApp
    if (result.message.length > 1500) {
      result.message = result.message.slice(0, 1497) + '...'
    }

    return result
  }

  async sendTemplate(phone: string, templateName: string, params?: Record<string, string>): Promise<boolean> {
    // Placeholder para WhatsApp Cloud API (sin envíos reales)
    console.log(`[WhatsApp] Would send template "${templateName}" to ${phone}`, params)
    return true
  }
}

// --- Telegram Adapter (seguro: sin envíos reales) ---

export class TelegramAdapter extends BaseAdapter {
  constructor() {
    super('telegram')
  }

  async processTelegramMessage(chatId: string, message: string): Promise<AdapterResponse> {
    const context: ChannelContext = { channel: 'telegram' }
    return this.processMessage(`tg_${chatId}`, message, context)
  }

  async sendMessage(chatId: string, text: string): Promise<{ sent: boolean; reason: string }> {
    const config = this.getConfig()
    if (!config.enabled) return { sent: false, reason: 'channel_disabled' }
    if (!config.metadata?.requires_credentials) return { sent: false, reason: 'missing_credentials' }
    // Simulación: no hay token de bot configurado
    console.log(`[Telegram] Would send message to ${chatId}`, text)
    return { sent: true, reason: 'simulated' }
  }
}

// --- Email Adapter (seguro: sin envíos reales) ---

export class EmailAdapter extends BaseAdapter {
  constructor() {
    super('email')
  }

  async sendEmail(to: string, subject: string, body: string): Promise<{ sent: boolean; reason: string }> {
    const config = this.getConfig()
    if (!config.enabled) return { sent: false, reason: 'channel_disabled' }
    if (!config.metadata?.requires_credentials) return { sent: false, reason: 'missing_credentials' }
    console.log(`[Email] Would send to ${to}`, subject, body)
    return { sent: true, reason: 'simulated' }
  }
}

// --- Despacho seguro de mensajes externos ---
// Nunca hace envíos reales a terceros: sin credenciales no se envía nada,
// y siempre se requiere confirmación explícita.

export interface SafeDispatchInput {
  channel: ElianaChannel
  to: string
  message: string
  confirmed: boolean
}

export interface SafeDispatchResult {
  sent: boolean
  simulated: boolean
  reason: 'channel_disabled' | 'not_confirmed' | 'missing_credentials' | 'simulated_sent'
}

export function dispatchSafeMessage(input: SafeDispatchInput): SafeDispatchResult {
  const config = CHANNEL_CONFIGS[input.channel]
  if (!input.confirmed) return { sent: false, simulated: false, reason: 'not_confirmed' }
  if (!config.enabled) return { sent: false, simulated: false, reason: 'channel_disabled' }
  if (config.metadata?.requires_credentials) {
    return { sent: false, simulated: false, reason: 'missing_credentials' }
  }
  console.log(`[ELIANA] Simulated ${input.channel} message to ${input.to}`, input.message)
  return { sent: true, simulated: true, reason: 'simulated_sent' }
}

// --- Marketplace Adapter ---

export class MarketplaceAdapter extends BaseAdapter {
  constructor() {
    super('marketplace')
  }

  async processProductInquiry(
    contactId: string,
    message: string,
    productId: string,
    productName: string,
    storeId: string
  ): Promise<AdapterResponse> {
    const context: ChannelContext = {
      channel: 'marketplace',
      module: 'products',
      product_id: productId,
      product_name: productName,
      store_id: storeId
    }
    return this.processMessage(contactId, message, context)
  }

  async createSellerIntake(
    contactId: string,
    data: Record<string, string>
  ): Promise<ElianaIntake> {
    const intake: ElianaIntake = {
      id: `intake_${Date.now()}`,
      conversation_id: '',
      intake_type: 'MarketplaceSellerIntake',
      data,
      completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Guardar en localStorage
    const intakes = JSON.parse(localStorage.getItem('eliana_intakes') || '[]')
    intakes.push(intake)
    localStorage.setItem('eliana_intakes', JSON.stringify(intakes))

    return intake
  }
}

// --- ZAFIRO Adapter ---

export class ZafiroAdapter extends BaseAdapter {
  constructor() {
    super('zafiro')
  }

  async processWithModule(
    contactId: string,
    message: string,
    module: string
  ): Promise<AdapterResponse> {
    const context: ChannelContext = {
      channel: 'zafiro',
      module
    }
    return this.processMessage(contactId, message, context)
  }
}

// --- Eliana Domain Adapter ---

export class ElianaDomainAdapter extends BaseAdapter {
  constructor() {
    super('eliana_domain')
  }
}

// --- Factory ---

export function getAdapter(channel: ElianaChannel): BaseAdapter {
  switch (channel) {
    case 'web': return new WebAdapter()
    case 'whatsapp': return new WhatsAppAdapter()
    case 'telegram': return new TelegramAdapter()
    case 'email': return new EmailAdapter()
    case 'marketplace': return new MarketplaceAdapter()
    case 'zafiro': return new ZafiroAdapter()
    case 'eliana_domain': return new ElianaDomainAdapter()
    default: return new WebAdapter()
  }
}

// --- Continuity Token (Web -> WhatsApp) ---

export function generateContinuityToken(conversationId: string): string {
  const token = `ct_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const tokens = JSON.parse(localStorage.getItem('eliana_continuity_tokens') || '{}')
  tokens[token] = {
    conversation_id: conversationId,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    used: false
  }
  localStorage.setItem('eliana_continuity_tokens', JSON.stringify(tokens))
  return token
}

export function validateContinuityToken(token: string): string | null {
  const tokens = JSON.parse(localStorage.getItem('eliana_continuity_tokens') || '{}')
  const entry = tokens[token]
  if (!entry) return null
  if (entry.used) return null
  if (new Date(entry.expires_at) < new Date()) return null

  // Marcar como usado
  entry.used = true
  tokens[token] = entry
  localStorage.setItem('eliana_continuity_tokens', JSON.stringify(tokens))

  return entry.conversation_id
}
