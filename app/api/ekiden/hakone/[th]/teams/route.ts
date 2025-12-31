import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ th: string }> }) {
  const { th } = await params
  const thNum = Number(th)
  if (!Number.isFinite(thNum)) {
    return NextResponse.json({ error: 'invalid th' }, { status: 400 })
  }

  const thEntry = await prisma.ekiden_th.findFirst({
    where: { ekiden_th: thNum },
  })

  if (!thEntry) {
    return NextResponse.json({ th: thNum, teams: [] })
  }

  const teams = await prisma.ekiden_no_team.findMany({
    where: { Ekiden_thId: thEntry.id },
    include: {
      school: true,
      teamMembers: { include: { student: true } },
    },
  })

  const studentIds = teams.flatMap((t) => t.teamMembers.map((m) => m.studentId))

  const ekidenItems = await prisma.student_ekiden_item.findMany({
    where: { studentId: { in: studentIds } },
    include: {
      Ekiden_th: { include: { ekiden: true } },
    },
  })

  const itemsByStudent = new Map<number, typeof ekidenItems>()
  for (const item of ekidenItems) {
    const arr = itemsByStudent.get(item.studentId) ?? []
    arr.push(item)
    itemsByStudent.set(item.studentId, arr)
  }

  const payload = {
    th: thNum,
    teams: teams.map((t) => ({
      id: t.id,
      schoolName: t.school.name,
      members: t.teamMembers.map((m) => {
        const s = m.student
        const results = (itemsByStudent.get(s.id) ?? [])
          .filter((it) => {
            const race = it.Ekiden_th?.ekiden?.name || ''
            return /箱根|Hakone|全日本|Zen|出雲|IZuMo/i.test(race)
          })
          .map((it) => ({
            race: it.Ekiden_th?.ekiden?.name || 'Unknown',
            time: it.score ?? null,
            rank: it.rank ?? null,
          }))
        return {
          id: s.id,
          name: s.name,
          pb5000: s.score_5000m ?? null,
          pb10000: s.score_10000m ?? null,
          pbHalf: s.score_half_marathon ?? null,
          results,
        }
      }),
    })),
  }

  return NextResponse.json(payload)
}
