"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Segmented } from "antd"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

function pad2(n: number) { return String(n).padStart(2, "0") }
function formatSeconds(sec?: number | null) {
    if (sec == null || !Number.isFinite(sec)) return "—"
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}
function formatPBText(sec?: number | null, kind?: "5000" | "10000" | "half") {
    if (sec == null || !Number.isFinite(sec)) return "—"
    if (kind === "half") return formatSeconds(sec)
    const m = Math.floor(sec / 60)
    const s = sec - m * 60
    let secStr = s.toFixed(2)
    if (secStr === "60.00") return `${pad2(m + 1)}:00.00`
    const [si, sf] = secStr.split(".")
    return `${pad2(m)}:${String(si).padStart(2, "0")}.${sf}`
}

export default function SchoolPBPage() {
    const params = useParams() as { th?: string }
    const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
    const [schools, setSchools] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [membersByTeam, setMembersByTeam] = useState<Record<number, any[]>>({})
    const [studentsBySchool, setStudentsBySchool] = useState<Record<number, any[]>>({})
    const [sortBy, setSortBy] = useState<"5000" | "10000" | "half">("5000")

    useEffect(() => {
        ; (async () => {
            const ekidensData = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            const hakone = ekidensData.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
            const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
            if (ed) setEkidenThId(ed.id)
            setSchools(await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools"))
        })()
    }, [params?.th])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId) return
            const tlist = await fetchPublicOrApi<any[]>("public-teams", Number(ekidenThId), `/api/teams?Ekiden_thId=${ekidenThId}`)
            setTeams(tlist)
            const membersMap: Record<number, any[]> = {}
            for (const t of tlist) {
                membersMap[t.id] = await fetchPublicOrApi<any[]>("public-team-members", Number(t.id), `/api/team-members?ekiden_no_teamId=${t.id}`)
            }
            setMembersByTeam(membersMap)
            const schoolIds: number[] = Array.from(new Set(tlist.map((t: any) => Number(t.schoolId))))
            const studentsMap: Record<number, any[]> = {}
            for (const sid of schoolIds) {
                studentsMap[sid] = await fetchPublicOrApi<any[]>("public-students", Number(sid), `/api/students?schoolId=${sid}`)
            }
            setStudentsBySchool(studentsMap)
        })()
    }, [ekidenThId])

    const schoolName = useMemo(() => {
        const m = new Map<number, string>()
        schools.forEach((s: any) => m.set(s.id, s.name))
        return m
    }, [schools])

    const membersBySchool = useMemo(() => {
        const map = new Map<number, number[]>()
        teams.forEach((t: any) => {
            const arr = map.get(t.schoolId) || []
            const mems = membersByTeam[t.id] || []
            mems.forEach((m: any) => arr.push(m.studentId))
            map.set(t.schoolId, arr)
        })
        return map
    }, [teams, membersByTeam])

    function top10Avg(schoolId: number, kind: "5000" | "10000" | "half") {
        const students = studentsBySchool[schoolId] || []
        const ids = new Set(membersBySchool.get(schoolId) || [])
        const vals: number[] = []
        for (const s of students) {
            if (!ids.has(s.id)) continue
            const v = kind === "5000" ? s.score_5000m : kind === "10000" ? s.score_10000m : s.score_half_marathon
            if (v == null) continue
            const n = Number(v)
            if (!Number.isFinite(n) || n <= 0) continue
            vals.push(n)
        }
        vals.sort((a, b) => a - b)
        const top = vals.slice(0, 10)
        if (!top.length) return null
        const avg = top.reduce((acc, x) => acc + x, 0) / top.length
        return avg
    }

    const rows = useMemo(() => {
        const list: { schoolId: number; school: string; avg5000: number | null; avg10000: number | null; avgHalf: number | null }[] = []
        const ids = Array.from(new Set(teams.map((t: any) => t.schoolId)))
        for (const sid of ids) {
            list.push({
                schoolId: sid,
                school: schoolName.get(sid) || String(sid),
                avg5000: top10Avg(sid, "5000"),
                avg10000: top10Avg(sid, "10000"),
                avgHalf: top10Avg(sid, "half"),
            })
        }
        return list
    }, [teams, schoolName, studentsBySchool, membersBySchool])

    function rankMap(values: (number | null)[]) {
        const arr = values.map((v, i) => ({ v, i })).filter(x => x.v != null).sort((a, b) => (a.v as number) - (b.v as number))
        const m = new Map<number, number>()
        arr.forEach((x, idx) => m.set(x.i, idx + 1))
        return m
    }

    const rank5000 = useMemo(() => rankMap(rows.map(r => r.avg5000)), [rows])
    const rank10000 = useMemo(() => rankMap(rows.map(r => r.avg10000)), [rows])
    const rankHalf = useMemo(() => rankMap(rows.map(r => r.avgHalf)), [rows])

    function schoolBg(sid: number) {
        const h = (sid * 57) % 360
        return `hsl(${h}, 60%, 95%)`
    }

    const sorted = useMemo(() => {
        return rows.slice().sort((a, b) => {
            const av = sortBy === "5000" ? a.avg5000 : sortBy === "10000" ? a.avg10000 : a.avgHalf
            const bv = sortBy === "5000" ? b.avg5000 : sortBy === "10000" ? b.avg10000 : b.avgHalf
            if (av == null && bv == null) return 0
            if (av == null) return 1
            if (bv == null) return -1
            return av - bv
        })
    }, [rows, sortBy])

    return (
        <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
            <h1 style={{ fontSize: 20 }}>{`第${params?.th ?? ""}回箱根驿传 学校PB排行榜`}</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                <button onClick={() => location.assign(`/`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>返回主页</button>
                <Segmented value={sortBy} onChange={(v) => setSortBy(v as any)} options={[{ label: "5000", value: "5000" }, { label: "10000", value: "10000" }, { label: "半马", value: "half" }]} />
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 3fr 80px 160px 80px 160px 80px 160px", gap: 0, fontWeight: 700 }}>
                    <div style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", borderRight: "1px solid #eee" }}>排名</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "1px solid #eee" }}>学校</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderLeft: "2px solid #999", borderRight: "1px solid #eee" }}>五千排名</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "2px solid #999" }}>五千平均</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderLeft: "2px solid #999", borderRight: "1px solid #eee" }}>万米排名</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "2px solid #999" }}>万米平均</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderLeft: "2px solid #999", borderRight: "1px solid #eee" }}>半马排名</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "2px solid #999" }}>半马平均</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "60px 3fr 80px 160px 80px 160px 80px 160px", gap: 0, background: "rgba(var(--panel-bg-rgb), var(--panel-opacity))" }}>
                    {sorted.map((r, idx) => (
                        <React.Fragment key={r.schoolId}>
                            <div style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: schoolBg(r.schoolId) }}>{String(idx + 1).padStart(2, "0")}</div>
                            <div onClick={() => location.assign(`/predict/hakone/${params?.th ?? ""}?schoolId=${r.schoolId}`)} style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "1px solid #eee", cursor: "pointer", background: schoolBg(r.schoolId) }}>{r.school}</div>
                            <div style={{ padding: 6, borderBottom: "1px solid #eee", borderLeft: "2px solid #999", borderRight: "1px solid #eee", background: schoolBg(r.schoolId) }}>{rank5000.get(rows.indexOf(r)) ?? "—"}</div>
                            <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "2px solid #999", background: schoolBg(r.schoolId) }}>{r.avg5000 != null ? formatPBText(r.avg5000, "5000") : "—"}</div>
                            <div style={{ padding: 6, borderBottom: "1px solid #eee", borderLeft: "2px solid #999", borderRight: "1px solid #eee", background: schoolBg(r.schoolId) }}>{rank10000.get(rows.indexOf(r)) ?? "—"}</div>
                            <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "2px solid #999", background: schoolBg(r.schoolId) }}>{r.avg10000 != null ? formatPBText(r.avg10000, "10000") : "—"}</div>
                            <div style={{ padding: 6, borderBottom: "1px solid #eee", borderLeft: "2px solid #999", borderRight: "1px solid #eee", background: schoolBg(r.schoolId) }}>{rankHalf.get(rows.indexOf(r)) ?? "—"}</div>
                            <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "2px solid #999", background: schoolBg(r.schoolId) }}>{r.avgHalf != null ? formatPBText(r.avgHalf, "half") : "—"}</div>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    )
}

