import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo, knowledgeIngestion } from "@/lib/knowledge"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"
import type { KnowledgeApproval } from "@/lib/knowledge/types"

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 20, windowMs: 60_000, keyPrefix: "knowledge-approvals" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const approvals = await knowledgeRepo.listApprovals()
    return NextResponse.json({
      approvals,
      total: approvals.length,
      pending: approvals.filter((a: KnowledgeApproval) => a.status === "pending").length,
    })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 20, windowMs: 60_000, keyPrefix: "knowledge-approvals" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { document_id, version_number } = body

    if (!document_id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
    }

    const doc = await knowledgeRepo.getDocument(document_id)
    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const approval = await knowledgeRepo.createApproval({
      document_id,
      version_number,
      status: "pending",
    })

    if (!approval) {
      return NextResponse.json({ error: "Failed to create approval" }, { status: 500 })
    }

    await knowledgeRepo.updateDocument(document_id, { status: "review" })

    await knowledgeRepo.logAudit({
      action: "request_approval",
      resource_type: "document",
      resource_id: document_id,
      resource_title: doc.title,
    })

    return NextResponse.json({ approval }, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 20, windowMs: 60_000, keyPrefix: "knowledge-approvals" })
    if (limited) return limited

    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { id, status, review_notes } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 })
    }

    const validStatuses = ["approved", "rejected", "revision_needed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const approval = await knowledgeRepo.updateApproval(id, {
      status,
      review_notes,
      reviewed_at: new Date().toISOString(),
    })

    if (!approval) {
      return NextResponse.json({ error: "Failed to update approval" }, { status: 500 })
    }

    if (status === "approved") {
      await knowledgeIngestion.publishDocument(approval.document_id)
    } else if (status === "rejected") {
      await knowledgeRepo.updateDocument(approval.document_id, { status: "rejected" })
    }

    await knowledgeRepo.logAudit({
      action: `approval_${status}`,
      resource_type: "document",
      resource_id: approval.document_id,
      new_value: { status, review_notes },
    })

    return NextResponse.json({ approval })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
