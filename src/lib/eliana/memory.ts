import type { ElianaMemory, ElianaMemoryEntry, ElianaMemoryFact } from "./types"

const STORAGE_KEY = "zafiro_eliana_memory"

function getMemories(): Record<string, ElianaMemory> {
  if (typeof window === "undefined") return {}
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") } catch { return {} }
}

function saveMemories(m: Record<string, ElianaMemory>) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
}

export function getElianaMemory(userId: string): ElianaMemory {
  const all = getMemories()
  if (!all[userId]) {
    all[userId] = { userId, shortTerm: [], longTerm: [], preferences: {}, lastInteraction: Date.now() }
    saveMemories(all)
  }
  return all[userId]
}

export function addShortTermMemory(userId: string, entry: ElianaMemoryEntry) {
  const all = getMemories()
  const mem = all[userId] || { userId, shortTerm: [], longTerm: [], preferences: {}, lastInteraction: Date.now() }
  mem.shortTerm.push(entry)
  if (mem.shortTerm.length > 50) mem.shortTerm = mem.shortTerm.slice(-50)
  mem.lastInteraction = Date.now()
  all[userId] = mem
  saveMemories(all)
}

export function addLongTermFact(userId: string, fact: Omit<ElianaMemoryFact, "createdAt" | "lastAccessed">) {
  const all = getMemories()
  const mem = all[userId] || { userId, shortTerm: [], longTerm: [], preferences: {}, lastInteraction: Date.now() }
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
}

export function setPreference(userId: string, key: string, value: string) {
  const all = getMemories()
  const mem = all[userId] || { userId, shortTerm: [], longTerm: [], preferences: {}, lastInteraction: Date.now() }
  mem.preferences[key] = value
  all[userId] = mem
  saveMemories(all)
}

export function getContextSummary(userId: string): string {
  const mem = getElianaMemory(userId)
  const recent = mem.shortTerm.slice(-5).map(e => `[${e.page}] ${e.role}: ${e.text.slice(0, 100)}`).join("\n")
  const facts = mem.longTerm.slice(-10).map(f => f.fact).join(", ")
  const prefs = Object.entries(mem.preferences).map(([k, v]) => `${k}=${v}`).join(", ")
  return `Recent: ${recent}\nFacts: ${facts}\nPrefs: ${prefs}`
}
