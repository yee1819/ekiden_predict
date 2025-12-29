import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("ekiden_no_teamId")
  const where = teamId ? { ekiden_no_teamId: Number(teamId) } : {}
  const items = await prisma.ekiden_Team_Member.findMany({ where, include: { student: true }, orderBy: { id: "desc" } })
  const shaped = items.map((i: any) => ({ id: i.id, ekiden_no_teamId: i.ekiden_no_teamId, studentId: i.studentId, role: i.role, studentName: i.student?.name }))
  return NextResponse.json(shaped)
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const teamId = Number(data.ekiden_no_teamId)
  const studentId = Number(data.studentId)
  if (!Number.isFinite(teamId) || !Number.isFinite(studentId)) return NextResponse.json({ error: "invalid payload" }, { status: 400 })
  const team = await prisma.ekiden_no_team.findUnique({ where: { id: teamId } })
  if (!team) return NextResponse.json({ error: "team not found" }, { status: 400 })
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) return NextResponse.json({ error: "student not found" }, { status: 400 })
  if (student.schoolId !== team.schoolId) return NextResponse.json({ error: "student not in team school" }, { status: 400 })
  const edition = await prisma.ekiden_th.findUnique({ where: { id: team.Ekiden_thId } })
  if (!edition) return NextResponse.json({ error: "edition not found" }, { status: 400 })
  const ek = await prisma.ekiden.findUnique({ where: { id: edition.ekidenId } })
  const required = ek?.required_team_members ?? 16
  const count = await prisma.ekiden_Team_Member.count({ where: { ekiden_no_teamId: teamId } })
  if (count >= required) return NextResponse.json({ error: "team roster full" }, { status: 400 })
  const exists = await prisma.ekiden_Team_Member.findUnique({ where: { ekiden_no_teamId_studentId: { ekiden_no_teamId: teamId, studentId } } })
  if (exists) return NextResponse.json({ error: "already in roster" }, { status: 400 })
  const item = await prisma.ekiden_Team_Member.create({ data: { ekiden_no_teamId: teamId, studentId, role: data.role } })
  return NextResponse.json(item)
}
export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.ekiden_Team_Member.update({
    where: { id: Number(data.id) }, data: {
      role: data.role
    }
  })
  return NextResponse.json(item)
}
export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  await prisma.ekiden_Team_Member.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
