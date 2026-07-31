import { NextResponse } from "next/server"
import { bibliotecaRepo } from "@/lib/biblioteca"

export async function GET() {
  const approvals = await bibliotecaRepo.listApprovals()
  return NextResponse.json({ approvals })
}

export async function POST(request: Request) {
  const body = await request.json()
  const approval = await bibliotecaRepo.createApproval(body)
  if (!approval) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json(approval, { status: 201 })
}
