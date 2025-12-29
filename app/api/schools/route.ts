import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET() {
  const name = cache.key("public-schools", "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.school.findMany({ orderBy: { id: "desc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
