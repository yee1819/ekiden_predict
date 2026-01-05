import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

function avg(nums: number[]) {
  const arr = nums.filter((n) => Number.isFinite(n) && n > 0)
  if (!arr.length) return null as any
  // Use floating point average, do not round yet. Client can format.
  // Actually, standard is to keep precision.
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export async function getIntervalsData(ekidenThId: number) {
  const thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
  const teams = await prisma.ekiden_no_team.findMany({ where: { Ekiden_thId: ekidenThId }, select: { id: true, schoolId: true } })
  const teamSchool = new Map<number, number>()
  teams.forEach((t) => teamSchool.set(t.id, t.schoolId))
  const schools = await prisma.school.findMany()
  const schoolName = new Map<number, string>()
  schools.forEach((s) => schoolName.set(s.id, s.name))

  const items = await prisma.student_ekiden_item.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { Ekiden_th_intervalId: "asc" } })
  const studentIds = Array.from(new Set(items.map((i) => i.studentId)))
  const students = studentIds.length ? await prisma.student.findMany({ where: { id: { in: studentIds } } }) : []
  const stuMap = new Map<number, any>()
  students.forEach((s) => stuMap.set(s.id, s))

  // Fetch all history for these students
  const historyItems = await prisma.student_ekiden_item.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      Ekiden_th: { include: { ekiden: true } },
      Ekiden_th_interval: { include: { ekiden_interval: true } },
    },
    orderBy: { Ekiden_th: { year: 'asc' } }
  })

  const historyByStudent = new Map<number, any[]>()
  historyItems.forEach(item => {
    const list = historyByStudent.get(item.studentId) || []
    list.push(item)
    historyByStudent.set(item.studentId, list)
  })

  const byInterval = new Map<number, any[]>()
  for (const it of items) {
    const arr = byInterval.get(it.Ekiden_th_intervalId) || []
    const sid = teamSchool.get(it.Ekiden_no_teamId) || 0
    const sname = schoolName.get(sid) || String(sid)
    const stu = stuMap.get(it.studentId)

    // Process history
    const rawHistory = historyByStudent.get(it.studentId) || []
    const entries = rawHistory.map(h => {
      const eName = h.Ekiden_th.ekiden.name
      let ekidenType = ""
      if (eName.includes("出雲") || eName.toLowerCase().includes("izumo")) ekidenType = "出雲"
      else if (eName.includes("全日本") || eName.toLowerCase().includes("all japan")) ekidenType = "全日本"
      else if (eName.includes("箱根") || eName.toLowerCase().includes("hakone")) ekidenType = "箱根"
      
      if (!ekidenType) return null

      // Calculate grade
      // grade = eventYear - entryYear + 1
      // But h.grade is enum ONE, TWO... or we can calc from years
      // Using student.entryYear if available
      let g = 1
      if (stu?.entryYear && h.Ekiden_th.year) {
        g = h.Ekiden_th.year - stu.entryYear + 1
      } else {
          // Fallback if entryYear is missing, try to use grade enum if it maps to 1-4
          // But schema says grade is enum ONE, TWO...
          // We can just send the raw year and let client calc, or calc here.
          // Let's calc here if possible.
          // Actually, let's trust entryYear from student.
      }
      if (g < 1) g = 1
      if (g > 4) g = 4

      return {
        ekiden: ekidenType,
        grade: g,
        intervalName: h.Ekiden_th_interval.ekiden_interval.name,
        rank: h.rank,
        time: h.score, // keep as number or format? Client expects string in formatSeconds or number? 
                       // The reference code uses formatSeconds(it.score) -> string "HH:MM:SS"
                       // I'll send number and let client format, OR send formatted string.
                       // Reference: `time: typeof it.score === "number" ? formatSeconds(it.score) : undefined`
                       // I will send formatted string to match `EntryRecord` type from reference.
        isNewRecord: h.isNewRecord,
        year: h.Ekiden_th.year
      }
    }).filter(Boolean)

    arr.push({
      teamId: it.Ekiden_no_teamId,
      schoolId: sid,
      schoolName: sname,
      studentId: it.studentId,
      playerName: stu?.name || null,
      scoreSec: Number(it.score) || null,
      rank: Number(it.rank) || null,
      s5000: Number(stu?.score_5000m) || null,
      s10000: Number(stu?.score_10000m) || null,
      sHalf: Number(stu?.score_half_marathon) || null,
      sCollegePB: Number(stu?.score_college_pb) || null,
      entryYear: stu?.entryYear || null,
      history: entries.length > 0 ? entries : undefined
    })
    byInterval.set(it.Ekiden_th_intervalId, arr)
  }

  const intervals = thIntervals.map((ti) => {
    const list = (byInterval.get(ti.id) || []).filter((x: any) => Number.isFinite(x.scoreSec) && x.scoreSec > 0)
    list.sort((a: any, b: any) => a.scoreSec - b.scoreSec)
    const avg5000 = avg(list.map((x: any) => x.s5000))
    const avg10000 = avg(list.map((x: any) => x.s10000))
    const avgHalf = avg(list.map((x: any) => x.sHalf))
    const avgCollegePB = avg(list.map((x: any) => x.sCollegePB))
    return {
      intervalId: ti.id,
      intervalName: ti.name,
      items: list,
      averages: { avg5000, avg10000, avgHalf, avgCollegePB },
    }
  })

  const totalsBySchool = new Map<number, number>()
  const schoolMetrics = new Map<number, { s5000: number[]; s10000: number[]; sHalf: number[]; sCollegePB: number[] }>()

  for (const it of items) {
    const sid = teamSchool.get(it.Ekiden_no_teamId)
    if (!Number.isFinite(sid as any)) continue
    
    // Total Time Calculation
    const v = Number(it.score)
    if (Number.isFinite(v) && v > 0) {
      totalsBySchool.set(sid!, (totalsBySchool.get(sid!) || 0) + v)
    }

    // School Averages Calculation
    const stu = stuMap.get(it.studentId)
    if (stu) {
      if (!schoolMetrics.has(sid!)) {
        schoolMetrics.set(sid!, { s5000: [], s10000: [], sHalf: [], sCollegePB: [] })
      }
      const m = schoolMetrics.get(sid!)!
      if (stu.score_5000m) m.s5000.push(Number(stu.score_5000m))
      if (stu.score_10000m) m.s10000.push(Number(stu.score_10000m))
      if (stu.score_half_marathon) m.sHalf.push(Number(stu.score_half_marathon))
      if (stu.score_college_pb) m.sCollegePB.push(Number(stu.score_college_pb))
    }
  }
  const totals = Array.from(totalsBySchool.entries()).map(([sid, total]) => ({ schoolId: sid, schoolName: schoolName.get(sid) || String(sid), total }))
  totals.sort((a, b) => a.total - b.total)

  const schoolAverages = Array.from(schoolMetrics.entries()).map(([sid, m]) => ({
    schoolId: sid,
    avg5000: avg(m.s5000),
    avg10000: avg(m.s10000),
    avgHalf: avg(m.sHalf),
    avgCollegePB: avg(m.sCollegePB),
  }))
  const schoolAvgMap = new Map(schoolAverages.map(s => [s.schoolId, s]))

  const overallAvg5000 = avg(students.map((s) => Number(s.score_5000m)))
  const overallAvg10000 = avg(students.map((s) => Number(s.score_10000m)))
  const overallAvgHalf = avg(students.map((s) => Number(s.score_half_marathon)))
  const overallAvgCollegePB = avg(students.map((s) => Number(s.score_college_pb)))

  return { intervals, schoolTotals: totals, schoolAverages: Object.fromEntries(schoolAvgMap), overallAverages: { avg5000: overallAvg5000, avg10000: overallAvg10000, avgHalf: overallAvgHalf, avgCollegePB: overallAvgCollegePB } }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })

    const data = await getIntervalsData(ekidenThId)
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
