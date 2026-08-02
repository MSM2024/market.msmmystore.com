import { NextResponse } from "next/server"
import { requireOwner } from "@/lib/api-auth"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { AutorIaRepository } from "@/lib/autor-ia/repository"
import { generateText, sanitizeGeneratedText } from "@/lib/autor-ia/engine"
import { buildAuthorSystemPrompt, buildSectionPrompt } from "@/lib/autor-ia/prompts"
import { ragPipeline } from "@/lib/knowledge"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const schema = z.object({
  title: z.string().trim().min(1, "La sección necesita un título").max(300),
  instructions: z.string().max(5000).optional(),
})

type Params = { params: Promise<{ chapterId: string }> }

export async function POST(request: Request, { params }: Params) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const rate = rateLimitByIp(request, { keyPrefix: "autor-ia-section", max: 10 })
  if (rate) return rate

  const admin = getSupabaseAdminClient()
  if (!admin) return NextResponse.json({ error: "Servicio no configurado" }, { status: 503 })

  const { chapterId } = await params
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })

  const repo = new AutorIaRepository(admin)
  const chapter = await repo.getChapter(chapterId)
  if (!chapter) return NextResponse.json({ error: "Capítulo no encontrado" }, { status: 404 })

  const book = await repo.getBook(chapter.book_id)
  if (!book) return NextResponse.json({ error: "Libro no encontrado" }, { status: 404 })

  const rag = await ragPipeline.retrieveContext(`sección "${parsed.data.title}" del capítulo "${chapter.title}" (${book.title})`, {
    max_results: 4,
    max_tokens: 2000,
  })

  const systemPrompt = buildAuthorSystemPrompt(book)
  const userPrompt = buildSectionPrompt(
    book,
    { title: chapter.title, number: chapter.chapter_number },
    { title: parsed.data.title, number: 0 },
    parsed.data.instructions,
    rag.context_text,
  )
  const content = await generateText({ systemPrompt, userPrompt })

  if (!content) {
    return NextResponse.json({ error: "No se pudo generar la sección (revisa GEMINI_API_KEY)" }, { status: 502 })
  }

  const check = sanitizeGeneratedText(content)
  if (!check.ok) return NextResponse.json({ error: `Contenido rechazado: ${check.reason}` }, { status: 422 })

  const section = await repo.createSection(chapter.id, { title: parsed.data.title, content: check.sanitized })
  const updatedChapter = await repo.rebuildChapterFromSections(chapter.id)
  await repo.updateChapter(chapter.id, { status: "draft" })
  if (book.status === "idea" || book.status === "outline") await repo.updateBook(book.id, { status: "draft" })

  await repo.logGeneration({
    userId: auth.auth.userId,
    query: `sección "${parsed.data.title}" del capítulo "${chapter.title}"`,
    response: check.sanitized,
    sourcesUsed: rag.sources,
  })

  return NextResponse.json({ section, chapter: updatedChapter, content: check.sanitized })
}
