import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ekidenId = searchParams.get("ekidenId")
  const where = ekidenId ? { ekidenId: Number(ekidenId) } : {}
  const items = await prisma.ekiden_interval.findMany({ where, orderBy: { id: "desc" } })
  return NextResponse.json(items)
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.ekiden_interval.create({
    data: {
      name: data.name,
      description: data.description,
      kilometer: Number(data.kilometer),
      record: Number(data.record),
      map: data.map ?? null,
      start_point: data.start_point ?? null,
      end_point: data.end_point ?? null,
      ekidenId: Number(data.ekidenId)
    }
  })
  return NextResponse.json(item)
}
export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.ekiden_interval.update({
    where: { id: Number(data.id) }, data: {
      name: data.name,
      description: data.description,
      kilometer: Number(data.kilometer),
      record: Number(data.record),
      map: data.map ?? null,
      start_point: data.start_point ?? null,
      end_point: data.end_point ?? null,
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
  await prisma.ekiden_interval.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
