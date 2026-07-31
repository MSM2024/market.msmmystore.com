import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const checks: Record<string, string> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "ELIANA — MSM & ZAFIRO",
    gemini: (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) ? "configured" : "not_configured",
  }

  return NextResponse.json(checks)
}
