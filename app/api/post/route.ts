import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  const id = searchParams.get("id")
  if (slug) {
    const item = await prisma.post.findFirst({ where: { slug, published: true, Status: "Published" } })
    return NextResponse.json(item ?? null)
  }
  if (id) {
    const item = await prisma.post.findFirst({ where: { id: Number(id), published: true, Status: "Published" } })
    return NextResponse.json(item ?? null)
  }
  const list = await prisma.post.findMany({ where: { published: true, Status: "Published" }, orderBy: { updatedAt: "desc" } })
  return NextResponse.json(list)
}

