import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { isUsableApiKey } from "@/lib/eliana/provider"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const limited = rateLimitByIp(request, { max: 30, windowMs: 60_000, keyPrefix: "eliana-health" })
  if (limited) return limited

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
