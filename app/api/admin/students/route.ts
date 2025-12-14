import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get("schoolId")
  const where = schoolId ? { schoolId: Number(schoolId) } : {}
  const name = cache.key("admin-students", schoolId ? Number(schoolId) : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.student.findMany({ where, orderBy: { id: "desc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const schoolId = Number(data.schoolId)
  if (!Number.isFinite(schoolId)) return NextResponse.json({ error: "invalid schoolId" }, { status: 400 })
  const schoolExists = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!schoolExists) return NextResponse.json({ error: "school not found" }, { status: 400 })
  const item = await prisma.student.create({
    data: {
      name: data.name,
      schoolId,
      score_1500m: data.score_1500m != null ? Number(data.score_1500m) : null,
      score_5000m: data.score_5000m != null ? Number(data.score_5000m) : null,
      score_10000m: data.score_10000m != null ? Number(data.score_10000m) : null,
      score_half_marathon: data.score_half_marathon != null ? Number(data.score_half_marathon) : null,
      score_full_marathon: data.score_full_marathon != null ? Number(data.score_full_marathon) : null,
      score_college_pb: data.score_college_pb != null ? Number(data.score_college_pb) : null,
      entryYear: data.entryYear != null && data.entryYear !== "" ? Number(data.entryYear) : null
    }
  })
  return NextResponse.json(item)
}
export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const schoolId = Number(data.schoolId)
  if (!Number.isFinite(schoolId)) return NextResponse.json({ error: "invalid schoolId" }, { status: 400 })
  const schoolExists = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!schoolExists) return NextResponse.json({ error: "school not found" }, { status: 400 })
  const item = await prisma.student.update({
    where: { id: Number(data.id) }, data: {
      name: data.name,
      schoolId,
      score_1500m: data.score_1500m != null ? Number(data.score_1500m) : null,
      score_5000m: data.score_5000m != null ? Number(data.score_5000m) : null,
      score_10000m: data.score_10000m != null ? Number(data.score_10000m) : null,
      score_half_marathon: data.score_half_marathon != null ? Number(data.score_half_marathon) : null,
      score_full_marathon: data.score_full_marathon != null ? Number(data.score_full_marathon) : null,
      score_college_pb: data.score_college_pb != null ? Number(data.score_college_pb) : null,
      entryYear: data.entryYear != null && data.entryYear !== "" ? Number(data.entryYear) : null
    }
  })
  return NextResponse.json(item)
}
export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  await prisma.student.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
