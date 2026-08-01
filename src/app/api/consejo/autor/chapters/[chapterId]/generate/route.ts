import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"
import { generateText, sanitizeGeneratedText, extractSectionsFromMarkdown } from "@/lib/autor-ia/engine"
import { buildAuthorSystemPrompt, buildChapterPrompt } from "@/lib/autor-ia/prompts"
import { ragPipeline } from "@/lib/knowledge"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const schema = z.object({
  instructions: z.string().max(5000).optional(),
})

type Params = { params: Promise<{ chapterId: string }> }

export async function POST(request: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const rate = rateLimitByIp(request, { keyPrefix: "autor-ia-chapter", max: 6 })
  if (rate) return rate

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { chapterId } = await params
  let body: unknown = {}
  try { body = await request.json() } catch { /* body opcional */ }

  const parsed = schema.safeParse(body ?? {})
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const repo = new AutorIaRepository(admin)
  const chapter = await repo.getChapter(chapterId)
  if (!chapter) return NextResponse.json({ error: "Capítulo no encontrado" }, { status: 404 })

  const book = await repo.getBook(chapter.book_id)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const rag = await ragPipeline.retrieveContext(`capítulo ${chapter.chapter_number}: ${chapter.title}. ${book.title}. ${book.purpose || ""}`, {
    max_results: 5,
    max_tokens: 3000,
  })

  const systemPrompt = buildAuthorSystemPrompt(book)
  const userPrompt = buildChapterPrompt(book, { title: chapter.title, number: chapter.chapter_number, summary: chapter.summary }, parsed.data.instructions, rag.context_text)
  const content = await generateText({ systemPrompt, userPrompt })

  if (!content) {
    return NextResponse.json({ error: "No se pudo generar el capítulo (revisa GEMINI_API_KEY)" }, { status: 502 })
  }

  const check = sanitizeGeneratedText(content)
  if (!check.ok) return NextResponse.json({ error: `Contenido rechazado: ${check.reason}` }, { status: 422 })

  const sections = extractSectionsFromMarkdown(check.sanitized)
  await repo.clearSections(chapter.id)
  for (const section of sections) {
    await repo.createSection(chapter.id, { title: section.title, content: section.content })
  }

  const updated = await repo.updateChapter(chapter.id, { content: check.sanitized, status: "draft" })
  if (book.status === "idea" || book.status === "outline") await repo.updateBook(book.id, { status: "draft" })

  await repo.logGeneration({
    userId: auth.auth.userId,
    query: `capítulo ${chapter.chapter_number} "${chapter.title}"`,
    response: check.sanitized,
    sourcesUsed: rag.sources,
  })

  return NextResponse.json({ chapter: updated, content: check.sanitized, sections })
}
