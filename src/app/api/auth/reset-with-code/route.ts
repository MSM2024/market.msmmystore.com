import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { code, password } = await request.json()

    if (!code || code.length < 6) {
      return NextResponse.json({ success: false, error: "Código inválido" }, { status: 400 })
    }

    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json({ success: false, error: "La contraseña debe tener al menos 8 caracteres, una mayúscula y un número." }, { status: 400 })
    }

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

    const validateRes = await fetch(`${supabaseUrl}/rest/v1/rpc/validate_recovery_code`, {
      method: "POST",
      headers,
      body: JSON.stringify({ p_code: code }),
    })

    if (!validateRes.ok) {
      const errText = await validateRes.text()
      console.error("VALIDATE_CODE_ERROR", validateRes.status, errText)
      return NextResponse.json({ success: false, error: "Código inválido o expirado" }, { status: 400 })
    }

    const userId = await validateRes.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Código inválido o expirado" }, { status: 400 })
    }

    // Update password via Supabase Admin API
    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "apikey": supabaseAnonKey,
      "Authorization": `Bearer ${serviceRoleKey && serviceRoleKey !== "PENDIENTE" ? serviceRoleKey : supabaseAnonKey}`,
    }

    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ password }),
    })

    if (!updateRes.ok) {
      return NextResponse.json({ success: false, error: "Error al actualizar la contraseña" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión." })
  } catch (err) {
    console.error("RESET_WITH_CODE_ERROR", err)
    return NextResponse.json({ success: false, error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
