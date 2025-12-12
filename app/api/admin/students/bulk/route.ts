import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const data = await req.json()
  const schoolId = Number(data.schoolId)
  if (!Number.isFinite(schoolId)) return NextResponse.json({ error: "invalid schoolId" }, { status: 400 })
  const school = await prisma.school.findUnique({ where: { id: schoolId } })
  if (!school) return NextResponse.json({ error: "school not found" }, { status: 400 })
  const entryYear = data.entryYear != null ? Number(data.entryYear) : null
  const collegePB = data.collegePB != null ? Number(data.collegePB) : null
  const rawNames: unknown[] = Array.isArray(data.names) ? data.names : []
  const names: string[] = rawNames.map(x => String(x).trim()).filter(x => x.length > 0)
  if (names.length === 0) return NextResponse.json({ error: "empty names" }, { status: 400 })
  const dedup = Array.from(new Set(names))
  const created = [] as any[]
  for (const name of dedup) {
    const s = await prisma.student.create({ data: { name, schoolId, entryYear: entryYear, score_college_pb: collegePB } })
    created.push(s)
  }
  return NextResponse.json({ created: created.length })
}
