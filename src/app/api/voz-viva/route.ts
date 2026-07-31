import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ notes: [] }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ notes: [] })

    const { data } = await supabase
      .from("stories")
      .select("id, title, content, summary, category, status, privacy, created_at, updated_at, story_tags(tag)")
      .eq("owner_id", user.id)
      .eq("category", "voz-viva")
      .order("created_at", { ascending: false })

    return NextResponse.json({ notes: data || [] })
  } catch {
    return NextResponse.json({ notes: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

    const body = await request.json()
    const { content, title, classification, visibility } = body

    if (!content || content.trim().length < 3) {
      return NextResponse.json({ error: "El contenido debe tener al menos 3 caracteres" }, { status: 400 })
    }

    const noteTitle = title || `Voz Viva - ${new Date().toLocaleDateString("es-MX")}`
    const privacyMap: Record<string, string> = {
      privado: "solo_yo",
      publicar: "publica",
      recuerdo: "solo_yo",
      enseñanza: "comunidad",
      proyecto: "equipo",
    }

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        owner_id: user.id,
        title: noteTitle,
        content: content.trim(),
        summary: classification || "",
        category: "voz-viva",
        privacy: privacyMap[visibility] || "solo_yo",
        status: visibility === "publicar" ? "publicada" : "borrador",
        published_at: visibility === "publicar" ? new Date().toISOString() : null,
      })
      .select("id, title, slug, created_at")
      .single()

    if (error) throw error
    return NextResponse.json({ note: story })
  } catch (err) {
    console.error("VOZ_VIVA_POST_ERROR", err)
    return NextResponse.json({ error: "Error al guardar la nota de voz" }, { status: 500 })
  }
}
