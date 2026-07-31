import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Nombre, email y mensaje son requeridos" }, { status: 400 })
    }

    const admin = getSupabaseAdminClient()
    if (admin) {
      const { error } = await admin.from("contact_messages").insert({
        name,
        email,
        subject: subject || "Sin asunto",
        message,
        created_at: new Date().toISOString(),
      })
      if (error) throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar mensaje"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
