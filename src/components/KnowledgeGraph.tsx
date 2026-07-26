'use client'

import { useState, useMemo } from "react"
import { Atom, Network } from "lucide-react"
import { getKnowledgeGraph, getRelatedNodes } from "@/lib/eliana/knowledge"
import { getSession } from "@/lib/auth"
import type { KnowledgeGraph as KG, KnowledgeNode, KnowledgeEdge } from "@/lib/eliana/types"

const NODE_COLORS: Record<string, string> = {
  user: "#00D9FF", platform: "#7c3aed", concept: "#2563eb",
  question: "#d946ef", community: "#22d3ee", project: "#f59e0b",
}

export default function KnowledgeGraphView({ className = "" }: { className?: string }) {
  const session = getSession()
  const userId = session?.id || ""
  const [graph, setGraph] = useState<KG>(() => userId ? getKnowledgeGraph(userId) : { nodes: [], edges: [] })
  const [selected, setSelected] = useState<string>("")
  const [hovered, setHovered] = useState<string>("")

  const layout = useMemo(() => {
    if (graph.nodes.length === 0) return { nodes: [], edges: [] }
    const cx = 200, cy = 140, r = 100
    const center = graph.nodes.find(n => n.type === "user")
    const others = graph.nodes.filter(n => n.type !== "user")
    const angleStep = others.length > 0 ? (2 * Math.PI) / others.length : 0

    const positioned = new Map<string, { x: number; y: number }>()
    if (center) positioned.set(center.id, { x: cx, y: cy })

    others.forEach((n, i) => {
      const angle = i * angleStep - Math.PI / 2
      const dist = r + (n.weight || 3) * 8
      positioned.set(n.id, {
        x: cx + dist * Math.cos(angle),
        y: cy + dist * Math.sin(angle),
      })
    })

    const edges = graph.edges.map(e => ({
      ...e,
      x1: positioned.get(e.source)?.x || cx,
      y1: positioned.get(e.source)?.y || cy,
      x2: positioned.get(e.target)?.x || cx,
      y2: positioned.get(e.target)?.y || cy,
    }))

    return { nodes: graph.nodes.map(n => ({ ...n, pos: positioned.get(n.id) || { x: cx, y: cy } })), edges }
  }, [graph])

  const selectedInfo = useMemo(() => {
    if (!selected) return null
    const node = graph.nodes.find(n => n.id === selected)
    if (!node) return null
    const related = getRelatedNodes(graph, selected, 1)
    return { node, related }
  }, [selected, graph])

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Network className="w-4 h-4 text-[#00D9FF]" />
        <h3 className="text-sm font-bold text-white tracking-wide">Mapa Vivo del Conocimiento</h3>
        <span className="text-[8px] text-slate-500 ml-auto">{graph.nodes.length} nodos · {graph.edges.length} conexiones</span>
      </div>

      <div className="relative h-64 border border-slate-700/50 rounded-2xl glass overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 280">
          {layout.edges.map((e, i) => {
            const isActive = selected && (e.source === selected || e.target === selected)
            return (
              <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                stroke={isActive ? "#00D9FF" : "#1e3a5f"}
                strokeWidth={isActive ? 1.5 : 0.5}
                opacity={isActive ? 0.8 : 0.3}
                className="transition-all duration-300"
              />
            )
          })}
          {layout.nodes.map(n => {
            const isSelected = selected === n.id
            const isHovered = hovered === n.id
            const isRelated = selected && getRelatedNodes(graph, selected, 1).some(r => r.id === n.id)
            const color = NODE_COLORS[n.type] || "#6B7280"
            const r = isSelected ? 6 : isHovered ? 5 : n.type === "user" ? 5 : 3
            return (
              <g key={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered("")}
                onClick={() => setSelected(selected === n.id ? "" : n.id)}
                className="cursor-pointer"
              >
                <circle cx={n.pos.x} cy={n.pos.y} r={r + 4} fill="transparent" className="cursor-pointer" />
                <circle cx={n.pos.x} cy={n.pos.y} r={r}
                  fill={isSelected ? "#00D9FF" : color}
                  opacity={isSelected || !selected ? 1 : isRelated ? 0.8 : 0.2}
                  className="transition-all duration-300"
                />
                {isSelected && (
                  <circle cx={n.pos.x} cy={n.pos.y} r={r + 4}
                    fill="none" stroke="#00D9FF" strokeWidth={1}
                    opacity={0.5}
                  >
                    <animate attributeName="r" from={r + 4} to={r + 10} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x={n.pos.x + r + 4} y={n.pos.y + 1}
                  fill={isSelected ? "#00D9FF" : isRelated ? "#94a3b8" : "#475569"}
                  fontSize={isSelected ? 8 : 7}
                  className="transition-all duration-300 pointer-events-none select-none"
                >
                  {n.label.slice(0, 18)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {selectedInfo && (
        <div className="mt-3 p-3 rounded-xl glass">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedInfo.node.type] || "#6B7280" }} />
            <p className="text-[10px] font-bold text-white">{selectedInfo.node.label}</p>
            <span className="text-[7px] text-slate-500 uppercase">{selectedInfo.node.type}</span>
          </div>
          {selectedInfo.related.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedInfo.related.slice(0, 6).map(r => (
                <button key={r.id} onClick={() => setSelected(r.id)}
                  className="text-[7px] px-2 py-0.5 rounded-full glass text-slate-300 hover:text-white transition-all cursor-pointer">
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
