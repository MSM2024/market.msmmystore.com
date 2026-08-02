import { knowledgeRepo } from "./repository"
import type {
  KnowledgeDocument,
  KnowledgeStatus,
} from "./types"

const DEFAULT_CHUNK_SIZE = 1000
const DEFAULT_CHUNK_OVERLAP = 200

export interface IngestionOptions {
  chunk_size?: number
  chunk_overlap?: number
  generate_embeddings?: boolean
  auto_publish?: boolean
}

export interface IngestionResult {
  job_id: string
  documents_processed: number
  chunks_created: number
  embeddings_generated: number
  errors: string[]
}

export class KnowledgeIngestion {
  async ingestDocument(
    doc: Partial<KnowledgeDocument>,
    options: IngestionOptions = {}
  ): Promise<KnowledgeDocument | null> {
    const chunkSize = options.chunk_size || DEFAULT_CHUNK_SIZE
    const chunkOverlap = options.chunk_overlap || DEFAULT_CHUNK_OVERLAP

    const existing = await knowledgeRepo.getDocumentBySlug(doc.slug || "")
    let document: KnowledgeDocument | null

    if (existing) {
      document = await knowledgeRepo.updateDocument(existing.id, {
        ...doc,
        status: "draft" as KnowledgeStatus,
      })
    } else {
      document = await knowledgeRepo.createDocument(doc)
    }

    if (!document) return null

    await knowledgeRepo.deleteChunks(document.id)
    const chunks = this.chunkContent(document.content, chunkSize, chunkOverlap)

    for (let i = 0; i < chunks.length; i++) {
      await knowledgeRepo.createChunk({
        document_id: document.id,
        chunk_index: i,
        content: chunks[i].content,
        heading: chunks[i].heading,
        token_count: chunks[i].token_count,
      })
    }

    return document
  }

  async ingestBatch(
    documents: Partial<KnowledgeDocument>[],
    options: IngestionOptions = {}
  ): Promise<IngestionResult> {
    const job = await knowledgeRepo.createJob({
      status: "processing",
      job_type: "batch_ingest",
      documents_total: documents.length,
    })

    if (!job) {
      return {
        job_id: "",
        documents_processed: 0,
        chunks_created: 0,
        embeddings_generated: 0,
        errors: ["Failed to create job"],
      }
    }

    let documentsProcessed = 0
    let chunksCreated = 0
    const embeddingsGenerated = 0
    const errors: string[] = []

    for (const doc of documents) {
      try {
        const result = await this.ingestDocument(doc, options)
        if (result) {
          documentsProcessed++
          const chunks = await knowledgeRepo.getChunks(result.id)
          chunksCreated += chunks.length
        } else {
          errors.push(`Failed to ingest document: ${doc.title || "unknown"}`)
        }
      } catch (error) {
        errors.push(`Error ingesting ${doc.title || "unknown"}: ${error}`)
      }
    }

    await knowledgeRepo.updateJob(job.id, {
      status: errors.length === documents.length ? "failed" : "completed",
      documents_processed: documentsProcessed,
      chunks_created: chunksCreated,
      embeddings_generated: embeddingsGenerated,
      errors,
      completed_at: new Date().toISOString(),
    })

    return {
      job_id: job.id,
      documents_processed: documentsProcessed,
      chunks_created: chunksCreated,
      embeddings_generated: embeddingsGenerated,
      errors,
    }
  }

  private chunkContent(
    content: string,
    chunkSize: number,
    chunkOverlap: number
  ): Array<{ content: string; heading?: string; token_count: number }> {
    const chunks: Array<{ content: string; heading?: string; token_count: number }> = []

    const lines = content.split("\n")
    let currentChunk = ""
    let currentHeading: string | undefined
    let currentTokenCount = 0

    for (const line of lines) {
      const lineTokenCount = this.estimateTokens(line)

      if (line.startsWith("#")) {
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            heading: currentHeading,
            token_count: currentTokenCount,
          })
          const overlapText = this.getOverlapText(currentChunk, chunkOverlap)
          currentChunk = overlapText
          currentTokenCount = this.estimateTokens(overlapText)
        }
        currentHeading = line.replace(/^#+\s*/, "")
      }

      if (currentTokenCount + lineTokenCount > chunkSize && currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          heading: currentHeading,
          token_count: currentTokenCount,
        })
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap)
        currentChunk = overlapText
        currentTokenCount = this.estimateTokens(overlapText)
      }

      currentChunk += line + "\n"
      currentTokenCount += lineTokenCount
    }

    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        heading: currentHeading,
        token_count: currentTokenCount,
      })
    }

    return chunks
  }

  private getOverlapText(text: string, overlapChars: number): string {
    if (text.length <= overlapChars) return text
    const lastPart = text.slice(-overlapChars)
    const lastNewline = lastPart.indexOf("\n")
    if (lastNewline >= 0) {
      return lastPart.slice(lastNewline + 1)
    }
    return lastPart
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  async syncFromSource(sourceId: string): Promise<IngestionResult> {
    const source = await knowledgeRepo.getSource(sourceId)
    if (!source) {
      return {
        job_id: "",
        documents_processed: 0,
        chunks_created: 0,
        embeddings_generated: 0,
        errors: ["Source not found"],
      }
    }

    await knowledgeRepo.updateSource(sourceId, {
      sync_status: "syncing",
    })

    const job = await knowledgeRepo.createJob({
      source_id: sourceId,
      status: "processing",
      job_type: "source_sync",
    })

    const documentsProcessed = 0
    const chunksCreated = 0
    const errors: string[] = []

    try {
      await knowledgeRepo.updateSource(sourceId, {
        sync_status: "completed",
        last_synced_at: new Date().toISOString(),
      })

      if (job) {
        await knowledgeRepo.updateJob(job.id, {
          status: "completed",
          documents_processed: documentsProcessed,
          chunks_created: chunksCreated,
          completed_at: new Date().toISOString(),
        })
      }
    } catch (error) {
      await knowledgeRepo.updateSource(sourceId, {
        sync_status: "error",
        error_message: String(error),
      })

      if (job) {
        await knowledgeRepo.updateJob(job.id, {
          status: "failed",
          errors: [String(error)],
        })
      }

      errors.push(String(error))
    }

    return {
      job_id: job?.id || "",
      documents_processed: documentsProcessed,
      chunks_created: chunksCreated,
      embeddings_generated: 0,
      errors,
    }
  }

  async publishDocument(documentId: string): Promise<boolean> {
    const doc = await knowledgeRepo.getDocument(documentId)
    if (!doc) return false

    const updated = await knowledgeRepo.updateDocument(documentId, {
      status: "published",
      published_at: new Date().toISOString(),
    })

    if (!updated) return false

    await knowledgeRepo.logAudit({
      action: "publish",
      resource_type: "document",
      resource_id: documentId,
      resource_title: doc.title,
      new_value: { status: "published" },
    })

    return true
  }

  async archiveDocument(documentId: string): Promise<boolean> {
    const doc = await knowledgeRepo.getDocument(documentId)
    if (!doc) return false

    const updated = await knowledgeRepo.updateDocument(documentId, {
      status: "archived",
      archived_at: new Date().toISOString(),
    })

    if (!updated) return false

    await knowledgeRepo.logAudit({
      action: "archive",
      resource_type: "document",
      resource_id: documentId,
      resource_title: doc.title,
      new_value: { status: "archived" },
    })

    return true
  }

  async createVersion(documentId: string, changelog?: string): Promise<boolean> {
    const doc = await knowledgeRepo.getDocument(documentId)
    if (!doc) return false

    const versions = await knowledgeRepo.getVersions(documentId)
    const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1

    const version = await knowledgeRepo.createVersion({
      document_id: documentId,
      version_number: nextVersion,
      title: doc.title,
      content: doc.content,
      summary: doc.summary,
      changelog,
      created_by: doc.updated_by,
    })

    if (!version) return false

    await knowledgeRepo.logAudit({
      action: "create_version",
      resource_type: "document",
      resource_id: documentId,
      resource_title: doc.title,
      new_value: { version_number: nextVersion },
    })

    return true
  }
}

export const knowledgeIngestion = new KnowledgeIngestion()
