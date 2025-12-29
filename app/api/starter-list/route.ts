import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get("ekiden_no_teamId")
  const thId = searchParams.get("Ekiden_thId")
  const where: any = {}
  if (teamId) where.Ekiden_no_teamId = Number(teamId)
  if (thId) where.Ekiden_thId = Number(thId)
  const name = cache.key("public-starter-list", { teamId: teamId ? Number(teamId) : null, thId: thId ? Number(thId) : null })
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.ekiden_Starter_List.findMany({ where, include: { Ekiden_th_interval: { include: { ekiden_interval: true } }, student: true }, orderBy: { id: "desc" } })
  const shaped = items.map((i: any) => ({
    id: i.id,
    studentId: i.studentId,
    studentName: i.student?.name,
    Ekiden_thId: i.Ekiden_thId,
    Ekiden_no_teamId: i.Ekiden_no_teamId,
    Ekiden_th_intervalId: i.Ekiden_th_intervalId,
    baseIntervalId: i.Ekiden_th_interval?.ekiden_intervalId,
    intervalName: i.Ekiden_th_interval?.ekiden_interval?.name,
  }))
  await cache.write(name, shaped)
  return NextResponse.json(shaped)
}
