import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"
import { isSupabaseAvailable } from "@/lib/biblioteca/fallback"

export async function GET() {
  if (!isSupabaseAvailable()) {
    return NextResponse.json({ jobs: [] })
  }
  try {
    const jobs = await bibliotecaRepo.listJobs()
    return NextResponse.json({ jobs })
  } catch {
    return NextResponse.json({ jobs: [] })
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAvailable()) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
  try {
    const body = await request.json()
    const job = await bibliotecaRepo.createJob(body)
    if (!job) return NextResponse.json({ error: "Failed" }, { status: 500 })
    return NextResponse.json(job, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 503 })
  }
}
