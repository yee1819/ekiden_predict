import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get("studentIds")
  if (!idsParam) return NextResponse.json([])
  const studentIds = idsParam.split(",").map(s => Number(s)).filter(n => Number.isFinite(n))
  if (studentIds.length === 0) return NextResponse.json([])
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
    thId: i.Ekiden_thId,
    isNewRecord: i.isNewRecord === true
  }))
  return NextResponse.json(shaped)
}
