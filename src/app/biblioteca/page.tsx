"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BookOpen, Search, Filter, Sparkles, Layers, Users, MapPin } from "lucide-react"

interface Book {
  id: string
  title: string
  author: string
  series?: string
  volume_number?: number
  summary?: string
  status: string
  privacy_level: string
  tags: string[]
  created_at: string
}

const COLLECTIONS = [
  { id: "identidad", name: "Identidad y Autobiografía", icon: "👤" },
  { id: "yo-soy", name: "Yo Soy y Palabra", icon: "💬" },
  { id: "fe", name: "Fe y Espiritualidad", icon: "🙏" },
  { id: "suenos", name: "Sueños y Conciencia", icon: "💫" },
  { id: "abundancia", name: "Abundancia y Mentalidad", icon: "💰" },
  { id: "familia", name: "Familia e Historias", icon: "🏠" },
  { id: "ciencia", name: "Ciencia, Tecnología y Futuro", icon: "🔬" },
  { id: "msm", name: "MSM y Emprendimiento", icon: "🏢" },
  { id: "elevacion", name: "Elevación Consciente", icon: "✨" },
  { id: "guiones", name: "Guiones y Obras Creativas", icon: "🎬" },
]

export default function BibliotecaPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCollection, setSelectedCollection] = useState("")

  useEffect(() => {
    Promise.resolve().then(() => setLoading(true))
    const params = new URLSearchParams({ limit: "100" })
    if (search) params.set("q", search)

    fetch(`/api/biblioteca/books?${params}`)
      .then(r => r.json())
      .then(data => {
        setBooks(data.books || [])
      })
      .catch(() => setBooks([]))
      .finally(() => setLoading(false))
  }, [search])

  const filtered = selectedCollection
    ? books.filter(b => b.tags?.some(t => t.includes(selectedCollection)))
    : books

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-[#00D9FF]" />
          <h1 className="text-3xl font-bold">Biblioteca Viva de Don Miguel</h1>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar en la biblioteca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          <button
            onClick={() => setSelectedCollection("")}
            className={`px-3 py-2 rounded-xl text-sm transition-colors ${
              !selectedCollection ? "bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40" : "bg-white/10 text-white/70 border border-white/10"
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Todas
          </button>
          {COLLECTIONS.map(col => (
            <button
              key={col.id}
              onClick={() => setSelectedCollection(col.id === selectedCollection ? "" : col.id)}
              className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                selectedCollection === col.id ? "bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/40" : "bg-white/10 text-white/70 border border-white/10"
              }`}
            >
              <span className="mr-1">{col.icon}</span>
              {col.name.split(" ")[0]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-white/50 py-12">Cargando biblioteca...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white/50 py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No se encontraron obras en esta colección</p>
            <p className="text-sm mt-2">Las obras se importarán desde Google Drive</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(book => (
              <Link
                key={book.id}
                href={`/biblioteca/${book.id}`}
                className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#00D9FF]/40 transition-colors"
              >
                <h3 className="font-semibold text-lg mb-1">{book.title}</h3>
                <p className="text-sm text-white/50 mb-2">{book.author}</p>
                {book.series && (
                  <p className="text-xs text-[#00D9FF]/70 mb-2">
                    <Layers className="w-3 h-3 inline mr-1" />
                    {book.series}{book.volume_number ? ` · Tomo ${book.volume_number}` : ""}
                  </p>
                )}
                {book.summary && (
                  <p className="text-sm text-white/60 line-clamp-2">{book.summary}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {book.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-white/10 text-white/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
