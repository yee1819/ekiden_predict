import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const summaryId = Number(searchParams.get("summaryId"))
    if (!Number.isFinite(summaryId)) return NextResponse.json({ error: "missing summaryId" }, { status: 400 })

    const summary = await prisma.ekiden_User_Predict_Summary.findUnique({ where: { id: summaryId } })
    if (!summary) return NextResponse.json({ error: "summary_not_found" }, { status: 404 })

    const ekidenThId = summary.Ekiden_thId
    const teamId = summary.Ekiden_no_teamId

    const th = await prisma.ekiden_th.findUnique({ where: { id: ekidenThId } })
    const thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
    const base = th ? await prisma.ekiden.findUnique({ where: { id: th.ekidenId } }) : null
    const intervalNamesMap = new Map<number, string>()
    if (base) {
      const baseIntervals = await prisma.ekiden_interval.findMany({ where: { ekidenId: base.id }, orderBy: { id: "asc" } })
      baseIntervals.forEach(b => intervalNamesMap.set(b.id, b.name))
    }

    const starters = await prisma.ekiden_Starter_List.findMany({ where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: teamId }, include: { Ekiden_th_interval: true } })
    const starterByIntervalId = new Map<number, number>()
    starters.forEach(s => starterByIntervalId.set(s.Ekiden_th_intervalId, s.studentId))

    const details = await prisma.ekiden_User_Predict_Detail.findMany({ where: { summaryId }, include: { Ekiden_th_interval: true } })
    const map = new Map<number, number>()
    thIntervals.forEach((ti, idx) => { const starter = starterByIntervalId.get(ti.id); if (starter) map.set(idx + 1, starter) })
    details.forEach(d => { const slot = thIntervals.findIndex(ti => ti.id === d.Ekiden_th_intervalId) + 1; if (slot > 0) map.set(slot, d.substitutedStudentId) })

    const items = thIntervals.map((ti, idx) => ({
      slot: idx + 1,
      intervalName: intervalNamesMap.get(ti.ekiden_intervalId) || `${idx + 1}区`,
      playerId: map.get(idx + 1) || null,
    }))

    const studentIds = Array.from(new Set(items.map(i => i.playerId).filter((id: any) => Number.isFinite(id)))) as number[]
    const students = studentIds.length ? await prisma.student.findMany({ where: { id: { in: studentIds } } }) : []
    const stuMap = new Map<number, any>()
    students.forEach(s => stuMap.set(s.id, s))

    const shapedItems = items.map(i => {
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
    })

    const school = await prisma.school.findUnique({ where: { id: (await prisma.ekiden_no_team.findUnique({ where: { id: teamId } }))?.schoolId || 0 } })
    return NextResponse.json({
      group: {
        items: shapedItems,
        meta: {
          name: summary.userName || "—",
          createdAt: summary.createdAt,
          opinion: summary.opinion || null,
          batchId: summary.batchId || null,
        },
      },
      meta: { teamId, schoolName: school?.name || String(teamId), ekidenThId, eventYear: th?.year }
    })
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

