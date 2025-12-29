import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    const teamIdParam = searchParams.get("ekiden_no_teamId")
    const schoolIdParam = searchParams.get("schoolId")
    const schoolName = searchParams.get("schoolName") || undefined
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })

    let team: any | null = null
    if (teamIdParam) {
      team = await prisma.ekiden_no_team.findUnique({ where: { id: Number(teamIdParam) } })
    } else if (schoolIdParam) {
      team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId: Number(schoolIdParam) } })
    } else if (schoolName) {
      const school = await prisma.school.findFirst({ where: { name: schoolName } })
      if (school) team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId: school.id } })
    } else {
      const teams = await prisma.ekiden_no_team.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { id: "asc" } })
      team = teams[0] || null
    }
    if (!team) return NextResponse.json({ groups: [], meta: { teamId: null } })

    const thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
    const base = await prisma.ekiden_th.findUnique({ where: { id: ekidenThId } })
    const intervalNamesMap = new Map<number, string>()
    if (base) {
      const baseIntervals = await prisma.ekiden_interval.findMany({ where: { ekidenId: base.ekidenId }, orderBy: { id: "asc" } })
      baseIntervals.forEach(b => intervalNamesMap.set(b.id, b.name))
    }

    const starters = await prisma.ekiden_Starter_List.findMany({ where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: team.id }, include: { Ekiden_th_interval: true } })
    const starterByIntervalId = new Map<number, number>()
    starters.forEach(s => starterByIntervalId.set(s.Ekiden_th_intervalId, s.studentId))

    const summaries = await prisma.ekiden_User_Predict_Summary.findMany({ where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: team.id }, orderBy: { createdAt: "desc" } })
    const summaryIds = summaries.map(s => s.id)
    const details = summaryIds.length ? await prisma.ekiden_User_Predict_Detail.findMany({ where: { summaryId: { in: summaryIds } }, include: { Ekiden_th_interval: true } }) : []
    const detailsBySummary = new Map<number, any[]>()
    details.forEach(d => { const arr = detailsBySummary.get(d.summaryId) || []; arr.push(d); detailsBySummary.set(d.summaryId, arr) })

    const likeRows = await (prisma as any).ekiden_Predict_Like.groupBy({ by: ["batchId"], where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: team.id }, _count: { batchId: true } })
    const likeCountByBatch: Record<string, number> = {}
    for (const r of likeRows) likeCountByBatch[(r as any).batchId] = (r as any)._count?.batchId || 0

    const groups = summaries.map(s => {
      const map = new Map<number, number>()
      thIntervals.forEach((ti, idx) => { const starter = starterByIntervalId.get(ti.id); if (starter) map.set(idx + 1, starter) })
      const ds = detailsBySummary.get(s.id) || []
      ds.forEach(d => { const slot = thIntervals.findIndex(ti => ti.id === d.Ekiden_th_intervalId) + 1; if (slot > 0) map.set(slot, d.substitutedStudentId) })

      const items = thIntervals.map((ti, idx) => ({
        slot: idx + 1,
        intervalName: intervalNamesMap.get(ti.ekiden_intervalId) || `${idx + 1}区`,
        playerId: map.get(idx + 1) || null,
      }))

      return {
        items,
        meta: {
          name: s.userName || "—",
          createdAt: s.createdAt,
          opinion: s.opinion || null,
          batchId: s.batchId || null,
          likeCount: s.batchId ? (likeCountByBatch[s.batchId] || 0) : 0,
        },
      }
    })

    const studentIds = Array.from(new Set(groups.flatMap(g => g.items.map(i => i.playerId).filter((id: any) => Number.isFinite(id))))) as number[]
    const students = studentIds.length ? await prisma.student.findMany({ where: { id: { in: studentIds } } }) : []
    const stuMap = new Map<number, any>()
    students.forEach(s => stuMap.set(s.id, s))

    const shaped = groups.map(g => ({
      items: g.items.map(i => {
        const starterId = starterByIntervalId.get(thIntervals[i.slot - 1]?.id)
        const isSub = starterId != null && i.playerId != null && i.playerId !== starterId
        return {
          slot: i.slot,
          intervalName: i.intervalName,
          playerId: i.playerId,
          playerName: i.playerId ? (stuMap.get(i.playerId)?.name || null) : null,
          isSub,
          student: i.playerId ? {
            name: stuMap.get(i.playerId)?.name || null,
            score5000m: stuMap.get(i.playerId)?.score_5000m ?? null,
            score10000m: stuMap.get(i.playerId)?.score_10000m ?? null,
            scoreHalf: stuMap.get(i.playerId)?.score_half_marathon ?? null,
            collegePB: stuMap.get(i.playerId)?.score_college_pb ?? null,
            entryYear: stuMap.get(i.playerId)?.entryYear ?? null,
          } : null,
        }
      }),
      meta: g.meta,
    }))

    const school = await prisma.school.findUnique({ where: { id: team.schoolId } })
    return NextResponse.json({ groups: shaped, meta: { teamId: team.id, schoolId: team.schoolId, schoolName: school?.name || String(team.schoolId) } })
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
