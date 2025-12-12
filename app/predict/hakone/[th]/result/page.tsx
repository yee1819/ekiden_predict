"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Select, Tooltip, Modal, Input } from "antd"

export default function ResultPage() {
    const params = useParams() as { th?: string }
    const router = useRouter()
    const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
    const [eventYear, setEventYear] = useState<number | undefined>(undefined)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [teamCount, setTeamCount] = useState<number>(0)
    const [schoolName, setSchoolName] = useState<string>("")
    const [schools, setSchools] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(5)
    const [list, setList] = useState<{ groups: { items: any[]; meta: any }[]; meta: any } | null>(null)
    const [showOpinion, setShowOpinion] = useState<boolean>(false)
    const [selectedOpinion, setSelectedOpinion] = useState<string>("")
    const [entriesById, setEntriesById] = useState<Record<number, any[]>>({})
    const [filterName, setFilterName] = useState<string>("")
    const [ekidenIdToName, setEkidenIdToName] = useState<Record<number, "出雲" | "全日本" | "箱根" | undefined>>({})
    const [predFilter, setPredFilter] = useState<"all" | "withTime" | "withoutTime">("all")

    useEffect(() => {
        try {
            const raw = localStorage.getItem("hakone_summary")
            if (raw) {
                const d = JSON.parse(raw)
                if (d?.school) setSchoolName(d.school)
            }
        } catch { }
    }, [])

    useEffect(() => {
        ; (async () => {
            const ekidensRes = await fetch("/api/admin/ekidens")
            const ekidensData = await ekidensRes.json()
            const idNameMap: Record<number, "出雲" | "全日本" | "箱根" | undefined> = {}
            ekidensData.forEach((e: any) => { if (e?.name === "出雲" || e?.name === "全日本" || e?.name === "箱根") idNameMap[e.id] = e.name })
            setEkidenIdToName(idNameMap)
            const hakone = ekidensData.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const edRes = await fetch(`/api/admin/editions?ekidenId=${hakone.id}`)
            const eds = await edRes.json()
            const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
            if (ed) { setEkidenThId(ed.id); setEventYear(Number(ed.year)) }
            const schoolsRes = await fetch("/api/admin/schools")
            const schoolsData = await schoolsRes.json()
            setSchools(schoolsData)
        })()
    }, [params?.th])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId) return
            const totalRes = await fetch(`/api/predict/hakone/count?ekidenThId=${ekidenThId}`)
            const total = await totalRes.json()
            setTotalCount(Number(total?.count || 0))
            const teamsRes = await fetch(`/api/admin/teams?Ekiden_thId=${ekidenThId}`)
            const tlist = await teamsRes.json()
            setTeams(tlist)
            const schoolId = selectedSchoolId ?? (schoolName ? (schools.find((s: any) => s.name === schoolName)?.id) : undefined)
            const paramsStr = schoolId ? `schoolId=${schoolId}` : (schoolName ? `schoolName=${encodeURIComponent(schoolName)}` : "")
            const teamRes = await fetch(`/api/predict/hakone/count?ekidenThId=${ekidenThId}${paramsStr ? `&${paramsStr}` : ""}`)
            const team = await teamRes.json()
            setTeamCount(Number(team?.count || 0))
            const listRes = await fetch(`/api/predict/hakone/list?ekidenThId=${ekidenThId}${paramsStr ? `&${paramsStr}` : ""}`)
            const lst = await listRes.json()
            setList(lst)
            try {
                const ids = Array.from(new Set((lst?.groups ?? []).flatMap((g: any) => g.items.map((it: any) => it.playerId)).filter((id: any) => Number.isFinite(id))))
                if (ids.length) {
                    const entRes = await fetch(`/api/admin/student-entries?studentIds=${ids.join(',')}`)
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
        })()
    }, [ekidenThId, schoolName, selectedSchoolId, schools])

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
    function formatPace(sec: number | undefined | null, km: number | undefined) {
        if (!sec || !km || km <= 0) return "—"
        const perKm = sec / km
        const m = Math.floor(perKm / 60)
        const s = Math.round(perKm % 60)
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}/km`
    }
    const slotDistances: Record<number, number> = { 1: 21.3, 2: 23.1, 3: 21.4, 4: 20.9, 5: 20.8, 6: 20.8, 7: 21.3, 8: 21.4, 9: 23.1, 10: 23.0 }

    type Grade = 1 | 2 | 3 | 4
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
                                    <div
                                        key={`${g}-${c}`}
                                        style={{
                                            padding: 6,
                                            textAlign: "center",
                                            borderTop: "1px solid #eee",
                                            background: cellBg(rec),
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            borderLeft: "1px solid #eee",
                                        }}
                                    >
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
    }


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

    function PlayerTooltip({ student, playerId }: { student: { name?: string | null; score5000m?: string | number | null; score10000m?: string | number | null; scoreHalf?: string | number | null; collegePB?: string | number | null; entryYear?: number | null } | null, playerId?: number | null }) {
        const s = student || null
        return (
            <div style={{ flex: "0 0 280px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 10 }}>
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

    function EntriesTooltip({ playerId }: { playerId?: number }) {
        const entries = (playerId && entriesById[playerId]) ? entriesById[playerId] : []
        return (
            <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>驿传经历</div>
                {entries.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                        {entries.slice(0, 10).map((e: any) => (
                            <div key={e.id} style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>{e.intervalName ?? "—"}</span>
                                <span>{typeof e.score === "number" ? formatSeconds(e.score) : "—"}{e.rank ? `（${e.rank}）` : ""}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: "#999" }}>暂无记录</div>
                )}
            </div>
        )
    }

    const schoolOptions = useMemo(() => teams.map((t: any) => ({ value: t.schoolId, label: (schools.find((s: any) => s.id === t.schoolId)?.name ?? String(t.schoolId)) })), [teams, schools])
    const filteredGroups = useMemo(() => {
        const gs: { items: any[]; meta: any }[] = list?.groups ?? []
        const q = filterName.trim().toLowerCase()
        let base = q ? gs.filter(g => String(g.meta?.name || "").toLowerCase().includes(q)) : gs
        if (predFilter === "withTime") base = base.filter(g => (g.items || []).every((it: any) => typeof it.predictSec === "number"))
        else if (predFilter === "withoutTime") base = base.filter(g => !(g.items || []).every((it: any) => typeof it.predictSec === "number"))
        return base
    }, [list, filterName, predFilter])

    function cyclePredFilter() {
        setPredFilter(prev => prev === "all" ? "withTime" : prev === "withTime" ? "withoutTime" : "all")
    }

    return (
        <div style={{ padding: 16, maxWidth: 1200, overflowX: "auto", margin: "0 auto" }}>
            <div className="pageHead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 className="pageHeadTitle" style={{ fontSize: 20 }}>{`第${params?.th ?? ""}回箱根驿传 预测结果`}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Select style={{ minWidth: 240 }} value={selectedSchoolId ?? undefined} options={schoolOptions} onChange={(v) => setSelectedSchoolId(v)} placeholder="选择学校" />
                    <Input value={filterName} onChange={e => setFilterName(e.target.value)} allowClear placeholder="筛选昵称" style={{ width: 200 }} />
                    <div>全体预测条数：{totalCount / 10}</div>
                    <div>当前学校预测条数：{teamCount / 10}</div>
                    {/* <button onClick={cyclePredFilter} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>{predFilter === "all" ? "全部数据" : predFilter === "withTime" ? "预测时间" : "不预测时间"}</button> */}
                </div>
            </div>
            <div style={{ position: "fixed", right: 24, bottom: 80, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
                <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}/result/rank`)} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>查看排名</button>
                <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}`)} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>返回分配</button>
                <button onClick={() => { try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch { window.scrollTo(0, 0) } }} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>回到顶部</button>
            </div>

            <div style={{ position: "fixed", right: 24, top: 80, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
                <button onClick={() => setPredFilter("all")} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: predFilter === "all" ? "#1677ff" : "#fff", color: predFilter === "all" ? "#fff" : "#000" }}>全部数据</button>
                <button onClick={() => setPredFilter("withTime")} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: predFilter === "withTime" ? "#1677ff" : "#fff", color: predFilter === "withTime" ? "#fff" : "#000" }}>预测时间</button>
                <button onClick={() => setPredFilter("withoutTime")} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: predFilter === "withoutTime" ? "#1677ff" : "#fff", color: predFilter === "withoutTime" ? "#fff" : "#000" }}>不预测时间</button>
            </div>
            <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 12 }}>
                {filteredGroups.length ? (
                    <div style={{ display: "grid", gap: 20 }}>
                        {filteredGroups.map((group, gi) => (
                            <div key={gi} style={{ display: "grid", gap: 10 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "10fr 2fr", gap: 10 }}>
                                    <div style={{ fontWeight: 700 }}>{group.meta?.name ?? "—"}    </div>

                                    {/* {group.meta?.total ? <div style={{ fontSize: 14, color: "#333" }}>{formatSeconds(group.meta?.total)}</div> : null} */}

                                    <div style={{ textAlign: "right", color: "#666" }}>{group.meta?.createdAt ? new Date(group.meta.createdAt).toLocaleString() : "—"} <button onClick={() => { setSelectedOpinion(String(group.meta?.opinion || "")); setShowOpinion(true) }} style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: 6, marginLeft: 8 }}>查看阵容看法</button></div>
                                </div>
                                <div style={{ display: "grid", gap: 10 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) 140px", gap: 6, alignItems: "center" }}>
                                        {(() => {
                                            const compact = !group.items.slice(0, 5).every((x: any) => typeof x.predictSec === "number")
                                            let cum = 0
                                            return group.items.slice(0, 5).map((it: any) => {
                                                const scores = it.student ? { score5000m: it.student.score5000m, score10000m: it.student.score10000m, scoreHalf: it.student.scoreHalf } : {}
                                                const sec = typeof it.predictSec === "number" ? it.predictSec : undefined
                                                cum = cum + (sec ?? 0)
                                                return (
                                                    <Tooltip key={`f-${it.slot}`} title={<PlayerTooltip student={it.student} playerId={it.playerId} />} styles={{ container: { border: "1px solid #ddd", minWidth: 400 } }} color="#fff">
                                                        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, background: "#fff", position: "relative" }}>
                                                            {compact ? (
                                                                <>
                                                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区 {slotDistances[it.slot]}km</div>
                                                                    <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{it.playerName ?? "—"}</div>
                                                                    <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((scores as any)?.score5000m, "5000")} <br />10000 {formatPBText((scores as any)?.score10000m, "10000")}<br /> 半马 {formatPBText((scores as any)?.scoreHalf, "half")}</div>
                                                                </>
                                                            ) : (
                                                                <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                                                                    <div style={{ fontSize: 24, fontWeight: 900 }}>{it.playerName ?? "—"}</div>
                                                                    {/* <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText((scores as any)?.score5000m, "5000")}</div>
                                                                    <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText((scores as any)?.score10000m, "10000")}</div>
                                                                    <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText((scores as any)?.scoreHalf, "half")}</div> */}
                                                                </div>
                                                            )}
                                                            {!compact && (
                                                                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                                                    <span style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</span>
                                                                    {/* <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slotDistances[it.slot]}km</span> */}
                                                                </div>
                                                            )}
                                                            {!compact && (
                                                                <>
                                                                    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>{formatSeconds(sec)}</div>
                                                                    <div style={{ fontSize: 14, color: "#666" }}>{slotDistances[it.slot]}km 配速：{formatPace(sec, slotDistances[it.slot])}</div>
                                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
                                                                        <span>往路累计 {formatSeconds(cum)}</span>
                                                                        <span>总时间 {formatSeconds(cum)}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </Tooltip>
                                                )
                                            })
                                        })()}
                                        {/* <div style={{ textAlign: "right", fontWeight: 700 }}>{formatSeconds(group.meta?.forwardTotal)}</div> */}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) 140px", gap: 6, alignItems: "center" }}>
                                        {(() => {
                                            const compact = !group.items.slice(5, 10).every((x: any) => typeof x.predictSec === "number")
                                            let cum = group.meta?.forwardTotal || 0
                                            let fum = 0
                                            return group.items.slice(5, 10).map((it: any) => {
                                                const scores = it.student ? { score5000m: it.student.score5000m, score10000m: it.student.score10000m, scoreHalf: it.student.scoreHalf } : {}
                                                const sec = typeof it.predictSec === "number" ? it.predictSec : undefined
                                                cum = cum + (sec ?? 0)
                                                fum = fum + (sec ?? 0)

                                                return (
                                                    <Tooltip key={`r-${it.slot}`} title={<PlayerTooltip student={it.student} playerId={it.playerId} />} styles={{ container: { border: "1px solid #ddd", minWidth: 400 } }} color="#fff">
                                                        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, background: "#fff", position: "relative" }}>
                                                            {compact ? (
                                                                <>
                                                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区 {slotDistances[it.slot]}km</div>
                                                                    <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{it.playerName ?? "—"}</div>
                                                                    <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((scores as any)?.score5000m, "5000")} <br /> 10000 {formatPBText((scores as any)?.score10000m, "10000")} <br /> 半马 {formatPBText((scores as any)?.scoreHalf, "half")}</div>
                                                                </>
                                                            ) : (
                                                                <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                                                                    <div style={{ fontSize: 24, fontWeight: 900 }}>{it.playerName ?? "—"}</div>
                                                                    {/* <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText((scores as any)?.score5000m, "5000")}</div>
                                                                    <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText((scores as any)?.score10000m, "10000")}</div>
                                                                    <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText((scores as any)?.scoreHalf, "half")}</div> */}
                                                                </div>
                                                            )}
                                                            {!compact && (
                                                                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                                                    <span style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</span>

                                                                </div>
                                                            )}
                                                            {!compact && (
                                                                <>
                                                                    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>{formatSeconds(sec)}</div>
                                                                    <div style={{ fontSize: 14, color: "#666" }}> {slotDistances[it.slot]}km 配速：{formatPace(sec, slotDistances[it.slot])}</div>
                                                                    {/* <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>{slotDistances[it.slot]}km</span> */}
                                                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
                                                                        <span>复路累计 {formatSeconds(fum)}</span>
                                                                        <span>总时间 {formatSeconds(cum)}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </Tooltip>
                                                )
                                            })
                                        })()}
                                        {/* <div style={{ textAlign: "right", fontWeight: 700 }}>{formatSeconds(group.meta?.returnTotal)}</div> */}
                                    </div>
                                </div>
                                {gi < filteredGroups.length - 1 ? (
                                    <div style={{ height: 1, background: "#eee", margin: "12px 0" }} />
                                ) : null}
                            </div>
                        ))}
                    </div>
                ) : filterName.trim() ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#666" }}>未找到匹配昵称</div>
                ) : (
                    <div style={{ padding: 20, textAlign: "center", color: "#666" }}>还没有人预测哦，先去预测吧</div>
                )}
            </div>



            <Modal open={showOpinion} onCancel={() => setShowOpinion(false)} onOk={() => setShowOpinion(false)} okText="关闭" cancelText="取消">
                <div style={{ whiteSpace: "pre-wrap" }}>{selectedOpinion || "暂无阵容看法"}</div>
            </Modal>
            <style jsx>{`
              @media (max-width: 768px) {
                .pageHead { flex-wrap: wrap; gap: 8px; }
                .pageHeadTitle { width: 100%; }
              }
            `}</style>
        </div>
    )
}
