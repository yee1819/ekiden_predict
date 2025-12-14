import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const thId = searchParams.get("Ekiden_thId")
  const where = thId ? { Ekiden_thId: Number(thId) } : {}
  const name = cache.key("admin-th-intervals", thId ? Number(thId) : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.ekiden_th_interval.findMany({ where, orderBy: { id: "asc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.ekiden_th_interval.create({
    data: {
      Ekiden_thId: Number(data.Ekiden_thId),
      ekiden_intervalId: Number(data.ekiden_intervalId)
    }
  })
  return NextResponse.json(item)
}
export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  await prisma.ekiden_th_interval.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
