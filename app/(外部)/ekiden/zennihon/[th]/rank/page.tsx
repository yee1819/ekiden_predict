import React from "react"
export const dynamic = "force-dynamic"
export const revalidate = 0
import { prisma } from "@/app/lib/prisma"
import RankView from "@/app/components/RankView"
import { cacheKey } from "@/app/lib/public-cache"
import fs from "fs/promises"
import path from "path"

function formatSeconds(sec?: number | null) {
    if (sec == null || !Number.isFinite(sec) || sec <= 0) return "—"
    const s = Math.floor(sec)
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`
}

function formatPBText(value?: number | null) {
    if (value == null || !Number.isFinite(value) || value <= 0) return "—"
    return formatSeconds(value)
}

function formatPace(sec?: number | null, km?: number | null) {
    if (!sec || !km || sec <= 0 || km <= 0) return "—"
    const pace = sec / km
    const m = Math.floor(pace / 60)
    const s = Math.round(pace % 60)
    return `${m}:${String(s).padStart(2, "0")}/km`
}

function parseIntervalIndex(name?: string) {
    if (!name) return 0
    const m = name.match(/(\d+)/)
    if (m) return Number(m[1])
    const map: Record<string, number> = { "一区": 1, "二区": 2, "三区": 3, "四区": 4, "五区": 5, "六区": 6, "七区": 7, "八区": 8, "九区": 9, "十区": 10 }
    return map[name] ?? 0
}

export default async function Page({ params, searchParams }: { params: Promise<{ th: string }>, searchParams: Promise<{ sort?: string, interval?: string, limit?: string }> }) {
    const { th } = await params
    const sp = await searchParams
    const sort = (sp?.sort || "cum") as string
    const interval = (sp?.interval || "all") as string
    const limit = (sp?.limit || "all") as string
    const thNum = Number(th)
    if (!Number.isFinite(thNum)) {
        return <div style={{ padding: 16 }}>参数错误</div>
    }

    const key = cacheKey("ekiden-zennihon-rank", { th: thNum })
    const dir = path.join(process.cwd(), "public", "data")
    const file = path.join(dir, `${key}.json`)
    try {
        const txt = await fs.readFile(file, "utf-8")
        const cached = JSON.parse(txt) as { thEntry: { ekiden_th: number, year: number }, teamViews: any[], orders: number[], intervalMeta: Array<{ order: number, name: string, km: number | null }> }
        const sortKey = ["total", "interval", "cum", "pb10000", "pb5000", "pbHalf"].includes(sort) ? sort : "cum"
        const intervalKey = interval
        const limitKey = ["3", "5", "8", "10", "all"].includes(limit) ? limit : "all"
        return <RankView title={`全日本大学驿传 第${cached.thEntry.ekiden_th}届（${cached.thEntry.year}）区间排行榜`} teamViews={cached.teamViews} orders={cached.orders} intervalMeta={cached.intervalMeta} initialSort={sortKey as any} initialInterval={intervalKey} initialLimit={limitKey} />
    } catch { }

    const thEntry = await prisma.ekiden_th.findFirst({
        where: {
            ekiden_th: thNum,
            OR: [
                { ekiden: { is: { name: { contains: "全日本" } } } },
                { ekiden: { is: { name: { contains: "Zen" } } } },
            ],
        },
        include: { ekiden: true },
    })
    if (!thEntry) {
        return <div style={{ padding: 16 }}>未找到该届全日本大学驿传</div>
    }

    const teams = await prisma.ekiden_no_team.findMany({
        where: { Ekiden_thId: thEntry.id },
        include: {
            school: true,
            studentEkidenItems: {
                where: { Ekiden_thId: thEntry.id },
                include: {
                    student: true,
                    Ekiden_th_interval: { include: { ekiden_interval: true } },
                },
            },
        },
    })

    type Slot = {
        name: string
        sec: number | null
        rank: number | null
        km: number | null
        intervalName: string
        order: number
        pb5000?: number | null
        pb10000?: number | null
        pbHalf?: number | null
        cumSec?: number | null
        cumRank?: number | null
    }

    const teamViews = teams.map((t) => {
        const asc = t.studentEkidenItems
            .map((it) => ({
                name: it.student?.name ?? "—",
                sec: it.score ?? null,
                rank: typeof it.rank === "number" ? it.rank : null,
                km: it.Ekiden_th_interval?.ekiden_interval?.kilometer ?? null,
                intervalName: it.Ekiden_th_interval?.ekiden_interval?.name ?? "",
                order: (() => { const idx = parseIntervalIndex(it.Ekiden_th_interval?.ekiden_interval?.name ?? ""); return idx || (it.Ekiden_th_interval?.id ?? it.Ekiden_th_intervalId ?? 0) })(),
                pb5000: it.student?.score_5000m ?? null,
                pb10000: it.student?.score_10000m ?? null,
                pbHalf: it.student?.score_half_marathon ?? null,
            }))
            .sort((a, b) => a.order - b.order) as Slot[]

        let run = 0
        const withCum = asc.map((s) => {
            if (s.sec && s.sec > 0) run += s.sec
            return { ...s, cumSec: run > 0 ? run : null }
        })

        const totalSec = withCum.reduce((acc, s) => acc + (s.sec && s.sec > 0 ? s.sec : 0), 0)
        return { id: t.id, schoolName: t.school.name, totalSec, slots: withCum }
    })

    teamViews.sort((a, b) => a.totalSec - b.totalSec)

    const orders = Array.from(new Set(teamViews.flatMap((tv) => tv.slots.map((s) => s.order)))).sort((a, b) => a - b)
    orders.forEach((ord) => {
        const ranking = teamViews
            .map((tv) => {
                const s = tv.slots.find((x) => x.order === ord)
                return s && s.cumSec && s.cumSec > 0 ? { teamId: tv.id, cumSec: s.cumSec } : null
            })
            .filter((x): x is { teamId: number; cumSec: number } => !!x)
            .sort((a, b) => a.cumSec - b.cumSec)
        ranking.forEach((r, i) => {
            const tv = teamViews.find((t) => t.id === r.teamId)
            const s = tv?.slots.find((x) => x.order === ord)
            if (s) s.cumRank = i + 1
        })
    })

    const intervalMetaByOrder = new Map<number, { name: string, km: number | null }>()
    orders.forEach((ord) => {
        for (const tv of teamViews) {
            const s = tv.slots.find((x) => x.order === ord)
            if (s) { intervalMetaByOrder.set(ord, { name: s.intervalName, km: s.km }); break }
        }
        if (!intervalMetaByOrder.has(ord)) intervalMetaByOrder.set(ord, { name: `${ord}区`, km: null })
    })

    function cmp(a: any, b: any) { return a - b }
    function valAsc(n?: number | null) { return typeof n === "number" && n > 0 ? n : Number.POSITIVE_INFINITY }

    const sortLabel = {
        total: "总时间",
        interval: "区间用时",
        cum: "累计用时",
        pb10000: "万米",
        pb5000: "5000",
        pbHalf: "半马",
    } as const

    const sortKey = ["total", "interval", "cum", "pb10000", "pb5000", "pbHalf"].includes(sort) ? sort : "cum"
    const intervalMeta = orders.map(o => { const m = intervalMetaByOrder.get(o); return { order: o, name: m?.name ?? `${o}区`, km: m?.km ?? null } })
    const intervalKey = interval
    const limitKey = ["3", "5", "8", "10", "all"].includes(limit) ? limit : "all"
    try {
        await fs.mkdir(dir, { recursive: true })
        const payload = { thEntry: { ekiden_th: thEntry.ekiden_th, year: thEntry.year }, teamViews, orders, intervalMeta }
        await fs.writeFile(file, JSON.stringify(payload))
    } catch { }
    return <RankView title={`全日本大学驿传 第${thEntry.ekiden_th}届（${thEntry.year}）区间排行榜`} teamViews={teamViews} orders={orders} intervalMeta={intervalMeta} initialSort={sortKey as any} initialInterval={intervalKey} initialLimit={limitKey} />
}
