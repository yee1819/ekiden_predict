import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("ekiden_no_teamId")
  const thId = searchParams.get("Ekiden_thId")
  const where: any = {}
  if (teamId) where.Ekiden_no_teamId = Number(teamId)
  if (thId) where.Ekiden_thId = Number(thId)
  const mdl: any = (prisma as any).ekiden_Starter_List
  if (!mdl || typeof mdl.findMany !== "function") {
    return NextResponse.json({ error: "PrismaClient未包含Ekiden_Starter_List，请先生成客户端并同步数据库：npm run postinstall、npm run db:push（或 prisma generate / prisma migrate:deploy）" }, { status: 500 })
  }
  const items = await mdl.findMany({ where, include: { Ekiden_th_interval: { include: { ekiden_interval: true } }, student: true }, orderBy: { id: "desc" } })
  const shaped = items.map((i: any) => ({
    id: i.id,
    studentId: i.studentId,
    studentName: i.student?.name,
    Ekiden_thId: i.Ekiden_thId,
    Ekiden_no_teamId: i.Ekiden_no_teamId,
    Ekiden_th_intervalId: i.Ekiden_th_intervalId,
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
  const interval = await prisma.ekiden_th_interval.findUnique({ where: { id: Number(data.Ekiden_th_intervalId) } })
  if (!interval || interval.Ekiden_thId !== th.id) return NextResponse.json({ error: "interval not in edition" }, { status: 400 })
  const student = await prisma.student.findUnique({ where: { id: Number(data.studentId) } })
  if (!student) return NextResponse.json({ error: "student not found" }, { status: 400 })
  if (student.schoolId !== team.schoolId) return NextResponse.json({ error: "student not in team school" }, { status: 400 })
  try {
    const item = await mdl.upsert({
      where: { Ekiden_th_intervalId_Ekiden_no_teamId: { Ekiden_th_intervalId: Number(data.Ekiden_th_intervalId), Ekiden_no_teamId: team.id } },
      update: { studentId: student.id },
      create: { Ekiden_th_intervalId: Number(data.Ekiden_th_intervalId), Ekiden_no_teamId: team.id, Ekiden_thId: th.id, studentId: student.id }
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
    await mdl.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  }
  if (teamIdParam) {
    const where: any = { Ekiden_no_teamId: Number(teamIdParam) }
    if (thIdParam) where.Ekiden_thId = Number(thIdParam)
    await mdl.deleteMany({ where })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "missing id or team filter" }, { status: 400 })
}
