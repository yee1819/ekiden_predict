import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ekidenId = searchParams.get("ekidenId")
  const where = ekidenId ? { ekidenId: Number(ekidenId) } : {}
  const name = cache.key("public-editions", ekidenId ? Number(ekidenId) : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.ekiden_th.findMany({ where, orderBy: { id: "desc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
