import { NextRequest, NextResponse } from "next/server"
import { knowledgeSearch, checkInputSafety } from "@/lib/knowledge"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import type { SearchResult, KnowledgeChunk } from "@/lib/knowledge/types"

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "knowledge-search" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const body = await request.json()
    const { query, limit, threshold, doc_type, visibility, source_id } = body

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const safety = checkInputSafety(query)
    if (safety.blocked) {
      return NextResponse.json({ error: safety.reason }, { status: 400 })
    }

    const sanitizedQuery = safety.sanitized || query

    const results = await knowledgeSearch.search({
      query: sanitizedQuery,
      limit: limit || 10,
      threshold: threshold || 0.3,
      doc_type: doc_type || undefined,
      visibility: visibility || undefined,
      source_id: source_id || undefined,
    })

    return NextResponse.json({
      query: sanitizedQuery,
      results: results.map((r: SearchResult) => ({
        id: r.document.id,
        title: r.document.title,
        slug: r.document.slug,
        doc_type: r.document.doc_type,
        summary: r.document.summary,
        score: Math.round(r.score * 100) / 100,
        highlights: r.highlights,
        matched_chunks: r.matched_chunks?.map((c: KnowledgeChunk) => ({
          id: c.id,
          content: c.content,
          heading: c.heading,
        })),
      })),
      total: results.length,
    })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "knowledge-search" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
    }

    const safety = checkInputSafety(query)
    if (safety.blocked) {
      return NextResponse.json({ error: safety.reason }, { status: 400 })
    }

    const results = await knowledgeSearch.search({
      query: safety.sanitized || query,
      limit: parseInt(searchParams.get("limit") || "10"),
      threshold: parseFloat(searchParams.get("threshold") || "0.3"),
    })

    return NextResponse.json({
      query: safety.sanitized || query,
      results: results.map((r: SearchResult) => ({
        id: r.document.id,
        title: r.document.title,
        slug: r.document.slug,
        doc_type: r.document.doc_type,
        score: Math.round(r.score * 100) / 100,
        highlights: r.highlights,
      })),
      total: results.length,
    })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
