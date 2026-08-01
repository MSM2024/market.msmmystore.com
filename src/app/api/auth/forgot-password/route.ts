import { NextResponse } from "next/server"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 5, windowMs: 60_000, keyPrefix: "forgot-password" })
    if (limited) return limited

    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Correo electrónico inválido" },
        { status: 400 }
      )
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const rawAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const rawPub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const isInvalid = (v?: string) => !v || (v.startsWith("[") && v.endsWith("]")) || v === "your-anon-key-here" || v === "https://your-project.supabase.co"
    const supabaseUrl = isInvalid(rawUrl) ? undefined : rawUrl
    const supabaseAnonKey = isInvalid(rawAnon) ? (isInvalid(rawPub) ? undefined : rawPub) : rawAnon

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, message: "El servicio de autenticación no está disponible en este momento." },
        { status: 503 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zafiro.msmmystore.com"

    // Try Supabase Auth REST API to send recovery email
    const res = await fetch(`${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(`${appUrl}/auth/reset-password`)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
      },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      return NextResponse.json({
        success: true,
        message: "Si existe una cuenta asociada a este correo recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.",
      })
    }

    console.error("PASSWORD_RESET_REQUEST_FAILED", { status: res.status, email })

    if (res.status === 429) {
      // Try recovery code fallback
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey && serviceRoleKey !== "PENDIENTE") {
        try {
          const codeRes = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_recovery_code`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": serviceRoleKey,
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ p_email: email }),
          })
          if (codeRes.ok) {
            const code = await codeRes.json()
            if (code) {
              return NextResponse.json({
                success: true,
                code_display: `Código de recuperación: ${code}`,
                message: "El servicio de correo está temporalmente limitado. Usa el código de recuperación.",
              })
            }
          }
        } catch { /* fallback silently */ }
      }

      return NextResponse.json({
        success: false,
        message: "Has superado el límite de solicitudes. Espera 1 minuto e inténtalo de nuevo, o usa el código de recuperación si tu cuenta tiene uno.",
        retryAfter: 60,
      }, { status: 429 })
    }

    // Other errors: return generic success (don't reveal user existence)
    return NextResponse.json({
      success: true,
      message: "Si existe una cuenta asociada a este correo recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.",
    })
  } catch (error) {
    console.error("PASSWORD_RESET_REQUEST_FAILED", {
      message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    })

    return NextResponse.json(
      { success: false, message: "No pudimos procesar la solicitud en este momento. Inténtalo nuevamente." },
      { status: 500 }
    )
  }
}
