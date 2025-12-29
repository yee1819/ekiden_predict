import { NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

type SubInput = { slot: number; playerId: number }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ekidenThId: number | undefined = body.ekidenThId
    const ekidenNoTeamId: number | undefined = body.ekidenNoTeamId
    const userName: string | undefined = body.userName
    const opinion: string | undefined = body.opinion
    const substitutions: SubInput[] = Array.isArray(body.substitutions) ? body.substitutions : []

    if (!ekidenThId) return NextResponse.json({ error: "missing ekidenThId" }, { status: 400 })
    if (!ekidenNoTeamId) return NextResponse.json({ error: "missing ekidenNoTeamId" }, { status: 400 })
    if (!userName || !String(userName).trim()) return NextResponse.json({ error: "用户名必填" }, { status: 400 })

    // IP 将在下方统一处理

    let thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
    if (thIntervals.length === 0) {
      const th = await prisma.ekiden_th.findUnique({ where: { id: ekidenThId } })
      if (!th) return NextResponse.json({ error: "edition not found" }, { status: 404 })
      const baseIntervals = await prisma.ekiden_interval.findMany({ where: { ekidenId: th.ekidenId }, orderBy: { id: "asc" } })
      const ops = baseIntervals.slice(0, 10).map(b => prisma.ekiden_th_interval.create({ data: { Ekiden_thId: ekidenThId, ekiden_intervalId: b.id } }))
      await prisma.$transaction(ops)
      thIntervals = await prisma.ekiden_th_interval.findMany({ where: { Ekiden_thId: ekidenThId }, orderBy: { ekiden_intervalId: "asc" } })
    }
    const intervalIdBySlot = new Map<number, number>()
    thIntervals.forEach((it, idx) => { intervalIdBySlot.set(idx + 1, it.id) })

    const batchId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const rawIp = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "").split(",")[0].trim()
    const ua = req.headers.get("user-agent") || ""
    const ip = rawIp ? rawIp : (ua ? `ua:${ua}` : null)
    if (ip) {
      const conflictTeam = await prisma.ekiden_Team_Predict.findFirst({ where: { Ekiden_thId: ekidenThId, userName, NOT: { ipAddress: ip } } })
      const conflictSummary = await prisma.ekiden_User_Predict_Summary.findFirst({ where: { Ekiden_thId: ekidenThId, userName, NOT: { ipAddress: ip } } })
      if (conflictTeam || conflictSummary) return NextResponse.json({ error: "用户名已有人使用，请换一个" }, { status: 409 })
      await prisma.ekiden_Team_Predict.updateMany({ where: { ipAddress: ip }, data: { userName } })
      await prisma.ekiden_User_Predict_Summary.updateMany({ where: { ipAddress: ip }, data: { userName } })
    }

    const summary = await prisma.ekiden_User_Predict_Summary.create({ data: { Ekiden_thId: ekidenThId, Ekiden_no_teamId: ekidenNoTeamId, userName, opinion: opinion ?? null, ipAddress: ip ?? null, batchId } })

    const details = substitutions.map(s => {
      const thIntervalId = intervalIdBySlot.get(s.slot)
      if (!thIntervalId) return null
      return prisma.ekiden_User_Predict_Detail.create({ data: { summaryId: summary.id, Ekiden_th_intervalId: thIntervalId, substitutedStudentId: s.playerId } })
    }).filter(Boolean) as any[]
    if (details.length) await prisma.$transaction(details)

    return NextResponse.json({ ok: true, summaryId: summary.id, batchId })
  } catch (e) {
    return NextResponse.json({ error: "server_error" }, { status: 500 })
  }
}
