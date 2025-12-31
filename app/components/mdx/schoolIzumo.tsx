"use client"
import React, { useEffect, useMemo, useState } from "react"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

function formatSeconds(sec?: number | null) {
    if (sec == null) return "—"
    const h = Math.floor((sec as number) / 3600)
    const m = Math.floor(((sec as number) % 3600) / 60)
    const s = (sec as number) % 60
    const hhStr = String(h).padStart(2, "0")
    const mmStr = String(m).padStart(2, "0")
    const ssStr = String(s).padStart(2, "0")
    if (h === 0) return `${mmStr}:${ssStr}`
    return `${hhStr}:${mmStr}:${ssStr}`
}
function formatPace(sec?: number | null, km?: number | null) {
    if (!sec || !km || sec <= 0 || km <= 0) return "—"
    const pace = sec / km
    const m = Math.floor(pace / 60)
    const s = Math.round(pace % 60)
    return `${m}:${String(s).padStart(2, "0")}/km`
}
function pad2(n: number) { return String(n).padStart(2, "0") }
function parseTimeStr(t?: string) {
    if (!t) return undefined
    const parts = String(t).split(":").map(x => Number(x))
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return undefined
}
function formatPBText(v?: string | number | null, kind?: "5000" | "10000" | "half") {
    if (v == null) return "—"
    const sec = typeof v === "number" ? v : parseTimeStr(v)
    if (sec == null || sec <= 0) return "—"
    if (kind === "half") return formatSeconds(sec)
    const m = Math.floor(sec / 60)
    const s = sec - m * 60
    let secStr = s.toFixed(2)
    if (secStr === "60.00") return `${pad2(m + 1)}:00.00`
    const [si, sf] = secStr.split(".")
    return `${pad2(m)}:${String(si).padStart(2, "0")}.${sf}`
}

function SchoolIzumo({ id, year }: { id?: number | string, year?: number | string }) {
    const schoolId = useMemo(() => {
        const n = typeof id === "string" ? Number(id) : (id as number | undefined)
        return n != null && Number.isFinite(n) ? n : undefined
    }, [id])

    const [edition, setEdition] = useState<any | null>(null)
    const [team, setTeam] = useState<any | null>(null)
    const [results, setResults] = useState<any[]>([])
    const [intervals, setIntervals] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [schools, setSchools] = useState<any[]>([])

    useEffect(() => {
        ; (async () => {
            const ekidens = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            const izumo = ekidens.find((e: any) => e.name === "出雲") || ekidens.find((e: any) => e.name === "出云")
            if (!izumo) return
            const eds = await fetchPublicOrApi<any[]>("public-editions", Number(izumo.id), `/api/editions?ekidenId=${izumo.id}`)
            const y = year != null ? Number(year) : undefined
            const target = (y != null && Number.isFinite(y)) ? (eds.find((x: any) => Number(x.year) === Number(y)) || null) : null
            setEdition(target)
            if (!target || !schoolId) return
            setSchools(await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools"))
            const teams = await fetchPublicOrApi<any[]>("public-teams", Number(target.id), `/api/teams?Ekiden_thId=${target.id}`)
            const t = teams.find((x: any) => Number(x.schoolId) === Number(schoolId)) || null
            setTeam(t)
            const res = t ? await fetchPublicOrApi<any[]>("public-ekiden-results", { teamId: Number(t.id), thId: Number(target.id) }, `/api/ekiden-results?ekiden_no_teamId=${t.id}&Ekiden_thId=${target.id}`) : []
            setResults(Array.isArray(res) ? res : [])
            const ivs = await fetchPublicOrApi<any[]>("public-intervals", Number(izumo.id), `/api/intervals?ekidenId=${izumo.id}`)
            setIntervals(Array.isArray(ivs) ? ivs : [])
            const stu = await fetchPublicOrApi<any[]>("public-students", Number(schoolId), `/api/students?schoolId=${schoolId}`)
            setStudents(Array.isArray(stu) ? stu : [])
        })()
    }, [id, year])

    const intervalKmMap = useMemo(() => {
        const m = new Map<number, number>()
        intervals.forEach((i: any) => { if (Number.isFinite(i.kilometer)) m.set(Number(i.id), Number(i.kilometer)) })
        return m
    }, [intervals])

    const studentMap = useMemo(() => {
        const m = new Map<number, any>()
        students.forEach(s => m.set(Number(s.id), s))
        return m
    }, [students])

    const schoolMap = useMemo(() => {
        const m = new Map<number, string>()
        schools.forEach((s: any) => m.set(Number(s.id), String(s.name)))
        return m
    }, [schools])

    const teamView = useMemo(() => {
        if (!team) return null
        const asc = (results || []).map((it: any) => ({
            name: studentMap.get(Number(it.studentId))?.name ?? it.studentName ?? "—",
            sec: typeof it.score === "number" ? it.score : null,
            rank: typeof it.rank === "number" ? it.rank : null,
            km: intervalKmMap.get(Number(it.baseIntervalId)) ?? null,
            intervalName: it.intervalName ?? "",
            order: Number(it.baseIntervalId) || 0,
            pb5000: studentMap.get(Number(it.studentId))?.score_5000m ?? null,
            pb10000: studentMap.get(Number(it.studentId))?.score_10000m ?? null,
            pbHalf: studentMap.get(Number(it.studentId))?.score_half_marathon ?? null,
        })).sort((a: any, b: any) => a.order - b.order)
        let run = 0
        const withCum = asc.map((s: any) => { if (s.sec && s.sec > 0) run += s.sec; return { ...s, cumSec: run > 0 ? run : null } })
        const totalSec = withCum.reduce((acc: number, s: any) => acc + (s.sec && s.sec > 0 ? s.sec : 0), 0)
        const schoolName = schoolMap.get(Number(team.schoolId)) ?? (team.schoolName ?? `学校 ${team.schoolId}`)
        return { id: team.id, schoolName, totalSec, slots: withCum }
    }, [team, results, intervalKmMap, studentMap, schoolMap])

    if (!edition || !teamView) return <div style={{ padding: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#eee", borderRadius: 8, background: "#fff" }}>未找到队伍或该年成绩</div>

    return (
        <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-baseline justify-between">
                <div className="text-lg font-bold">{teamView.schoolName}（出雲 第{edition.ekiden_th}届 / {edition.year}）</div>
                <div className="text-sm text-gray-600">总时间：{formatSeconds(teamView.totalSec)}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {(teamView.slots || []).map((slot: any, idx: number) => (
                    <div key={idx} className="relative rounded-lg border p-3" style={{ backgroundColor: (slot.rank === 1 ? "#FFD700" : slot.rank === 2 ? "#C0C0C0" : slot.rank === 3 ? "#CD7F32" : "#F9FAFB") }}>
                        <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{slot.name}</div>
                            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(slot.pb5000, "5000")}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(slot.pb10000, "10000")}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(slot.pbHalf, "half")}</div>
                            {/* <span>此时位次：—</span> */}
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
    )
}

export default SchoolIzumo
