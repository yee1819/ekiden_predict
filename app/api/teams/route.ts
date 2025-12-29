import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ekiden_th_id = searchParams.get("Ekiden_thId")
  const where = ekiden_th_id ? { Ekiden_thId: Number(ekiden_th_id) } : {}
  const name = cache.key("public-teams", ekiden_th_id ? Number(ekiden_th_id) : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.ekiden_no_team.findMany({ where, orderBy: { id: "desc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
