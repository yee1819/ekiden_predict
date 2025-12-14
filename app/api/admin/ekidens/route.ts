import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET() {
  try {
    const name = cache.key("admin-ekidens", "all")
    const hit = await cache.read<any[]>(name)
    if (hit) return NextResponse.json(hit)
    const items = await prisma.ekiden.findMany({ orderBy: { id: "desc" } })
    await cache.write(name, items)
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "internal error" }, { status: 500 })
  }
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const reqMembers = Number(data.required_team_members) || 16
  const item = await prisma.ekiden.create({ data: { name: data.name, description: data.description, required_team_members: reqMembers } })
  const count = Number(data.intervalCount) || 0
  if (count > 0) {
    const names = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]
    const ops = Array.from({ length: count }, (_, i) => prisma.ekiden_interval.create({
      data: {
        name: `${names[i] ?? String(i + 1)}区`,
        description: "",
        kilometer: 0,
        record: 0,
        map: null,
        start_point: null,
        end_point: null,
        ekidenId: item.id
      }
    }))
    await prisma.$transaction(ops)
  }
  return NextResponse.json(item)
}
export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const reqMembers = Number(data.required_team_members) || undefined
  const item = await prisma.ekiden.update({ where: { id: Number(data.id) }, data: { name: data.name, description: data.description, ...(reqMembers ? { required_team_members: reqMembers } : {}) } })
  return NextResponse.json(item)
}
export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  if (!Number.isFinite(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 })
  try {
    const intervalCount = await prisma.ekiden_interval.count({ where: { ekidenId: id } })
    const editionCount = await prisma.ekiden_th.count({ where: { ekidenId: id } })
    if (intervalCount > 0 || editionCount > 0) {
      return NextResponse.json({ error: "该驿传存在区间或届数，无法删除" }, { status: 400 })
    }
    await prisma.ekiden.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "删除失败" }, { status: 400 })
  }
}
