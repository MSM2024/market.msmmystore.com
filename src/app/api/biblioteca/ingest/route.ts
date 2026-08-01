import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"
import {
  MAX_UPLOAD_BYTES,
  ALLOWED_EXTENSIONS,
  ALLOWED_CATEGORIES,
  CATEGORY_TO_PRIVACY_LEVEL,
  chunkText,
  splitMarkdownSections,
  normalizeTitle,
} from "@/lib/biblioteca/ingest"

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const form = await request.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: "Se esperaba multipart/form-data" }, { status: 400 })

  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 })

  const filename = file.name.toLowerCase()
  if (!ALLOWED_EXTENSIONS.some(ext => filename.endsWith(ext))) {
    return NextResponse.json(
      { error: `Formato no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(", ")}` },
      { status: 415 },
    )
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "El archivo excede el tamaño máximo de 5 MB" }, { status: 413 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "El archivo está vacío" }, { status: 400 })
  }

  const category = String(form.get("privacy_category") || "interno")
  if (!(ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json(
      { error: "Categoría de privacidad no permitida. Solo se aceptan obras públicas o internas." },
      { status: 403 },
    )
  }

  const author = String(form.get("author") || "").trim()
  if (!author) return NextResponse.json({ error: "Autor requerido" }, { status: 400 })

  const content = await file.text()
  const checksum = createHash("sha256").update(content, "utf8").digest("hex")
  const isMarkdown = filename.endsWith(".md") || filename.endsWith(".markdown")
  const stem = file.name.replace(/\.(txt|md|markdown)$/i, "")
  const requestedTitle = String(form.get("title") || "").trim() || stem

  const sections = isMarkdown ? splitMarkdownSections(content) : []
  const title = sections.find(s => s.title)?.title || requestedTitle
  const bodyText = sections.length > 0 ? sections.map(s => s.body).join("\n\n") : content

  const repo = new BibliotecaRepository(supabase)
  const book = await repo.createBook({
    title,
    normalized_title: normalizeTitle(title),
    author,
    work_type: String(form.get("work_type") || "").trim() || undefined,
    series: String(form.get("series") || "").trim() || undefined,
    language: String(form.get("language") || "es").trim(),
    format: isMarkdown ? "markdown" : "text",
    status: "pendiente_revision",
    privacy_level: CATEGORY_TO_PRIVACY_LEVEL[category],
    privacy_category: category as "publico" | "interno",
    checksum,
    source_url: `manual://${file.name}`,
    metadata: {
      ingested_via: "manual_upload",
      original_filename: file.name,
      original_size: file.size,
      checksum,
    privacy_category: category as "publico" | "interno",
      stored_in_bucket: false,
    },
    tags: [],
  })
  if (!book) return NextResponse.json({ error: "No se pudo crear el libro" }, { status: 500 })

  const chaptersToCreate =
    sections.length > 0
      ? sections
      : [{ title: title || "Capítulo único", body: content }]

  const warnings: string[] = []
  let chapterIndex = 0
  let chunkCount = 0

  for (const section of chaptersToCreate) {
    if (!section.body) continue
    chapterIndex += 1
    const chapter = await repo.createChapter({
      book_id: book.id,
      chapter_number: chapterIndex,
      title: section.title || `Capítulo ${chapterIndex}`,
      content_original: section.body,
      word_count: section.body.split(/\s+/).length,
      metadata: { ingested_via: "manual_upload" },
    })
    if (!chapter) {
      warnings.push(`No se pudo guardar el capítulo "${section.title}"`)
      continue
    }
    const chunks = chunkText(section.body)
    let index = 0
    for (const text of chunks) {
      await repo.createChunk({
        book_id: book.id,
        chapter_id: chapter.id,
        chunk_index: index,
        section: section.title || undefined,
        content: text,
        token_count: Math.round(text.split(/\s+/).length),
        main_concepts: [],
        people_mentioned: [],
        places_mentioned: [],
        metadata: { ingested_via: "manual_upload", checksum },
      })
      index += 1
      chunkCount += 1
    }
  }

  if (chapterIndex === 0) {
    warnings.push("El documento no contenía texto procesable")
  }

  try {
    const buffer = Buffer.from(content, "utf8")
    const { error: uploadError } = await supabase.storage
      .from("biblioteca_ingesta")
      .upload(`uploads/${book.id}/${file.name}`, buffer, { contentType: file.type || "text/plain" })
    if (uploadError) {
      warnings.push(`No se pudo almacenar la copia original en el bucket: ${uploadError.message}`)
    } else {
      await repo.updateBook(book.id, {
        metadata: { ...book.metadata, stored_in_bucket: true },
      })
    }
  } catch {
    warnings.push("El bucket biblioteca_ingesta no existe o no está accesible (aplica la migración 00056)")
  }

  await repo.logAccess({
    book_id: book.id,
    actor_id: auth.auth.userId,
    actor_email: auth.auth.email,
    action: "ingest_manual",
    resource_type: "book",
    resource_id: book.id,
    resource_title: book.title,
    new_value: {
      filename: file.name,
      size: file.size,
      chapters: chapterIndex,
      chunks: chunkCount,
      checksum,
    },
  })

  return NextResponse.json(
    {
      book,
      chapters_created: chapterIndex,
      chunks_created: chunkCount,
      body_chars: bodyText.length,
      warnings,
    },
    { status: 201 },
  )
}
