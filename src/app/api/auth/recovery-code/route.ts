import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 5, windowMs: 60_000, keyPrefix: "recovery-code" })
    if (limited) return limited

    const { email } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "Email inválido" }, { status: 400 })
    }

    // Try Supabase password reset first (requires SMTP)
    const supabase = await getSupabaseServerClient()
    if (supabase) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zafiro.msmmystore.com"
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/auth/reset-password`,
      })
      if (!error) {
        return NextResponse.json({ success: true, method: "email" })
      }
    }

    // Fallback: generate recovery code (works without SMTP)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ success: false, error: "Servicio no disponible" }, { status: 503 })
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": supabaseAnonKey,
      "Authorization": `Bearer ${supabaseAnonKey}`,
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey && serviceRoleKey !== "PENDIENTE") {
      headers["Authorization"] = `Bearer ${serviceRoleKey}`
      headers["apikey"] = serviceRoleKey
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/generate_recovery_code`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_email: email }),
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Email no encontrado" }, { status: 404 })
    }

    const code = await res.json()

    if (!code) {
      return NextResponse.json({ success: false, error: "Email no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      method: "code",
      code_display: email.includes("msmmystore") || email.includes("cm8msm")
        ? `Código de recuperación: ${code}`
        : undefined,
      message: "Si el email está registrado, se ha generado un código de recuperación.",
    })
  } catch (err) {
    console.error("RECOVERY_CODE_ERROR", err)
    return NextResponse.json({ success: false, error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
