"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Select, Tooltip } from "antd"

export default function RankPage() {
    const params = useParams() as { th?: string }
    const router = useRouter()
    const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [eventYear, setEventYear] = useState<number | undefined>(undefined)
    const [schools, setSchools] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(undefined)
    const [members, setMembers] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [rankBySlot, setRankBySlot] = useState<Record<number, { studentId: number; name: string; count: number }[]>>({})
    const [entriesById, setEntriesById] = useState<Record<number, any[]>>({})
    const [top3Only, setTop3Only] = useState<boolean>(true)
    const [ekidenIdToName, setEkidenIdToName] = useState<Record<number, "出雲" | "全日本" | "箱根" | undefined>>({})

    useEffect(() => {
        try {
            const raw = localStorage.getItem("hakone_summary")
            if (raw) {
                const d = JSON.parse(raw)
                if (d?.school) {
                    const nm = String(d.school)
                        ; (async () => {
                            const res = await fetch("/api/admin/schools")
                            const list = await res.json()
                            setSchools(list)
                            const sch = list.find((s: any) => s.name === nm)
                            if (sch) setSelectedSchoolId(sch.id)
                        })()
                }
            }
        } catch { }
        const mm = window.matchMedia('(max-width: 768px)')
        const onChange = () => setIsMobile(mm.matches)
        onChange()
        mm.addEventListener ? mm.addEventListener('change', onChange) : mm.addListener(onChange as any)
        return () => { mm.removeEventListener ? mm.removeEventListener('change', onChange) : mm.removeListener(onChange as any) }
    }, [])

    useEffect(() => {
        ; (async () => {
            const ekidensRes = await fetch("/api/admin/ekidens")
            const ekidensData = await ekidensRes.json()
            const hakone = ekidensData.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const edRes = await fetch(`/api/admin/editions?ekidenId=${hakone.id}`)
            const eds = await edRes.json()
            const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
            if (ed) { setEkidenThId(ed.id); setEventYear(Number(ed.year)) }
            const idNameMap: Record<number, "出雲" | "全日本" | "箱根" | undefined> = {}
            ekidensData.forEach((e: any) => { if (e?.name === "出雲" || e?.name === "全日本" || e?.name === "箱根") idNameMap[e.id] = e.name })
            setEkidenIdToName(idNameMap)
            if (schools.length === 0) {
                const schoolsRes = await fetch("/api/admin/schools")
                setSchools(await schoolsRes.json())
            }
        })()
    }, [params?.th])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId) return
            const teamsRes = await fetch(`/api/admin/teams?Ekiden_thId=${ekidenThId}`)
            const tlist = await teamsRes.json()
            setTeams(tlist)
            if (!selectedSchoolId && tlist.length) {
                const t0 = tlist[tlist.length - 1]
                setSelectedSchoolId(t0.schoolId)
            }
        })()
    }, [ekidenThId])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId || !selectedSchoolId) return
            const team = teams.find((t: any) => t.schoolId === selectedSchoolId)
            if (!team) return
            const memRes = await fetch(`/api/admin/team-members?ekiden_no_teamId=${team.id}`)
            const mems = await memRes.json()
            setMembers(mems)
            const stuRes = await fetch(`/api/admin/students?schoolId=${selectedSchoolId}`)
            const studs = await stuRes.json()
            setStudents(studs)
            try {
                const idsParam = mems.map((m: any) => m.studentId).filter((id: any) => Number.isFinite(id))
                if (idsParam.length) {
                    const entRes = await fetch(`/api/admin/student-entries?studentIds=${idsParam.join(',')}`)
                    const ent = await entRes.json()
                    const map: Record<number, any[]> = {}
                    for (const e of ent) {
                        if (!map[e.studentId]) map[e.studentId] = []
                        map[e.studentId].push(e)
                    }
                    setEntriesById(map)
                } else {
                    setEntriesById({})
                }
            } catch { }
            const listRes = await fetch(`/api/predict/hakone/list?ekidenThId=${ekidenThId}&schoolId=${selectedSchoolId}`)
            const lst = await listRes.json()
            const slots = Array.from({ length: 10 }, (_, i) => i + 1)
            const memberIds = new Set<number>(mems.map((m: any) => m.studentId).filter(Boolean))
            const nameMap = new Map<number, string>()
            studs.forEach((s: any) => nameMap.set(s.id, s.name))
            const countsBySlot = new Map<number, Map<number, number>>()
            slots.forEach(slot => countsBySlot.set(slot, new Map<number, number>()))
            for (const g of (lst?.groups ?? [])) {
                for (const it of (g.items ?? [])) {
                    const slot = Number(it.slot)
                    const pid = Number(it.playerId || 0)
                    if (!Number.isFinite(slot) || !Number.isFinite(pid) || pid === 0) continue
                    if (!countsBySlot.has(slot)) continue
                    if (!memberIds.has(pid)) continue
                    const m = countsBySlot.get(slot)!
                    m.set(pid, (m.get(pid) || 0) + 1)
                }
            }
            const next: Record<number, { studentId: number; name: string; count: number }[]> = {}
            slots.forEach(slot => {
                const m = countsBySlot.get(slot)!
                const rows = Array.from(memberIds).map(id => ({ studentId: id, name: nameMap.get(id) || String(id), count: m.get(id) || 0 }))
                rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
                next[slot] = rows.slice(0, 16)
            })
            setRankBySlot(next)
        })()
    }, [ekidenThId, selectedSchoolId, teams])

    function formatSeconds(sec?: number | null) {
        if (sec == null) return "—"
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        const hhStr = String(h).padStart(2, "0")
        const mmStr = String(m).padStart(2, "0")
        const ssStr = String(s).padStart(2, "0")
        return `${hhStr}:${mmStr}:${ssStr}`
    }
    function parseTimeStr(t?: string) {
        if (!t) return undefined
        const parts = String(t).split(":").map(x => Number(x))
        if (parts.length === 2) return parts[0] * 60 + parts[1]
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return undefined
    }
    function formatPBText(v?: string | number, kind?: "5000" | "10000" | "half" | "full") {
        if (v == null) return "—"
        const sec = typeof v === "number" ? v : parseTimeStr(v)
        if (!sec || sec <= 0) return "—"
        if (kind === "half" || kind === "full") return formatSeconds(sec)
        const m = Math.floor(sec / 60)
        const s = Math.floor(sec % 60)
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    }
    type Grade = 1 | 2 | 3 | 4
    function calcGrade(entryYear?: number): Grade | undefined {
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
    type EkidenType = "出雲" | "全日本" | "箱根"
    type EntryRecord = { ekiden: EkidenType; grade: Grade; intervalName?: string; rank?: number; time?: string }
    function renderEntriesGridByPlayer(playerId?: number | null) {
        const raw = (playerId && entriesById[playerId]) ? entriesById[playerId] : []
        const grades: Grade[] = [1, 2, 3, 4]
        const cols: EkidenType[] = ["出雲", "全日本", "箱根"]
        const gradeMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 }
        const lookup = new Map<string, EntryRecord>()
        raw.forEach((it: any) => {
            const g = gradeMap[String(it.grade)] as Grade
            const name = ekidenIdToName[it.ekidenId]
            if (!name) return
            const rec: EntryRecord = { ekiden: name, grade: g, intervalName: it.intervalName, rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined }
            lookup.set(`${g}-${name}`, rec)
        })
        function cellBg(rec?: EntryRecord) {
            if (!rec) return undefined
            if (rec.rank === 1) return "#ffd700"
            if (rec.rank === 2) return "#c0c0c0"
            if (rec.rank === 3) return "#cd7f32"
            return undefined
        }
        return (
            <div style={{ border: "1px solid #ddd", borderRadius: 8 }}>
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
                                const text = rec?.intervalName ? `${rec.intervalName}${rec?.rank ? `${rec.rank}位` : ""}` : ""
                                return (
                                    <div key={`${g}-${c}`} style={{ padding: 6, textAlign: "center", borderTop: "1px solid #eee", borderRight: "1px solid #eee", background: cellBg(rec), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        <div style={{ whiteSpace: "nowrap" }}><strong>{text}</strong></div>
                                        {rec?.time && (<div style={{ fontSize: 12, color: "#555", marginTop: 2, whiteSpace: "nowrap" }}><strong>{rec.time}</strong></div>)}
                                    </div>
                                )
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        )
    }
    function PlayerTooltip({ student, playerId }: { student: { name?: string | null; score5000m?: string | number | null; score10000m?: string | number | null; scoreHalf?: string | number | null; collegePB?: string | number | null; entryYear?: number | null } | null, playerId?: number | null }) {
        const s = student || null
        return (
            <div style={{ flex: "0 0 280px", border: "1px solid #000000", borderRadius: 10, background: "#fff", padding: 10 }}>
                <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>队员详情</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8, fontSize: 12 }}>
                    <div>姓名：{s?.name ?? "—"}</div>
                    <div>年级：{gradeText(calcGrade(s?.entryYear ?? undefined))}</div>
                    <div>5000m：{formatPBText(s?.score5000m as any, "5000") ?? "--"}</div>
                    <div>10000m：{formatPBText(s?.score10000m as any, "10000") ?? "--"}</div>
                    <div>半程：{formatPBText(s?.scoreHalf as any, "half") ?? "--"}</div>
                    <div>高校PB：{formatPBText(s?.collegePB as any, "5000") ?? "--"}</div>
                </div>
                {renderEntriesGridByPlayer(playerId)}
            </div>
        )
    }

    const schoolOptions = useMemo(() => teams.map((t: any) => ({ value: t.schoolId, label: (schools.find((s: any) => s.id === t.schoolId)?.name ?? String(t.schoolId)) })), [teams, schools])

    return (
        <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{ fontSize: 20 }}>{`第${params?.th ?? ""}回箱根驿传 预测排名`}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Select style={{ minWidth: 240 }} value={selectedSchoolId ?? undefined} options={schoolOptions} onChange={(v) => setSelectedSchoolId(v)} placeholder="选择学校" />
                    <button onClick={() => setTop3Only(v => !v)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>{top3Only ? "查看全数据" : "只展示前三名"}</button>
                </div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(5, 1fr)", gap: isMobile ? 6 : 8 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(slot => (
                    <div key={slot} style={{ border: "1px solid #ddd", borderRadius: 8, background: "#fff", padding: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>{slot}区</div>
                            {/* <div style={{ color: "#666", fontSize: 11 }}>十六人榜</div> */}
                        </div>
                        <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: isMobile ? "32px 1fr 48px" : "40px 1fr 60px", gap: 4 }}>
                            {((rankBySlot[slot] || Array.from({ length: 16 }, () => ({ studentId: 0, name: "—", count: 0 }))))
                                .slice(0, top3Only ? 3 : 16)
                                .map((row, idx) => (
                                    <React.Fragment key={`${slot}-${row.studentId}-${idx}`}>
                                        <div style={{ border: "1px solid #eee", borderRadius: 6, padding: isMobile ? "4px 6px" : "6px 8px", textAlign: "center", color: "#666", background: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : undefined }}>{idx + 1}</div>
                                        {(() => {
                                            const stu = students.find((s: any) => s.id === row.studentId)
                                            const shaped = stu ? { name: stu.name, score5000m: stu.score_5000m ?? null, score10000m: stu.score_10000m ?? null, scoreHalf: stu.score_half_marathon ?? null, collegePB: stu.score_college_pb ?? null, entryYear: stu.entryYear ?? null } : null
                                            return (
                                                <Tooltip title={<PlayerTooltip student={shaped} playerId={row.studentId} />} styles={{ container: { border: "2px solid #030303", minWidth: isMobile ? 280 : 400 } }} color="#fff">
                                                    <div style={{ border: "1px solid #eee", borderRadius: 6, padding: isMobile ? "4px 6px" : "6px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : undefined }}><strong>{row.name}</strong></div>
                                                </Tooltip>
                                            )
                                        })()}
                                        <div style={{ border: "1px solid #eee", borderRadius: 6, padding: isMobile ? "4px 6px" : "6px 8px", textAlign: "right", fontWeight: 700, background: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : undefined }}>{row.count}</div>
                                    </React.Fragment>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ position: "fixed", right: 24, bottom: 80, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
                <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}`)} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>返回分配</button>
                <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}/result`)} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>返回结果</button>
                <button onClick={() => { try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch { window.scrollTo(0, 0) } }} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>回到顶部</button>
            </div>
        </div>
    )
}
