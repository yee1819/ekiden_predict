import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET() {
  try {
    const name = cache.key("public-ekidens", "all")
    const hit = await cache.read<any[]>(name)
    if (hit) return NextResponse.json(hit)
    const items = await prisma.ekiden.findMany({ orderBy: { id: "desc" } })
    await cache.write(name, items)
    return NextResponse.json(items)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "internal error" }, { status: 500 })
  }
}
