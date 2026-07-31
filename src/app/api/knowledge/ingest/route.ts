import { NextRequest, NextResponse } from "next/server"
import { knowledgeIngestion, knowledgeRepo, checkInputSafety } from "@/lib/knowledge"
import { requireAdmin } from "@/lib/api-auth"
import type { KnowledgeIngestionJob } from "@/lib/knowledge/types"

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { documents, source_id, options } = body

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: "Documents array is required" }, { status: 400 })
    }

    const safety = checkInputSafety(JSON.stringify(documents))
    if (safety.blocked) {
      return NextResponse.json({ error: safety.reason }, { status: 400 })
    }

    const result = await knowledgeIngestion.ingestBatch(documents, {
      chunk_size: options?.chunk_size || 1000,
      chunk_overlap: options?.chunk_overlap || 200,
      generate_embeddings: options?.generate_embeddings || false,
      auto_publish: options?.auto_publish || false,
    })

    return NextResponse.json({
      job_id: result.job_id,
      documents_processed: result.documents_processed,
      chunks_created: result.chunks_created,
      embeddings_generated: result.embeddings_generated,
      errors: result.errors,
      success: result.errors.length === 0,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
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
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
