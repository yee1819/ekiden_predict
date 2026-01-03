import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    const schoolName = searchParams.get("schoolName") || undefined
    const schoolIdParam = searchParams.get("schoolId")
    const schoolId = schoolIdParam ? Number(schoolIdParam) : undefined
    const multiParam = searchParams.get("schoolIds")
    const multiIds = (multiParam ? multiParam.split(",") : []).map((s) => Number(s)).filter((n) => Number.isFinite(n))
    const repeated = searchParams.getAll ? searchParams.getAll("schoolId").map((s) => Number(s)).filter((n) => Number.isFinite(n)) : []
    const requestedIds = Array.from(new Set([...(multiIds || []), ...(repeated || [])]))
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })

    if (requestedIds.length > 0) {
      const cacheName = cache.key("final-counts", { ekidenThId, schoolIds: requestedIds })
      const hit = await cache.read<Record<number, number>>(cacheName)
      if (hit) return NextResponse.json({ countsBySchoolId: hit })

      const teams = await prisma.ekiden_no_team.findMany({ where: { Ekiden_thId: ekidenThId }, select: { id: true, schoolId: true } })
      const teamBySchool = new Map<number, number>()
      teams.forEach((t) => teamBySchool.set(t.schoolId, t.id))

      const rows = await prisma.ekiden_User_Predict_Summary.groupBy({ by: ["Ekiden_no_teamId"], where: { Ekiden_thId: ekidenThId }, _count: { _all: true } })
      const countByTeam = new Map<number, number>()
      rows.forEach((r: any) => countByTeam.set(r.Ekiden_no_teamId, r._count?._all ?? 0))

      const result: Record<number, number> = {}
      for (const sid of requestedIds) {
        const tid = teamBySchool.get(sid)
        result[sid] = tid ? (countByTeam.get(tid) || 0) : 0
      }
      await cache.write(cacheName, result)
      return NextResponse.json({ countsBySchoolId: result })
    }

    if (schoolId || schoolName) {
      const cacheName = cache.key("final-count", { ekidenThId, schoolId: schoolId ?? null, schoolName: schoolName ?? null })
      const hit = await cache.read<{ count: number }>(cacheName)
      if (hit) return NextResponse.json(hit)
      let team: any | null = null
      if (schoolId) {
        team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId } })
      } else if (schoolName) {
        const school = await prisma.school.findFirst({ where: { name: schoolName } })
        if (!school) return NextResponse.json({ count: 0 })
        team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId: school.id } })
      }
      if (!team) return NextResponse.json({ count: 0 })
      const count = await prisma.ekiden_User_Predict_Summary.count({ where: { Ekiden_no_teamId: team.id, Ekiden_thId: ekidenThId } })
      const payload = { count }
      await cache.write(cacheName, payload)
      return NextResponse.json(payload)
    }

    const count = await prisma.ekiden_User_Predict_Summary.count({ where: { Ekiden_thId: ekidenThId } })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

