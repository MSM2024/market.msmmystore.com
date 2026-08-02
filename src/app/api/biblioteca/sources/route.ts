import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"
import { writeAuditLog } from "@/lib/audit"
import { z } from "zod"

const sourceSchema = z.object({
  source_type: z.enum(["google_drive", "manual", "upload", "import"]),
  drive_folder_id: z.string().max(300).optional(),
  drive_folder_name: z.string().max(300).optional(),
  name: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  last_synced_at: z.string().max(100).optional(),
  sync_status: z.string().max(100).optional(),
  error_message: z.string().max(1000).optional(),
})

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const repo = new BibliotecaRepository(supabase)
  const sources = await repo.getSources()
  return NextResponse.json({ sources })
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  const supabase = await getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

  const body = await request.json().catch(() => null)
  const parsed = sourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos de fuente inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const repo = new BibliotecaRepository(supabase)
  const source = await repo.createSource({
    ...parsed.data,
    config: parsed.data.config ?? {},
    sync_status: parsed.data.sync_status ?? "pending",
  })
  if (!source) return NextResponse.json({ error: "Failed to create source" }, { status: 500 })

  await writeAuditLog({
    action: "biblioteca.source.create",
    resource: "library_sources",
    resource_type: "source",
    resource_id: source.id,
    new_value: { name: source.name, source_type: source.source_type },
    request,
    app_name: "zafiro",
  })

  return NextResponse.json(source, { status: 201 })
}
