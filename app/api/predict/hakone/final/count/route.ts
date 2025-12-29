import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const ekidenThId = Number(searchParams.get("ekidenThId"))
    const schoolName = searchParams.get("schoolName") || undefined
    const schoolIdParam = searchParams.get("schoolId")
    const schoolId = schoolIdParam ? Number(schoolIdParam) : undefined
    if (!Number.isFinite(ekidenThId)) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })

    if (schoolId || schoolName) {
      let team: any | null = null
      if (schoolId) {
        team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId } })
      } else if (schoolName) {
        const school = await prisma.school.findFirst({ where: { name: schoolName } })
        if (!school) return NextResponse.json({ count: 0 })
        team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId: school.id } })
      }
      if (!team) return NextResponse.json({ count: 0 })
      const count = await prisma.ekiden_User_Predict_Summary.count({ where: { Ekiden_no_teamId: team.id, Ekiden_thId: ekidenThId } })
      return NextResponse.json({ count })
    }

    const count = await prisma.ekiden_User_Predict_Summary.count({ where: { Ekiden_thId: ekidenThId } })
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}

