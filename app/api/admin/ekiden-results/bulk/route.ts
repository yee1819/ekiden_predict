import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
function computeGrade(entryYear: number | null, year: number): "ONE" | "TWO" | "THREE" | "FOUR" {
  if (!entryYear) return "ONE"
  const gradeNum = year - entryYear + 1
  if (gradeNum <= 1) return "ONE"
  if (gradeNum === 2) return "TWO"
  if (gradeNum === 3) return "THREE"
  return "FOUR"
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const team = await prisma.ekiden_no_team.findUnique({ where: { id: Number(data.Ekiden_no_teamId) }, include: { Ekiden_th: true } })
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 400 })
  const th = team.Ekiden_th
  const entries: Array<{ Ekiden_th_intervalId: number, studentId: number, score: number, rank: number }> = Array.isArray(data.entries) ? data.entries : []
  if (entries.length === 0) return NextResponse.json({ error: "empty entries" }, { status: 400 })
  const thIntervalRows = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: th.id }, select: { id: true, ekiden_intervalId: true } })
  const validThIds = new Set(thIntervalRows.map(x => x.id))
  const thByBase = new Map(thIntervalRows.map(x => [x.ekiden_intervalId, x.id]))
  const prepared: Array<{ intervalId: number, studentId: number, score: number, rank: number, grade: "ONE" | "TWO" | "THREE" | "FOUR" }> = []
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
    prepared.push({ intervalId: thIntervalId, studentId: Number(e.studentId), score: Number(e.score), rank: Number(e.rank ?? 0), grade: computeGrade(s.entryYear ?? null, th.year) })
  }
  try {
    const created = await prisma.$transaction(prepared.map(e => prisma.student_ekiden_item.upsert({
      where: { Ekiden_th_intervalId_Ekiden_no_teamId: { Ekiden_th_intervalId: e.intervalId, Ekiden_no_teamId: team.id } },
      update: { score: e.score, rank: e.rank, studentId: e.studentId, grade: e.grade },
      create: { score: e.score, rank: e.rank, grade: e.grade, Ekiden_th_intervalId: e.intervalId, Ekiden_no_teamId: team.id, Ekiden_thId: th.id, studentId: e.studentId }
    })))
    return NextResponse.json({ upserted: created.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "bulk create failed" }, { status: 400 })
  }
}
export async function PATCH(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const team = await prisma.ekiden_no_team.findUnique({ where: { id: Number(data.Ekiden_no_teamId) }, include: { Ekiden_th: true } })
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 400 })
  const th = team.Ekiden_th
  const entries: Array<{ id?: number, Ekiden_th_intervalId?: number, ekiden_intervalId?: number, studentId: number, score: number, rank: number }> = Array.isArray(data.entries) ? data.entries : []
  if (entries.length === 0) return NextResponse.json({ error: "empty entries" }, { status: 400 })
  const thIntervalIds = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: th.id }, select: { id: true } })
  const validIds = new Set(thIntervalIds.map(x => x.id))
  for (const e of entries) {
    if (!validIds.has(Number(e.Ekiden_th_intervalId))) return NextResponse.json({ error: `interval ${e.Ekiden_th_intervalId} not in edition` }, { status: 400 })
    const s = await prisma.student.findUnique({ where: { id: Number(e.studentId) } })
    if (!s) return NextResponse.json({ error: `student ${e.studentId} not found` }, { status: 400 })
    if (s.schoolId !== team.schoolId) return NextResponse.json({ error: `student ${e.studentId} not in team school` }, { status: 400 })
  }
  try {
    const updated = await prisma.$transaction(entries.map(e => prisma.student_ekiden_item.update({
      where: { id: Number(e.id) }, data: {
        score: Number(e.score),
        rank: Number(e.rank ?? 0),
        studentId: Number(e.studentId)
      }
    })))
    return NextResponse.json({ updated: updated.length })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "bulk update failed" }, { status: 400 })
  }
}
