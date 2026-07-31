import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"

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

    const body = await request.json()
    const update: Record<string, unknown> = {}
    if (body.title !== undefined) update.title = body.title.trim()
    if (body.content !== undefined) update.content = body.content
    if (body.summary !== undefined) update.summary = body.summary
    if (body.category !== undefined) update.category = body.category
    if (body.privacy !== undefined) update.privacy = body.privacy
    if (body.status !== undefined) {
      update.status = body.status
      if (body.status === "publicada") update.published_at = new Date().toISOString()
    }
    if (body.event_date !== undefined) update.event_date = body.event_date
    if (body.location !== undefined) update.location = body.location

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
