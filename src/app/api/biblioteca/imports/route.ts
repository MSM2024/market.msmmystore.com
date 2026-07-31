import { NextResponse } from "next/server"
import { BibliotecaRepository } from "@/lib/biblioteca"
import { isSupabaseAvailable } from "@/lib/biblioteca/fallback"
import { getSupabaseServerClient } from "@/lib/supabase-server"
import { requireOwner } from "@/lib/api-auth"

export async function GET() {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  if (!isSupabaseAvailable()) {
    return NextResponse.json({ jobs: [] })
  }
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ jobs: [] })

    const repo = new BibliotecaRepository(supabase)
    const jobs = await repo.listJobs()
    return NextResponse.json({ jobs })
  } catch {
    return NextResponse.json({ jobs: [] })
  }
}

export async function POST(request: Request) {
  const auth = await requireOwner()
  if (!auth.ok) return auth.response

  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
  try {
    const supabase = await getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })

    const repo = new BibliotecaRepository(supabase)
    const body = await request.json()
    const job = await repo.createJob(body)
    if (!job) return NextResponse.json({ error: "Failed" }, { status: 500 })
    return NextResponse.json(job, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}
