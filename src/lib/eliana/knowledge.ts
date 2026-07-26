import type { KnowledgeGraph, KnowledgeNode, KnowledgeEdge } from "./types"
import { getAllPlatformAnalyses } from "./analysis"
import { questions, communities as defaultCommunities } from "@/lib/zafiro-data"

const STORAGE_KEY = "zafiro_eliana_graph"

function getGraph(): KnowledgeGraph {
  if (typeof window === "undefined") return { nodes: [], edges: [] }
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"nodes":[],"edges":[]}') } catch { return { nodes: [], edges: [] } }
}

function saveGraph(g: KnowledgeGraph) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(g))
}

export function buildUserKnowledgeGraph(userId: string): KnowledgeGraph {
  const graph = getGraph()
  const analyses = getAllPlatformAnalyses(userId)

  const userNode: KnowledgeNode = {
    id: `user:${userId}`, type: "user", label: `Usuario ${userId.slice(0, 6)}`, weight: 10, color: "#00D9FF",
  }
  const nodes: KnowledgeNode[] = [userNode]
  const edges: KnowledgeEdge[] = []

  analyses.forEach(a => {
    const pNode: KnowledgeNode = {
      id: `platform:${a.platformId}`, type: "platform", label: a.platformType, weight: 5, color: "#7c3aed",
    }
    nodes.push(pNode)
    edges.push({ source: userNode.id, target: pNode.id, type: "connects", weight: 1 })
    a.categories.forEach(c => {
      const cId = `concept:${c.toLowerCase().replace(/\s+/g, "-")}`
      if (!nodes.find(n => n.id === cId)) {
        nodes.push({ id: cId, type: "concept", label: c, weight: 3, color: "#2563eb" })
      }
      edges.push({ source: pNode.id, target: cId, type: "analyzed", weight: 1 })
    })
    a.topics.forEach(t => {
      const tId = `topic:${t.toLowerCase().replace(/\s+/g, "-")}`
      if (!nodes.find(n => n.id === tId)) {
        nodes.push({ id: tId, type: "concept", label: t, weight: 2, color: "#38bdf8" })
      }
      edges.push({ source: pNode.id, target: tId, type: "analyzed", weight: 0.8 })
    })
  })

  const allQuestions = questions || []
  allQuestions.slice(0, 5).forEach(q => {
    const qId = `q:${q.id}`
    nodes.push({ id: qId, type: "question", label: q.title.slice(0, 30), weight: 4, color: "#d946ef" })
    edges.push({ source: userNode.id, target: qId, type: "created", weight: 0.5 })
    if (q.category) {
      const catId = `concept:${q.category.toLowerCase().replace(/\s+/g, "-")}`
      edges.push({ source: qId, target: catId, type: "relates", weight: 0.7 })
    }
  })

  defaultCommunities.slice(0, 3).forEach(c => {
    const cId = `community:${c.id}`
    nodes.push({ id: cId, type: "community", label: c.name, weight: 4, color: "#22d3ee" })
    edges.push({ source: userNode.id, target: cId, type: "belongs", weight: 0.6 })
  })

  const merged = mergeGraph(graph, { nodes, edges })
  saveGraph(merged)
  return merged
}

function mergeGraph(existing: KnowledgeGraph, incoming: KnowledgeGraph): KnowledgeGraph {
  const nodeMap = new Map<string, KnowledgeNode>()
  existing.nodes.forEach(n => nodeMap.set(n.id, n))
  incoming.nodes.forEach(n => {
    if (nodeMap.has(n.id)) {
      const existingNode = nodeMap.get(n.id)!
      existingNode.weight = Math.max(existingNode.weight, n.weight)
    } else {
      nodeMap.set(n.id, n)
    }
  })

  const edgeSet = new Set<string>()
  const mergedEdges: KnowledgeEdge[] = []
  const allEdges = [...existing.edges, ...incoming.edges]
  allEdges.forEach(e => {
    const key = `${e.source}|${e.target}|${e.type}`
    if (!edgeSet.has(key)) {
      edgeSet.add(key)
      mergedEdges.push(e)
    }
  })

  return { nodes: Array.from(nodeMap.values()), edges: mergedEdges }
}

export function getKnowledgeGraph(userId: string): KnowledgeGraph {
  const graph = getGraph()
  if (graph.nodes.length === 0) return buildUserKnowledgeGraph(userId)
  return graph
}

export function findPathBetween(graph: KnowledgeGraph, fromId: string, toId: string): KnowledgeEdge[] {
  const visited = new Set<string>()
  const queue: { nodeId: string; path: KnowledgeEdge[] }[] = [{ nodeId: fromId, path: [] }]
  visited.add(fromId)
  while (queue.length > 0) {
    const current = queue.shift()!
    const neighbors = graph.edges.filter(e => e.source === current.nodeId || e.target === current.nodeId)
    for (const edge of neighbors) {
      const nextNode = edge.source === current.nodeId ? edge.target : edge.source
      if (nextNode === toId) return [...current.path, edge]
      if (!visited.has(nextNode)) {
        visited.add(nextNode)
        queue.push({ nodeId: nextNode, path: [...current.path, edge] })
      }
    }
  }
  return []
}

export function getRelatedNodes(graph: KnowledgeGraph, nodeId: string, maxDepth = 2): KnowledgeNode[] {
  const related = new Set<string>()
  const queue = [{ id: nodeId, depth: 0 }]
  const visited = new Set<string>()
  visited.add(nodeId)

  while (queue.length > 0) {
    const current = queue.shift()!
    if (current.depth >= maxDepth) continue
    const edges = graph.edges.filter(e => e.source === current.id || e.target === current.id)
    for (const edge of edges) {
      const nextId = edge.source === current.id ? edge.target : edge.source
      if (!visited.has(nextId)) {
        visited.add(nextId)
        related.add(nextId)
        queue.push({ id: nextId, depth: current.depth + 1 })
      }
    }
  }
  return graph.nodes.filter(n => related.has(n.id))
}
