import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("ekiden_no_teamId")
  const where = teamId ? { ekiden_no_teamId: Number(teamId) } : {}
  const name = cache.key("public-team-members", teamId ? Number(teamId) : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.ekiden_Team_Member.findMany({ where, orderBy: { id: "desc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
