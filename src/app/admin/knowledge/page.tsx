"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { hasRole, refreshSession } from "@/lib/auth"

interface KnowledgeStats {
  total_documents: number
  published_documents: number
  draft_documents: number
  total_chunks: number
  total_queries: number
  total_feedback: number
  total_gaps: number
  open_gaps: number
  pending_approvals: number
  documents_by_type: Record<string, number>
  documents_by_status: Record<string, number>
}

interface KnowledgeDocument {
  id: string
  title: string
  slug: string
  doc_type: string
  status: string
  visibility: string
  summary?: string
  priority: number
  created_at: string
  updated_at: string
}

interface KnowledgeGap {
  id: string
  gap_type: string
  title: string
  description?: string
  status: string
  priority: number
  created_at: string
}

interface KnowledgeApproval {
  id: string
  document_id: string
  status: string
  requested_at: string
  review_notes?: string
}

const DOC_TYPES = ["policy", "faq", "guide", "tutorial", "reference", "changelog", "identity", "operations", "legal", "marketing"]
const VISIBILITIES = ["public", "internal", "confidential", "restricted"]
const GAP_TYPES = ["missing_topic", "outdated_info", "low_coverage", "contradiction", "user_request"]

export default function KnowledgeAdminPage() {
  const router = useRouter()

  useEffect(() => {
    refreshSession().then(session => {
      if (!session || (!hasRole("owner") && !hasRole("admin") && !hasRole("superadmin"))) {
        router.replace("/")
      }
    })
  }, [router])

  const [tab, setTab] = useState<"overview" | "documents" | "gaps" | "approvals" | "settings">("overview")
  const [stats, setStats] = useState<KnowledgeStats | null>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [gaps, setGaps] = useState<KnowledgeGap[]>([])
  const [approvals, setApprovals] = useState<KnowledgeApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateDoc, setShowCreateDoc] = useState(false)
  const [showCreateGap, setShowCreateGap] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: "", content: "", doc_type: "reference", visibility: "internal", summary: "" })
  const [newGap, setNewGap] = useState({ gap_type: "missing_topic", title: "", description: "", priority: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsRes, docsRes, gapsRes, approvalsRes] = await Promise.all([
        fetch("/api/knowledge/stats"),
        fetch("/api/knowledge/documents?limit=50"),
        fetch("/api/knowledge/gaps"),
        fetch("/api/knowledge/approvals"),
      ])

      if (statsRes.ok) setStats(await statsRes.json())
      if (docsRes.ok) {
        const data = await docsRes.json()
        setDocuments(data.documents || [])
      }
      if (gapsRes.ok) {
        const data = await gapsRes.json()
        setGaps(data.gaps || [])
      }
      if (approvalsRes.ok) {
        const data = await approvalsRes.json()
        setApprovals(data.approvals || [])
      }
    } catch (_err) {
      setError("Error fetching data")
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [fetchData])

  const createDocument = async () => {
    if (!newDoc.title || !newDoc.content) return
    try {
      const res = await fetch("/api/knowledge/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc),
      })
      if (res.ok) {
        setShowCreateDoc(false)
        setNewDoc({ title: "", content: "", doc_type: "reference", visibility: "internal", summary: "" })
        fetchData()
      }
    } catch (_err) {
      setError("Error creating document")
    }
  }

  const createGap = async () => {
    if (!newGap.title) return
    try {
      const res = await fetch("/api/knowledge/gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGap),
      })
      if (res.ok) {
        setShowCreateGap(false)
        setNewGap({ gap_type: "missing_topic", title: "", description: "", priority: 0 })
        fetchData()
      }
    } catch (_err) {
      setError("Error creating gap")
    }
  }

  const updateDocumentStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/knowledge/documents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) fetchData()
    } catch (_err) {
      setError("Error updating document")
    }
  }

  const updateApproval = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/knowledge/approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) fetchData()
    } catch (_err) {
      setError("Error updating approval")
    }
  }

  const deleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return
    try {
      const res = await fetch(`/api/knowledge/documents?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchData()
    } catch (_err) {
      setError("Error deleting document")
    }
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" })

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-600", review: "bg-amber-600", published: "bg-emerald-600",
      archived: "bg-slate-600", rejected: "bg-red-600", pending: "bg-amber-600",
      approved: "bg-emerald-600", revision_needed: "bg-blue-600",
    }
    return colors[status] || "bg-gray-600"
  }

  if (loading) {
    return (
      <div className="min-h-screen zafiro-page flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading Knowledge Base...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen zafiro-page text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">Knowledge Base Admin</h1>
            <p className="text-gray-400 mt-1">Manage ELIANA&apos;s knowledge documents, gaps, and approvals</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition">
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 text-red-200">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-300">Dismiss</button>
          </div>
        )}

        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
          {(["overview", "documents", "gaps", "approvals", "settings"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg transition capitalize ${tab === t ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Documents" value={stats.total_documents} color="cyan" />
            <StatCard label="Published" value={stats.published_documents} color="emerald" />
            <StatCard label="Drafts" value={stats.draft_documents} color="amber" />
            <StatCard label="Total Chunks" value={stats.total_chunks} color="purple" />
            <StatCard label="Queries" value={stats.total_queries} color="blue" />
            <StatCard label="Feedback" value={stats.total_feedback} color="pink" />
            <StatCard label="Gaps" value={stats.total_gaps} color="orange" />
            <StatCard label="Pending Approvals" value={stats.pending_approvals} color="red" />
          </div>
        )}

        {tab === "documents" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Documents</h2>
              <button onClick={() => setShowCreateDoc(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition">
                + New Document
              </button>
            </div>

            {showCreateDoc && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4">Create New Document</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Title" value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                    className="col-span-2 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                  <textarea placeholder="Summary" value={newDoc.summary} onChange={e => setNewDoc({ ...newDoc, summary: e.target.value })}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-20" />
                  <select value={newDoc.doc_type} onChange={e => setNewDoc({ ...newDoc, doc_type: e.target.value })}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                    {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={newDoc.visibility} onChange={e => setNewDoc({ ...newDoc, visibility: e.target.value })}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                    {VISIBILITIES.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <textarea placeholder="Content (Markdown)" value={newDoc.content} onChange={e => setNewDoc({ ...newDoc, content: e.target.value })}
                    className="col-span-2 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-40" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={createDocument} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg">Create</button>
                  <button onClick={() => setShowCreateDoc(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.title}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusColor(doc.status)}`}>{doc.status}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-700">{doc.doc_type}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-700">{doc.visibility}</span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{doc.summary || "No summary"} | Priority: {doc.priority}</div>
                    <div className="text-xs text-gray-500 mt-1">Created: {formatDate(doc.created_at)} | Updated: {formatDate(doc.updated_at)}</div>
                  </div>
                  <div className="flex gap-2">
                    {doc.status === "draft" && (
                      <button onClick={() => updateDocumentStatus(doc.id, "published")} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm">Publish</button>
                    )}
                    {doc.status === "published" && (
                      <button onClick={() => updateDocumentStatus(doc.id, "archived")} className="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded text-sm">Archive</button>
                    )}
                    <button onClick={() => deleteDocument(doc.id)} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "gaps" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Knowledge Gaps</h2>
              <button onClick={() => setShowCreateGap(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg transition">
                + Report Gap
              </button>
            </div>

            {showCreateGap && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-4">
                <h3 className="text-lg font-semibold mb-4">Report Knowledge Gap</h3>
                <div className="grid grid-cols-2 gap-4">
                  <select value={newGap.gap_type} onChange={e => setNewGap({ ...newGap, gap_type: e.target.value })}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                    {GAP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                  <input placeholder="Priority (0-10)" type="number" min="0" max="10" value={newGap.priority}
                    onChange={e => setNewGap({ ...newGap, priority: parseInt(e.target.value) || 0 })}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                  <input placeholder="Title" value={newGap.title} onChange={e => setNewGap({ ...newGap, title: e.target.value })}
                    className="col-span-2 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                  <textarea placeholder="Description" value={newGap.description} onChange={e => setNewGap({ ...newGap, description: e.target.value })}
                    className="col-span-2 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-20" />
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={createGap} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg">Create</button>
                  <button onClick={() => setShowCreateGap(false)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {gaps.map(gap => (
                <div key={gap.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{gap.title}</span>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColor(gap.status)}`}>{gap.status}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-700">{gap.gap_type.replace(/_/g, " ")}</span>
                    <span className="text-sm text-gray-400">Priority: {gap.priority}</span>
                  </div>
                  {gap.description && <div className="text-sm text-gray-400 mt-1">{gap.description}</div>}
                  <div className="text-xs text-gray-500 mt-1">Created: {formatDate(gap.created_at)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "approvals" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
            <div className="space-y-2">
              {approvals.filter(a => a.status === "pending").map(approval => (
                <div key={approval.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Document: {approval.document_id}</div>
                    <div className="text-sm text-gray-400">Requested: {formatDate(approval.requested_at)}</div>
                    {approval.review_notes && <div className="text-sm text-gray-400">Notes: {approval.review_notes}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => updateApproval(approval.id, "approved")} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded text-sm">Approve</button>
                    <button onClick={() => updateApproval(approval.id, "rejected")} className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm">Reject</button>
                  </div>
                </div>
              ))}
              {approvals.filter(a => a.status === "pending").length === 0 && (
                <div className="text-gray-500 text-center py-8">No pending approvals</div>
              )}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Knowledge Settings</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400">Settings management coming soon. Configure embedding models, chunk sizes, retention policies, and more.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    cyan: "border-cyan-500/30 bg-cyan-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
    amber: "border-amber-500/30 bg-amber-500/10",
    purple: "border-purple-500/30 bg-purple-500/10",
    blue: "border-blue-500/30 bg-blue-500/10",
    pink: "border-pink-500/30 bg-pink-500/10",
    orange: "border-orange-500/30 bg-orange-500/10",
    red: "border-red-500/30 bg-red-500/10",
  }
  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color] || colorClasses.cyan}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}
