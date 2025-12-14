import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ekiden_th_id = searchParams.get("Ekiden_thId")
  const where = ekiden_th_id ? { Ekiden_thId: Number(ekiden_th_id) } : {}
  const name = cache.key("admin-teams", ekiden_th_id ? Number(ekiden_th_id) : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.ekiden_no_team.findMany({ where, orderBy: { id: "desc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const schoolId = Number(data.schoolId)
  const Ekiden_thId = Number(data.Ekiden_thId)
  const edition = await prisma.ekiden_th.findUnique({ where: { id: Ekiden_thId } })
  if (!edition) return NextResponse.json({ error: "edition not found" }, { status: 400 })
  const ek = await prisma.ekiden.findUnique({ where: { id: edition.ekidenId } })
  const required = ek?.required_team_members ?? 16
  const members: number[] = Array.isArray(data.members) ? data.members.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n)) : []
  if (members.length !== required) return NextResponse.json({ error: `need ${required} members` }, { status: 400 })
  const created = await prisma.$transaction(async (tx) => {
    const team = await tx.ekiden_no_team.create({ data: { schoolId, Ekiden_thId, coach: data.coach, leader: data.leader } })
    const students = await tx.student.findMany({ where: { id: { in: members } } })
    const invalid = students.find(s => s.schoolId !== schoolId)
    if (invalid) throw new Error("student not in team school")
    const ops = students.map(s => tx.ekiden_Team_Member.create({
      data: {
        ekiden_no_teamId: team.id,
        studentId: s.id,
        role: (s.score_5000m || s.score_10000m || s.score_1500m) ? "STARTER" : "RESERVE"
      }
    }))
    await Promise.all(ops)
    return team
  })
  return NextResponse.json(created)
}
export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.ekiden_no_team.update({
    where: { id: Number(data.id) }, data: {
      schoolId: Number(data.schoolId),
      Ekiden_thId: Number(data.Ekiden_thId),
      coach: data.coach,
      leader: data.leader
    }
  })
  return NextResponse.json(item)
}
export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 })
  try {
    await prisma.$transaction(async (tx) => {
      await tx.student_ekiden_item.deleteMany({ where: { Ekiden_no_teamId: id } })
      await tx.ekiden_Team_Member.deleteMany({ where: { ekiden_no_teamId: id } })
      await tx.ekiden_no_team.delete({ where: { id } })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: "该队伍仍有关联成绩或成员，无法删除" }, { status: 400 })
  }
}
