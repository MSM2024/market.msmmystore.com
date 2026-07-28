export type {
  KnowledgeStatus,
  KnowledgeDocType,
  KnowledgeSourceType,
  KnowledgePermissionLevel,
  KnowledgeFeedbackType,
  KnowledgeJobStatus,
  KnowledgeApprovalStatus,
  KnowledgeGapType,
  KnowledgeVisibility,
  KnowledgeDocument,
  KnowledgeChunk,
  KnowledgeSource,
  KnowledgeTag,
  KnowledgeVersion,
  KnowledgePermission,
  KnowledgeQuery,
  KnowledgeAnswer,
  KnowledgeFeedback,
  KnowledgeIngestionJob,
  KnowledgeAuditLog,
  KnowledgeApproval,
  KnowledgeGap,
  KnowledgeSetting,
  SearchOptions,
  SearchResult,
  RAGContext,
  RAGOptions,
  EmbeddingRequest,
  EmbeddingResponse,
} from "./types"

export { knowledgeRepo } from "./repository"
export { KnowledgeRepository } from "./repository"
export { knowledgeSearch, ragPipeline } from "./search"
export { KnowledgeSearchEngine, RAGPipeline } from "./search"
export { knowledgeIngestion } from "./ingestion"
export { KnowledgeIngestion } from "./ingestion"
export {
  checkInputSafety,
  checkOutputSafety,
  extractTopics,
  buildSystemPrompt,
  ELIANA_IDENTITY,
  sanitizeForDisplay,
  truncateWithContext,
} from "./guardrails"
export type { GuardrailResult } from "./guardrails"
export {
  getElianaKnowledge,
  buildElianaKnowledgePrompt,
  processElianaKnowledgeRequest,
  detectKnowledgeGaps,
  getKnowledgeSuggestions,
} from "./eliana-integration"
export type { ElianaKnowledgeContext } from "./eliana-integration"
export { seedKnowledgeBase, getSeedStats, SEED_DOCUMENTS } from "./seed"
export type { SeedDocument } from "./seed"
export { loadKnowledgeBase, searchKnowledge, buildKnowledgeContext } from "./compat"
export type { KnowledgeDoc } from "../knowledge-data"
