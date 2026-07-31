import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { searchFallbackBooks, FALLBACK_BOOKS, isSupabaseAvailable } from "@/lib/biblioteca/fallback"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"
import type { LibraryBookStatus, LibraryPrivacyLevel } from "@/lib/biblioteca/types"

export async function GET(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const series = searchParams.get("series")
  const limit = parseInt(searchParams.get("limit") || "50")
  const q = searchParams.get("q")

  if (!isSupabaseAvailable()) {
    if (q) {
      const books = searchFallbackBooks(q)
      return NextResponse.json({ books, total: books.length })
    }
    let books = FALLBACK_BOOKS
    if (series) books = books.filter(b => b.series?.toLowerCase() === series.toLowerCase())
    return NextResponse.json({ books: books.slice(0, limit), total: books.length })
  }

  const supabase = await getSupabaseServerClient()
  if (!supabase) {
    if (q) {
      const books = searchFallbackBooks(q)
      return NextResponse.json({ books, total: books.length })
    }
    let books = FALLBACK_BOOKS
    if (series) books = books.filter(b => b.series?.toLowerCase() === series.toLowerCase())
    return NextResponse.json({ books: books.slice(0, limit), total: books.length })
  }

  try {
    const repo = new BibliotecaRepository(supabase)
    if (q) {
      const results = await repo.searchBooks({ query: q, limit })
      return NextResponse.json({ books: results.map(r => r.book), total: results.length })
    }

    const result = await repo.listBooks({
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
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible. Aplica la migración primero." }, { status: 503 })
  }
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

    const repo = new BibliotecaRepository(supabase)
    const body = await request.json()
    const book = await repo.createBook(body)
    if (!book) return NextResponse.json({ error: "Failed to create book" }, { status: 500 })
    return NextResponse.json(book, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}
