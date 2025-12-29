import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function GET() {
  const items = await prisma.school.findMany({ orderBy: { id: "desc" } })
  return NextResponse.json(items)
}
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.school.create({ data: { name: data.name } })
  return NextResponse.json(item)
}
export async function PUT(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const item = await prisma.school.update({ where: { id: Number(data.id) }, data: { name: data.name } })
  return NextResponse.json(item)
}
export async function DELETE(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const id = Number(searchParams.get("id"))
  await prisma.school.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
