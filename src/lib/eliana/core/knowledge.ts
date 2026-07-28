'use client'

import type { ElianaKnowledge } from './types'

// ================================================================
// ELIANA KNOWLEDGE ENGINE — Versión Core
// Fuente maestra de conocimiento para todos los canales
// ================================================================

const STORAGE_KEY = 'eliana_knowledge'

function getKnowledge(): ElianaKnowledge[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveKnowledge(docs: ElianaKnowledge[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

export function getPublishedKnowledge(): ElianaKnowledge[] {
  return getKnowledge().filter(d => d.status === 'published')
}

export function getKnowledgeByCategory(category: string): ElianaKnowledge[] {
  return getKnowledge().filter(d => d.category === category && d.status === 'published')
}

export function searchKnowledge(query: string, channel?: string): ElianaKnowledge[] {
  const published = getPublishedKnowledge()
  const q = query.toLowerCase()
  const terms = q.split(/\s+/).filter(t => t.length > 2)

  return published
    .filter(doc => {
      if (channel && doc.channel !== 'all' && doc.channel !== channel) return false
      const searchable = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase()
      return terms.some(term => searchable.includes(term))
    })
    .sort((a, b) => {
      const scoreA = terms.reduce((s, t) => s + (a.title.toLowerCase().includes(t) ? 3 : 0) + (a.tags.some(tag => tag.includes(t)) ? 2 : 0) + (a.content.toLowerCase().includes(t) ? 1 : 0), 0)
      const scoreB = terms.reduce((s, t) => s + (b.title.toLowerCase().includes(t) ? 3 : 0) + (b.tags.some(tag => tag.includes(t)) ? 2 : 0) + (b.content.toLowerCase().includes(t) ? 1 : 0), 0)
      return scoreB - scoreA
    })
    .slice(0, 5)
}

export function buildKnowledgeContext(query: string, channel?: string, maxChars: number = 1500): string {
  const results = searchKnowledge(query, channel)
  if (results.length === 0) return ''

  return results
    .map(doc => `[${doc.title}]\n${doc.content.slice(0, 400)}`)
    .join('\n\n')
    .slice(0, maxChars)
}

export function getAllKnowledge(): ElianaKnowledge[] {
  return getKnowledge()
}

export function createKnowledge(doc: Omit<ElianaKnowledge, 'id' | 'created_at' | 'updated_at' | 'version'>): ElianaKnowledge {
  const docs = getKnowledge()
  const newDoc: ElianaKnowledge = {
    ...doc,
    id: `know_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  docs.push(newDoc)
  saveKnowledge(docs)
  return newDoc
}

export function updateKnowledge(id: string, updates: Partial<ElianaKnowledge>): ElianaKnowledge | null {
  const docs = getKnowledge()
  const idx = docs.findIndex(d => d.id === id)
  if (idx === -1) return null
  docs[idx] = {
    ...docs[idx],
    ...updates,
    version: docs[idx].version + 1,
    updated_at: new Date().toISOString()
  }
  saveKnowledge(docs)
  return docs[idx]
}

export function approveKnowledge(id: string, approvedBy: string): ElianaKnowledge | null {
  return updateKnowledge(id, {
    status: 'approved',
    approved_by: approvedBy,
    approved_at: new Date().toISOString()
  })
}

export function publishKnowledge(id: string): ElianaKnowledge | null {
  return updateKnowledge(id, { status: 'published' })
}

export function archiveKnowledge(id: string): ElianaKnowledge | null {
  return updateKnowledge(id, { status: 'archived' })
}

export function getKnowledgeStats() {
  const docs = getKnowledge()
  return {
    total: docs.length,
    published: docs.filter(d => d.status === 'published').length,
    draft: docs.filter(d => d.status === 'draft').length,
    pending: docs.filter(d => d.status === 'pending_review').length,
    archived: docs.filter(d => d.status === 'archived').length,
    categories: [...new Set(docs.map(d => d.category))].length
  }
}

export function migrateFromStaticKnowledge(): number {
  const existing = getKnowledge()
  if (existing.length > 0) return 0

  const staticDocs: Omit<ElianaKnowledge, 'id' | 'created_at' | 'updated_at' | 'version'>[] = [
    {
      category: 'identidad_msm',
      title: 'Identidad ZAFIRO',
      content: 'ZAFIRO es la red social del conocimiento impulsada por Inteligencia Artificial. MSM MY STORE LLC. Fundador: Don Miguel Soria Martínez. WhatsApp: +1 772 301 5523.',
      source: 'knowledge-data',
      status: 'published',
      priority: 10,
      requires_human_review: false,
      tags: ['zafiro', 'identidad', 'msm', 'miguel'],
      channel: 'all'
    },
    {
      category: 'eliana',
      title: 'Persona ELIANA',
      content: 'ELIANA es el núcleo sintético de ZAFIRO, la Guía Inteligente del ecosistema MSM & ZAFIRO. Saluda con "Bendiciones". Responde en español. Tono humano, directo, amable y profesional. WhatsApp: +1 772 301 5523.',
      source: 'knowledge-data',
      status: 'published',
      priority: 10,
      requires_human_review: false,
      tags: ['eliana', 'persona', 'identidad'],
      channel: 'all'
    },
    {
      category: 'productos',
      title: 'Servicios Digitales MSM',
      content: 'Marca $99.50, Kit Esencial $249.50, Rebranding desde $299.50, Web $349.50, Premium $580, E-commerce $999, Marketplace multivendedor desde $2,999.50. Marketing digital, apps, automatización.',
      source: 'knowledge-data',
      status: 'published',
      priority: 9,
      requires_human_review: false,
      tags: ['servicios', 'precios', 'marketplace', 'web', 'apps'],
      channel: 'all'
    },
    {
      category: 'marketplace',
      title: 'Marketplace MSM',
      content: 'El Marketplace MSM es una plataforma multivendedor donde puedes vender productos físicos y digitales. Categorías: electrónica, moda, hogar, belleza, deportes, gemas, arte, servicios, digitales. Comisión estándar 10%, Premier 7%, Elite 5%. Primeros 3 meses 0% comisión.',
      source: 'knowledge-data',
      status: 'published',
      priority: 9,
      requires_human_review: false,
      tags: ['marketplace', 'tienda', 'vender', 'productos', 'comisiones'],
      channel: 'all'
    },
    {
      category: 'escuela',
      title: 'Escuela MSM',
      content: 'Cursos: Gemología Básica (gratis), Intermedia ($49.99), Profesional ($149.99), IA para Emprendedores ($79.99), Marketing Digital ($99.99), Diseño Web ($69.99), Emprendimiento Digital ($59.99), Joyería y Diseño ($89.99). Membresías: Básico gratis, Pro $19.99/mes, Premium $49.99/mes, Empresa $99.99/mes.',
      source: 'knowledge-data',
      status: 'published',
      priority: 9,
      requires_human_review: false,
      tags: ['escuela', 'cursos', 'aprendizaje', 'gemologia', 'ia', 'precios'],
      channel: 'all'
    },
    {
      category: 'album',
      title: 'Álbum de la Vida',
      content: 'El Álbum de la Vida es un módulo para preservar el legado familiar. Árbol genealógico interactivo, línea de tiempo, memorias, fotos, videos, documentos, tradiciones. Privado por defecto. Planes: Gratis (50 fotos), Pro ($9.99/mes), Familia ($19.99/mes). Heredero digital disponible.',
      source: 'knowledge-data',
      status: 'published',
      priority: 8,
      requires_human_review: false,
      tags: ['album', 'familia', 'legado', 'genealogia', 'historia'],
      channel: 'all'
    },
    {
      category: 'consejo_invisible',
      title: 'Consejo Invisible',
      content: 'El Consejo Invisible es el órgano estratégico de MSM. Miembros con rango Maestro o superior. Máximo 12 consejeros. Mandato 6 meses. Votación ponderada por rango. Gestiona presupuesto, aprueba propuestas, nombra líderes. Transparencia: actas públicas, presupuesto abierto.',
      source: 'knowledge-data',
      status: 'published',
      priority: 8,
      requires_human_review: false,
      tags: ['consejo', 'invisible', 'votacion', 'gobierno', 'estrategia'],
      channel: 'all'
    },
    {
      category: 'mente_maestra',
      title: 'Mente Maestra',
      content: 'Mente Maestra es el motor de inteligencia colectiva. Miembros contribuyen conocimiento, la IA lo organiza, se valida colectivamente. Sistema de expertos: Aprendiz, Practicante, Experto, Maestro. Mapa vivo del conocimiento con conexiones entre temas.',
      source: 'knowledge-data',
      status: 'published',
      priority: 8,
      requires_human_review: false,
      tags: ['mente', 'maestra', 'conocimiento', 'colectivo', 'expertos'],
      channel: 'all'
    },
    {
      category: 'referidos',
      title: 'Sistema de Referidos',
      content: 'Gana +200 PTS por cada referido registrado. +10% comisión en las primeras 3 compras. El referido gana +100 PTS y 10% descuento. Código único e intransferible. Máximo 50 referidos activos por cuenta.',
      source: 'knowledge-data',
      status: 'published',
      priority: 8,
      requires_human_review: false,
      tags: ['referidos', 'invitar', 'bonos', 'recompensas', 'puntos'],
      channel: 'all'
    },
    {
      category: 'pagos',
      title: 'Pagos y Facturación',
      content: 'Aceptamos: Tarjeta crédito/débito (Stripe - Visa, Mastercard, Amex, Discover), transferencia bancaria (bancos cubanos), PayPal, efectivo (puntos autorizados en Cuba), criptomonedas (próximamente). Reembolsos en 30 días. Verificación de pagos 24-48 horas para transferencias.',
      source: 'knowledge-data',
      status: 'published',
      priority: 9,
      requires_human_review: false,
      tags: ['pagos', 'stripe', 'tarjeta', 'transferencia', 'paypal'],
      channel: 'all'
    },
    {
      category: 'envios',
      title: 'Envíos y Entregas',
      content: 'Opciones: Estándar 5-7 días ($4.99, gratis >$50), Exprés 2-3 días ($9.99), Mismo día ciudades principales ($14.99), Internacional 10-15 días, Especializado joyas/gemas (incluido). Seguimiento en tiempo real. Empaque especializado para joyas. 3 intentos de entrega.',
      source: 'knowledge-data',
      status: 'published',
      priority: 9,
      requires_human_review: false,
      tags: ['envios', 'entregas', 'seguimiento', 'paquetes', 'empaque'],
      channel: 'all'
    },
    {
      category: 'gemologia',
      title: 'Guía de Gemología',
      content: 'Piedras mayores: Diamante (10 Mohs), Zafiro (9), Rubí (9), Esmeralda (7.5-8). Otras: Alexandrita, Opalo, Amatista, Turquesa. Tratamientos: Térmico (estándar), Difusión (debe divulgarse), Relleno vidrio (controversial). Orígenes: Kashmir, Mogok, Sri Lanka, Colombia.',
      source: 'knowledge-data',
      status: 'published',
      priority: 9,
      requires_human_review: false,
      tags: ['gemologia', 'zafiros', 'rubies', 'corindon', 'diamantes'],
      channel: 'all'
    },
    {
      category: 'seguridad',
      title: 'Seguridad de Cuenta',
      content: 'Protege tu cuenta: contraseña fuerte (8+ caracteres, mayúsculas, minúsculas, números, símbolos), activa 2FA (Google Authenticator, Authy), no compartas credenciales, reporta actividad sospechosa. Recuperación por email o códigos de respaldo. Soporte: +1 772 301 5523.',
      source: 'knowledge-data',
      status: 'published',
      priority: 9,
      requires_human_review: false,
      tags: ['seguridad', 'cuenta', 'contraseña', '2fa', 'proteccion'],
      channel: 'all'
    },
    {
      category: 'comunidad',
      title: 'Comunidad ZAFIRO',
      content: 'Red social con muro personal, comentarios, reacciones, mensajería directa. Círculos: Gemología, IA, Marketing, Emprendimiento, Diseño, Tech, Bienestar, Arte. Reglas: respeto, contenido relevante, originalidad, colaboración. Eventos semanales y mensuales.',
      source: 'knowledge-data',
      status: 'published',
      priority: 8,
      requires_human_review: false,
      tags: ['comunidad', 'red', 'social', 'grupos', 'conectar'],
      channel: 'all'
    },
    {
      category: 'notificaciones',
      title: 'Sistema de Notificaciones',
      content: 'Tipos: compras, mensajes, recompensas, marketplace, comunidad, sistema. Canales: in-app, email, push, WhatsApp (próximamente). Configuración personalizable: tipo de notificación, canales, horario no molestar, frecuencia de resumen.',
      source: 'knowledge-data',
      status: 'published',
      priority: 7,
      requires_human_review: false,
      tags: ['notificaciones', 'alertas', 'mensajes', 'push'],
      channel: 'all'
    },
    {
      category: 'don_miguel',
      title: 'Don Miguel Soria Martínez',
      content: 'Fundador y CEO de MSM MY STORE LLC. Valores: conocimiento compartido, empoderamiento digital, legado y familia, excelencia y honestidad, comunidad primero. WhatsApp: +1 772 301 5523. Compromiso: atención personal, transparencia, innovación constante.',
      source: 'knowledge-data',
      status: 'published',
      priority: 10,
      requires_human_review: false,
      tags: ['miguel', 'soria', 'fundador', 'ceo', 'historia'],
      channel: 'all'
    },
    {
      category: 'rangos',
      title: 'Rangos del Ecosistema',
      content: 'Miembro (0 PTS), Colaborador (500), Contribuidor (2,000), Mentor (5,000), Expert (10,000), Maestro (25,000), Líder (50,000), Fundador (invitación). Cada rango desbloquea beneficios y permisos nuevos.',
      source: 'knowledge-data',
      status: 'published',
      priority: 8,
      requires_human_review: false,
      tags: ['rangos', 'niveles', 'pts', 'beneficios', 'progresion'],
      channel: 'all'
    }
  ]

  let count = 0
  for (const doc of staticDocs) {
    createKnowledge(doc)
    count++
  }
  return count
}
