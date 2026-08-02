import { NextRequest, NextResponse } from "next/server"
import { knowledgeIngestion, knowledgeRepo, checkInputSafety } from "@/lib/knowledge"
import { requireAdmin } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"
import type { KnowledgeIngestionJob } from "@/lib/knowledge/types"

const optionsSchema = z.object({
  chunk_size: z.number().int().positive().max(100_000).optional(),
  chunk_overlap: z.number().int().nonnegative().max(100_000).optional(),
  generate_embeddings: z.boolean().optional(),
  auto_publish: z.boolean().optional(),
})

const documentSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().max(500).optional(),
  source_id: z.string().max(300).optional(),
  doc_type: z.enum(["policy", "faq", "guide", "tutorial", "reference", "changelog", "identity", "operations", "legal", "marketing"]).optional(),
  status: z.enum(["draft", "review", "published", "archived", "rejected"]).optional(),
  visibility: z.enum(["public", "internal", "confidential", "restricted"]).optional(),
  content: z.string().min(1).max(2_000_000),
  summary: z.string().max(20_000).optional(),
  language: z.string().max(10).optional(),
  priority: z.number().int().nonnegative().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const ingestSchema = z.object({
  documents: z.array(documentSchema).min(1).max(200),
  source_id: z.string().max(300).optional(),
  options: optionsSchema.optional(),
})

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 10, windowMs: 60_000, keyPrefix: "knowledge-ingest" })
    if (limited) return limited

    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => null)
    const parsed = ingestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de ingesta inválidos", issues: parsed.error.issues }, { status: 400 })
    }

    const { documents, source_id, options } = parsed.data

    const safety = checkInputSafety(JSON.stringify(documents))
    if (safety.blocked) {
      return NextResponse.json({ error: safety.reason }, { status: 400 })
    }

    const result = await knowledgeIngestion.ingestBatch(
      documents.map((doc) => ({ ...doc, source_id: doc.source_id ?? source_id ?? undefined })),
      {
        chunk_size: options?.chunk_size ?? 1000,
        chunk_overlap: options?.chunk_overlap ?? 200,
        generate_embeddings: options?.generate_embeddings ?? false,
        auto_publish: options?.auto_publish ?? false,
      },
    )

    if (result.job_id) {
      await writeAuditLog({
        action: "knowledge.ingest.batch",
        resource: "knowledge_documents",
        resource_type: "knowledge_document",
        resource_id: result.job_id,
        new_value: {
          documents_requested: documents.length,
          documents_processed: result.documents_processed,
          chunks_created: result.chunks_created,
        },
        details: `Ingesta de ${documents.length} documento(s)`,
        request,
        app_name: "zafiro",
      })
    }

    return NextResponse.json({
      job_id: result.job_id,
      documents_processed: result.documents_processed,
      chunks_created: result.chunks_created,
      embeddings_generated: result.embeddings_generated,
      errors: result.errors,
      success: result.errors.length === 0,
    })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 10, windowMs: 60_000, keyPrefix: "knowledge-ingest" })
    if (limited) return limited

    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get("job_id")

    if (jobId) {
      const jobs = await knowledgeRepo.listJobs()
      const job = jobs.find((j: KnowledgeIngestionJob) => j.id === jobId)
      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 })
      }
      return NextResponse.json({ job })
    }

    const jobs = await knowledgeRepo.listJobs()
    return NextResponse.json({ jobs })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
