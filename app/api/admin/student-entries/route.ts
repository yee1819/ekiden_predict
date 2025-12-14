import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get("studentIds")
  if (!idsParam) return NextResponse.json([])
  const studentIds = idsParam.split(",").map(s => Number(s)).filter(n => Number.isFinite(n))
  if (studentIds.length === 0) return NextResponse.json([])
  const name = cache.key("admin-student-entries", studentIds.slice().sort((a, b) => a - b))
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.student_ekiden_item.findMany({
    where: { studentId: { in: studentIds } },
    include: { Ekiden_th: true, Ekiden_th_interval: { include: { ekiden_interval: true } } },
    orderBy: { id: "desc" }
  })
  const shaped = items.map((i: any) => ({
    id: i.id,
    studentId: i.studentId,
    ekidenId: i.Ekiden_th?.ekidenId,
    grade: i.grade,
    intervalId: i.Ekiden_th_interval?.ekiden_intervalId,
    intervalName: i.Ekiden_th_interval?.ekiden_interval?.name,
    rank: i.rank,
    score: i.score,
    thId: i.Ekiden_thId
  }))
  await cache.write(name, shaped)
  return NextResponse.json(shaped)
}
