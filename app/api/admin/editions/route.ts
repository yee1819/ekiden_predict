import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const ekidenId = searchParams.get("ekidenId")
  const where = ekidenId ? { ekidenId: Number(ekidenId) } : {}
  const items = await prisma.ekiden_th.findMany({ where, orderBy: { id: "desc" } })
  return NextResponse.json(items)
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.ekiden_th.create({
    data: {
      ekiden_th: Number(data.ekiden_th),
      year: Number(data.year),
      ekidenId: Number(data.ekidenId)
    }
  })
  return NextResponse.json(item)
}
export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.ekiden_th.update({
    where: { id: Number(data.id) }, data: {
      ekiden_th: Number(data.ekiden_th),
      year: Number(data.year),
      ekidenId: Number(data.ekidenId)
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
      await tx.student_ekiden_item.deleteMany({ where: { Ekiden_thId: id } })
      const teams = await tx.ekiden_no_team.findMany({ where: { Ekiden_thId: id }, select: { id: true } })
      const teamIds = teams.map(t => t.id)
      if (teamIds.length > 0) {
        await tx.ekiden_Team_Member.deleteMany({ where: { ekiden_no_teamId: { in: teamIds } } })
      }
      await tx.ekiden_no_team.deleteMany({ where: { Ekiden_thId: id } })
      await tx.Ekiden_th_interval.deleteMany({ where: { Ekiden_thId: id } })
      await tx.ekiden_th.delete({ where: { id } })
    })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "删除失败" }, { status: 400 })
  }
}
