import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  try {
    const ekidens = await prisma.ekiden.findMany({ orderBy: { id: "desc" } })
    const editions = await prisma.ekiden_th.findMany({ orderBy: { id: "desc" } })
    const intervals = await prisma.ekiden_interval.findMany({ orderBy: { id: "asc" } })
    const thIntervals = await prisma.ekiden_th_interval.findMany({ orderBy: { id: "asc" } })
    const schools = await prisma.school.findMany({ orderBy: { id: "desc" } })
    const teams = await prisma.ekiden_no_team.findMany({ orderBy: { id: "desc" } })
    const students = await prisma.student.findMany({ orderBy: { id: "desc" } })
    const members = await prisma.ekiden_Team_Member.findMany({ include: { student: true }, orderBy: { id: "desc" } })
    const posts = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } })

    return NextResponse.json({ ekidens, editions, intervals, thIntervals, schools, teams, students, members, posts })
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

