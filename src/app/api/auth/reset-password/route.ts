import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 10, windowMs: 60_000, keyPrefix: "reset-password" })
    if (limited) return limited

    const body = await request.json()
    const { password, accessToken, refreshToken } = body || {}

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 8 caracteres." },
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

    if (accessToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || "",
      })
      if (sessionError) {
        return NextResponse.json(
          { success: false, message: "El enlace de recuperación ha expirado. Solicita uno nuevo." },
          { status: 401 }
        )
      }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: "El enlace de recuperación ha expirado. Solicita uno nuevo." },
        { status: 401 }
      )
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error("PASSWORD_UPDATE_FAILED", { message: error.message })
      return NextResponse.json(
        { success: false, message: "No pudimos actualizar la contraseña. Inténtalo de nuevo." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente." })
  } catch (error) {
    console.error("PASSWORD_UPDATE_FAILED", {
      message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    })
    return NextResponse.json(
      { success: false, message: "No pudimos procesar la solicitud. Inténtalo nuevamente." },
      { status: 500 }
    )
  }
}
