import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"
import { generateText, sanitizeGeneratedText } from "@/lib/autor-ia/engine"
import { buildOutlinePrompt, buildAuthorSystemPrompt } from "@/lib/autor-ia/prompts"
import { ragPipeline } from "@/lib/knowledge"
import { rateLimitByIp } from "@/lib/rate-limit"

type Params = { params: Promise<{ bookId: string }> }

export async function POST(request: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const rate = rateLimitByIp(request, { keyPrefix: "autor-ia-outline", max: 6 })
  if (rate) return rate

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { bookId } = await params
  const repo = new AutorIaRepository(admin)
  const book = await repo.getBook(bookId)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const rag = await ragPipeline.retrieveContext(`libro: ${book.title}. ${book.purpose || ""} ${book.target_reader || ""}`, {
    max_results: 4,
    max_tokens: 2000,
  })

  const systemPrompt = buildAuthorSystemPrompt(book)
  const userPrompt = buildOutlinePrompt(book) + (rag.context_text ? `\n\nReferencias disponibles:\n${rag.context_text}` : "")
  const outline = await generateText({ systemPrompt, userPrompt })

  if (!outline) {
    return NextResponse.json({ error: "No se pudo generar el outline (revisa GOOGLE_API_KEY)" }, { status: 502 })
  }

  const check = sanitizeGeneratedText(outline)
  if (!check.ok) return NextResponse.json({ error: `Contenido rechazado: ${check.reason}` }, { status: 422 })

  const updated = await repo.updateBook(book.id, { outline: check.sanitized, status: "outline" })
  await repo.logGeneration({
    userId: auth.auth.userId,
    query: `outline de "${book.title}"`,
    response: check.sanitized,
    sourcesUsed: rag.sources,
  })

  return NextResponse.json({ outline: check.sanitized, book: updated })
}
