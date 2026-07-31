"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Database, Upload, Search, CheckCircle, XCircle, Clock, AlertTriangle, FileText, RefreshCw } from "lucide-react"

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

export default function AdminBibliotecaImportacionPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"catalogo" | "importaciones">("catalogo")

  useEffect(() => {
    Promise.all([
      fetch("/api/biblioteca/books?limit=200").then(r => r.json()),
      fetch("/api/biblioteca/imports").then(r => r.json()),
    ]).then(([booksData, jobsData]) => {
      setBooks(booksData.books || [])
      setJobs(jobsData.jobs || [])
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

  return (
    <div className="min-h-screen bg-black text-white">
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
      </div>
    </div>
  )
}
