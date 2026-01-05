import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    const schoolId = searchParams.get("schoolId") ? Number(searchParams.get("schoolId")) : undefined
    const schoolName = searchParams.get("schoolName") || undefined
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })

    const cutoffDate = new Date("2025-12-29T06:30:00Z")

    let team: any | null = null
    if (schoolId) {
      team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId } })
    } else if (schoolName) {
      const school = await prisma.school.findFirst({ where: { name: schoolName } })
      if (school) team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId: school.id } })
    }
    if (!team) {
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

    const predicts = await prisma.ekiden_Team_Predict.findMany({ where: { Ekiden_no_teamId: team.id, Ekiden_thId: ekidenThId, createdAt: { lte: cutoffDate } }, orderBy: [{ batchId: "desc" }, { createdAt: "desc" }, { Ekiden_th_intervalId: "asc" }] })
    const students = await prisma.student.findMany({ where: { id: { in: predicts.map(p => p.studentId!).filter(Boolean) as number[] } } })
    const stuMap = new Map<number, any>()
    students.forEach(s => stuMap.set(s.id, s))

    const actualItems = await prisma.student_ekiden_item.findMany({
      where: { Ekiden_thId: ekidenThId },
      select: { Ekiden_no_teamId: true, Ekiden_th_intervalId: true, studentId: true }
    })
    const actualMap = new Map<number, Map<number, number>>()
    for (const item of actualItems) {
      if (!actualMap.has(item.Ekiden_no_teamId)) actualMap.set(item.Ekiden_no_teamId, new Map())
      actualMap.get(item.Ekiden_no_teamId)!.set(item.Ekiden_th_intervalId, item.studentId)
    }

    const groupsMap = new Map<string, any[]>()
    for (const p of predicts) {
      const key = p.batchId ?? `${p.createdAt.toISOString().slice(0, 19)}`
      const arr = groupsMap.get(key) || []
      arr.push(p)
      groupsMap.set(key, arr)
    }

    const sum = (arr: any[]) => arr.reduce((acc, it) => acc + (typeof it.predictSec === "number" ? it.predictSec : 0), 0)
    const groups = Array.from(groupsMap.entries()).map(([key, arr]) => {
      const byInterval = new Map<number, typeof arr[number]>()
      arr.forEach(x => byInterval.set(x.Ekiden_th_intervalId, x))
      const actualForTeam = actualMap.get(team.id)
      const items = thIntervals.map((thInt, idx) => {
        const p = byInterval.get(thInt.id)
        const stu = p?.studentId ? stuMap.get(p.studentId) : undefined
        const actualStudentId = actualForTeam?.get(thInt.id)
        const isCorrect = !!(actualStudentId && p?.studentId && actualStudentId === p.studentId)
        return {
          slot: idx + 1,
          intervalName: intervalNamesMap.get(thInt.ekiden_intervalId) || `${idx + 1}区`,
          predictSec: typeof p?.predict_score_sec === "number" ? p!.predict_score_sec : null,
          playerId: p?.studentId ?? null,
          playerName: stu?.name ?? null,
          isCorrect,
          student: stu ? {
            name: stu.name,
            score5000m: stu.score_5000m ?? null,
            score10000m: stu.score_10000m ?? null,
            scoreHalf: stu.score_half_marathon ?? null,
            collegePB: stu.score_college_pb ?? null,
            entryYear: stu.entryYear ?? null,
          } : null,
        }
      })
      const forward = items.slice(0, 5)
      const returnR = items.slice(5, 10)
      const createdAt = arr.map(x => x.createdAt).filter(Boolean).sort((a, b) => (a as any) - (b as any)).pop() || null
      const meta = {
        name: arr.find(x => x.userName)?.userName || "—",
        createdAt,
        opinion: arr.find(x => x.opinion)?.opinion || null,
        forwardTotal: sum(forward),
        returnTotal: sum(returnR),
        total: sum(items),
        correctCount: items.filter(x => x.isCorrect).length,
        batchId: arr.find(x => x.batchId)?.batchId || null,
        groupKey: key,
      }
      return { items, meta }
    }).sort((a, b) => new Date(b.meta.createdAt || 0).getTime() - new Date(a.meta.createdAt || 0).getTime())

    return NextResponse.json({ groups, meta: { teamId: team.id, schoolId: team.schoolId, schoolName: (await prisma.school.findUnique({ where: { id: team.schoolId } }))?.name || String(team.schoolId) } })
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
