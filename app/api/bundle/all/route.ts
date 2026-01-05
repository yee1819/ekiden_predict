import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"

export async function GET() {
  try {
    const name = cache.key("all-bundle", "v1")
    const hit = await cache.read<any>(name)
    if (hit) return NextResponse.json(hit)

    const ekidens = await prisma.ekiden.findMany({ orderBy: { id: "desc" } })
    const editions = await prisma.ekiden_th.findMany({ orderBy: { id: "desc" } })
    const intervals = await prisma.ekiden_interval.findMany({ orderBy: { id: "asc" } })
    const thIntervals = await prisma.ekiden_th_interval.findMany({ orderBy: { ekiden_intervalId: "asc" } })
    const schools = await prisma.school.findMany({ orderBy: { id: "desc" } })
    const teams = await prisma.ekiden_no_team.findMany({ orderBy: { id: "desc" } })
    const students = await prisma.student.findMany({ orderBy: { id: "desc" } })
    const members = await prisma.ekiden_Team_Member.findMany({ include: { student: true }, orderBy: { id: "desc" } })
    const resultsRaw = await prisma.student_ekiden_item.findMany({ include: { Ekiden_th: true, Ekiden_th_interval: { include: { ekiden_interval: true } } }, orderBy: { id: "desc" } })
    const results = resultsRaw.map((i: any) => ({
      id: i.id,
      studentId: i.studentId,
      ekidenId: i.Ekiden_th?.ekidenId,
      grade: i.grade,
      intervalId: i.Ekiden_th_interval?.ekiden_intervalId,
      intervalName: i.Ekiden_th_interval?.ekiden_interval?.name,
      rank: i.rank,
      score: i.score,
      thId: i.Ekiden_thId,
      isNewRecord: i.isNewRecord === true,
    }))
    const posts = await prisma.post.findMany({ where: { published: true, Status: "Published" }, orderBy: { updatedAt: "desc" } })

    const payload = { ekidens, editions, intervals, thIntervals, schools, teams, students, members, results, posts }
    await cache.write(name, payload)
    return NextResponse.json(payload)
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
