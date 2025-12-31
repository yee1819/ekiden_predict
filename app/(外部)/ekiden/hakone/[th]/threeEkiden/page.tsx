"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

type EkidenType = "出雲" | "全日本" | "箱根"

function formatSeconds(sec?: number | null) {
    if (sec == null) return "—"
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    const hhStr = String(h).padStart(2, "0")
    const mmStr = String(m).padStart(2, "0")
    const ssStr = String(s).padStart(2, "0")
    if (h === 0) return `${mmStr}:${ssStr}`
    return `${hhStr}:${mmStr}:${ssStr}`
}

function pad2(n: number) { return String(n).padStart(2, "0") }
function parseTimeStr(t?: string) {
    if (!t) return undefined
    const parts = String(t).split(":").map(x => Number(x))
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return undefined
}
function formatPBText(v?: string | number, kind?: "5000" | "10000" | "half") {
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
type Grade = 1 | 2 | 3 | 4
function calcGrade(entryYear?: number, eventYear?: number): Grade | undefined {
    if (!eventYear || !entryYear) return undefined
    const g = eventYear - entryYear + 1
    if (g < 1) return 1 as Grade
    if (g > 4) return 4 as Grade
    return g as Grade
}
function gradeText(g?: Grade) {
    if (!g) return "—"
    return g === 1 ? "一年" : g === 2 ? "二年" : g === 3 ? "三年" : "四年"
}

export default function ThreeEkidenPage() {
    const params = useParams() as { th?: string }
    const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
    const [eventYear, setEventYear] = useState<number | undefined>(undefined)
    const [schools, setSchools] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [rosterByTeam, setRosterByTeam] = useState<Record<number, any[]>>({})
    const [entriesByStudent, setEntriesByStudent] = useState<Record<number, any[]>>({})
    const [editionByEkidenName, setEditionByEkidenName] = useState<Record<EkidenType, number | undefined>>({ 出雲: undefined, 全日本: undefined, 箱根: undefined })
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(undefined)
    const [studentsBySchool, setStudentsBySchool] = useState<Record<number, any[]>>({})
    const [layoutMode, setLayoutMode] = useState<"4x4" | "2x8">("4x4")
    const [isMobile, setIsMobile] = useState<boolean>(false)

    useEffect(() => {
        ; (async () => {
            const ekidens = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            const hakone = ekidens.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
            const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
            if (!ed) return
            setEkidenThId(ed.id)
            setEventYear(Number(ed.year))
            const izumo = ekidens.find((e: any) => e.name === "出雲")
            const zennihon = ekidens.find((e: any) => e.name === "全日本")
            const izumoEd = izumo ? (await fetchPublicOrApi<any[]>("public-editions", Number(izumo.id), `/api/editions?ekidenId=${izumo.id}`)).find((x: any) => Number(x.year) === Number(ed.year)) : undefined
            const zenEd = zennihon ? (await fetchPublicOrApi<any[]>("public-editions", Number(zennihon.id), `/api/editions?ekidenId=${zennihon.id}`)).find((x: any) => Number(x.year) === Number(ed.year)) : undefined
            setEditionByEkidenName({ 出雲: izumoEd?.id, 全日本: zenEd?.id, 箱根: ed.id })
            setSchools(await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools"))
        })()
    }, [params?.th])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId) return
            const tlist = await fetchPublicOrApi<any[]>("public-teams", Number(ekidenThId), `/api/teams?Ekiden_thId=${ekidenThId}`)
            setTeams(tlist)
            if (!tlist.length) return
            const rosterEntries = await Promise.all(tlist.map(async (t: any) => {
                const j = await fetchPublicOrApi<any[]>("public-team-members", Number(t.id), `/api/team-members?ekiden_no_teamId=${t.id}`)
                return [t.id, j] as [number, any[]]
            }))
            const rosterMap = Object.fromEntries(rosterEntries)
            setRosterByTeam(rosterMap)
            const ids = Array.from(new Set(Object.values(rosterMap).flat().map((m: any) => m.studentId).filter((id: any) => Number.isFinite(id))))
            if (ids.length) {
                const ent = await fetchPublicOrApi<any[]>("public-student-entries", ids.slice().sort((a, b) => a - b), `/api/student-entries?studentIds=${ids.join(',')}`)
                const map: Record<number, any[]> = {}
                for (const e of ent) {
                    if (!map[e.studentId]) map[e.studentId] = []
                    map[e.studentId].push(e)
                }
                setEntriesByStudent(map)
            } else {
                setEntriesByStudent({})
            }
        })()
    }, [ekidenThId])

    const teamsBySchool = useMemo(() => {
        const bySchool = new Map<number, any[]>()
        teams.forEach((t: any) => {
            const arr = bySchool.get(t.schoolId) || []
            arr.push(t)
            bySchool.set(t.schoolId, arr)
        })
        return bySchool
    }, [teams])

    const availableSchoolIds = useMemo(() => {
        return [...teamsBySchool.keys()].sort((a, b) => a - b)
    }, [teamsBySchool])

    useEffect(() => {
        if (availableSchoolIds.length && (selectedSchoolId == null || !availableSchoolIds.includes(selectedSchoolId))) {
            setSelectedSchoolId(availableSchoolIds[0])
        }
    }, [availableSchoolIds])

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768)
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])

    useEffect(() => {
        ; (async () => {
            if (selectedSchoolId == null) return
            const arr = await fetchPublicOrApi<any[]>("public-students", Number(selectedSchoolId), `/api/students?schoolId=${selectedSchoolId}`)
            setStudentsBySchool(prev => ({ ...prev, [selectedSchoolId]: arr }))
        })()
    }, [selectedSchoolId])

    const studentMap = useMemo(() => {
        const map = new Map<number, any>()
        Object.entries(studentsBySchool).forEach(([sid, arr]) => { (arr as any[]).forEach(s => map.set(s.id, s)) })
        return map
    }, [studentsBySchool])

    function displayName(studentId?: number, fallback?: any) {
        if (!studentId) return fallback ?? "—"
        const s = studentMap.get(studentId)
        return s?.name ?? (fallback ?? studentId)
    }

    function renderPBGrid(studentId?: number) {
        const s = studentId ? studentMap.get(studentId) : null
        if (!s) return null
        return (
            <div style={{ border: "1px solid #eee", borderRadius: 8, background: "#fff", padding: 8, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, fontSize: 12 }}>
                    <div>姓名：{s?.name ?? "—"}</div>
                    <div>年级：{gradeText(calcGrade(s?.entryYear, eventYear))}</div>
                    <div>5000m：{formatPBText(s?.score_5000m, "5000") ?? "--"}</div>
                    <div>10000m：{formatPBText(s?.score_10000m, "10000") ?? "--"}</div>
                    <div>半程：{formatPBText(s?.score_half_marathon, "half") ?? "--"}</div>
                    <div>高校PB：{formatPBText(s?.score_college_pb, "5000") ?? "--"}</div>
                </div>
            </div>
        )
    }

    const ekidenIdByName: Record<EkidenType, number> = { 出雲: 5, 全日本: 4, 箱根: 3 }

    const [viewScope, setViewScope] = useState<"current" | "all">("all")

    function resultCell(studentId?: number, ekiden?: EkidenType) {
        if (!studentId || !ekiden) return "—"
        const list = entriesByStudent[studentId] || []
        const item = (() => {
            if (viewScope === "current") {
                const thId = ekiden ? editionByEkidenName[ekiden] : undefined
                return thId ? list.find((x: any) => Number(x.thId) === Number(thId)) : undefined
            } else {
                const targetId = ekidenIdByName[ekiden]
                const arr = list.filter((x: any) => Number(x.ekidenId) === Number(targetId))
                if (!arr.length) return undefined
                return arr.slice().sort((a: any, b: any) => Number(a.thId) - Number(b.thId)).at(-1)
            }
        })()
        const name = item?.intervalName || "—"
        const time = typeof item?.score === "number" ? formatSeconds(item?.score) : "—"
        const rank = item?.rank ? `${item.rank}位` : ""
        return `${name}${time !== "—" ? ` ${time}` : ""}${rank ? ` ${rank}` : ""}`
    }

    function currentEntry(studentId?: number, ekiden?: EkidenType) {
        if (!studentId || !ekiden) return undefined as any
        const thId = editionByEkidenName[ekiden]
        const list = entriesByStudent[studentId] || []
        return thId ? list.find((x: any) => Number(x.thId) === Number(thId)) : undefined
    }

    function entryText(item?: any) {
        const name = item?.intervalName || "—"
        const time = typeof item?.score === "number" ? formatSeconds(item?.score) : "—"
        const rank = item?.rank ? `${item.rank}位` : ""
        return `${name}${time !== "—" ? ` ${time}` : ""}${rank ? ` ${rank}` : ""}`
    }

    function cellBgRank(rank?: number) {
        if (rank === 1) return "#ffd700"
        if (rank === 2) return "#c0c0c0"
        if (rank === 3) return "#cd7f32"
        return undefined
    }

    return (
        <div style={{ padding: 16, maxWidth: 1400, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h1 style={{ fontSize: 18, fontWeight: 800 }}>{`第${params?.th ?? ""}回 学校队伍三大驿传成绩（本届16人）`}</h1>
                <div style={{ flex: 1 }} />
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#555" }}>学校</span>
                    <select
                        value={selectedSchoolId ?? ""}
                        onChange={(e) => setSelectedSchoolId(Number(e.target.value))}
                        style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, background: "#fff" }}
                    >
                        <option value="" disabled>选择学校</option>
                        {availableSchoolIds.map((id) => {
                            const sc = schools.find((s: any) => s.id === id)
                            return (
                                <option key={id} value={id}>{sc?.name ?? `学校 ${id}`}</option>
                            )
                        })}
                    </select>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#555" }}>范围</span>
                    <select
                        value={viewScope}
                        onChange={(e) => setViewScope(e.target.value as any)}
                        style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, background: "#fff" }}
                    >
                        <option value="current">本年度</option>
                        <option value="all">所有三大驿传</option>
                    </select>
                </label>
                {viewScope === "all" ? (
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "#555" }}>布局</span>
                        <select
                            value={layoutMode}
                            onChange={(e) => setLayoutMode(e.target.value as any)}
                            style={{ padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, background: "#fff" }}
                        >
                            <option value="4x4">4×4</option>
                            <option value="2x8">2×8</option>
                        </select>
                    </label>
                ) : null}
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 16 }}>
                {availableSchoolIds.filter((id) => selectedSchoolId != null ? id === selectedSchoolId : false).map((schoolId) => {
                    const sc = schools.find((s: any) => s.id === schoolId)
                    const teamList = teamsBySchool.get(schoolId) || []
                    const team = teamList[0]
                    const roster = team ? (rosterByTeam[team.id] || []) : []
                    return (
                        <div key={schoolId} style={{ border: "1px solid #ddd", borderRadius: 10, background: `rgba(${getComputedStyle(document.documentElement).getPropertyValue('--panel-bg-rgb') || '255,255,255'}, ${getComputedStyle(document.documentElement).getPropertyValue('--panel-opacity') || '0.92'})`, padding: 12 }}>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{sc?.name ?? `学校 ${schoolId}`}</div>
                                <span style={{ fontSize: 12, color: "#666" }}>{roster.length ? `本届队伍人数：${roster.length}` : "无队伍数据"}</span>
                            </div>
                            {viewScope === "current" ? (
                                <div style={{ display: "grid", gridTemplateColumns: "minmax(18ch, 1fr) repeat(3, minmax(18ch, 1fr))", gap: 6, alignItems: "center" }}>
                                    <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee" }}>队员</div>
                                    <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", textAlign: "center" }}>出雲</div>
                                    <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", textAlign: "center" }}>全日本</div>
                                    <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", textAlign: "center" }}>箱根</div>
                                    {(() => {
                                        const sortedRoster = roster.slice().sort((a: any, b: any) => {
                                            const sa = studentMap.get(a.studentId)
                                            const sb = studentMap.get(b.studentId)
                                            const ga = calcGrade(sa?.entryYear, eventYear)
                                            const gb = calcGrade(sb?.entryYear, eventYear)
                                            const na = ga == null ? -1 : ga
                                            const nb = gb == null ? -1 : gb
                                            if (na === -1 && nb !== -1) return 1
                                            if (nb === -1 && na !== -1) return -1
                                            return nb - na
                                        })
                                        return sortedRoster.map((m: any) => (
                                            <React.Fragment key={m.id}>
                                                <div style={{ padding: 6, borderTop: "1px solid #eee" }}>{displayName(m.studentId, m.studentName)}</div>
                                                {(() => { const it = currentEntry(m.studentId, "出雲"); return (<div style={{ padding: 6, borderTop: "1px solid #eee", textAlign: "center", background: cellBgRank(it?.rank) }}>{entryText(it)}</div>) })()}
                                                {(() => { const it = currentEntry(m.studentId, "全日本"); return (<div style={{ padding: 6, borderTop: "1px solid #eee", textAlign: "center", background: cellBgRank(it?.rank) }}>{entryText(it)}</div>) })()}
                                                {(() => { const it = currentEntry(m.studentId, "箱根"); return (<div style={{ padding: 6, borderTop: "1px solid #eee", textAlign: "center", background: cellBgRank(it?.rank) }}>{entryText(it)}</div>) })()}
                                            </React.Fragment>
                                        ))
                                    })()}
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : (layoutMode === "4x4" ? "repeat(4, 320px)" : "repeat(2, 320px)"), gap: 10, justifyContent: "center", margin: "0 auto" }}>
                                    {(() => {
                                        const sortedRoster = roster.slice(0, 16).sort((a: any, b: any) => {
                                            const sa = studentMap.get(a.studentId)
                                            const sb = studentMap.get(b.studentId)
                                            const ga = calcGrade(sa?.entryYear, eventYear)
                                            const gb = calcGrade(sb?.entryYear, eventYear)
                                            const na = ga == null ? -1 : ga
                                            const nb = gb == null ? -1 : gb
                                            if (na === -1 && nb !== -1) return 1
                                            if (nb === -1 && na !== -1) return -1
                                            return nb - na
                                        })
                                        return sortedRoster.map((m: any) => (
                                            <div key={m.id} style={{ border: "1px solid #eee", borderRadius: 8, background: "#fff", padding: 8, width: isMobile ? "100%" : undefined }}>
                                                <div style={{ fontWeight: 700, marginBottom: 6 }}>{displayName(m.studentId, m.studentName)}</div>
                                                {renderPBGrid(m.studentId)}
                                                {(() => {
                                                    const raw = entriesByStudent[m.studentId] || []
                                                    const gradeMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 }
                                                    const grades = [1, 2, 3, 4] as number[]
                                                    const cols: EkidenType[] = ["出雲", "全日本", "箱根"]
                                                    const lookup = new Map<string, { intervalName?: string; rank?: number; time?: string }>()
                                                    raw.forEach((it: any) => {
                                                        const g = gradeMap[String(it.grade)] as number
                                                        const name = (it.ekidenId === 5 ? "出雲" : it.ekidenId === 4 ? "全日本" : it.ekidenId === 3 ? "箱根" : undefined) as EkidenType | undefined
                                                        if (!name || !g) return
                                                        lookup.set(`${g}-${name}`, { intervalName: it.intervalName, rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined })
                                                    })
                                                    function cellBg(rec?: { rank?: number }) {
                                                        if (!rec) return undefined
                                                        if (rec.rank === 1) return "#ffd700"
                                                        if (rec.rank === 2) return "#c0c0c0"
                                                        if (rec.rank === 3) return "#cd7f32"
                                                        return undefined
                                                    }
                                                    return (
                                                        <div style={{ border: "1px solid #ddd" }}>
                                                            <div style={{ background: "#fffa9f", padding: 6, fontWeight: 600 }}>驿伝エントリー</div>
                                                            <div style={{ display: "grid", gridTemplateColumns: "60px repeat(3, minmax(8ch, 1fr))", gap: 0 }}>
                                                                <div style={{ padding: 6, borderRight: "1px solid #eee", borderBottom: "1px solid #eee" }}></div>
                                                                {cols.map(c => (
                                                                    <div key={c} style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{c}</div>
                                                                ))}
                                                                {grades.map(g => (
                                                                    <React.Fragment key={g}>
                                                                        <div style={{ padding: 6, borderTop: "1px solid #eee", borderRight: "1px solid #eee" }}>{g}年</div>
                                                                        {cols.map(c => {
                                                                            const rec = lookup.get(`${g}-${c}`)
                                                                            const text = rec?.intervalName ? `${rec.intervalName}${rec?.rank ? `${rec.rank}位` : ""}${rec?.time ? "" : ""}` : ""
                                                                            return (
                                                                                <div key={`${g}-${c}`} style={{ padding: 6, textAlign: "center", borderTop: "1px solid #eee", background: cellBg(rec), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", borderLeft: "1px solid #eee" }}>
                                                                                    <div style={{ whiteSpace: "nowrap" }}>{text}</div>
                                                                                    {rec?.time && (
                                                                                        <div style={{ fontSize: 12, color: "#555", marginTop: 2, whiteSpace: "nowrap" }}>{rec.time}</div>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </React.Fragment>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        ))
                                    })()}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

