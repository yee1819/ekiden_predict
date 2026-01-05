"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Select, Tooltip, Modal, Input } from "antd"
import { fetchPublicOrApi } from "@/app/lib/public-cache"



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
    const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(undefined)
    const [list, setList] = useState<{ groups: { items: any[]; meta: any }[]; meta: any } | null>(null)
    const [showOpinion, setShowOpinion] = useState<boolean>(false)
    const [selectedOpinion, setSelectedOpinion] = useState<string>("")
    const [entriesById, setEntriesById] = useState<Record<number, any[]>>({})
    const [filterName, setFilterName] = useState<string>("")
    const [ekidenIdToName, setEkidenIdToName] = useState<Record<number, "出雲" | "全日本" | "箱根" | undefined>>({})
    const [predFilter, setPredFilter] = useState<"all" | "withTime" | "withoutTime">("all")
    const [sortBy, setSortBy] = useState<"likes_desc" | "likes_asc" | "created_desc" | "created_asc" | "correct_desc" | "correct_asc">("created_desc")
    const [likesMap, setLikesMap] = useState<Record<string, number>>({})
    const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
    const [popBatchId, setPopBatchId] = useState<string | null>(null)
    const [countsBySchool, setCountsBySchool] = useState<Record<number, number>>({})

    async function computeFingerprint(): Promise<string> {
        try {
            const ua = navigator.userAgent
            const lang = navigator.language
            const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}@${window.devicePixelRatio || 1}`
            const tz = String(new Date().getTimezoneOffset())
            // Canvas fingerprint
            const canvas = document.createElement("canvas")
            canvas.width = 200
            canvas.height = 50
            const ctx = canvas.getContext("2d")
            let canvasSig = ""
            if (ctx) {
                ctx.textBaseline = "top"
                ctx.font = "16px 'Arial'"
                ctx.fillStyle = "#f60"
                ctx.fillRect(10, 10, 100, 20)
                ctx.fillStyle = "#000"
                ctx.fillText(`${ua.slice(0, 32)}`, 12, 12)
                canvasSig = canvas.toDataURL()
            }
            // WebGL vendor/renderer
            let webglSig = ""
            try {
                const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null
                if (gl) {
                    const dbg = gl.getExtension("WEBGL_debug_renderer_info") as any
                    const vendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : ""
                    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ""
                    webglSig = `${vendor}|${renderer}`
                }
            } catch { }
            // Fonts (best-effort)
            let fontsSig = ""
            try {
                const fonts = (document as any).fonts
                if (fonts && typeof fonts.size === "number") fontsSig = String(fonts.size)
            } catch { }
            const raw = `${ua}|${lang}|${screenInfo}|${tz}|${canvasSig}|${webglSig}|${fontsSig}`
            const enc = new TextEncoder().encode(raw)
            const digest = await crypto.subtle.digest("SHA-256", enc)
            const bytes = Array.from(new Uint8Array(digest))
            const hex = bytes.map(b => b.toString(16).padStart(2, "0")).join("")
            try { document.cookie = `hakone_fp=${hex}; path=/; max-age=${60 * 60 * 24 * 365}` } catch { }
            return hex
        } catch {
            return Math.random().toString(36).slice(2)
        }
    }

    async function getFingerprintFromCookieOrGen() {
        try {
            const m = document.cookie.match(/(?:^|;\s*)hakone_fp=([^;]+)/)
            if (m && m[1]) return m[1]
        } catch { }
        return await computeFingerprint()
    }

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
            const ekidensData = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            const idNameMap: Record<number, "出雲" | "全日本" | "箱根" | undefined> = {}
            ekidensData.forEach((e: any) => { if (e?.name === "出雲" || e?.name === "全日本" || e?.name === "箱根") idNameMap[e.id] = e.name })
            setEkidenIdToName(idNameMap)
            const hakone = ekidensData.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
            const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
            if (ed) { setEkidenThId(ed.id); setEventYear(Number(ed.year)) }
            setSchools(await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools"))
        })()
    }, [params?.th])

    const [groupsByTeam, setGroupsByTeam] = useState<Record<number, any[]>>({})
    const [likesByTeam, setLikesByTeam] = useState<Record<number, Record<string, number>>>({})

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId) return
            const teamsData = await fetchPublicOrApi<any[]>("public-teams", Number(ekidenThId), `/api/teams?Ekiden_thId=${ekidenThId}`)
            setTeams(teamsData)
            const res = await fetch(`/api/predict/hakone/final/bundle?ekidenThId=${ekidenThId}`)
            const j = res.ok ? await res.json() : null
            setTotalCount(Number(j?.totalCount || 0))
            setCountsBySchool((j?.countsBySchoolId || {}) as Record<number, number>)
            setGroupsByTeam((j?.groupsByTeam || {}) as Record<number, any[]>)
            setLikesByTeam((j?.likesByTeam || {}) as Record<number, Record<string, number>>)

            const allIdsRaw = teamsData.flatMap((t: any) => (((j?.groupsByTeam || {})[t.id] || []) as any[]).flatMap((g: any) => (g.items || []).map((it: any) => it.playerId)))
            const ids = Array.from(new Set(allIdsRaw)).filter((id): id is number => Number.isFinite(id as number))
            if (ids.length) {
                const sortedIds = ids.slice().sort((a, b) => a - b)
                const ent = await fetchPublicOrApi<any[]>("public-student-entries", sortedIds, `/api/student-entries?studentIds=${ids.join(',')}`)
                const map: Record<number, any[]> = {}
                for (const e of ent) {
                    if (!map[e.studentId]) map[e.studentId] = []
                    map[e.studentId].push(e)
                }
                setEntriesById(map)
            } else {
                setEntriesById({})
            }

            // 默认选择：优先选有数据的学校
            if (!selectedSchoolId && teamsData.length) {
                const withData = teamsData.filter((t: any) => ((j?.countsBySchoolId || {})[t.schoolId] || 0) > 0)
                const pick = withData.length ? withData[withData.length - 1] : teamsData[teamsData.length - 1]
                if (pick) setSelectedSchoolId(pick.schoolId)
            }
        })()
    }, [ekidenThId])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId || !selectedSchoolId) { setList(null); setLikesMap({}); return }
            const team = teams.find((t: any) => t.schoolId === selectedSchoolId)
            if (!team) { setList(null); setLikesMap({}); return }
            let groups = groupsByTeam[team.id] || []
            let likes = likesByTeam[team.id] || {}
            if (!groups.length) {
                try {
                    const lj = await fetch(`/api/predict/hakone/list?ekidenThId=${ekidenThId}&schoolId=${selectedSchoolId}`).then(r => r.ok ? r.json() : { groups: [], meta: {} })
                    const lg = Array.isArray(lj?.groups) ? lj.groups : []
                    groups = lg
                    setGroupsByTeam(prev => ({ ...prev, [team.id]: lg }))
                    const likeRes = await fetch(`/api/predict/hakone/likes?ekidenThId=${ekidenThId}&teamId=${team.id}`)
                    const likeJson = likeRes.ok ? await likeRes.json() : { likes: {} }
                    likes = (likeJson?.likes || {}) as Record<string, number>
                    setLikesByTeam(prev => ({ ...prev, [team.id]: likes }))
                    const idRaw = lg.flatMap((g: any) => g.items.map((it: any) => it.playerId))
                    const ids = Array.from(new Set(idRaw)).filter((id): id is number => Number.isFinite(id as number))
                    const missing = ids.filter(id => !(id in entriesById))
                    if (missing.length) {
                        const sorted = missing.slice().sort((a, b) => a - b)
                        const ent = await fetchPublicOrApi<any[]>("public-student-entries", sorted, `/api/student-entries?studentIds=${missing.join(',')}`)
                        setEntriesById(prev => {
                            const map = { ...prev }
                            for (const e of ent) {
                                if (!map[e.studentId]) map[e.studentId] = []
                                map[e.studentId].push(e)
                            }
                            return map
                        })
                    }
                } catch { }
            }
            setTeamCount(Number((countsBySchool[selectedSchoolId] || 0)))
            setList({ groups, meta: { teamId: team.id } })
            setLikesMap(likes)
        })()
    }, [selectedSchoolId, teams, groupsByTeam, countsBySchool])

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
        const s = sec - m * 60
        let secStr = s.toFixed(2)
        if (secStr === "60.00") return `${String(m + 1).padStart(2, "0")}:00.00`
        const [si, sf] = secStr.split(".")
        return `${String(m).padStart(2, "0")}:${String(si).padStart(2, "0")}.${sf}`
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
    type EntryRecord = { ekiden: EkidenType; grade: Grade; intervalName?: string; rank?: number; time?: string; isNewRecord?: boolean }
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
            const rec: EntryRecord = { ekiden: name, grade: g, intervalName: it.intervalName, rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined, isNewRecord: it?.isNewRecord === true }
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
                                        <div style={{ whiteSpace: "nowrap" }}>{rec?.isNewRecord ? <span style={{ color: "red", marginRight: 2 }}>新</span> : null}{text}</div>
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
            <div style={{ flex: "0 0 280px", border: "1px solid #ddd", borderRadius: 10, background: "rgba(var(--panel-bg-rgb), var(--panel-opacity))", padding: 10 }}>
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

    const schoolSelectOptions = useMemo(() => {
        return [...teams].reverse().map((t: any) => {
            const name = schools.find((s: any) => s.id === t.schoolId)?.name ?? String(t.schoolId)
            const cnt = (groupsByTeam[t.id] || []).length
            return {
                value: t.schoolId,
                label: (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                        <span style={{ width: "6ch", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{cnt}</span>
                    </div>
                )
            }
        })
    }, [teams, schools, groupsByTeam])
    const filteredGroups = useMemo(() => {
        const gs: { items: any[]; meta: any }[] = list?.groups ?? []
        const q = filterName.trim().toLowerCase()
        let base = q ? gs.filter(g => String(g.meta?.name || "").toLowerCase().includes(q)) : gs
        if (predFilter === "withTime") base = base.filter(g => (g.items || []).every((it: any) => typeof it.predictSec === "number"))
        else if (predFilter === "withoutTime") base = base.filter(g => !(g.items || []).every((it: any) => typeof it.predictSec === "number"))
        return base
    }, [list, filterName, predFilter])

    const sortedGroups = useMemo(() => {
        const arr = filteredGroups.slice()
        if (sortBy === "likes_desc") {
            arr.sort((a, b) => (likesMap[b.meta?.batchId || ""] || 0) - (likesMap[a.meta?.batchId || ""] || 0))
        } else if (sortBy === "likes_asc") {
            arr.sort((a, b) => (likesMap[a.meta?.batchId || ""] || 0) - (likesMap[b.meta?.batchId || ""] || 0))
        } else if (sortBy === "created_asc") {
            arr.sort((a, b) => new Date(a.meta?.createdAt || 0).getTime() - new Date(b.meta?.createdAt || 0).getTime())
        } else if (sortBy === "correct_desc") {
            arr.sort((a, b) => (b.meta?.correctCount || 0) - (a.meta?.correctCount || 0))
        } else if (sortBy === "correct_asc") {
            arr.sort((a, b) => (a.meta?.correctCount || 0) - (b.meta?.correctCount || 0))
        } else {
            arr.sort((a, b) => new Date(b.meta?.createdAt || 0).getTime() - new Date(a.meta?.createdAt || 0).getTime())
        }
        return arr
    }, [filteredGroups, likesMap, sortBy])

    useEffect(() => {
        ; (async () => {
            if (!ekidenThId) return
            const list = teams
            if (!list.length) { setCountsBySchool({}); return }
            try {
                const entries = await Promise.all(list.map(async (t: any) => {
                    try {
                        const res = await fetch(`/api/predict/hakone/count?ekidenThId=${ekidenThId}&schoolId=${t.schoolId}`)
                        const j = res.ok ? await res.json() : {}
                        return [t.schoolId, Number(j?.count || 0)] as [number, number]
                    } catch { return [t.schoolId, 0] as [number, number] }
                }))
                setCountsBySchool(Object.fromEntries(entries))
            } catch { setCountsBySchool({}) }
        })()
    }, [ekidenThId, teams])

    function cyclePredFilter() {
        setPredFilter(prev => prev === "all" ? "withTime" : prev === "withTime" ? "withoutTime" : "all")
    }

    return (
        <div style={{ padding: 16, maxWidth: 1200, overflowX: "auto", margin: "0 auto" }}>
            <div className="pageHead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 className="pageHeadTitle" style={{ fontSize: 20 }}>{`第${params?.th ?? ""}回箱根驿传 预测结果`}</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Select style={{ minWidth: 240 }} value={selectedSchoolId ?? undefined} options={schoolSelectOptions} onChange={(v) => setSelectedSchoolId(v)} placeholder="选择学校" virtual={false} />
                    <Input value={filterName} onChange={e => setFilterName(e.target.value)} allowClear placeholder="筛选昵称" style={{ width: 200 }} />
                    <Select style={{ width: 160 }} value={sortBy} onChange={(v) => setSortBy(v)} options={[{ value: "likes_desc", label: "按点赞顺序" }, { value: "likes_asc", label: "按点赞倒序" }, { value: "created_desc", label: "按时间倒序" }, { value: "created_asc", label: "按时间顺序" }, { value: "correct_desc", label: "按正确数倒序" }, { value: "correct_asc", label: "按正确数顺序" }]} placeholder="排序" virtual={false} />
                    <div>全体预测条数：{totalCount}</div>
                    <div>当前学校预测条数：{selectedSchoolId ? (countsBySchool[selectedSchoolId] || 0) : 0}</div>
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
            <div style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 10, background: "rgba(var(--panel-bg-rgb), var(--panel-opacity))", padding: 12 }}>
                {sortedGroups.length ? (
                    <div style={{ display: "grid", gap: 20 }}>
                        {sortedGroups.map((group, gi) => (
                            <div key={gi} style={{ display: "grid", gap: 10 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "10fr 2fr", gap: 10 }}>
                                    <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
                                        <span>{group.meta?.name ?? "—"}</span>
                                        <span style={{ fontSize: 12, color: "#666" }}>预测成功（{(Array.isArray(group.items) ? group.items.filter((it: any) => it?.isCorrect === true).length : 0)}/10）</span>
                                        {(() => {
                                            const bid = group.meta?.batchId as string | null
                                            const count = bid ? (likesMap[bid] || 0) : 0
                                            const liked = bid ? likedSet.has(bid) : false
                                            async function onLike() {
                                                if (!ekidenThId) return
                                                const teamId = (list as any)?.meta?.teamId
                                                const batchId = bid
                                                if (!Number.isFinite(teamId) || !batchId) return
                                                const fp = await getFingerprintFromCookieOrGen()
                                                const res = await fetch(`/api/predict/hakone/likes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ekidenThId, teamId, batchId, fingerprint: fp }) })
                                                const data = res.ok ? await res.json() : { ok: false }
                                                if (data?.ok) {
                                                    setLikesMap(prev => ({ ...prev, [batchId]: Number(data.count || 0) }))
                                                    setLikedSet(prev => new Set(prev).add(batchId))
                                                    setPopBatchId(batchId)
                                                    setTimeout(() => { setPopBatchId(pid => (pid === batchId ? null : pid)) }, 400)
                                                }
                                            }
                                            return bid ? (
                                                <button
                                                    onClick={onLike}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        padding: "4px 10px",
                                                        border: "1px solid #eee",
                                                        borderRadius: 20,
                                                        background: liked ? "#ffe6e6" : "#fff",
                                                        color: liked ? "#d14" : "#d14",
                                                        cursor: "pointer",
                                                        animation: popBatchId === bid ? "heartPop 300ms ease" : undefined,
                                                    }}
                                                    aria-label="点赞"
                                                >
                                                    <span style={{ fontSize: 16, lineHeight: 1 }}>❤️</span>
                                                    <span style={{ fontSize: 12 }}>{count}</span>
                                                </button>
                                            ) : null
                                        })()}
                                    </div>

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
                                                        <div style={{ border: it.isCorrect ? "2px solid #52c41a" : "1px solid #ddd", borderRadius: 8, padding: 10, background: it.isCorrect ? "#f6ffed" : "rgba(var(--panel-bg-rgb), var(--panel-opacity))", position: "relative" }}>
                                                            {compact ? (
                                                                <>
                                                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区 {slotDistances[it.slot]}km</div>
                                                                    <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>
                                                                        {it.playerName ?? "—"}
                                                                        <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((it as any)?.student?.entryYear ?? undefined))}</span>
                                                                    </div>
                                                                    <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((scores as any)?.score5000m, "5000")} <br />10000 {formatPBText((scores as any)?.score10000m, "10000")}<br /> 半马 {formatPBText((scores as any)?.scoreHalf, "half")}</div>
                                                                </>
                                                            ) : (
                                                                <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                                                                    <div style={{ fontSize: 24, fontWeight: 900 }}>
                                                                        {it.playerName ?? "—"}
                                                                        {/* <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((it as any)?.student?.entryYear ?? undefined))}</span> */}
                                                                    </div>
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
                                                        <div style={{ border: it.isCorrect ? "2px solid #52c41a" : "1px solid #ddd", borderRadius: 8, padding: 10, background: it.isCorrect ? "#f6ffed" : "rgba(var(--panel-bg-rgb), var(--panel-opacity))", position: "relative" }}>
                                                            {compact ? (
                                                                <>
                                                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区 {slotDistances[it.slot]}km</div>
                                                                    <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>
                                                                        {it.playerName ?? "—"}
                                                                        <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((it as any)?.student?.entryYear ?? undefined))}</span>
                                                                    </div>
                                                                    <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((scores as any)?.score5000m, "5000")} <br /> 10000 {formatPBText((scores as any)?.score10000m, "10000")} <br /> 半马 {formatPBText((scores as any)?.scoreHalf, "half")}</div>
                                                                </>
                                                            ) : (
                                                                <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                                                                    <div style={{ fontSize: 24, fontWeight: 900 }}>
                                                                        {it.playerName ?? "—"}
                                                                        {/* <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((it as any)?.student?.entryYear ?? undefined))}</span> */}
                                                                    </div>
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
                                {gi < sortedGroups.length - 1 ? (
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
              @keyframes heartPop {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
              }
            `}</style>
        </div>
    )
}
