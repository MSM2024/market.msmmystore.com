import { KNOWLEDGE_DOCS, type KnowledgeDoc } from "./knowledge-data"

let kb: KnowledgeDoc[] | null = null

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúüñ0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

const STOP_WORDS = new Set([
  "que", "con", "los", "las", "una", "para", "por", "del", "como", "más",
  "pero", "sus", "entre", "este", "esta", "esto", "tiene", "puede", "todo",
  "también", "sobre", "ello", "ante", "cada", "cuando", "donde", "muy",
  "the", "and", "for", "are", "has", "have", "been", "from", "what", "does",
  "with", "that", "this", "which", "your", "will", "been",
])

function keywords(text: string): string[] {
  return tokenize(text).filter((t) => !STOP_WORDS.has(t))
}

export function loadKnowledgeBase(): KnowledgeDoc[] {
  if (kb) return kb
  kb = KNOWLEDGE_DOCS
  return kb
}

export function searchKnowledge(query: string, topN = 5): KnowledgeDoc[] {
  const docs = loadKnowledgeBase()
  if (!docs.length || !query.trim()) return []

  const queryKeywords = keywords(query)
  if (!queryKeywords.length) return docs.slice(0, topN)

  const scored = docs.map((doc) => {
    const titleTokens = keywords(doc.title)
    const contentTokens = keywords(doc.content)
    const tagTokens = doc.tags.flatMap((t) => keywords(t))

    let score = 0
    for (const qk of queryKeywords) {
      if (titleTokens.includes(qk)) score += 10
      if (tagTokens.includes(qk)) score += 5
      const contentCount = contentTokens.filter((t) => t === qk).length
      score += contentCount
    }
    return { doc, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.filter((s) => s.score > 0).slice(0, topN).map((s) => s.doc)
}

export function buildKnowledgeContext(query: string): string {
  const docs = searchKnowledge(query, 5)
  if (!docs.length) return ""

  const seen = new Set<string>()
  const parts: string[] = []
  for (const doc of docs) {
    const key = doc.id || doc.title
    if (seen.has(key)) continue
    seen.add(key)
    parts.push(`[${doc.title} (${doc.dataset})]\n${doc.content.slice(0, 1200)}`)
  }
  if (!parts.length) return ""

  return `\n\n---\nCONOCIMIENTO DE ZAFIRO:\n${parts.join("\n\n---\n")}\n---\nUsa la información anterior para responder. Si la pregunta no está cubierta, usa tu conocimiento general.`
}
