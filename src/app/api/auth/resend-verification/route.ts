import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 5, windowMs: 60_000, keyPrefix: "resend-verification" })
    if (limited) return limited

    const { email } = await request.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Correo electrónico inválido" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: "Servicio no disponible temporalmente." },
        { status: 503 }
      )
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    })

    if (error) {
      console.error("RESEND_VERIFICATION_FAILED", { message: error.message })
      return NextResponse.json(
        { success: false, message: "No pudimos reenviar el correo. Inténtalo de nuevo." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Correo reenviado. Revisa tu bandeja de entrada." })
  } catch (error) {
    console.error("RESEND_VERIFICATION_FAILED", {
      message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    })
    return NextResponse.json(
      { success: false, message: "No pudimos procesar la solicitud. Inténtalo nuevamente." },
      { status: 500 }
    )
  }
}
