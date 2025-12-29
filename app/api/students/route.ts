import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import * as cache from "@/app/lib/cache"
export const revalidate = 604800

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const schoolIdParam = searchParams.get("schoolId")
  const schoolIdNum = schoolIdParam != null ? Number(schoolIdParam) : undefined
  const hasValidSchoolId = schoolIdNum != null && Number.isFinite(schoolIdNum)
  const where = hasValidSchoolId ? { schoolId: schoolIdNum } : {}
  const name = cache.key("public-students", hasValidSchoolId ? schoolIdNum! : "all")
  const hit = await cache.read<any[]>(name)
  if (hit) return NextResponse.json(hit)
  const items = await prisma.student.findMany({ where, orderBy: { id: "desc" } })
  await cache.write(name, items)
  return NextResponse.json(items)
}
