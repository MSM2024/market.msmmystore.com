import { NextResponse } from "next/server"

export async function GET() {
  const checks: Record<string, string> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "ELIANA — MSM & ZAFIRO",
    gemini: (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) ? "configured" : "not_configured",
  }

  return NextResponse.json(checks)
}
