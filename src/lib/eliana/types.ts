export interface ElianaContext {
  userId: string
  page: string
  section?: string
  itemId?: string
  query?: string
  metadata?: Record<string, string>
}

export interface ElianaMemory {
  userId: string
  shortTerm: ElianaMemoryEntry[]
  longTerm: ElianaMemoryFact[]
  preferences: Record<string, string>
  lastInteraction: number
}

export interface ElianaMemoryEntry {
  role: "user" | "eliana"
  text: string
  page: string
  timestamp: number
}

export interface ElianaMemoryFact {
  fact: string
  category: string
  confidence: number
  createdAt: number
  lastAccessed: number
}

export interface PlatformAnalysis {
  platformId: string
  platformType: string
  userId: string
  categories: string[]
  tags: string[]
  topics: string[]
  summary: string
  keywords: string[]
  sentiment: "positive" | "neutral" | "negative"
  contentTypes: string[]
  language: string
  analyzedAt: number
}

export interface KnowledgeNode {
  id: string
  type: "question" | "concept" | "user" | "platform" | "community" | "project"
  label: string
  description?: string
  color?: string
  weight: number
}

export interface KnowledgeEdge {
  source: string
  target: string
  type: "relates" | "answers" | "connects" | "belongs" | "created" | "analyzed"
  weight: number
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
}

export interface Recommendation {
  id: string
  type: "user" | "question" | "community" | "content" | "platform"
  label: string
  description: string
  score: number
  reason: string
  image?: string
}

export interface ElianaResponse {
  text: string
  suggestions?: string[]
  actions?: ElianaAction[]
  context?: Record<string, string>
}

export interface ElianaAction {
  type: "navigate" | "analyze" | "connect" | "share" | "create"
  label: string
  payload: Record<string, string>
}
