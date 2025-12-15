"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Modal, Select } from "antd"

function pad2(n: number) { return String(n).padStart(2, "0") }
function parseTimeStr(t?: string) {
    if (!t) return undefined
    const parts = String(t).split(":").map(x => Number(x))
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return undefined
}
function formatSeconds(sec?: number | null) {
    if (sec == null || !Number.isFinite(sec)) return "—"
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
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

export default function StudentPBPage() {
    const params = useParams() as { th?: string }
    const router = useRouter()
    const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
    const [eventYear, setEventYear] = useState<number | undefined>(undefined)
    const [schools, setSchools] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [membersByTeam, setMembersByTeam] = useState<Record<number, any[]>>({})
    const [studentsBySchool, setStudentsBySchool] = useState<Record<number, any[]>>({})
    const [entriesById, setEntriesById] = useState<Record<number, any[]>>({})
    const [selectedId, setSelectedId] = useState<number | undefined>(undefined)
    const [isMobile, setIsMobile] = useState<boolean>(false)
    const [filterSchoolId, setFilterSchoolId] = useState<number | undefined>(undefined)
    const [modalSid, setModalSid] = useState<number | undefined>(undefined)
    const [metricView, setMetricView] = useState<"all" | "5000" | "10000" | "half">("all")
    const [ekidenById, setEkidenById] = useState<Map<number, string>>(new Map())
    const [ekidenShortById, setEkidenShortById] = useState<Map<number, "出雲" | "全日本" | "箱根" | "">>(new Map())
    const [intervalMaps, setIntervalMaps] = useState<Record<number, Record<number, string>>>({})
    const sec5000Ref = useRef<HTMLDivElement>(null)
    const sec10000Ref = useRef<HTMLDivElement>(null)
    const secHalfRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        ; (async () => {
            const ekidensRes = await fetch("/api/admin/ekidens")
            const ekidensData = ekidensRes.ok ? await ekidensRes.json() : []
            const hakone = ekidensData.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const m = new Map<number, string>()
            const sm = new Map<number, "出雲" | "全日本" | "箱根" | "">()
            ekidensData.forEach((e: any) => {
                m.set(e.id, e.name)
                const nm = String(e.name)
                const short = nm.includes("出雲") ? "出雲" : nm.includes("全日本") ? "全日本" : nm.includes("箱根") ? "箱根" : ""
                sm.set(e.id, short)
            })

            setEkidenById(m)
            setEkidenShortById(sm)
            const edRes = await fetch(`/api/admin/editions?ekidenId=${hakone.id}`)
            const eds = edRes.ok ? await edRes.json() : []
            const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
            if (ed) { setEkidenThId(ed.id); setEventYear(Number(ed.year)) }
            const schoolsRes = await fetch("/api/admin/schools")
            setSchools(schoolsRes.ok ? await schoolsRes.json() : [])
        })()
    }, [params?.th])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId) return
            const teamsRes = await fetch(`/api/admin/teams?Ekiden_thId=${ekidenThId}`)
            const tlist = teamsRes.ok ? await teamsRes.json() : []
            setTeams(tlist)
            const membersMap: Record<number, any[]> = {}
            for (const t of tlist) {
                const memRes = await fetch(`/api/admin/team-members?ekiden_no_teamId=${t.id}`)
                membersMap[t.id] = memRes.ok ? await memRes.json() : []
            }
            setMembersByTeam(membersMap)
            const schoolIds: number[] = Array.from(new Set(tlist.map((t: any) => Number(t.schoolId))))

            const studentsMap: Record<number, any[]> = {}
            for (const sid of schoolIds) {
                const stuRes = await fetch(`/api/admin/students?schoolId=${sid}`)
                const data = (stuRes.ok ? await stuRes.json() : []) as any[]
                studentsMap[sid] = data
            }
            setStudentsBySchool(studentsMap)
            const ids = Array.from(new Set(Object.values(membersMap).flat().map((m: any) => m.studentId).filter(Boolean)))
            if (ids.length) {
                const entRes = await fetch(`/api/admin/student-entries?studentIds=${ids.join(',')}`)
                const ent = entRes.ok ? await entRes.json() : []
                const byId: Record<number, any[]> = {}
                for (const e of ent) { if (!byId[e.studentId]) byId[e.studentId] = []; byId[e.studentId].push(e) }
                setEntriesById(byId)
                const presentEkidenIds = Array.from(new Set(ent.map((h: any) => h.ekidenId).filter(Boolean))) as number[]
                const maps: Record<number, Record<number, string>> = {}
                await Promise.all(presentEkidenIds.map(async (eid) => {
                    const r = await fetch(`/api/admin/intervals?ekidenId=${eid}`)
                    const arr = r.ok ? await r.json() : []
                    maps[eid] = Object.fromEntries(arr.map((x: any) => [x.id, x.name]))
                }))
                setIntervalMaps(maps)
            }
        })()
    }, [ekidenThId])

    useEffect(() => {
        const update = () => setIsMobile(window.innerWidth < 768)
        update()
        window.addEventListener("resize", update)
        return () => window.removeEventListener("resize", update)
    }, [])

    const studentMap = useMemo(() => {
        const map = new Map<number, any>()
        Object.entries(studentsBySchool).forEach(([sid, arr]) => { arr.forEach(s => map.set(s.id, s)) })
        return map
    }, [studentsBySchool])
    const schoolName = useMemo(() => {
        const m = new Map<number, string>()
        schools.forEach((s: any) => m.set(s.id, s.name))
        return m
    }, [schools])
    const allMembers = useMemo(() => Object.values(membersByTeam).flat(), [membersByTeam])
    const teamSchoolIds = useMemo(() => Array.from(new Set(teams.map((t: any) => t.schoolId))), [teams])
    const schoolOptions = useMemo(
        () =>
            [...teamSchoolIds] // 不动原数据
                .reverse()       // 只反转显示顺序
                .map(id => ({
                    label: schoolName.get(id) || String(id),
                    value: id,
                })),
        [teamSchoolIds, schoolName]
    )
    function schoolBg(sid: number) {
        const h = (sid * 57) % 360
        return `hsl(${h}, 60%, 95%)`
    }
    function perfBg(kind: "5000" | "10000" | "half", sec: number | null) {
        if (sec == null) return undefined
        if (kind === "5000") {
            if (sec <= 13 * 60 + 30) return "#ffd700"
            if (sec <= 13 * 60 + 40) return "#c0c0c0"
            if (sec <= 14 * 60 + 0) return "#cd7f32"
            return undefined
        }
        if (kind === "10000") {
            if (sec <= 28 * 60 + 0) return "#ffd700"
            if (sec <= 28 * 60 + 20) return "#c0c0c0"
            if (sec <= 29 * 60 + 0) return "#cd7f32"
            return undefined
        }
        if (kind === "half") {
            if (sec <= 1 * 3600 + 1 * 60 + 0) return "#ffd700"
            if (sec <= 1 * 3600 + 2 * 60 + 0) return "#c0c0c0"
            if (sec <= 1 * 3600 + 3 * 60 + 30) return "#cd7f32"
            return undefined
        }
        return undefined
    }

    function rowsFor(kind: "5000" | "10000" | "half") {
        const rows: { id: number; name: string; schoolId: number; school: string; gradeText: string; sec: number | null }[] = []
        for (const m of allMembers) {
            const s = studentMap.get(m.studentId)
            if (!s) continue
            const v = kind === "5000" ? s.score_5000m : kind === "10000" ? s.score_10000m : s.score_half_marathon
            const secVal = v == null ? null : Number(v)
            const valid = secVal != null && Number.isFinite(secVal) && secVal > 0
            const g = calcGrade(s.entryYear, eventYear)
            rows.push({ id: s.id, name: s.name, schoolId: s.schoolId, school: schoolName.get(s.schoolId) || String(s.schoolId), gradeText: gradeText(g), sec: valid ? secVal! : null })
        }
        const withPB = rows.filter(r => r.sec != null).sort((a, b) => (a.sec! - b.sec!))
        const noPB = rows.filter(r => r.sec == null)
        return [...withPB, ...noPB]
    }

    function rankMap(kind: "5000" | "10000" | "half") {
        const rows = rowsFor(kind)
        const map = new Map<number, number>()
        let rank = 1
        for (const r of rows) {
            if (r.sec == null) continue
            map.set(r.id, rank++)
        }
        return map
    }

    function TooltipCard({ sid }: { sid: number }) {
        const s = studentMap.get(sid)
        const gr = calcGrade(s?.entryYear, eventYear)
        const entries = entriesById[sid] || []
        return (
            <div style={{ maxWidth: 280 }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>{s?.name ?? "—"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", gap: 8, marginBottom: 8 }}>
                    <div>年级：{gradeText(gr)}</div>

                    <div>5000m：{formatPBText(s?.score_5000m, "5000")}</div>
                    <div>10000m：{formatPBText(s?.score_10000m, "10000")}</div>
                    <div>半程：{formatPBText(s?.score_half_marathon, "half")}</div>
                    <div>高校pb：{formatPBText(s?.score_college_pb, "5000")}</div>
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                    {entries.slice(0, 10).map((e: any) => (
                        <div key={e.id} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>{e.intervalName ?? "—"}</span>
                            <span>{typeof e.score === "number" ? formatSeconds(e.score) : "—"}{e.rank ? `（${e.rank}）` : ""}</span>
                        </div>
                    ))}
                    {entries.length === 0 && <div style={{ color: "#999" }}>暂无记录</div>}
                </div>
            </div>
        )
    }

    function List({ kind, title, sectionRef }: { kind: "5000" | "10000" | "half"; title: string; sectionRef: React.MutableRefObject<HTMLDivElement | null> }) {
        const rowsBase = rowsFor(kind)
        const rank = useMemo(() => rankMap(kind), [membersByTeam, studentsBySchool, kind])
        const rows = filterSchoolId ? rowsBase.filter(r => r.schoolId === filterSchoolId) : rowsBase
        return (
            <div ref={sectionRef} style={{ border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <strong>{title}</strong>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr 80px 120px", gap: 0 }}>
                    <div style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: "#f7f7f7" }}>名次</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: "#f7f7f7" }}>学校</div>
                    <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: "#f7f7f7" }}>选手</div>
                    <div style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: "#f7f7f7" }}>年级</div>
                    <div style={{ padding: 6, textAlign: "right", borderBottom: "1px solid #eee", background: "#f7f7f7" }}>成绩</div>
                    {rows.map((r, idx) => (
                        <div key={`${kind}-${r.id}`} style={{ display: "contents", background: selectedId === r.id ? "#fffa9f" : undefined }}>
                            <div style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: schoolBg(r.schoolId) }}>{rank.get(r.id) ? String(rank.get(r.id)!).padStart(2, "0") : "—"}</div>
                            <div style={{ padding: 6, borderBottom: "1px solid #eee", borderRight: "1px solid #eee", cursor: "pointer", background: schoolBg(r.schoolId) }} onClick={(e) => { e.stopPropagation(); router.push(`/predict/hakone/${params?.th ?? ""}?schoolId=${r.schoolId}`) }}>{r.school}</div>
                            <div onClick={() => { setSelectedId(r.id); setModalSid(r.id) }} style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: schoolBg(r.schoolId) }}>{r.name || "-"}</div>
                            <div style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", borderRight: "1px solid #eee", background: schoolBg(r.schoolId) }}>{r.gradeText || "-"}</div>
                            <div style={{ padding: 6, textAlign: "right", borderBottom: "1px solid #eee", background: perfBg(kind, r.sec) }}>{r.sec == null ? "-" : (kind === "half" ? formatSeconds(r.sec) : formatPBText(r.sec, kind))}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
            <h1 style={{ fontSize: 20 }}>{`第${params?.th ?? ""}回箱根驿传 本届PB排行榜`}</h1>

            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>返回主页</button>
                <Select style={{ minWidth: 240 }} value={filterSchoolId} options={schoolOptions} onChange={(v) => setFilterSchoolId(v)} placeholder="筛选学校" allowClear virtual={false} />
                <Select style={{ minWidth: 160 }} value={metricView} onChange={(v) => setMetricView(v)} options={[{ label: "全部展示", value: "all" }, { label: "5000m", value: "5000" }, { label: "10000m", value: "10000" }, { label: "半马", value: "half" }]} />
            </div>
            {metricView === "all" ? (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
                    <List kind="5000" title="5000m" sectionRef={sec5000Ref} />
                    <List kind="10000" title="10000m" sectionRef={sec10000Ref} />
                    <List kind="half" title="半马" sectionRef={secHalfRef} />
                </div>
            ) : metricView === "5000" ? (
                <List kind="5000" title="5000m" sectionRef={sec5000Ref} />
            ) : metricView === "10000" ? (
                <List kind="10000" title="10000m" sectionRef={sec10000Ref} />
            ) : (
                <List kind="half" title="半马" sectionRef={secHalfRef} />
            )}
            {isMobile && (
                <div style={{ position: "fixed", right: 24, bottom: 80, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
                    <button onClick={() => { sec5000Ref.current?.scrollIntoView({ behavior: "smooth" }) }} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>5000</button>
                    <button onClick={() => { sec10000Ref.current?.scrollIntoView({ behavior: "smooth" }) }} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>10000</button>
                    <button onClick={() => { secHalfRef.current?.scrollIntoView({ behavior: "smooth" }) }} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>半马</button>
                </div>
            )}
            <Modal open={modalSid != null} onCancel={() => setModalSid(undefined)} footer={null} title="选手信息">
                {modalSid != null && (
                    <div>
                        {(() => {
                            const s = studentMap.get(modalSid)
                            const gr = calcGrade(s?.entryYear, eventYear)
                            const entries = entriesById[modalSid] || []
                            return (
                                <div>
                                    <div style={{ marginBottom: 8, fontWeight: 600 }}>{s?.name ?? "-"}</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", gap: 8, marginBottom: 8 }}>
                                        <div>5000m：{formatPBText(s?.score_5000m, "5000")}</div>
                                        <div>10000m：{formatPBText(s?.score_10000m, "10000")}</div>
                                        <div>半程：{formatPBText(s?.score_half_marathon, "half")}</div>
                                        <div>年级：{gradeText(gr)}</div>
                                        <div>高校pb：{formatPBText(s?.score_college_pb, "5000")}</div>
                                    </div>
                                    {(() => {
                                        const grades: Grade[] = [1, 2, 3, 4]
                                        const cols: string[] = ["出雲", "全日本", "箱根"]
                                        const lookup = new Map<string, any[]>()
                                        function normEkiden(raw?: string) {
                                            if (!raw) return ""
                                            if (raw.includes("出雲")) return "出雲"
                                            if (raw.includes("全日本")) return "全日本"
                                            if (raw.includes("箱根")) return "箱根"
                                            return ""
                                        }
                                        function normGrade(g: any): Grade | undefined {
                                            if (typeof g === "string") {
                                                const gm: Record<string, Grade> = { ONE: 1 as Grade, TWO: 2 as Grade, THREE: 3 as Grade, FOUR: 4 as Grade, "一年": 1 as Grade, "二年": 2 as Grade, "三年": 3 as Grade, "四年": 4 as Grade }
                                                if (gm[g]) return gm[g]
                                                const m = g.match(/[1-4]/)
                                                if (m) return Number(m[0]) as Grade
                                            }
                                            if (typeof g === "number") { if (g >= 1 && g <= 4) return g as Grade }
                                            return undefined
                                        }
                                        function cellBg(rec?: any) {
                                            if (!rec) return undefined
                                            if (rec.rank === 1) return "#ffd700"
                                            if (rec.rank === 2) return "#c0c0c0"
                                            if (rec.rank === 3) return "#cd7f32"
                                            return undefined
                                        }
                                        entries.forEach((r: any) => {
                                            const short = ekidenShortById.get(r.ekidenId) || ""
                                            const name = normEkiden(short)
                                            const g = normGrade(r.grade)
                                            if (!name || !g) return
                                            const key = `${g}-${name}`
                                            const arr = lookup.get(key) || []
                                            arr.push(r)
                                            lookup.set(key, arr)
                                        })
                                        return (
                                            <div style={{ border: "1px solid #969696" }}>
                                                <div style={{ background: "#fffa9f", padding: 6, fontWeight: 600 }}>駅伝エントリー</div>
                                                <div style={{ display: "grid", gridTemplateColumns: "60px repeat(3, minmax(12ch, 1fr))", gap: 0 }}>
                                                    <div style={{ padding: 6, borderRight: "1px solid #eee", borderBottom: "1px solid #eee" }}></div>
                                                    {cols.map(c => (
                                                        <div key={c} style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{c}</div>
                                                    ))}
                                                    {grades.map(g => (
                                                        <React.Fragment key={g}>
                                                            <div style={{ padding: 6, borderTop: "1px solid #eee", borderRight: "1px solid #eee" }}>{g}年</div>
                                                            {cols.map(c => {
                                                                const key = `${g}-${c}`
                                                                const list = lookup.get(key) || []
                                                                return (
                                                                    <div key={key} style={{ padding: 6, textAlign: "left", borderTop: "1px solid #eee", borderLeft: "1px solid #eee" }}>
                                                                        {list.length === 0 ? (
                                                                            <div style={{ color: "#999" }}>—</div>
                                                                        ) : (
                                                                            list.map((rec: any) => {
                                                                                const iname = rec.intervalName ?? intervalMaps?.[rec.ekidenId]?.[rec.intervalId] ?? "—"
                                                                                const time = typeof rec.score === "number" ? formatSeconds(rec.score) : "—"
                                                                                const rank = rec.rank ? `${rec.rank}位` : ""
                                                                                return <div key={rec.id} style={{ whiteSpace: "nowrap", textAlign: "center", background: cellBg(rec), borderRadius: 4, padding: 2 }}>{iname}{rank} <br />{time}</div>
                                                                            })
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
                            )
                        })()}
                    </div>
                )}
            </Modal>
        </div>
    )
}

