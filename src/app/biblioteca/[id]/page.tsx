"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BookOpen, Layers, User, MapPin, Tags, FileText, Clock, ArrowLeft, Shield } from "lucide-react"
import type {
  LibraryBook, LibraryChapter, LibraryVersion, LibraryPerson,
  LibraryPlace, LibraryTopic, LibraryChunk, LibraryRelationship, LibraryAccessLog,
} from "@/lib/biblioteca/types"

interface BookDetail {
  book: LibraryBook | null
  chapters: LibraryChapter[]
  versions: LibraryVersion[]
  people: LibraryPerson[]
  places: LibraryPlace[]
  topics: LibraryTopic[]
  relationships: (LibraryRelationship & { target?: LibraryBook })[]
  chunks: LibraryChunk[]
  accessLogs: LibraryAccessLog[]
}

const PRIVACY_LABELS: Record<string, string> = {
  privado_don_miguel: "Privado — Solo Don Miguel",
  familia: "Familia",
  equipo_msm: "Equipo MSM",
  interno_eliana: "Interno ELIANA",
  comunidad: "Comunidad",
  publico: "Público",
  legado_futuro: "Legado Futuro",
}

const PRIVACY_COLORS: Record<string, string> = {
  publico: "text-green-400 border-green-400/30",
  comunidad: "text-blue-400 border-blue-400/30",
  interno_eliana: "text-yellow-400 border-yellow-400/30",
  equipo_msm: "text-purple-400 border-purple-400/30",
  familia: "text-pink-400 border-pink-400/30",
  privado_don_miguel: "text-red-400 border-red-400/30",
  legado_futuro: "text-[#00D9FF] border-[#00D9FF]/30",
}

export default function BookDetailPage() {
  const params = useParams()
  const [data, setData] = useState<BookDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/biblioteca/books/${params.id}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen zafiro-page text-white flex items-center justify-center">
      <div className="text-white/50">Cargando obra...</div>
    </div>
  )

  if (!data?.book) return (
    <div className="min-h-screen zafiro-page text-white flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-white/50">Obra no encontrada</p>
        <Link href="/biblioteca" className="text-[#00D9FF] hover:underline mt-2 inline-block">Volver a la biblioteca</Link>
      </div>
    </div>
  )

  const { book, chapters, versions, relationships } = data

  return (
    <div className="min-h-screen zafiro-page text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/biblioteca" className="inline-flex items-center gap-2 text-white/50 hover:text-[#00D9FF] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a la biblioteca
        </Link>

        <div className="flex items-start gap-4 mb-6">
          <BookOpen className="w-10 h-10 text-[#00D9FF] mt-1 shrink-0" />
          <div>
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            <p className="text-white/60">por {book.author}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-3 py-1 text-xs rounded-full border ${PRIVACY_COLORS[book.privacy_level] || "text-white/50 border-white/20"}`}>
                <Shield className="w-3 h-3 inline mr-1" />
                {PRIVACY_LABELS[book.privacy_level] || book.privacy_level}
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-white/50 border border-white/10">
                {book.status}
              </span>
              {book.series && (
                <span className="px-3 py-1 text-xs rounded-full bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30">
                  <Layers className="w-3 h-3 inline mr-1" />
                  {book.series}{book.volume_number ? ` · Tomo ${book.volume_number}` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {book.summary && (
          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">Sinopsis</h2>
            <p className="text-white/80">{book.summary}</p>
          </div>
        )}

        {book.description && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-2">Descripción</h2>
            <p className="text-white/70 whitespace-pre-line">{book.description}</p>
          </div>
        )}

        {chapters.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00D9FF]" />
              Capítulos ({chapters.length})
            </h2>
            <div className="space-y-2">
              {chapters.map((ch: LibraryChapter) => (
                <div key={ch.id} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-[#00D9FF] text-sm mr-2">#{ch.chapter_number}</span>
                  <span className="text-white/80">{ch.title || `Capítulo ${ch.chapter_number}`}</span>
                  {ch.word_count != null && <span className="text-white/30 text-xs ml-2">({ch.word_count} palabras)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {versions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00D9FF]" />
              Versiones ({versions.length})
            </h2>
            <div className="space-y-2">
              {versions.map((v: LibraryVersion) => (
                <div key={v.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                  <span className="text-[#00D9FF]">v{v.version_number}</span>
                  {v.changelog && <span className="text-white/50 ml-2">— {v.changelog}</span>}
                  <span className="text-white/30 ml-2">{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {relationships.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Tags className="w-5 h-5 text-[#00D9FF]" />
              Obras Relacionadas
            </h2>
            <div className="space-y-2">
              {relationships.map((rel) => (
                <div key={rel.id} className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
                  <span className="text-white/70">{rel.relationship_type}</span>
                  <span className="text-white/30 mx-2">→</span>
                  <Link href={`/biblioteca/${rel.target_book_id}`} className="text-[#00D9FF] hover:underline">
                    {rel.target?.title || "Obra relacionada"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-white/30 border-t border-white/10 pt-4 mt-8">
          <p>ID: {book.id}</p>
          {book.drive_file_id && <p>Drive ID: {book.drive_file_id}</p>}
          {book.checksum && <p>Checksum: {book.checksum}</p>}
          {book.version && <p>Versión actual: {book.version}</p>}
          <p>Actualizado: {new Date(book.updated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
