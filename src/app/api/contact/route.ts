import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase-admin"
import { rateLimitByIp } from "@/lib/rate-limit"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  subject: z.string().max(200).optional(),
  message: z.string().min(1).max(5000),
})

export async function POST(request: Request) {
  try {
    const limited = rateLimitByIp(request, { max: 10, windowMs: 60_000, keyPrefix: "contact" })
    if (limited) return limited

    const body = await request.json().catch(() => null)
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de contacto inválidos" }, { status: 400 })
    }
    const { name, email, subject, message } = parsed.data

    const admin = getSupabaseAdminClient()
    if (!admin) {
      return NextResponse.json(
        { error: "El servicio de contacto no está disponible: Supabase no está configurado." },
        { status: 503 }
      )
    }
    const { error } = await admin.from("contact_messages").insert({
      name,
      email,
      subject: subject || "Sin asunto",
      message,
      created_at: new Date().toISOString(),
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al enviar mensaje"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
