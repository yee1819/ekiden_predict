import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const thId = searchParams.get("Ekiden_thId")
  const where = thId ? { Ekiden_thId: Number(thId) } : {}
  const name = cache.key("public-th-intervals", thId ? Number(thId) : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.ekiden_th_interval.findMany({ where, orderBy: { id: "asc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
