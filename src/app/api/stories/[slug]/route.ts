import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { z } from "zod"

const storyPutSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().max(500_000).optional(),
  summary: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  privacy: z.enum(["solo_yo", "familia", "equipo", "comunidad", "publica"]).optional(),
  status: z.enum(["borrador", "publicada", "archivada"]).optional(),
  event_date: z.string().max(50).optional(),
  location: z.string().max(300).optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ story: null, error: "Unavailable" }, { status: 503 })

    const { data: story, error } = await supabase
      .from("stories")
      .select("*, story_media(*), story_tags(*), story_people(*), story_versions(*)")
      .eq("slug", slug)
      .single()

    if (error || !story) {
      return NextResponse.json({ story: null, error: "Historia no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ story })
  } catch {
    return NextResponse.json({ story: null, error: "Error al cargar la historia" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

    const existing = await supabase.from("stories").select("id, owner_id").eq("slug", slug).single()
    if (existing.error || !existing.data) {
      return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
    }
    if (existing.data.owner_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para editar esta historia" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const parsed = storyPutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de historia inválidos", issues: parsed.error.issues }, { status: 400 })
    }

    const data = parsed.data
    const update: Record<string, unknown> = {}
    if (data.title !== undefined) update.title = data.title.trim()
    if (data.content !== undefined) update.content = data.content
    if (data.summary !== undefined) update.summary = data.summary
    if (data.category !== undefined) update.category = data.category
    if (data.privacy !== undefined) update.privacy = data.privacy
    if (data.status !== undefined) {
      update.status = data.status
      if (data.status === "publicada") update.published_at = new Date().toISOString()
    }
    if (data.event_date !== undefined) update.event_date = data.event_date
    if (data.location !== undefined) update.location = data.location

    const { data: story, error } = await supabase
      .from("stories")
      .update(update)
      .eq("id", existing.data.id)
      .select("*, story_media(*), story_tags(*), story_people(*)")
      .single()

    if (error) throw error
    return NextResponse.json({ story })
  } catch (err) {
    console.error("STORIES_PUT_ERROR", err)
    return NextResponse.json({ error: "Error al actualizar la historia" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

    const existing = await supabase.from("stories").select("id, owner_id").eq("slug", slug).single()
    if (existing.error || !existing.data) {
      return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
    }
    if (existing.data.owner_id !== user.id) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta historia" }, { status: 403 })
    }

    const { error } = await supabase.from("stories").delete().eq("id", existing.data.id)
    if (error) throw error
    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error("STORIES_DELETE_ERROR", err)
    return NextResponse.json({ error: "Error al eliminar la historia" }, { status: 500 })
  }
}
