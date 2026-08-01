'use client'

// ================================================================
// ELIANA MEMORY LAYER
// localStorage como caché síncrona (rápida, funciona offline y para
// visitantes) + persistencia en Supabase (eliana_memory) para
// usuarios autenticados. Patrón de doble escritura (ver
// core/persistence.ts). Las lecturas síncronas no cambian de firma;
// la sincronización con el servidor ocurre en segundo plano.
// ================================================================

import type { ElianaMemory, ElianaMemoryEntry, ElianaMemoryFact } from "./types"
import { getSession } from "@/lib/auth"
import { isSupabaseAvailable } from "@/lib/supabase"

const STORAGE_KEY = "zafiro_eliana_memory"

type MemoryType = "short_term" | "long_term" | "preference" | "fact"

interface MemoryRow {
  id?: string
  memory_type: MemoryType
  key?: string | null
  content: string
  category?: string
  confidence?: number
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

function emptyMemory(userId: string): ElianaMemory {
  return { userId, shortTerm: [], longTerm: [], preferences: {}, lastInteraction: Date.now() }
}

function getMemories(): Record<string, ElianaMemory> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } catch { return {} }
}

function saveMemories(m: Record<string, ElianaMemory>) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
}

function toRows(mem: ElianaMemory): MemoryRow[] {
  const rows: MemoryRow[] = []
  for (const e of mem.shortTerm) {
    rows.push({
      memory_type: "short_term",
      content: e.text,
      category: e.page,
      confidence: 1,
      metadata: { role: e.role, timestamp: e.timestamp },
    })
  }
  for (const f of mem.longTerm) {
    rows.push({
      memory_type: "long_term",
      key: f.fact.slice(0, 500),
      content: f.fact,
      category: f.category,
      confidence: f.confidence,
      metadata: { createdAt: f.createdAt, lastAccessed: f.lastAccessed },
    })
  }
  for (const [k, v] of Object.entries(mem.preferences)) {
    rows.push({ memory_type: "preference", key: k, content: v, category: "preference", confidence: 1 })
  }
  return rows
}

function memoryFromRows(rows: MemoryRow[], userId: string): ElianaMemory {
  const mem = emptyMemory(userId)
  for (const r of rows) {
    if (r.memory_type === "short_term") {
      mem.shortTerm.push({
        role: r.metadata?.role === "eliana" ? "eliana" : "user",
        text: r.content,
        page: r.category || "general",
        timestamp: typeof r.metadata?.timestamp === "number" ? r.metadata.timestamp : Date.now(),
      })
    } else if (r.memory_type === "long_term" || r.memory_type === "fact") {
      mem.longTerm.push({
        fact: r.content,
        category: r.category || "general",
        confidence: typeof r.confidence === "number" ? r.confidence : 1,
        createdAt: typeof r.metadata?.createdAt === "number" ? r.metadata.createdAt : Date.now(),
        lastAccessed: typeof r.metadata?.lastAccessed === "number" ? r.metadata.lastAccessed : Date.now(),
      })
    } else if (r.memory_type === "preference") {
      if (r.key) mem.preferences[r.key] = r.content
    }
  }
  return mem
}

// --- Sincronización con Supabase (fondo) ---

const syncing = new Set<string>()
const syncQueued: Record<string, boolean> = {}

function shouldSync(userId: string): boolean {
  const session = getSession()
  if (!session || session.id !== userId) return false
  if (!isSupabaseAvailable()) return false
  return true
}

function doSync(userId: string): Promise<void> {
  const mem = getMemories()[userId]
  if (!mem) return Promise.resolve()
  return fetch("/api/eliana/memory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "replace", rows: toRows(mem) }),
  })
    .then(() => {})
    .catch(() => {})
}

function scheduleSync(userId: string) {
  if (!shouldSync(userId)) return
  if (syncing.has(userId)) {
    syncQueued[userId] = true
    return
  }
  syncing.add(userId)
  doSync(userId).finally(() => {
    syncing.delete(userId)
    if (syncQueued[userId]) {
      syncQueued[userId] = false
      scheduleSync(userId)
    }
  })
}

const hydrating = new Set<string>()

function hydrateFromServer(userId: string) {
  if (!shouldSync(userId)) return
  if (hydrating.has(userId)) return
  hydrating.add(userId)
  fetch("/api/eliana/memory")
    .then(r => r.json())
    .then((data: { rows?: MemoryRow[] }) => {
      if (!Array.isArray(data.rows) || data.rows.length === 0) return
      const all = getMemories()
      const local = all[userId]
      const server = memoryFromRows(data.rows, userId)
      if (!local) {
        all[userId] = server
        saveMemories(all)
        return
      }
      // Fusionar sin perder entradas locales más nuevas (carrera con escrituras síncronas)
      const seen = new Set(local.shortTerm.map(e => `${e.role}:${e.text}:${e.timestamp}`))
      for (const e of server.shortTerm) {
        const k = `${e.role}:${e.text}:${e.timestamp}`
        if (!seen.has(k)) { local.shortTerm.push(e); seen.add(k) }
      }
      local.shortTerm.sort((a, b) => a.timestamp - b.timestamp)
      local.shortTerm = local.shortTerm.slice(-50)
      for (const f of server.longTerm) {
        if (!local.longTerm.some(x => x.fact === f.fact)) local.longTerm.push(f)
      }
      local.longTerm = local.longTerm.slice(-200)
      for (const [k, v] of Object.entries(server.preferences)) {
        if (!(k in local.preferences)) local.preferences[k] = v
      }
      local.lastInteraction = Math.max(local.lastInteraction, server.lastInteraction)
      all[userId] = local
      saveMemories(all)
    })
    .catch(() => {})
    .finally(() => hydrating.delete(userId))
}

// --- API pública ---

export function getElianaMemory(userId: string): ElianaMemory {
  const all = getMemories()
  if (!all[userId]) {
    all[userId] = emptyMemory(userId)
    saveMemories(all)
    hydrateFromServer(userId)
  }
  return all[userId]
}

export function addShortTermMemory(userId: string, entry: ElianaMemoryEntry) {
  const all = getMemories()
  const mem = all[userId] || emptyMemory(userId)
  mem.shortTerm.push(entry)
  if (mem.shortTerm.length > 50) mem.shortTerm = mem.shortTerm.slice(-50)
  mem.lastInteraction = Date.now()
  all[userId] = mem
  saveMemories(all)
  scheduleSync(userId)
}

export function addLongTermFact(userId: string, fact: Omit<ElianaMemoryFact, "createdAt" | "lastAccessed">) {
  const all = getMemories()
  const mem = all[userId] || emptyMemory(userId)
  const existing = mem.longTerm.find(f => f.fact === fact.fact)
  if (existing) {
    existing.lastAccessed = Date.now()
    existing.confidence = Math.min(1, existing.confidence + 0.1)
  } else {
    mem.longTerm.push({ ...fact, createdAt: Date.now(), lastAccessed: Date.now() })
  }
  if (mem.longTerm.length > 200) mem.longTerm = mem.longTerm.slice(-200)
  all[userId] = mem
  saveMemories(all)
  scheduleSync(userId)
}

export function setPreference(userId: string, key: string, value: string) {
  const all = getMemories()
  const mem = all[userId] || emptyMemory(userId)
  mem.preferences[key] = value
  all[userId] = mem
  saveMemories(all)
  scheduleSync(userId)
}

export function getContextSummary(userId: string): string {
  const mem = getElianaMemory(userId)
  const recent = mem.shortTerm.slice(-5).map(e => `[${e.page}] ${e.role}: ${e.text.slice(0, 100)}`).join("\n")
  const facts = mem.longTerm.slice(-10).map(f => f.fact).join(", ")
  const prefs = Object.entries(mem.preferences).map(([k, v]) => `${k}=${v}`).join(", ")
  return `Recent: ${recent}\nFacts: ${facts}\nPrefs: ${prefs}`
}

/** Olvido: borra la memoria local y la del servidor (si está autenticado). */
export async function clearElianaMemory(userId: string): Promise<void> {
  const all = getMemories()
  delete all[userId]
  saveMemories(all)
  if (shouldSync(userId)) {
    try {
      await fetch("/api/eliana/memory", { method: "DELETE" })
    } catch { /* mejor esfuerzo */ }
  }
}

/** Fuerza la recarga de la memoria desde el servidor. */
export function refreshElianaMemory(userId: string) {
  hydrateFromServer(userId)
}
