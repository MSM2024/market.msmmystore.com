import { getSupabaseClient, isSupabaseAvailable } from "@/lib/supabase"
import { knowledgeRepo } from "./repository"
import type {
  SearchOptions,
  SearchResult,
  RAGContext,
  RAGOptions,
  KnowledgeDocument,
  KnowledgeChunk,
  KnowledgeQuery,
} from "./types"

const STOP_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al",
  "en", "con", "por", "para", "sin", "sobre", "entre", "hasta", "desde",
  "que", "como", "pero", "si", "no", "si", "ya", "muy", "mas", "menos",
  "este", "esta", "estos", "estas", "ese", "esa", "esos", "esas",
  "aquel", "aquella", "aquellos", "aquellas", "yo", "tu", "el", "ella",
  "nosotros", "vosotros", "ellos", "ellas", "me", "te", "le", "nos",
  "lo", "la", "los", "las", "mi", "tu", "su", "mis", "tus", "sus",
  "que", "cual", "cuales", "quien", "quienes", "donde", "como", "cuando",
  "porque", "por que", "para que", "aunque", "sino", "pero", "mas",
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "can", "this", "that", "these", "those",
  "it", "its", "not", "no", "yes", "si", "que", "what", "how", "when",
  "where", "who", "which", "why", "if", "then", "than", "so", "very",
  "just", "about", "into", "through", "during", "before", "after",
  "above", "below", "between", "under", "again", "further", "once", "here",
  "there", "all", "both", "each", "few", "more", "most", "other", "some",
  "such", "only", "own", "same", "than", "too", "also", "back", "even",
  "still", "new", "way", "use", "her", "him", "his", "our", "they",
  "them", "their", "we", "she", "he",
])

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractTokens(text: string): string[] {
  const normalized = normalizeText(text)
  return normalized
    .split(" ")
    .filter(token => token.length > 2 && !STOP_WORDS.has(token))
}

function calculateTokenOverlap(tokens1: string[], tokens2: string[]): number {
  const set2 = new Set(tokens2)
  let matches = 0
  for (const token of tokens1) {
    if (set2.has(token)) matches++
  }
  return tokens1.length > 0 ? matches / tokens1.length : 0
}

function buildSearchContext(
  document: KnowledgeDocument,
  chunks: KnowledgeChunk[],
  queryTokens: string[]
): string {
  const parts: string[] = []

  parts.push(`## ${document.title}`)
  if (document.summary) {
    parts.push(`Resumen: ${document.summary}`)
  }
  parts.push(`Tipo: ${document.doc_type} | Estado: ${document.status}`)
  parts.push("")

  if (chunks.length > 0) {
    for (const chunk of chunks.slice(0, 5)) {
      if (chunk.heading) {
        parts.push(`### ${chunk.heading}`)
      }
      parts.push(chunk.content)
      parts.push("")
    }
  } else {
    const contentLines = document.content.split("\n")
    const scoredLines = contentLines.map(line => ({
      line,
      score: calculateTokenOverlap(queryTokens, extractTokens(line)),
    }))
    scoredLines.sort((a, b) => b.score - a.score)
    const topLines = scoredLines.slice(0, 10).map(l => l.line)
    parts.push(topLines.join("\n"))
  }

  return parts.join("\n")
}

export class KnowledgeSearchEngine {
  private get client() {
    return getSupabaseClient()
  }

  private get available() {
    return isSupabaseAvailable()
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const startTime = Date.now()
    const query = options.query.trim()
    const limit = options.limit || 10
    const threshold = options.threshold || 0.3

    if (!query) return []

    const queryTokens = extractTokens(query)

    const keywordResults = await this.keywordSearch(query, queryTokens, options)
    const vectorResults = await this.vectorSearch(query, options)

    const mergedResults = this.mergeResults(keywordResults, vectorResults, limit, threshold)

    const responseTime = Date.now() - startTime
    await this.logSearch(query, mergedResults.length, mergedResults[0]?.score || 0, responseTime)

    return mergedResults
  }

  private async keywordSearch(
    query: string,
    queryTokens: string[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.available) return []

    let dbQuery = this.client
      .from("knowledge_documents")
      .select("*")
      .eq("status", options.status || "published")

    if (options.doc_type) dbQuery = dbQuery.eq("doc_type", options.doc_type)
    if (options.visibility) dbQuery = dbQuery.eq("visibility", options.visibility)
    if (options.source_id) dbQuery = dbQuery.eq("source_id", options.source_id)

    const orConditions = [
      `title.ilike.%${query}%`,
      `content.ilike.%${query}%`,
      `summary.ilike.%${query}%`,
    ].join(",")

    dbQuery = dbQuery.or(orConditions)
    dbQuery = dbQuery.limit(options.limit || 20)

    const { data, error } = await dbQuery
    if (error) return []

    return (data || []).map((doc: KnowledgeDocument) => ({
      document: doc as KnowledgeDocument,
      score: this.scoreDocument(doc as KnowledgeDocument, query, queryTokens),
      highlights: this.extractHighlights(doc as KnowledgeDocument, query, queryTokens),
    }))
  }

  private async vectorSearch(
    query: string,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    if (!this.available || !options.embedding) return []

    const { data, error } = await this.client.rpc("search_knowledge_chunks", {
      query_embedding: options.embedding,
      match_count: options.limit || 10,
      match_threshold: options.threshold || 0.5,
    })

    if (error || !data) return []

    const docIds = [...new Set((data as Record<string, unknown>[]).map((chunk: Record<string, unknown>) => chunk.document_id as string))] as string[]
    const docs = await Promise.all(
      docIds.map(id => knowledgeRepo.getDocument(id))
    )

    return docs
      .filter((doc): doc is KnowledgeDocument => doc !== null)
      .map(doc => ({
        document: doc,
        score: (data.find((chunk: Record<string, unknown>) => chunk.document_id === doc.id)?.similarity as number) || 0,
        matched_chunks: data
          .filter((chunk: Record<string, unknown>) => chunk.document_id === doc.id)
          .map((chunk: Record<string, unknown>) => ({
            id: chunk.chunk_id,
            document_id: doc.id,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            heading: chunk.heading,
            metadata: {},
            created_at: new Date().toISOString(),
          })),
      }))
  }

  private mergeResults(
    keywordResults: SearchResult[],
    vectorResults: SearchResult[],
    limit: number,
    threshold: number
  ): SearchResult[] {
    const seen = new Map<string, SearchResult>()

    for (const result of keywordResults) {
      const key = result.document.id
      seen.set(key, { ...result, score: result.score * 0.4 })
    }

    for (const result of vectorResults) {
      const key = result.document.id
      const existing = seen.get(key)
      if (existing) {
        existing.score = Math.min(1, existing.score + result.score * 0.6)
        if (result.matched_chunks) {
          existing.matched_chunks = result.matched_chunks
        }
      } else {
        seen.set(key, { ...result, score: result.score * 0.6 })
      }
    }

    const merged = Array.from(seen.values())
    merged.sort((a, b) => b.score - a.score)

    return merged.filter(r => r.score >= threshold).slice(0, limit)
  }

  private scoreDocument(
    doc: KnowledgeDocument,
    query: string,
    queryTokens: string[]
  ): number {
    let score = 0
    const q = query.toLowerCase()

    if (doc.title.toLowerCase().includes(q)) score += 10
    if (doc.summary?.toLowerCase().includes(q)) score += 5

    const titleTokens = extractTokens(doc.title)
    score += calculateTokenOverlap(queryTokens, titleTokens) * 8

    const contentTokens = extractTokens(doc.content)
    score += calculateTokenOverlap(queryTokens, contentTokens) * 4

    const exactMatches = (doc.content.toLowerCase().match(
      new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    ) || []).length
    score += Math.min(exactMatches * 3, 15)

    if (doc.priority > 0) score += doc.priority
    if (doc.status === "published") score += 2

    return Math.min(score / 30, 1)
  }

  private extractHighlights(
    doc: KnowledgeDocument,
    query: string,
    queryTokens: string[]
  ): string[] {
    const highlights: string[] = []
    const content = doc.content
    const lines = content.split("\n")

    for (const line of lines) {
      const lineTokens = extractTokens(line)
      const overlap = calculateTokenOverlap(queryTokens, lineTokens)
      if (overlap > 0.2 || line.toLowerCase().includes(query.toLowerCase())) {
        highlights.push(line.trim().substring(0, 200))
        if (highlights.length >= 3) break
      }
    }

    return highlights
  }

  private async logSearch(
    query: string,
    resultsCount: number,
    topScore: number,
    responseTimeMs: number
  ): Promise<void> {
    try {
      await knowledgeRepo.logQuery({
        query,
        results_count: resultsCount,
        top_score: topScore,
        response_time_ms: responseTimeMs,
        source: "search_engine",
        channel: "web",
      })
    } catch {
      // Silent fail for logging
    }
  }
}

export class RAGPipeline {
  private searchEngine = new KnowledgeSearchEngine()

  async retrieveContext(
    query: string,
    options: RAGOptions = {}
  ): Promise<RAGContext> {
    const startTime = Date.now()
    const maxResults = options.max_results || 5
    const maxTokens = options.max_tokens || 4000

    const searchResults = await this.searchEngine.search({
      query,
      limit: maxResults,
      threshold: options.threshold || 0.3,
    })

    const contextParts: string[] = []
    let totalChars = 0
    const sources: Array<{ title: string; slug: string; doc_type: string }> = []

    for (const result of searchResults) {
      const contextText = buildSearchContext(
        result.document,
        result.matched_chunks || [],
        extractTokens(query)
      )

      if (totalChars + contextText.length > maxTokens * 4) break

      contextParts.push(contextText)
      totalChars += contextText.length
      sources.push({
        title: result.document.title,
        slug: result.document.slug,
        doc_type: result.document.doc_type,
      })
    }

    const contextText = contextParts.join("\n\n---\n\n")
    const confidence = searchResults.length > 0
      ? searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length
      : 0

    const responseTime = Date.now() - startTime
    await this.logRAG(query, searchResults.length, confidence, responseTime)

    return {
      query,
      results: searchResults,
      total_chunks: searchResults.reduce((sum, r) => sum + (r.matched_chunks?.length || 0), 0),
      context_text: contextText,
      sources,
      confidence: Math.round(confidence * 100) / 100,
    }
  }

  async buildPrompt(
    query: string,
    systemPrompt: string,
    options: RAGOptions = {}
  ): Promise<{ system: string; context: string }> {
    const context = await this.retrieveContext(query, options)

    const enrichedSystem = `${systemPrompt}

## Conocimiento Relevante
El siguiente conocimiento ha sido recuperado de la base de conocimiento de MSM. Usa esta información para responder de manera precisa y completa.

${context.context_text}

## Fuentes
${context.sources.map(s => `- ${s.title} (${s.doc_type})`).join("\n")}

## Instrucciones
- Responde en español
- Usa la información del conocimiento recuperado cuando sea relevante
- Si el conocimiento no es suficiente, indica que no tienes información específica
- Sé conciso pero completo
- Cita las fuentes cuando sea posible
- Si detectas información inconsistente, señálalo`

    return {
      system: enrichedSystem,
      context: context.context_text,
    }
  }

  private async logRAG(
    query: string,
    resultsCount: number,
    confidence: number,
    responseTimeMs: number
  ): Promise<void> {
    try {
      await knowledgeRepo.logQuery({
        query,
        results_count: resultsCount,
        top_score: confidence,
        response_time_ms: responseTimeMs,
        source: "rag_pipeline",
        channel: "web",
      })
    } catch {
      // Silent fail for logging
    }
  }
}

export const knowledgeSearch = new KnowledgeSearchEngine()
export const ragPipeline = new RAGPipeline()
