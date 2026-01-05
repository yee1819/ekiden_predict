import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    const schoolIdParam = searchParams.get("schoolId")
    const schoolId = schoolIdParam ? Number(schoolIdParam) : undefined
    const summaryIdParam = searchParams.get("summaryId")
    const summaryId = summaryIdParam ? Number(summaryIdParam) : undefined
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })

    const cutoffDate = new Date("2025-12-29T06:30:00Z") // 2025-12-29 14:30:00 UTC+8
    const actualItems = await prisma.student_ekiden_item.findMany({
      where: { Ekiden_thId: ekidenThId },
      select: { Ekiden_no_teamId: true, Ekiden_th_intervalId: true, studentId: true }
    })
    const actualMap = new Map<number, Map<number, number>>()
    for (const item of actualItems) {
      if (!actualMap.has(item.Ekiden_no_teamId)) actualMap.set(item.Ekiden_no_teamId, new Map())
      actualMap.get(item.Ekiden_no_teamId)!.set(item.Ekiden_th_intervalId, item.studentId)
    }

    const name = cache.key("final-bundle", { ekidenThId, schoolId: schoolId ?? null })

    const teams = await prisma.ekiden_no_team.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { id: "desc" } })
    const schools = await prisma.school.findMany({ orderBy: { id: "desc" } })
    const batchRows = await (prisma as any).ekiden_Team_Predict.groupBy({
      by: ["Ekiden_no_teamId", "batchId"],
      where: { Ekiden_thId: ekidenThId, createdAt: { lte: cutoffDate } },
      _count: { batchId: true }
    })
    const groupCountsByTeam = new Map<number, number>()
    for (const r of batchRows) {
      const tid = (r as any).Ekiden_no_teamId as number
      const prev = groupCountsByTeam.get(tid) || 0
      groupCountsByTeam.set(tid, prev + 1)
    }
    const countsBySchoolId: Record<number, number> = {}
    let totalCount = 0
    teams.forEach(t => { const c = groupCountsByTeam.get(t.id) || 0; countsBySchoolId[t.schoolId] = (countsBySchoolId[t.schoolId] || 0) + c; totalCount += c })

    let groups: any[] = []
    let likes: Record<string, number> = {}
    let teamCount = 0
    let teamId: number | undefined = undefined
    let schoolName: string = ""
    if (schoolId || summaryId) {
      let team = schoolId ? teams.find(t => t.schoolId === schoolId) : undefined
      if (summaryId && !team) {
        const s = await prisma.ekiden_User_Predict_Summary.findUnique({ where: { id: summaryId } })
        if (s && s.Ekiden_thId === ekidenThId) team = await prisma.ekiden_no_team.findUnique({ where: { id: s.Ekiden_no_teamId } }) as any
      }
      if (team) {
        teamId = team.id
        const th = await prisma.ekiden_th.findUnique({ where: { id: ekidenThId } })
        const thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
        const base = th ? await prisma.ekiden.findUnique({ where: { id: th.ekidenId } }) : null
        const intervalNamesMap = new Map<number, string>()
        if (base) {
          const baseIntervals = await prisma.ekiden_interval.findMany({ where: { ekidenId: base.id }, orderBy: { id: "asc" } })
          baseIntervals.forEach(b => intervalNamesMap.set(b.id, b.name))
        }

        const predicts = await prisma.ekiden_Team_Predict.findMany({
          where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: team.id, createdAt: { lte: cutoffDate } },
          orderBy: [{ batchId: "desc" }, { createdAt: "desc" }, { Ekiden_th_intervalId: "asc" }]
        })
        const students = await prisma.student.findMany({ where: { id: { in: predicts.map(p => p.studentId!).filter(Boolean) as number[] } } })
        const stuMap = new Map<number, any>()
        students.forEach(s => stuMap.set(s.id, s))

        const groupsMap = new Map<string, any[]>()
        for (const p of predicts) {
          const key = p.batchId ?? `${p.createdAt.toISOString().slice(0, 19)}`
          const arr = groupsMap.get(key) || []
          arr.push(p)
          groupsMap.set(key, arr)
        }

        function sum(arr: any[]) { return arr.reduce((acc, it) => acc + (typeof it.predict_score_sec === "number" ? it.predict_score_sec : 0), 0) }
        groups = Array.from(groupsMap.entries()).map(([key, arr]) => {
          const byInterval = new Map<number, typeof arr[number]>()
          arr.forEach(x => byInterval.set(x.Ekiden_th_intervalId, x))
          const actualForTeam = actualMap.get(team!.id)
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
                id: stu.id,
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
          const ret = items.slice(5, 10)
          const createdAt = arr.map(x => x.createdAt).filter(Boolean).sort((a, b) => (a as any) - (b as any)).pop() || null
          const meta = {
            name: arr.find(x => x.userName)?.userName || "—",
            createdAt,
            opinion: arr.find(x => x.opinion)?.opinion || null,
            forwardTotal: sum(forward as any),
            returnTotal: sum(ret as any),
            total: sum(items as any),
            correctCount: items.filter(x => x.isCorrect).length,
            batchId: arr.find(x => x.batchId)?.batchId || null,
            groupKey: key,
            teamId: team.id,
            schoolName: schools.find(sc => sc.id === team.schoolId)?.name || "",
          }
          return { items, meta }
        }).sort((a, b) => new Date(b.meta.createdAt || 0).getTime() - new Date(a.meta.createdAt || 0).getTime())

        const likeRows = await (prisma as any).ekiden_Predict_Like.groupBy({ by: ["batchId"], where: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: team.id }, _count: { batchId: true } })
        for (const r of likeRows) likes[(r as any).batchId] = (r as any)._count?.batchId || 0

        teamCount = groupCountsByTeam.get(team.id) || 0
        schoolName = schools.find(sc => sc.id === team.schoolId)?.name || ""
      }
    }
    // If no schoolId/summaryId provided, build full edition dataset for client-side filtering (single request per page)
    if (!schoolId && !summaryId) {
      const th = await prisma.ekiden_th.findUnique({ where: { id: ekidenThId } })
      const thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
      const base = th ? await prisma.ekiden.findUnique({ where: { id: th.ekidenId } }) : null
      const intervalNamesMap = new Map<number, string>()
      if (base) {
        const baseIntervals = await prisma.ekiden_interval.findMany({ where: { ekidenId: base.id }, orderBy: { id: "asc" } })
        baseIntervals.forEach(b => intervalNamesMap.set(b.id, b.name))
      }

      const predictsAll = await prisma.ekiden_Team_Predict.findMany({ where: { Ekiden_thId: ekidenThId, createdAt: { lte: cutoffDate } }, orderBy: [{ Ekiden_no_teamId: "asc" }, { batchId: "desc" }, { createdAt: "desc" }, { Ekiden_th_intervalId: "asc" }] })
      const studentIdsAll = Array.from(new Set(predictsAll.map(p => p.studentId!).filter(Boolean) as number[]))
      const studentsAll = studentIdsAll.length ? await prisma.student.findMany({ where: { id: { in: studentIdsAll } } }) : []
      const stuByIdAll = new Map<number, any>()
      studentsAll.forEach(s => stuByIdAll.set(s.id, s))

      const likesRowsAll = await (prisma as any).ekiden_Predict_Like.groupBy({ by: ["Ekiden_no_teamId", "batchId"], where: { Ekiden_thId: ekidenThId }, _count: { batchId: true } })
      const likesByTeam: Record<number, Record<string, number>> = {}
      for (const r of likesRowsAll) {
        const tid = (r as any).Ekiden_no_teamId as number
        const bid = (r as any).batchId as string
        const cnt = (r as any)._count?.batchId || 0
        if (!likesByTeam[tid]) likesByTeam[tid] = {}
        likesByTeam[tid][bid] = cnt
      }

      const groupsByTeam: Record<number, any[]> = {}

      function sum(arr: any[]) { return arr.reduce((acc, it) => acc + (typeof it.predict_score_sec === "number" ? it.predict_score_sec : 0), 0) }
      const groupedByTeam = new Map<number, Map<string, any[]>>()
      for (const p of predictsAll) {
        const tm = groupedByTeam.get(p.Ekiden_no_teamId) || new Map<string, any[]>()
        const key = p.batchId ?? `${p.createdAt.toISOString().slice(0, 19)}`
        const arr = tm.get(key) || []
        arr.push(p)
        tm.set(key, arr)
        groupedByTeam.set(p.Ekiden_no_teamId, tm)
      }
      for (const [tid, m] of groupedByTeam.entries()) {
        const gs = Array.from(m.entries()).map(([key, arr]) => {
          const byInterval = new Map<number, typeof arr[number]>()
          arr.forEach(x => byInterval.set(x.Ekiden_th_intervalId, x))
          const actualForTeam = actualMap.get(tid)
          const items = thIntervals.map((thInt, idx) => {
            const p = byInterval.get(thInt.id)
            const stu = p?.studentId ? stuByIdAll.get(p.studentId) : undefined
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
                id: stu.id,
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
          const ret = items.slice(5, 10)
          const createdAt = arr.map(x => x.createdAt).filter(Boolean).sort((a, b) => (a as any) - (b as any)).pop() || null
          const meta = {
            name: arr.find(x => x.userName)?.userName || "—",
            createdAt,
            opinion: arr.find(x => x.opinion)?.opinion || null,
            forwardTotal: sum(forward as any),
            returnTotal: sum(ret as any),
            total: sum(items as any),
            correctCount: items.filter(x => x.isCorrect).length,
            batchId: arr.find(x => x.batchId)?.batchId || null,
            groupKey: key,
            teamId: tid,
            schoolName: schools.find(sc => sc.id === (teams.find(t => t.id === tid)?.schoolId))?.name || "",
          }
          return { items, meta }
        }).sort((a, b) => new Date(b.meta.createdAt || 0).getTime() - new Date(a.meta.createdAt || 0).getTime())
        groupsByTeam[tid] = gs
      }

      const payload = { teams, schools, countsBySchoolId, totalCount, groupsByTeam, likesByTeam }
      await cache.write(name, payload)
      return NextResponse.json(payload)
    }

    const payload = { teams, schools, countsBySchoolId, totalCount, teamCount, teamId, schoolName, groups, likes }
    await cache.write(name, payload)
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
