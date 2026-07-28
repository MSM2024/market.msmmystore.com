import { KNOWLEDGE_DOCS, type KnowledgeDoc } from "@/lib/knowledge-data"

// ================================================================
// ELIANA INTELLIGENT KNOWLEDGE ENGINE
// Searches all 58 docs and returns contextual responses
// ================================================================

interface ScoredDoc {
  doc: KnowledgeDoc
  score: number
  matchedTerms: string[]
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[\s.,;:!?¡¿()\[\]{}"'+\-\/\\]+/)
    .filter(t => t.length > 2)
}

function scoreDocument(query: string, doc: KnowledgeDoc): ScoredDoc {
  const queryTerms = tokenize(query)
  const titleTerms = tokenize(doc.title)
  const contentTerms = tokenize(doc.content)
  const tagTerms = doc.tags.map(t => t.toLowerCase())

  let score = 0
  const matchedTerms: string[] = []

  for (const term of queryTerms) {
    // Title match (highest weight)
    if (titleTerms.some(t => t.includes(term) || term.includes(t))) {
      score += 10
      matchedTerms.push(term)
    }
    // Tag match (high weight)
    if (tagTerms.some(t => t.includes(term) || term.includes(t))) {
      score += 8
      matchedTerms.push(term)
    }
    // Content match (medium weight)
    const contentLower = doc.content.toLowerCase()
    if (contentLower.includes(term)) {
      score += 3
      // Bonus for multiple occurrences
      const count = (contentLower.match(new RegExp(term, "g")) || []).length
      score += Math.min(count, 5)
      matchedTerms.push(term)
    }
  }

  // Bonus for exact phrase match
  const queryLower = query.toLowerCase()
  if (doc.content.toLowerCase().includes(queryLower)) {
    score += 20
  }
  if (doc.title.toLowerCase().includes(queryLower)) {
    score += 15
  }

  // Bonus for doc_form
  if (doc.doc_form === "qa_model") score += 2

  return { doc, score, matchedTerms: [...new Set(matchedTerms)] }
}

function extractRelevantSection(content: string, query: string, maxChars: number = 800): string {
  const queryTerms = tokenize(query)
  const lines = content.split("\n").filter(l => l.trim().length > 0)

  // Score each paragraph/sentence
  const scoredLines = lines.map((line, idx) => {
    const lineLower = line.toLowerCase()
    let relevance = 0
    for (const term of queryTerms) {
      if (lineLower.includes(term)) relevance += 5
    }
    // Bonus for headings
    if (line.startsWith("#")) relevance += 3
    return { line, idx, relevance }
  })

  // Sort by relevance, take top paragraphs
  const relevant = scoredLines
    .sort((a, b) => b.relevance - a.relevance)
    .filter(s => s.relevance > 0)
    .slice(0, 8)
    .sort((a, b) => a.idx - b.idx) // restore order

  if (relevant.length === 0) {
    // Fallback: return first section
    return content.slice(0, maxChars).replace(/#{1,3}\s/g, "")
  }

  let result = ""
  for (const { line } of relevant) {
    const clean = line.replace(/^#{1,3}\s/, "").trim()
    if (result.length + clean.length > maxChars) break
    result += clean + "\n\n"
  }

  return result.trim()
}

export function searchKnowledgeIntelligent(
  query: string,
  maxResults: number = 3,
  maxChars: number = 1200
): string {
  const scored = KNOWLEDGE_DOCS.map(doc => scoreDocument(query, doc))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)

  if (scored.length === 0) return ""

  const sections = scored.map(({ doc, matchedTerms }) => {
    const section = extractRelevantSection(doc.content, query, 600)
    return `**${doc.title}** (${matchedTerms.slice(0, 3).join(", ")})\n${section}`
  })

  return sections.join("\n\n---\n\n").slice(0, maxChars)
}

export function getKnowledgeStats() {
  const datasets = new Set(KNOWLEDGE_DOCS.map(d => d.dataset))
  const tags = new Set(KNOWLEDGE_DOCS.flatMap(d => d.tags))
  return {
    totalDocs: KNOWLEDGE_DOCS.length,
    datasets: datasets.size,
    uniqueTags: tags.size,
    docForms: [...new Set(KNOWLEDGE_DOCS.map(d => d.doc_form))],
  }
}
