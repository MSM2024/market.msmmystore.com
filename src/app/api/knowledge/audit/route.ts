import { NextRequest, NextResponse } from "next/server"
import { knowledgeRepo } from "@/lib/knowledge"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "knowledge-audit" })
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const action = searchParams.get("action") || undefined
    const resource_type = searchParams.get("resource_type") || undefined

    const logs = await knowledgeRepo.getAuditLogs({
      limit,
      action,
      resource_type,
    })

    return NextResponse.json({
      logs,
      total: logs.length,
    })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "knowledge-audit" })
    if (limited) return limited

    const body = await request.json()
    const { action, resource_type, resource_id, resource_title, previous_value, new_value, metadata } = body

    if (!action || !resource_type) {
      return NextResponse.json({ error: "Action and resource type are required" }, { status: 400 })
    }

    const log = await knowledgeRepo.logAudit({
      action,
      resource_type,
      resource_id,
      resource_title,
      previous_value,
      new_value,
      metadata: metadata || {},
    })

    if (!log) {
      return NextResponse.json({ error: "Failed to log audit entry" }, { status: 500 })
    }

    return NextResponse.json({ log }, { status: 201 })
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
