import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ stories: [], error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const privacy = searchParams.get("privacy")
    const category = searchParams.get("category")
    const search = searchParams.get("q")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const offset = (page - 1) * limit
    const isPublic = searchParams.get("public") === "true"

    let query = supabase
      .from("stories")
      .select("*, story_media(*), story_tags(*), story_people(*)", { count: "exact" })

    if (isPublic) {
      query = query.in("status", ["publicada"]).in("privacy", ["publica", "comunidad"])
    } else if (user) {
      query = query.or(`owner_id.eq.${user.id},and(status.eq.publicada,privacy.in.(publica,comunidad))`)
    } else {
      query = query.in("status", ["publicada"]).in("privacy", ["publica", "comunidad"])
    }

    if (status) query = query.eq("status", status)
    if (privacy) query = query.eq("privacy", privacy)
    if (category) query = query.eq("category", category)
    if (search) query = query.ilike("title", `%${search}%`)

    const { data: stories, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return NextResponse.json({ stories, total: count, page, limit })
  } catch (err) {
    console.error("STORIES_GET_ERROR", err)
    return NextResponse.json({ stories: [], error: "Error al cargar historias" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "stories" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

    const body = await request.json()
    const storySchema = z.object({
      title: z.string().min(2).max(200),
      content: z.string().max(200000).optional(),
      summary: z.string().max(2000).optional(),
      category: z.string().max(100).optional(),
      privacy: z.enum(["publica", "comunidad", "familia", "solo_yo"]).optional(),
      status: z.enum(["borrador", "publicada", "archivada"]).optional(),
      event_date: z.string().nullable().optional(),
      location: z.string().max(300).optional(),
    })
    const parsed = storySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "El título debe tener al menos 2 caracteres" }, { status: 400 })
    }
    const { title, content, summary, category, privacy, status, event_date, location } = parsed.data

    const baseSlug = slugify(title)
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        owner_id: user.id,
        title: title.trim(),
        slug: uniqueSlug,
        content: content || "",
        summary: summary || "",
        category: category || "general",
        privacy: privacy || "solo_yo",
        status: status || "borrador",
        event_date: event_date || null,
        location: location || "",
        published_at: status === "publicada" ? new Date().toISOString() : null,
      })
      .select("*, story_media(*), story_tags(*), story_people(*)")
      .single()

    if (error) throw error
    return NextResponse.json({ story })
  } catch (err) {
    console.error("STORIES_POST_ERROR", err)
    return NextResponse.json({ error: "Error al crear la historia" }, { status: 500 })
  }
}
