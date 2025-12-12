import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

type SlotInput = { slot: number; predictSec: number | null; playerId: number | null }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ekidenThId: number | undefined = body.ekidenThId
    const ekidenNoTeamId: number | undefined = body.ekidenNoTeamId
    const schoolName: string | undefined = body.schoolName
    const userName: string | undefined = body.userName
    const opinion: string | undefined = body.opinion
    const slots: SlotInput[] = Array.isArray(body.slots) ? body.slots : []

    if (!ekidenThId) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })
    if (!userName || !String(userName).trim()) return NextResponse.json({ error: "用户名必填" }, { status: 400 })

    let teamId = ekidenNoTeamId
    if (!teamId) {
      if (!schoolName) return NextResponse.json({ error: "missing schoolName" }, { status: 400 })
      const school = await prisma.school.findFirst({ where: { name: schoolName } })
      if (!school) return NextResponse.json({ error: "school not found" }, { status: 404 })
      const team = await prisma.ekiden_no_team.findFirst({ where: { Ekiden_thId: ekidenThId, schoolId: school.id } })
      if (!team) return NextResponse.json({ error: "team not found" }, { status: 404 })
      teamId = team.id
    }

    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0].trim() || null
    if (ip) {
      const conflict = await prisma.ekiden_Team_Predict.findFirst({ where: { Ekiden_thId: ekidenThId, userName, NOT: { ipAddress: ip } } })
      if (conflict) return NextResponse.json({ error: "用户名已有人使用，请换一个" }, { status: 409 })
      await prisma.ekiden_Team_Predict.updateMany({ where: { ipAddress: ip }, data: { userName } })
    }

    let thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
    if (thIntervals.length === 0) {
      const th = await prisma.ekiden_th.findUnique({ where: { id: ekidenThId } })
      if (!th) return NextResponse.json({ error: "edition not found" }, { status: 404 })
      const baseIntervals = await prisma.ekiden_interval.findMany({ where: { ekidenId: th.ekidenId }, orderBy: { id: "asc" } })
      if (baseIntervals.length === 0) return NextResponse.json({ error: "base intervals missing" }, { status: 400 })
      const ops = baseIntervals.slice(0, 10).map(b => prisma.ekiden_th_interval.create({ data: { Ekiden_thId: ekidenThId, ekiden_intervalId: b.id } }))
      await prisma.$transaction(ops)
      thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
    } else if (thIntervals.length < 10) {
      const th = await prisma.ekiden_th.findUnique({ where: { id: ekidenThId } })
      if (th) {
        const baseIntervals = await prisma.ekiden_interval.findMany({ where: { ekidenId: th.ekidenId }, orderBy: { id: "asc" } })
        const present = new Set(thIntervals.map(x => x.ekiden_intervalId))
        const missing = baseIntervals.filter(b => !present.has(b.id)).slice(0, 10 - thIntervals.length)
        if (missing.length) {
          const ops = missing.map(b => prisma.ekiden_th_interval.create({ data: { Ekiden_thId: ekidenThId, ekiden_intervalId: b.id } }))
          await prisma.$transaction(ops)
          thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
        }
      }
    }
    const intervalIdBySlot = new Map<number, number>()
    thIntervals.forEach((it, idx) => { intervalIdBySlot.set(idx + 1, it.id) })

    let affected = 0
    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    for (const s of slots) {
      if (!s || typeof s.slot !== "number") continue
      const thIntervalId = intervalIdBySlot.get(s.slot)
      if (!thIntervalId) continue
      await prisma.ekiden_Team_Predict.create({
        data: { Ekiden_no_teamId: teamId!, Ekiden_thId: ekidenThId, Ekiden_th_intervalId: thIntervalId, predict_score_sec: (typeof s.predictSec === "number" ? s.predictSec : null), userName: userName ?? null, studentId: s.playerId ?? null, opinion: opinion ?? null, ipAddress: ip, batchId },
      })
      affected++
    }

    return NextResponse.json({ ok: true, affected })
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
