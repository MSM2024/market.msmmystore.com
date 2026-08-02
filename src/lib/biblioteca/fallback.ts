import { SEED_CATALOG, type SeedBookEntry } from "./seed-catalog"

function hashId(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function enrich(entry: SeedBookEntry, _index: number) {
  const id = hashId(entry.normalized_title)
  const col = collectionFor(entry)
  const tags = [...entry.tags]
  if (!tags.includes(col)) tags.push(col)
  return {
    id,
    ...entry,
    tags,
    slug: toSlug(entry.title),
    created_at: "2026-07-28T00:00:00.000Z",
    updated_at: "2026-07-28T00:00:00.000Z",
    drive_file_id: null,
    checksum: null,
    version: 1,
  }
}

function collectionFor(entry: SeedBookEntry): string {
  const t = entry.tags.map(x => x.toLowerCase())
  if (t.some(x => ["autobiografia", "identidad", "don-miguel", "perfil", "historias", "personal"].includes(x))) return "identidad"
  if (t.some(x => ["yo-soy", "lenguaje-positivo", "palabra-creadora", "codigo-vivo", "evangelio"].includes(x))) return "yo-soy"
  if (t.some(x => ["fe", "espiritualidad", "cristianismo", "oracion"].includes(x))) return "fe"
  if (t.some(x => ["suenos", "conciencia", "visiones", "onirico", "profecia"].includes(x))) return "suenos"
  if (t.some(x => ["riqueza", "abundancia", "prosperidad", "mentalidad", "millonarios"].includes(x))) return "abundancia"
  if (t.some(x => ["familia", "memorias", "visualizacion"].includes(x))) return "familia"
  if (t.some(x => ["maquina-futuro", "tecnologia", "ciencia", "invento", "cuantico"].includes(x))) return "ciencia"
  if (t.some(x => ["msm", "emprendimiento", "negocios", "manual"].includes(x))) return "msm"
  if (t.some(x => ["ensenanzas", "oraciones", "reflexiones", "elevacion", "voz"].includes(x))) return "elevacion"
  if (t.some(x => ["guion", "pelicula", "creatividad"].includes(x))) return "guiones"
  return "general"
}

const ENRICHED = SEED_CATALOG.map(enrich)

export const FALLBACK_BOOKS = ENRICHED.map(e => ({
  ...e,
  collection: collectionFor(e),
}))

export function findFallbackBook(idOrSlug: string) {
  return FALLBACK_BOOKS.find(b => b.id === idOrSlug || b.slug === idOrSlug || b.normalized_title.includes(idOrSlug.toLowerCase())) || null
}

export function searchFallbackBooks(query: string) {
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return FALLBACK_BOOKS.filter(b => {
    const s = (b.title + " " + b.author + " " + b.description + " " + b.summary + " " + b.tags.join(" ")).toLowerCase()
    return s.includes(q)
  }).slice(0, 50)
}

export function getFallbackBookWithJoins(id: string) {
  const book = findFallbackBook(id)
  if (!book) return null
  return {
    book,
    chapters: [],
    versions: [],
    people: [],
    places: [],
    topics: [],
    relationships: [],
    chunks: [],
    accessLogs: [],
  }
}

export function isSupabaseAvailable(): boolean {
  return process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== undefined &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== "PENDIENTE"
}
