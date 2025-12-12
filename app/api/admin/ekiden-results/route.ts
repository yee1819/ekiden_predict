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
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("ekiden_no_teamId")
  const thId = searchParams.get("Ekiden_thId")
  const where: any = {}
  if (teamId) where.Ekiden_no_teamId = Number(teamId)
  if (thId) where.Ekiden_thId = Number(thId)
  const items = await prisma.student_ekiden_item.findMany({ where, include: { Ekiden_th_interval: { include: { ekiden_interval: true } } }, orderBy: { id: "desc" } })
  const shaped = items.map((i: any) => ({
    id: i.id,
    studentId: i.studentId,
    Ekiden_thId: i.Ekiden_thId,
    Ekiden_no_teamId: i.Ekiden_no_teamId,
    grade: i.grade,
    rank: i.rank,
    score: i.score,
    baseIntervalId: i.Ekiden_th_interval?.ekiden_intervalId,
    intervalName: i.Ekiden_th_interval?.ekiden_interval?.name,
  }))
  return NextResponse.json(shaped)
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const team = await prisma.ekiden_no_team.findUnique({ where: { id: Number(data.Ekiden_no_teamId) }, include: { Ekiden_th: true } })
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 400 })
  const th = team.Ekiden_th
  const interval = await prisma.Ekiden_th_interval.findUnique({ where: { id: Number(data.Ekiden_th_intervalId) } })
  if (!interval || interval.Ekiden_thId !== th.id) return NextResponse.json({ error: "interval not in edition" }, { status: 400 })
  const student = await prisma.student.findUnique({ where: { id: Number(data.studentId) } })
  if (!student) return NextResponse.json({ error: "student not found" }, { status: 400 })
  if (student.schoolId !== team.schoolId) return NextResponse.json({ error: "student not in team school" }, { status: 400 })
  const grade = computeGrade(student.entryYear ?? null, th.year)
  try {
    const item = await prisma.student_ekiden_item.create({
      data: {
        score: Number(data.score),
        rank: Number(data.rank ?? 0),
        grade,
        Ekiden_th_intervalId: Number(data.Ekiden_th_intervalId),
        Ekiden_no_teamId: Number(data.Ekiden_no_teamId),
        Ekiden_thId: th.id,
        studentId: student.id
      }
    })
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "create failed" }, { status: 400 })
  }
}
export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const idParam = searchParams.get("id")
  const teamIdParam = searchParams.get("ekiden_no_teamId")
  const thIdParam = searchParams.get("Ekiden_thId")
  if (idParam) {
    const id = Number(idParam)
    await prisma.student_ekiden_item.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }
  if (teamIdParam) {
    const where: any = { Ekiden_no_teamId: Number(teamIdParam) }
    if (thIdParam) where.Ekiden_thId = Number(thIdParam)
    await prisma.student_ekiden_item.deleteMany({ where })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "missing id or team filter" }, { status: 400 })
}
