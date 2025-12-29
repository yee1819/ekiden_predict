import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const mdl: any = (prisma as any).ekiden_Starter_List
  if (!mdl || typeof mdl.upsert !== "function") {
    return NextResponse.json({ error: "PrismaClient未包含Ekiden_Starter_List，请先生成客户端并同步数据库：npm run postinstall、npm run db:push（或 prisma generate / prisma migrate:deploy）" }, { status: 500 })
  }
  const data = await req.json()
  const team = await prisma.ekiden_no_team.findUnique({ where: { id: Number(data.Ekiden_no_teamId) }, include: { Ekiden_th: true } })
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 400 })
  const th = team.Ekiden_th
  const entries: Array<{ Ekiden_th_intervalId?: number, ekiden_intervalId?: number, studentId: number }> = Array.isArray(data.entries) ? data.entries : []
  if (entries.length === 0) return NextResponse.json({ error: "empty entries" }, { status: 400 })
  const thIntervalRows = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: th.id }, select: { id: true, ekiden_intervalId: true } })
  const validThIds = new Set(thIntervalRows.map(x => x.id))
  const thByBase = new Map(thIntervalRows.map(x => [x.ekiden_intervalId, x.id]))
  const prepared: Array<{ intervalId: number, studentId: number }> = []
  for (const e of entries) {
    let thIntervalId: number | undefined = e.Ekiden_th_intervalId != null ? Number(e.Ekiden_th_intervalId) : undefined
    const baseId: number | undefined = e.ekiden_intervalId != null ? Number(e.ekiden_intervalId) : undefined
    if (thIntervalId == null && baseId != null) {
      const existing = thByBase.get(baseId)
      if (existing != null) thIntervalId = existing
      else {
        const created = await prisma.ekiden_th_interval.create({ data: { Ekiden_thId: th.id, ekiden_intervalId: baseId }, select: { id: true } })
        thIntervalId = created.id
        thByBase.set(baseId, thIntervalId)
        validThIds.add(thIntervalId)
      }
    }
    if (thIntervalId == null || !validThIds.has(thIntervalId)) return NextResponse.json({ error: `interval not in edition` }, { status: 400 })
    const s = await prisma.student.findUnique({ where: { id: Number(e.studentId) } })
    if (!s) return NextResponse.json({ error: `student ${e.studentId} not found` }, { status: 400 })
    if (s.schoolId !== team.schoolId) return NextResponse.json({ error: `student ${e.studentId} not in team school` }, { status: 400 })
    prepared.push({ intervalId: thIntervalId, studentId: Number(e.studentId) })
  }
  try {
    const batchSize = 20
    let total = 0
    for (let i = 0; i < prepared.length; i += batchSize) {
      const batch = prepared.slice(i, i + batchSize)
      const res = await prisma.$transaction(async (tx) => {
        return Promise.all(batch.map(e => (tx as any).ekiden_Starter_List.upsert({
          where: { Ekiden_th_intervalId_Ekiden_no_teamId: { Ekiden_th_intervalId: e.intervalId, Ekiden_no_teamId: team.id } },
          update: { studentId: e.studentId },
          create: { Ekiden_th_intervalId: e.intervalId, Ekiden_no_teamId: team.id, Ekiden_thId: th.id, studentId: e.studentId }
        })))
      }, { timeout: 30000 })
      total += res.length
    }
    return NextResponse.json({ upserted: total })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "bulk create failed" }, { status: 400 })
  }
}
