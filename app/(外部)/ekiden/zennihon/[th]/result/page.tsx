import React from "react"
import { prisma } from "@/app/lib/prisma"
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

export default async function Page({ params }: { params: Promise<{ th: string }> }) {
    const { th } = await params
    const thNum = Number(th)
    if (!Number.isFinite(thNum)) {
        return <div style={{ padding: 16 }}>参数错误</div>
    }

    const key = cacheKey("ekiden-zennihon-result", { th: thNum })
    const dir = path.join(process.cwd(), "public", "data")
    const file = path.join(dir, `${key}.json`)
    try {
        const txt = await fs.readFile(file, "utf-8")
        const cached = JSON.parse(txt) as { thEntry: { ekiden_th: number, year: number }, teamViews: any[] }
        const thEntry = cached.thEntry
        const teamViews = cached.teamViews
        return (
            <main className="bg-gray-50 py-10 px-6 text-gray-900 min-h-screen h-full overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold mb-4">全日本大学驿传 第{thEntry.ekiden_th}届（{thEntry.year}）队伍成绩</h1>
                    <div className="space-y-6">
                        {teamViews.map((team: any, teamIdx: number) => (
                            <div key={team.id} className="rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: (teamIdx === 0 ? "#FFD700" : teamIdx === 1 ? "#C0C0C0" : teamIdx === 2 ? "#CD7F32" : undefined), borderWidth: (teamIdx < 3 ? 8 : 1), borderStyle: "solid" }}>
                                <div className="flex items-baseline justify-between">
                                    <div className="text-lg font-bold">{teamIdx === 0 ? "冠军" : teamIdx === 1 ? "亚军" : teamIdx === 2 ? "季军" : `${teamIdx + 1}位`} {team.schoolName}</div>
                                    <div className="text-sm text-gray-600">总时间：{formatSeconds(team.totalSec)}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                                    {team.slots.map((slot: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="relative rounded-lg border p-3"
                                            style={{
                                                backgroundColor:
                                                    slot.rank === 1
                                                        ? "#FFD700"
                                                        : slot.rank === 2
                                                            ? "#C0C0C0"
                                                            : slot.rank === 3
                                                                ? "#CD7F32"
                                                                : "#F9FAFB",
                                            }}
                                        >
                                            <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                                                <div style={{ fontSize: 18, fontWeight: 800 }}>{slot.name}</div>
                                                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(slot.pb5000)}</div>
                                                <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(slot.pb10000)}</div>
                                                <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(slot.pbHalf)}</div>
                                                <span>此时位次：{slot.cumRank ?? "—"}位</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                                <span style={{ fontSize: 16, fontWeight: 800 }}>{slot.intervalName}</span>
                                                <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slot.km ?? "—"}km</span>
                                            </div>
                                            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>
                                                <span style={{ color: slot.isNewRecord ? "red" : undefined }}>{formatSeconds(slot.sec)}</span>
                                               
                                                <span style={{ fontSize: 12, color: slot.isNewRecord ? "red" : "#555", marginTop: 2 }}>{slot.rank ?? "—"}位  {slot.isNewRecord ? <span style={{ color: "red", marginLeft: 4 }}>『新』</span> : null}</span>
                                            </div>
                                            <div style={{ fontSize: 13, color: "#666" }}>配速：{formatPace(slot.sec ?? null, slot.km ?? null)}</div>
                                            <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#333", marginTop: 4 }}>
                                                <span>用时：{formatSeconds(slot.cumSec ?? null)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        )
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

    type TeamView = {
        id: number
        schoolName: string
        totalSec: number
        slots: Array<{
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
            isNewRecord?: boolean
        }>
    }

    const teamViews: TeamView[] = teams.map((t) => {
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
                isNewRecord: it.isNewRecord === true,
            }))
            .sort((a, b) => a.order - b.order)

        let run = 0
        const withCum = asc.map((s) => {
            if (s.sec && s.sec > 0) run += s.sec
            return { ...s, cumSec: run > 0 ? run : null }
        })

        const slots = withCum
        const totalSec = withCum.reduce((acc, s) => acc + (s.sec && s.sec > 0 ? s.sec : 0), 0)
        return { id: t.id, schoolName: t.school.name, totalSec, slots }
    })

    teamViews.sort((a, b) => a.totalSec - b.totalSec)

    const orders = Array.from(new Set(teamViews.flatMap((tv) => tv.slots.map((s) => s.order))))
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

    const payloadThEntry = { ekiden_th: thEntry.ekiden_th, year: thEntry.year }
    try {
        await fs.mkdir(dir, { recursive: true })
        const payload = { thEntry: payloadThEntry, teamViews }
        await fs.writeFile(file, JSON.stringify(payload))
    } catch { }
    return (
        <main className="bg-gray-50 py-10 px-6 text-gray-900 min-h-screen h-full overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">全日本大学驿传 第{thEntry.ekiden_th}届（{thEntry.year}）队伍成绩</h1>
                <div className="space-y-6">
                    {teamViews.map((team, teamIdx) => (
                        <div key={team.id} className="rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: (teamIdx === 0 ? "#FFD700" : teamIdx === 1 ? "#C0C0C0" : teamIdx === 2 ? "#CD7F32" : undefined), borderWidth: (teamIdx < 3 ? 8 : 1) }}>
                            <div className="flex items-baseline justify-between">
                                <div className="text-lg font-bold">{teamIdx === 0 ? "冠军" : teamIdx === 1 ? "亚军" : teamIdx === 2 ? "季军" : `${teamIdx + 1}位`} {team.schoolName}</div>
                                <div className="text-sm text-gray-600">总时间：{formatSeconds(team.totalSec)}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                                {team.slots.map((slot, idx) => (
                                    <div
                                        key={idx}
                                        className="relative rounded-lg border p-3"
                                        style={{
                                            backgroundColor:
                                                slot.rank === 1
                                                    ? "#FFD700"
                                                    : slot.rank === 2
                                                        ? "#C0C0C0"
                                                        : slot.rank === 3
                                                            ? "#CD7F32"
                                                            : "#F9FAFB",
                                        }}
                                    >
                                        <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                                            <div style={{ fontSize: 18, fontWeight: 800 }}>{slot.name}</div>
                                            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(slot.pb5000)}</div>
                                            <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(slot.pb10000)}</div>
                                            <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(slot.pbHalf)}</div>
                                            <span>此时位次：{slot.cumRank ?? "—"}位</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                            <span style={{ fontSize: 16, fontWeight: 800 }}>{slot.intervalName}</span>
                                            <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slot.km ?? "—"}km</span>
                                        </div>
                                        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>{formatSeconds(slot.sec)} <span style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{slot.rank ?? "—"}位</span></div>
                                        <div style={{ fontSize: 13, color: "#666" }}>配速：{formatPace(slot.sec ?? null, slot.km ?? null)}</div>
                                        <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#333", marginTop: 4 }}>
                                            <span>用时：{formatSeconds(slot.cumSec ?? null)}</span>

                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
