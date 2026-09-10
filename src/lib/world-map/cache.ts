/**
 * ZAFIRO WORLD MAP — Caché por viewport/zoom/capas/filtros.
 * No cachea información privada (solo nodos públicos ya saneados).
 */

export interface WorldMapCacheKey {
  zoom: number
  bbox: string
  layers: string[]
  filters: string
}

export function worldMapCacheKey(parts: Partial<WorldMapCacheKey>): string {
  return [
    "world-map",
    parts.zoom ?? "",
    parts.bbox ?? "",
    (parts.layers ?? []).join(","),
    parts.filters ?? "",
  ].join(":")
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface ViewportCache<T> {
  get: (key: string) => T | undefined
  set: (key: string, value: T) => void
  clear: () => void
  size: () => number
}

/** Caché en memoria con TTL y límite de entradas (solo datos públicos). */
export function createViewportCache<T>(options: { ttlMs?: number; maxEntries?: number } = {}): ViewportCache<T> {
  const ttlMs = options.ttlMs ?? 60_000
  const maxEntries = options.maxEntries ?? 40
  const store = new Map<string, CacheEntry<T>>()

  return {
    get(key) {
      const entry = store.get(key)
      if (!entry) return undefined
      if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return undefined
      }
      return entry.value
    },
    set(key, value) {
      store.delete(key)
      store.set(key, { value, expiresAt: Date.now() + ttlMs })
      while (store.size > maxEntries) {
        const oldest = store.keys().next().value
        if (oldest === undefined) break
        store.delete(oldest)
      }
    },
    clear() {
      store.clear()
    },
    size() {
      return store.size
    },
  }
}