import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"
import { checkInputSafety, checkOutputSafety } from "@/lib/knowledge"
import { getSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const slug = searchParams.get("slug")
    const status = searchParams.get("status") as "draft" | "review" | "published" | "archived" | "rejected" | null
    const doc_type = searchParams.get("doc_type")
    const visibility = searchParams.get("visibility")
    const source_id = searchParams.get("source_id")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const order_by = searchParams.get("order_by") || "created_at"
    const order = (searchParams.get("order") || "desc") as "asc" | "desc"

    if (id) {
      const doc = await knowledgeRepo.getDocument(id)
      if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })
      return NextResponse.json({ document: doc })
    }

    if (slug) {
      const doc = await knowledgeRepo.getDocumentBySlug(slug)
      if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })
      return NextResponse.json({ document: doc })
    }

    const result = await knowledgeRepo.listDocuments({
      status: (status || undefined) as "draft" | "review" | "published" | "archived" | "rejected" | undefined,
      doc_type: doc_type || undefined,
      visibility: visibility || undefined,
      source_id: source_id || undefined,
      limit,
      offset,
      order_by,
      order,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const safety = checkInputSafety(JSON.stringify(body))
    if (safety.blocked) {
      return NextResponse.json({ error: safety.reason }, { status: 400 })
    }

    if (!body.title || !body.content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const doc = await knowledgeRepo.createDocument({
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      doc_type: body.doc_type || "reference",
      status: body.status || "draft",
      visibility: body.visibility || "internal",
      content: body.content,
      summary: body.summary,
      language: body.language || "es",
      metadata: body.metadata || {},
      priority: body.priority || 0,
      source_id: body.source_id,
      created_by: user.id,
      updated_by: user.id,
    })

    if (!doc) {
      return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
    }

    await knowledgeRepo.logAudit({
      action: "create",
      resource_type: "document",
      resource_id: doc.id,
      resource_title: doc.title,
      new_value: { title: doc.title, status: doc.status },
    })

    return NextResponse.json({ document: doc }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const existing = await knowledgeRepo.getDocument(id)
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const doc = await knowledgeRepo.updateDocument(id, {
      ...updates,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    if (!doc) {
      return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
    }

    await knowledgeRepo.logAudit({
      action: "update",
      resource_type: "document",
      resource_id: id,
      resource_title: doc.title,
      previous_value: { status: existing.status },
      new_value: { status: doc.status },
    })

    return NextResponse.json({ document: doc })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const existing = await knowledgeRepo.getDocument(id)
    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const deleted = await knowledgeRepo.deleteDocument(id)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    await knowledgeRepo.logAudit({
      action: "delete",
      resource_type: "document",
      resource_id: id,
      resource_title: existing.title,
      previous_value: { title: existing.title, status: existing.status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
