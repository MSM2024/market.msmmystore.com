'use client'

// ================================================================
// ELIANA CORE — Tipos TypeScript
// Inteligencia Central del Ecosistema MSM
// ================================================================

// --- Canales ---
export type ElianaChannel = 'web' | 'whatsapp' | 'marketplace' | 'zafiro' | 'eliana_domain'

// --- Intenciones ---
export type ElianaIntent =
  | 'greeting'
  | 'product_inquiry'
  | 'price_check'
  | 'availability'
  | 'order_create'
  | 'order_status'
  | 'remittance'
  | 'currency_exchange'
  | 'travel'
  | 'complaint'
  | 'refund'
  | 'support'
  | 'become_seller'
  | 'create_business'
  | 'digital_services'
  | 'human_support'
  | 'general_info'
  | 'zafiro_guidance'
  | 'council_invisible'
  | 'unknown'

// --- Niveles de riesgo ---
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// --- Estado de conversación ---
export type ConversationStatus = 'active' | 'waiting_human' | 'resolved' | 'cancelled' | 'expired'

// --- Motivos de escalado ---
export type HandoffReason =
  | 'payment_confirmation'
  | 'private_payment_account'
  | 'refund'
  | 'complaint'
  | 'legal'
  | 'high_value_order'
  | 'identity_verification'
  | 'unapproved_information'
  | 'customer_requests_person'
  | 'technical_failure'
  | 'safety_alert'

// --- Estado de escalado ---
export type HandoffStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'

// --- Fuentes de conocimiento ---
export type KnowledgeSourceType = 'faq' | 'policy' | 'product' | 'service' | 'guide' | 'manual' | 'template'

export type KnowledgeStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'archived'

// --- Contexto del canal ---
export interface ChannelContext {
  channel: ElianaChannel
  module?: string
  page?: string
  section?: string
  item_id?: string
  user_role?: string
  product_id?: string
  product_name?: string
  store_id?: string
  order_reference?: string
  authorized_context?: string[]
}

// --- Contacto de ELIANA ---
export interface ElianaContact {
  id: string
  external_id: string
  channel: ElianaChannel
  name: string
  phone?: string
  email?: string
  country?: string
  language: string
  consent: boolean
  created_at: string
  updated_at: string
}

// --- Identidad unificada ---
export interface ElianaIdentity {
  id: string
  user_id?: string
  contact_id: string
  channel: ElianaChannel
  verified: boolean
  linked_at?: string
  created_at: string
}

// --- Conversación ---
export interface ElianaConversation {
  id: string
  contact_id: string
  channel: ElianaChannel
  status: ConversationStatus
  intent?: ElianaIntent
  risk_level: RiskLevel
  assigned_to?: string
  summary?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

// --- Mensaje ---
export interface ElianaMessage {
  id: string
  conversation_id: string
  role: 'user' | 'eliana' | 'human_agent'
  content: string
  channel: ElianaChannel
  metadata?: Record<string, unknown>
  created_at: string
}

// --- Sesión de canal ---
export interface ElianaChannelSession {
  id: string
  conversation_id: string
  channel: ElianaChannel
  session_token?: string
  expires_at?: string
  created_at: string
}

// --- Intake (ficha estructurada) ---
export type IntakeType =
  | 'CustomerIntake'
  | 'MarketplaceSellerIntake'
  | 'ProductInquiryIntake'
  | 'OrderSupportIntake'
  | 'DigitalServiceIntake'
  | 'CubaDeliveryIntake'
  | 'UnitedStatesDeliveryIntake'
  | 'HumanHandoffIntake'

export interface ElianaIntake {
  id: string
  conversation_id: string
  intake_type: IntakeType
  data: Record<string, unknown>
  completed: boolean
  created_at: string
  updated_at: string
}

// --- Escalado humano ---
export interface ElianaHandoff {
  id: string
  conversation_id: string
  reason: HandoffReason
  status: HandoffStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  summary: string
  assigned_to?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

// --- Conocimiento ---
export interface ElianaKnowledge {
  id: string
  category: string
  title: string
  content: string
  source: string
  version: number
  status: KnowledgeStatus
  priority: number
  valid_from?: string
  valid_until?: string
  requires_human_review: boolean
  approved_by?: string
  approved_at?: string
  tags: string[]
  channel: ElianaChannel | 'all'
  created_at: string
  updated_at: string
}

// --- Acción de ELIANA ---
export type ElianaActionType =
  | 'search_knowledge'
  | 'explain_product'
  | 'add_to_cart'
  | 'create_intake'
  | 'create_ticket'
  | 'request_human_review'
  | 'continue_whatsapp'

export interface ElianaAction {
  id: string
  conversation_id: string
  action_type: ElianaActionType
  parameters: Record<string, unknown>
  status: 'pending_confirmation' | 'confirmed' | 'executed' | 'failed'
  result?: Record<string, unknown>
  created_at: string
  executed_at?: string
}

// --- Configuración de canal ---
export interface ElianaChannelConfig {
  channel: ElianaChannel
  enabled: boolean
  welcome_message: string
  system_prompt_addition: string
  max_context_length: number
  allowed_intents: ElianaIntent[]
  requires_auth: boolean
  metadata?: Record<string, unknown>
}

// --- Dashboard del admin ---
export interface ElianaDashboardStats {
  total_conversations: number
  active_conversations: number
  resolved_today: number
  pending_handoffs: number
  knowledge_documents: number
  avg_response_time_ms: number
}

// --- Constantes ---
export const ELIANA_IDENTITY = {
  name: 'ELIANA MSM',
  presentation: 'Soy ELIANA, asistente virtual de MSM MY STORE',
  greeting: 'Bendiciones',
  default_language: 'es',
  disclaimer: 'Este contenido es una herramienta de orientación. Las decisiones financieras, legales o médicas deben ser examinadas responsablemente.'
} as const

export const INTENT_RISK_MAP: Record<ElianaIntent, RiskLevel> = {
  greeting: 'low',
  product_inquiry: 'low',
  price_check: 'low',
  availability: 'low',
  order_create: 'medium',
  order_status: 'low',
  remittance: 'high',
  currency_exchange: 'high',
  travel: 'medium',
  complaint: 'medium',
  refund: 'high',
  support: 'low',
  become_seller: 'medium',
  create_business: 'medium',
  digital_services: 'medium',
  human_support: 'low',
  general_info: 'low',
  zafiro_guidance: 'low',
  council_invisible: 'low',
  unknown: 'low'
}

export const CHANNEL_CONFIGS: Record<ElianaChannel, ElianaChannelConfig> = {
  web: {
    channel: 'web',
    enabled: true,
    welcome_message: 'Bendiciones. Soy ELIANA, asistente virtual de MSM. ¿En qué puedo ayudarte?',
    system_prompt_addition: '',
    max_context_length: 4000,
    allowed_intents: (Object.values(INTENT_RISK_MAP).length ? ['greeting', 'product_inquiry', 'price_check', 'availability', 'order_create', 'order_status', 'support', 'become_seller', 'create_business', 'digital_services', 'human_support', 'general_info', 'zafiro_guidance', 'council_invisible'] : ['greeting', 'general_info']) as ElianaIntent[],
    requires_auth: false
  },
  whatsapp: {
    channel: 'whatsapp',
    enabled: false,
    welcome_message: 'Bendiciones. Soy ELIANA, asistente virtual de MSM. ¿En qué puedo ayudarte?',
    system_prompt_addition: 'El usuario te escribe por WhatsApp. Mantén respuestas cortas. Máximo una pregunta por turno.',
    max_context_length: 2000,
    allowed_intents: ['greeting', 'product_inquiry', 'price_check', 'order_status', 'complaint', 'human_support', 'general_info'] as ElianaIntent[],
    requires_auth: false
  },
  marketplace: {
    channel: 'marketplace',
    enabled: true,
    welcome_message: 'Bendiciones. Puedo ayudarte con productos, tiendas y pedidos.',
    system_prompt_addition: 'Estás dentro del Marketplace. Enfócate en productos, tiendas, carrito y pedidos.',
    max_context_length: 3000,
    allowed_intents: ['product_inquiry', 'price_check', 'availability', 'order_create', 'order_status', 'become_seller', 'support'] as ElianaIntent[],
    requires_auth: false
  },
  zafiro: {
    channel: 'zafiro',
    enabled: true,
    welcome_message: 'Bendiciones. Soy ELIANA, tu guía dentro de ZAFIRO.',
    system_prompt_addition: 'Estás dentro de ZAFIRO. Enfócate en conocimiento, proyectos, membresías y orientación del ecosistema.',
    max_context_length: 4000,
    allowed_intents: ['greeting', 'general_info', 'zafiro_guidance', 'council_invisible', 'human_support'] as ElianaIntent[],
    requires_auth: false
  },
  eliana_domain: {
    channel: 'eliana_domain',
    enabled: true,
    welcome_message: 'Bendiciones. Soy ELIANA, la Guía Inteligente de MSM & ZAFIRO. ¿Cómo puedo orientarte hoy?',
    system_prompt_addition: 'Estás en el dominio principal de ELIANA. Puedes orientar sobre todo el ecosistema.',
    max_context_length: 4000,
    allowed_intents: ['greeting', 'product_inquiry', 'price_check', 'availability', 'order_status', 'support', 'become_seller', 'create_business', 'digital_services', 'human_support', 'general_info', 'zafiro_guidance', 'council_invisible'] as ElianaIntent[],
    requires_auth: false
  }
}

export const KNOWLEDGE_CATEGORIES = [
  'identidad_msm',
  'servicios',
  'marketplace',
  'productos',
  'tiendas',
  'servicios_digitales',
  'atencion_cliente',
  'envios',
  'cuba',
  'estados_unidos',
  'viajes',
  'referidos',
  'politicas',
  'seguridad',
  'privacidad',
  'preguntas_frecuentes',
  'escalado_humano',
  'eliana',
  'zafiro',
  'consejo_invisible'
] as const
