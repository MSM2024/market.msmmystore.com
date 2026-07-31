import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"
import { searchFallbackBooks, FALLBACK_BOOKS, isSupabaseAvailable } from "@/lib/biblioteca/fallback"
import type { LibraryBookStatus, LibraryPrivacyLevel } from "@/lib/biblioteca/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const series = searchParams.get("series")
  const limit = parseInt(searchParams.get("limit") || "50")
  const q = searchParams.get("q")

  const useDb = isSupabaseAvailable()

  if (!useDb) {
    if (q) {
      const books = searchFallbackBooks(q)
      return NextResponse.json({ books, total: books.length })
    }
    let books = FALLBACK_BOOKS
    if (series) books = books.filter(b => b.series?.toLowerCase() === series.toLowerCase())
    return NextResponse.json({ books: books.slice(0, limit), total: books.length })
  }

  try {
    if (q) {
      const results = await bibliotecaRepo.searchBooks({ query: q, limit })
      return NextResponse.json({ books: results.map(r => r.book), total: results.length })
    }

    const result = await bibliotecaRepo.listBooks({
      series: series || undefined,
      status: (searchParams.get("status") as LibraryBookStatus) || undefined,
      privacy_level: (searchParams.get("privacy") as LibraryPrivacyLevel) || undefined,
      limit,
      offset: parseInt(searchParams.get("offset") || "0"),
      order_by: "updated_at",
      order: "desc",
    })
    return NextResponse.json(result)
  } catch {
    if (q) {
      const books = searchFallbackBooks(q)
      return NextResponse.json({ books, total: books.length })
    }
    let books = FALLBACK_BOOKS
    if (series) books = books.filter(b => b.series?.toLowerCase() === series.toLowerCase())
    return NextResponse.json({ books: books.slice(0, limit), total: books.length })
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible. Aplica la migración primero." }, { status: 503 })
  }
  try {
    const body = await request.json()
    const book = await bibliotecaRepo.createBook(body)
    if (!book) return NextResponse.json({ error: "Failed to create book" }, { status: 500 })
    return NextResponse.json(book, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}
