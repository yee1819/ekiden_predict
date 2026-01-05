import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })
    const name = cache.key("hakone-bundle", ekidenThId)
    const hit = await cache.read<any>(name)
    if (hit) return NextResponse.json(hit)
    const teams = await prisma.ekiden_no_team.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { id: "desc" } })
    const payload = { teams }
    await cache.write(name, payload)
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

