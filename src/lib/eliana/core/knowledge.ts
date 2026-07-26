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
      content: 'ZAFIRO es la red social del conocimiento impulsada por Inteligencia Artificial. MSM MY STORE LLC.',
      source: 'knowledge-data',
      status: 'published',
      priority: 10,
      requires_human_review: false,
      tags: ['zafiro', 'identidad', 'msm'],
      channel: 'all'
    },
    {
      category: 'eliana',
      title: 'Persona ELIANA',
      content: 'ELIANA es el núcleo sintético de ZAFIRO. Saluda con "Bendiciones". Responde en español. Tono humano, directo, amable y profesional.',
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
      content: 'Marca $99.50, Kit Esencial $249.50, Rebranding desde $299.50, Web $349.50, Premium $580, E-commerce $999, Marketplace multivendedor desde $2,999.50.',
      source: 'knowledge-data',
      status: 'published',
      priority: 8,
      requires_human_review: false,
      tags: ['servicios', 'precios', 'marketplace'],
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
