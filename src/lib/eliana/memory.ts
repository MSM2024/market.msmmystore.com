'use client'

// ================================================================
// ELIANA MEMORY — SOLO SESIÓN ACTUAL (EFÍMERO, CON EXPIRACIÓN)
// ZAFIRO no conserva memoria permanente de conversaciones (orden de
// arquitectura v1.0.1). Este módulo mantiene la MISMA API pública
// (getElianaMemory / addShortTermMemory / addLongTermFact /
// setPreference / getContextSummary / clearElianaMemory) pero:
//   - NADA de Supabase (sin eliana_memory, sin /api/eliana/memory).
//   - sessionStorage: efímero (se limpia al cerrar la pestaña).
//   - Garantía de expiración: si la sesión supera MEMORY_TTL_MS
//     (24 h) se considera vacía y se limpia.
//   - Al cargar se elimina el almacén permanente legado
//     (localStorage "zafiro_eliana_memory") del archivo antiguo.
// ================================================================

import type { ElianaMemory, ElianaMemoryEntry, ElianaMemoryFact } from "./types"

const STORAGE_KEY = "zafiro_eliana_memory_session_v3"
const LEGACY_LOCALSTORAGE_KEY = "zafiro_eliana_memory"
const MEMORY_TTL_MS = 24 * 60 * 60 * 1000 // 1 día como máximo de vida por sesión

function emptyMemory(userId: string): ElianaMemory {
  return { userId, shortTerm: [], longTerm: [], preferences: {}, lastInteraction: Date.now() }
}

interface StoredBundle {
  createdAt: number
  memories: Record<string, ElianaMemory>
}

// Limpieza del almacén permanente legado (archivo anterior a v1.0.1).
function cleanupLegacyStorage() {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(LEGACY_LOCALSTORAGE_KEY)
  } catch {
    // ignorar
  }
}

function readBundle(): StoredBundle | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredBundle
    if (!parsed || typeof parsed !== "object" || typeof parsed.createdAt !== "number") return null
    // Expiración garantizada: fuera de TTL → se descarta y limpia.
    if (Date.now() - parsed.createdAt > MEMORY_TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeBundle(bundle: StoredBundle) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bundle))
  } catch {
    // sessionStorage no disponible: mantenemos solo la caché volátil
  }
}

function getMemories(): Record<string, ElianaMemory> {
  cleanupLegacyStorage()
  const bundle = readBundle()
  return bundle?.memories ?? {}
}

function saveMemories(all: Record<string, ElianaMemory>) {
  const bundle = readBundle()
  const createdAt = bundle?.createdAt ?? Date.now()
  writeBundle({ createdAt, memories: all })
}

function read(userId: string): ElianaMemory | null {
  return getMemories()[userId] ?? null
}

// --- API pública (idéntica para no romper análisis/tests) ---

export function getElianaMemory(userId: string): ElianaMemory {
  const existing = read(userId)
  if (existing) return existing
  const mem = emptyMemory(userId)
  saveMemories({ ...getMemories(), [userId]: mem })
  return mem
}

export function addShortTermMemory(userId: string, entry: ElianaMemoryEntry) {
  const mem = read(userId) || emptyMemory(userId)
  mem.shortTerm.push(entry)
  if (mem.shortTerm.length > 50) mem.shortTerm = mem.shortTerm.slice(-50)
  mem.lastInteraction = Date.now()
  saveMemories({ ...getMemories(), [userId]: mem })
}

export function addLongTermFact(userId: string, fact: Omit<ElianaMemoryFact, "createdAt" | "lastAccessed">) {
  const mem = read(userId) || emptyMemory(userId)
  const existing = mem.longTerm.find(f => f.fact === fact.fact)
  if (existing) {
    existing.lastAccessed = Date.now()
    existing.confidence = Math.min(1, existing.confidence + 0.1)
  } else {
    mem.longTerm.push({ ...fact, createdAt: Date.now(), lastAccessed: Date.now() })
  }
  if (mem.longTerm.length > 200) mem.longTerm = mem.longTerm.slice(-200)
  saveMemories({ ...getMemories(), [userId]: mem })
}

export function setPreference(userId: string, key: string, value: string) {
  const mem = read(userId) || emptyMemory(userId)
  mem.preferences[key] = value
  saveMemories({ ...getMemories(), [userId]: mem })
}

export function getContextSummary(userId: string): string {
  const mem = getElianaMemory(userId)
  const recent = mem.shortTerm.slice(-5).map(e => `[${e.page}] ${e.role}: ${e.text.slice(0, 100)}`).join("\n")
  const facts = mem.longTerm.slice(-10).map(f => f.fact).join(", ")
  const prefs = Object.entries(mem.preferences).map(([k, v]) => `${k}=${v}`).join(", ")
  return `Recent: ${recent}\nFacts: ${facts}\nPrefs: ${prefs}`
}

/** Olvido: borra la memoria EFÍMERA de la sesión (no hay servidor). */
export async function clearElianaMemory(userId: string): Promise<void> {
  const all = getMemories()
  delete all[userId]
  saveMemories(all)
}

/** No hay memoria permanente que recargar desde el servidor. */
export function refreshElianaMemory(_userId: string) {
  // intencionalmente sin operación: no existe histórico persistente
}