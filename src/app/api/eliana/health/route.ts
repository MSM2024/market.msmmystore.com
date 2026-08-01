import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { isUsableApiKey } from "@/lib/eliana/provider"

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response

  const checks: Record<string, string> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "ELIANA — MSM & ZAFIRO",
    gemini: (isUsableApiKey(process.env.GEMINI_API_KEY) || isUsableApiKey(process.env.GOOGLE_API_KEY)) ? "configured" : "not_configured",
  }

  return NextResponse.json(checks)
}
