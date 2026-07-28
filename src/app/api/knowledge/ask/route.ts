import { NextRequest, NextResponse } from "next/server"
import { ragPipeline, checkInputSafety, buildSystemPrompt, ELIANA_IDENTITY } from "@/lib/knowledge"
import type { SearchResult } from "@/lib/knowledge"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, system_prompt, max_results, max_tokens } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const safety = checkInputSafety(query)
    if (safety.blocked) {
      return NextResponse.json({ error: safety.reason }, { status: 400 })
    }

    const sanitizedQuery = safety.sanitized || query

    const context = await ragPipeline.retrieveContext(sanitizedQuery, {
      max_results: max_results || 5,
      max_tokens: max_tokens || 4000,
      threshold: 0.3,
    })

    const systemPrompt = system_prompt || buildSystemPrompt(ELIANA_IDENTITY)

    return NextResponse.json({
      query: sanitizedQuery,
      context: {
        text: context.context_text,
        sources: context.sources,
        confidence: context.confidence,
        total_chunks: context.total_chunks,
        documents_used: context.results.map((r: SearchResult) => ({
          id: r.document.id,
          title: r.document.title,
          slug: r.document.slug,
          doc_type: r.document.doc_type,
          score: Math.round(r.score * 100) / 100,
        })),
      },
      system_prompt: systemPrompt,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
