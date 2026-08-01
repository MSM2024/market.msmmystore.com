"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Database, Upload, CheckCircle, XCircle, Clock, FileText, RefreshCw, BookCheck } from "lucide-react"

interface ImportJob {
  id: string
  status: string
  job_type: string
  files_found: number
  files_scanned: number
  books_identified: number
  duplicates_found: number
  exclusions_applied: number
  books_imported: number
  chunks_created: number
  error_count: number
  errors: unknown[]
  started_at: string | null
  completed_at: string | null
  created_at: string
}

interface Book {
  id: string
  title: string
  author: string
  status: string
  privacy_level: string
  series: string | null
  volume_number: number | null
  drive_file_id: string | null
  version: number
  updated_at: string
}

interface Approval {
  id: string
  book_id: string
  version_number?: number
  status: string
  requested_by?: string
  reviewed_by?: string
  review_notes?: string
  requested_at: string
  reviewed_at?: string
}

const STATUS_COLORS: Record<string, string> = {
  descubierto: "bg-yellow-500/20 text-yellow-400",
  pendiente_revision: "bg-orange-500/20 text-orange-400",
  aprobado: "bg-green-500/20 text-green-400",
  importado: "bg-blue-500/20 text-blue-400",
  duplicado: "bg-purple-500/20 text-purple-400",
  excluido: "bg-red-500/20 text-red-400",
  error: "bg-red-500/20 text-red-400",
  actualizado: "bg-cyan-500/20 text-cyan-400",
}

const APPROVAL_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  revision_needed: "bg-orange-500/20 text-orange-400",
}

export default function AdminBibliotecaImportacionPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"catalogo" | "importaciones" | "aprobaciones">("catalogo")
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/biblioteca/books?limit=200").then(r => r.json()),
      fetch("/api/biblioteca/imports").then(r => r.json()),
      fetch("/api/biblioteca/approvals").then(r => r.json()),
    ]).then(([booksData, jobsData, approvalsData]) => {
      setBooks(booksData.books || [])
      setJobs(jobsData.jobs || [])
      setApprovals(approvalsData.approvals || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const counts = {
    total: books.length,
    descubierto: books.filter(b => b.status === "descubierto").length,
    aprobado: books.filter(b => b.status === "aprobado").length,
    importado: books.filter(b => b.status === "importado").length,
    duplicado: books.filter(b => b.status === "duplicado").length,
    excluido: books.filter(b => b.status === "excluido").length,
  }

  const pendingApprovals = approvals.filter(a => a.status === "pending")
  const reviewedApprovals = approvals.filter(a => a.status !== "pending")

  const bookTitle = (id: string) => books.find(b => b.id === id)?.title || id.slice(0, 8)

  async function decideApproval(id: string, status: string) {
    setBusyId(id)
    setFeedback("")
    try {
      const res = await fetch("/api/biblioteca/approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, review_notes: notes[id] || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setFeedback(data?.error || "No se pudo procesar la solicitud")
        return
      }
      const refreshed = await fetch("/api/biblioteca/approvals").then(r => r.json())
      setApprovals(refreshed.approvals || [])
    } catch {
      setFeedback("Error de red al procesar la solicitud")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Database className="w-8 h-8 text-[#00D9FF]" />
          <h1 className="text-3xl font-bold">Administración de Importación</h1>
          <span className="px-3 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Solo OWNER_SUPERADMIN
          </span>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white">{counts.total}</div>
            <div className="text-xs text-white/50">Total</div>
          </div>
          <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <div className="text-2xl font-bold text-yellow-400">{counts.descubierto}</div>
            <div className="text-xs text-white/50">Descubiertos</div>
          </div>
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-2xl font-bold text-green-400">{counts.aprobado}</div>
            <div className="text-xs text-white/50">Aprobados</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-2xl font-bold text-blue-400">{counts.importado}</div>
            <div className="text-xs text-white/50">Importados</div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
            <div className="text-2xl font-bold text-purple-400">{counts.duplicado}</div>
            <div className="text-xs text-white/50">Duplicados</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <div className="text-2xl font-bold text-red-400">{counts.excluido}</div>
            <div className="text-xs text-white/50">Excluidos</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("catalogo")}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              tab === "catalogo" ? "bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40" : "bg-white/10 text-white/70 border border-white/10"
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1" /> Catálogo
          </button>
          <button
            onClick={() => setTab("importaciones")}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              tab === "importaciones" ? "bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40" : "bg-white/10 text-white/70 border border-white/10"
            }`}
          >
            <RefreshCw className="w-4 h-4 inline mr-1" /> Importaciones
          </button>
          <button
            onClick={() => setTab("aprobaciones")}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              tab === "aprobaciones" ? "bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40" : "bg-white/10 text-white/70 border border-white/10"
            }`}
          >
            <BookCheck className="w-4 h-4 inline mr-1" /> Aprobaciones
            {pendingApprovals.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        </div>

        {tab === "catalogo" && (
          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-white/50 py-12">Cargando catálogo...</div>
            ) : books.length === 0 ? (
              <div className="text-center text-white/50 py-12">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No hay obras en el catálogo</p>
                <p className="text-sm mt-2">Conecta Google Drive para escanear y poblar el catálogo</p>
              </div>
            ) : (
              books.map(book => (
                <div key={book.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link href={`/biblioteca/${book.id}`} className="text-white hover:text-[#00D9FF] font-medium truncate block">
                      {book.title}
                    </Link>
                    <div className="flex gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[book.status] || "bg-white/10 text-white/50"}`}>
                        {book.status}
                      </span>
                      {book.series && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/50">
                          {book.series}{book.volume_number ? ` v${book.volume_number}` : ""}
                        </span>
                      )}
                      <span className="text-xs text-white/30">v{book.version}</span>
                    </div>
                  </div>
                  {book.drive_file_id && (
                    <span className="text-xs text-white/30" title={book.drive_file_id}>
                      <Upload className="w-3 h-3 inline" /> Drive
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "importaciones" && (
          <div className="space-y-3">
            {jobs.length === 0 ? (
              <div className="text-center text-white/50 py-12">
                <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No hay trabajos de importación registrados</p>
              </div>
            ) : (
              jobs.map(job => (
                <div key={job.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{job.job_type}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      job.status === "completed" ? "bg-green-500/20 text-green-400" :
                      job.status === "failed" ? "bg-red-500/20 text-red-400" :
                      job.status === "scanning" ? "bg-blue-500/20 text-blue-400" :
                      "bg-yellow-500/20 text-yellow-400"
                    }`}>{job.status}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-white/50">
                    <span>Archivos: {job.files_found}</span>
                    <span>Libros: {job.books_identified}</span>
                    <span>Duplicados: {job.duplicates_found}</span>
                    <span>Errores: {job.error_count}</span>
                  </div>
                  {job.started_at && (
                    <div className="text-xs text-white/30 mt-2">
                      Iniciado: {new Date(job.started_at).toLocaleString()}
                      {job.completed_at && ` · Completado: ${new Date(job.completed_at).toLocaleString()}`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "aprobaciones" && (
          <div className="space-y-3">
            {feedback && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">{feedback}</div>
            )}
            {loading ? (
              <div className="text-center text-white/50 py-12">Cargando aprobaciones...</div>
            ) : pendingApprovals.length === 0 ? (
              <div className="text-center text-white/50 py-12">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No hay solicitudes de aprobación pendientes</p>
              </div>
            ) : (
              pendingApprovals.map(a => (
                <div key={a.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/biblioteca/${a.book_id}`} className="text-white hover:text-[#00D9FF] font-medium">
                      {bookTitle(a.book_id)}
                    </Link>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${APPROVAL_COLORS[a.status] || "bg-white/10 text-white/50"}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="text-xs text-white/30 mb-3">
                    Solicitada: {new Date(a.requested_at).toLocaleString()}
                    {a.version_number ? ` · v${a.version_number}` : ""}
                  </div>
                  <textarea
                    value={notes[a.id] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [a.id]: e.target.value }))}
                    placeholder="Notas de revisión (opcional)..."
                    className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D9FF]/50"
                    rows={2}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => decideApproval(a.id, "approved")}
                      disabled={busyId === a.id}
                      className="px-4 py-2 rounded-lg text-sm bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" /> Aprobar
                    </button>
                    <button
                      onClick={() => decideApproval(a.id, "rejected")}
                      disabled={busyId === a.id}
                      className="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" /> Rechazar
                    </button>
                    <button
                      onClick={() => decideApproval(a.id, "revision_needed")}
                      disabled={busyId === a.id}
                      className="px-4 py-2 rounded-lg text-sm bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30 disabled:opacity-50 transition-colors"
                    >
                      <Clock className="w-4 h-4 inline mr-1" /> Requiere revisión
                    </button>
                  </div>
                </div>
              ))
            )}

            {!loading && reviewedApprovals.length > 0 && (
              <div className="pt-6">
                <h2 className="text-sm font-semibold text-white/50 mb-3">Historial de revisiones</h2>
                <div className="space-y-2">
                  {reviewedApprovals.map(a => (
                    <div key={a.id} className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{bookTitle(a.book_id)}</div>
                        <div className="text-xs text-white/30">
                          Revisada: {a.reviewed_at ? new Date(a.reviewed_at).toLocaleString() : "—"}
                          {a.review_notes ? ` · ${a.review_notes}` : ""}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${APPROVAL_COLORS[a.status] || "bg-white/10 text-white/50"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
