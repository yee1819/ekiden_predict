import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    const teamIdParam = searchParams.get("teamId")
    const teamId = teamIdParam ? Number(teamIdParam) : undefined
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })

    const where: any = { Ekiden_thId: ekidenThId }
    if (teamId) where.Ekiden_no_teamId = teamId

    const rows = await (prisma as any).ekiden_Predict_Like.groupBy({ by: ["batchId"], where, _count: { batchId: true } })
    const map: Record<string, number> = {}
    for (const r of rows) map[r.batchId] = (r as any)._count?.batchId ?? 0
    return NextResponse.json({ likes: map })
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ekidenThId: number | undefined = body.ekidenThId
    const teamId: number | undefined = body.teamId
    const batchId: string | undefined = body.batchId
    const fingerprint: string | undefined = body.fingerprint
    if (!ekidenThId) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })
    if (!teamId) return NextResponse.json({ error: "missing teamId" }, { status: 400 })
    if (!batchId) return NextResponse.json({ error: "missing batchId" }, { status: 400 })
    if (!fingerprint) return NextResponse.json({ error: "missing fingerprint" }, { status: 400 })

    try {
      await (prisma as any).ekiden_Predict_Like.create({ data: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: teamId, batchId, fingerprint } })
    } catch (e: any) {
      const msg = String(e?.message || "")
      if (msg.includes("Unique constraint") || msg.includes("Unique") || msg.includes("duplicate")) {
        const cnt = await (prisma as any).ekiden_Predict_Like.count({ where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: teamId, batchId } })
        return NextResponse.json({ ok: true, alreadyLiked: true, count: cnt })
      }
      return NextResponse.json({ error: "server_error" }, { status: 500 })
    }
    const count = await (prisma as any).ekiden_Predict_Like.count({ where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: teamId, batchId } })
    return NextResponse.json({ ok: true, alreadyLiked: false, count })
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
