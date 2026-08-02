import { NextResponse } from "next/server"
import { rateLimitByIp } from "@/lib/rate-limit"

const PASSWORD_RULES = /^(?=.*[A-Z])(?=.*\d).{8,}$/

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 5, windowMs: 60_000, keyPrefix: "auth-register" })
    if (limited) {
      return NextResponse.json(
        { success: false, code: "RATE_LIMITED", message: "Has realizado varios intentos. Espera unos minutos antes de intentar de nuevo." },
        { status: 429 }
      )
    }

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, code: "INVALID_JSON", message: "Solicitud inválida. Verifica los datos e inténtalo de nuevo." },
        { status: 400 }
      )
    }

    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    const termsAccepted = body?.termsAccepted
    const referralCode = body?.referralCode ? String(body.referralCode).trim() : ""

    if (!name || name.length < 2) {
      return NextResponse.json(
        { success: false, code: "INVALID_NAME", message: "El nombre de usuario debe tener al menos 2 caracteres." },
        { status: 400 }
      )
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, code: "INVALID_EMAIL", message: "El correo electrónico no es válido." },
        { status: 400 }
      )
    }

    if (!password || !PASSWORD_RULES.test(password)) {
      return NextResponse.json(
        { success: false, code: "INVALID_PASSWORD", message: "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número." },
        { status: 400 }
      )
    }

    if (termsAccepted !== true) {
      return NextResponse.json(
        { success: false, code: "TERMS_REQUIRED", message: "Debes aceptar los términos y condiciones." },
        { status: 400 }
      )
    }

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const rawAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const rawPub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    const isInvalid = (v?: string) => !v || (v.startsWith("[") && v.endsWith("]")) || v === "your-anon-key-here" || v === "https://your-project.supabase.co"
    const supabaseUrl = isInvalid(rawUrl) ? undefined : rawUrl
    const supabaseAnonKey = isInvalid(rawAnon) ? (isInvalid(rawPub) ? undefined : rawPub) : rawAnon
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, code: "SERVICE_UNAVAILABLE", message: "No pudimos crear tu cuenta. Inténtalo nuevamente." },
        { status: 503 }
      )
    }

    const emailCheck = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(email)}&limit=1`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
    })

    if (emailCheck.ok) {
      const existing = await emailCheck.json()
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json(
          { success: false, code: "EMAIL_EXISTS", message: "Este correo ya está registrado." },
          { status: 409 }
        )
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zafiro.msmmystore.com"

    const signUpBody: Record<string, unknown> = {
      email,
      password,
      data: { name, full_name: name, referral_code: referralCode },
      redirect_to: `${appUrl}/auth/callback`,
      gotrue_meta_security: {},
    }

    const res = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(signUpBody),
    })

    const result = await res.json()

    if (!res.ok) {
      const msg = (result?.msg || result?.message || result?.error_description || result?.error || "").toLowerCase()

      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate") || res.status === 409) {
        return NextResponse.json(
          { success: false, code: "EMAIL_EXISTS", message: "Este correo ya está registrado." },
          { status: 409 }
        )
      }

      if (msg.includes("rate") || msg.includes("too many") || msg.includes("over") || res.status === 429) {
        return NextResponse.json(
          { success: false, code: "RATE_LIMITED", message: "Has realizado varios intentos. Espera unos minutos antes de intentar de nuevo." },
          { status: 429 }
        )
      }

      if (msg.includes("weak") || msg.includes("password") || res.status === 422) {
        return NextResponse.json(
          { success: false, code: "INVALID_PASSWORD", message: "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número." },
          { status: 422 }
        )
      }

      if (msg.includes("invalid") || msg.includes("email") || res.status === 400) {
        return NextResponse.json(
          { success: false, code: "INVALID_EMAIL", message: "El correo electrónico no es válido." },
          { status: 400 }
        )
      }

      console.error("REGISTER_ERROR", { status: res.status, message: result?.msg || result?.message || result?.error_description || "UNKNOWN_ERROR" })
      return NextResponse.json(
        { success: false, code: "SERVER_ERROR", message: "No pudimos crear tu cuenta. Inténtalo nuevamente." },
        { status: 500 }
      )
    }

    if (!result?.id) {
      return NextResponse.json(
        { success: false, code: "SERVER_ERROR", message: "No pudimos crear tu cuenta. Inténtalo nuevamente." },
        { status: 500 }
      )
    }

    // Auto-confirm if SMTP is not configured
    let isConfirmed = Boolean(result?.email_confirmed_at) || Boolean(result?.confirmed_at)
    if (!isConfirmed) {
      try {
        const confirmHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
        }

        // Try service role key first, then anon key
        if (serviceRoleKey && serviceRoleKey !== "PENDIENTE") {
          confirmHeaders["Authorization"] = `Bearer ${serviceRoleKey}`
          confirmHeaders["apikey"] = serviceRoleKey
        }

        const confirmRes = await fetch(`${supabaseUrl}/rest/v1/rpc/auto_confirm_user`, {
          method: "POST",
          headers: confirmHeaders,
          body: JSON.stringify({ p_user_id: result.id, p_email: email, p_name: name }),
        })

        if (confirmRes.ok) {
          const confirmed = await confirmRes.json()
          isConfirmed = confirmed === true
        }
      } catch (e) {
        console.error("AUTO_CONFIRM_ATTEMPT_FAILED", e)
      }
    }

    return NextResponse.json({
      success: true,
      code: "ACCOUNT_CREATED",
      message: isConfirmed
        ? "Cuenta creada correctamente. Ya puedes iniciar sesión."
        : "Cuenta creada. Te enviamos un enlace de verificación a tu correo. Si no llega, usa la opción de reenviar en /auth/verify.",
      userId: result.id,
      auto_confirmed: isConfirmed,
    })
  } catch (error) {
    console.error("REGISTER_ERROR", {
      message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    })
    return NextResponse.json(
      { success: false, code: "SERVER_ERROR", message: "No pudimos crear tu cuenta. Inténtalo nuevamente." },
      { status: 500 }
    )
  }
}
