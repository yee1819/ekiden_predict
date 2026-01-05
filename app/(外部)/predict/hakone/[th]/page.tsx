"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Tooltip, Select, Segmented, TimePicker, message, Modal } from "antd"
import dayjs from "dayjs"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

type EkidenType = "出雲" | "全日本" | "箱根"
type Grade = 1 | 2 | 3 | 4
type EntryRecord = { ekiden: EkidenType; grade: Grade; intervalName?: string; rank?: number; symbol?: "○" | "△" | "—"; dnf?: boolean; time?: string; year?: number; runner?: string; runnerGrade?: number; isNewRecord?: boolean }
type Player = {
    id: number
    name: string
    role?: "STARTER" | "RESERVE"
    score1500m?: string
    score5000m?: string
    score10000m?: string
    scoreHalf?: string
    scoreFull?: string
    collegePB?: string
    entries?: EntryRecord[]
    entryYear?: number
}

export default function Page() {
    const params = useParams() as { th?: string }
    const searchParams = useSearchParams()

    const yearLabel = params?.th ?? ""
    const router = useRouter()
    useEffect(() => {
        if (params.th !== "102") {
            router.push("/predict/hakone/102")
        }
    }, [params.th, router])


    const [ekidens, setEkidens] = useState<any[]>([])
    const [editions, setEditions] = useState<any[]>([])
    const [schools, setSchools] = useState<any[]>([])
    const [teams, setTeams] = useState<any[]>([])
    const [hakoneThId, setHakoneThId] = useState<number | undefined>(undefined)
    const [eventYear, setEventYear] = useState<number | undefined>(undefined)
    const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined)
    const [members, setMembers] = useState<any[]>([])
    const [students, setStudents] = useState<any[]>([])
    const [teamResults, setTeamResults] = useState<any[]>([])

    const initialPlayers: Player[] = useMemo(() => [], [])

    const [players, setPlayers] = useState<Player[]>(initialPlayers)
    const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
    const [detailPlayer, setDetailPlayer] = useState<Player | null>(null)
    const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false)
    const [assignments, setAssignments] = useState<Record<number, Player | null>>(
        () => Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, null]))
    )

    type SchoolOption = { id: number; name: string; teamId: number }
    const schoolOptions: SchoolOption[] = useMemo(
        () => [...teams].reverse().map((t: any) => ({ id: t.schoolId, name: (schools.find((s: any) => s.id === t.schoolId)?.name ?? String(t.schoolId)), teamId: t.id })),
        [teams, schools]
    )
    const [selectedSchool, setSelectedSchool] = useState<SchoolOption | undefined>(undefined)
    const [metric, setMetric] = useState<"1500m" | "5000m" | "10000m" | "半马" | "全马">("5000m")
    const [predictMode, setPredictMode] = useState<boolean>(false)
    const [predictions, setPredictions] = useState<Record<number, number>>(() => Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, 3600])))

    function parseTimeToSeconds(t?: string) {
        if (!t) return Infinity
        const parts = t.split(":").map(Number)
        if (parts.length === 2) return parts[0] * 60 + parts[1]
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return Infinity
    }

    function formatSeconds(sec: number) {
        const h = Math.floor(sec / 3600)
        const m = Math.floor((sec % 3600) / 60)
        const s = sec % 60
        const hhStr = String(h).padStart(2, "0")
        const mmStr = String(m).padStart(2, "0")
        const ssStr = String(s).padStart(2, "0")
        return `${hhStr}:${mmStr}:${ssStr}`
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

    const totalPrediction = useMemo(() => {
        let sum = 0
        let count = 0
        for (let slot = 1; slot <= 10; slot++) {
            if (assignments[slot] && typeof predictions[slot] === "number") {
                sum += predictions[slot]
                count++
            }
        }
        return { sum, count }
    }, [assignments, predictions])

    const leaderboard = useMemo(() => {
        const key = metric === "1500m" ? "score1500m" : metric === "5000m" ? "score5000m" : metric === "10000m" ? "score10000m" : metric === "半马" ? "scoreHalf" : "scoreFull"
        return [...players].sort((a, b) => parseTimeToSeconds(a[key as keyof Player] as string) - parseTimeToSeconds(b[key as keyof Player] as string))
    }, [players, metric])

    const top10AvgSec = useMemo(() => {
        const key = metric === "1500m" ? "score1500m" : metric === "5000m" ? "score5000m" : metric === "10000m" ? "score10000m" : metric === "半马" ? "scoreHalf" : "scoreFull"
        const secs = leaderboard.slice(0, 10).map(p => parseTimeToSeconds(p[key as keyof Player] as string)).filter(v => Number.isFinite(v)) as number[]
        if (!secs.length) return undefined as number | undefined
        const avg = Math.round(secs.reduce((a, b) => a + b, 0) / secs.length)
        return avg
    }, [leaderboard, metric])

    const assignedIds = useMemo(
        () => new Set(Object.values(assignments).filter(Boolean).map(p => (p as Player).id)),
        [assignments]
    )

    const unassigned = useMemo(
        () => players.filter(p => !assignedIds.has(p.id)),
        [players, assignedIds]
    )
    const hakone_qujian = {
        1: `（21.3km，大手町 → 鹤见）：
        几乎全程平坦的市区道路，仅有轻微桥上起伏如六乡桥下坡易引发加速和集団崩坏，是序盘激烈驱け引き（追逐与摆脱）的起点，各队多派速度型选手争取有利位置，避免过早消耗而奠定全队基调的战略性开端区间。
        各队一般会大集团跑到18公里的六乡桥再利用下坡进行最后冲刺`,
        2: `（23.1km，鹤见 → 户塚）：
        被称为“花之2区”的最长距离エース（ACE）区间，中盘権太坂急上坡和末尾3km“户塚之壁”连续起伏考验体力精神与胜负感，各队投入顶尖选手或留学生，常诞生惊人“ごぼう抜き（戏剧性逆转）”大逆转的戏剧性对决地带。`,
        3: `（21.4km，户塚 → 平塚）：
        前半下坡后转入沿海国道134号的风景最美区间，可眺望相模湾与富士山，但向かい风强时成自然战考验耐力，昔日视为“つなぎ区间(连接区间)”而近年エース（ACE）投入增多的位置维持与追击关键地段。`,
        4: `（20.9km，平塚 → 小田原）平地区间中最短却细微起伏连续的“准エース（ACE）区间”，节奏把握难且终盘上坡加箱根冷风考验粘り强さ（耐力），为后续山登り准备位置的疲労蓄积与战略连接重要环节。`,
        5: `（20.8km，小田原 → 芦之湖）象征箱根的最大难所“山登り”，标高差864m急上坡主导伴ヘアピンカーブ（急转弯）多发，后半下坡切换需技术，天气恶化时更严酷，常诞生“山の神”并大逆转决定往路冠军的荣耀与苦闘并存区间。`,
        6: `（20.8km，芦之湖 → 小田原）逆走山路的“山下り”，标高差864m急下坡需求制动与曲线技术，极致的下坡加上极致的急转弯,朝冷加脚负担大易伤，如果是雨/雪天危险程度激增，ペース抑え（控制配速）保存体力为后续的关键，专长选手常获区間赏的极速与风险并存区间。`,
        7: `（21.3km，小田原 → 平塚）平坦为主却后半小起伏多且气温差最大（朝冷到日中热）的耐力考验区间，昔“つなぎ（连接）”而近年视为“复路准2区”投入有力选手的位置维持与追击战略要点。`,
        8: `（21.4km，平塚 → 户塚）沿海逆走前半上坡含遊行寺坂难所，风温影响大需求上り耐力的シード(种子)权争い激烈地带，在经历长距离的高速跑面前出现的城墙一般---游行寺坂，挡住了多少人想拿下区间记录的尝试，常上演隐れたドラマ（隐藏的戏剧反转）【小松陽平||鈴木宗孝】的复路中盘胜负所`,
        9: `（23.1km，户塚 → 鹤见）复路最长被称为“复路之花之2区”，下坡起步易过ペース（配速）而末尾上坡苦考验后半粘り（耐力），与二区相比少了一个大坡，但此时太阳直射且此时一般都是独走，先进行多次上下坡的消耗考验选手的体力分配，顺位争い与逆转剧多发的エース级对决延续区间`,
        10: `（23.0km，鹤见 → 大手町）平坦最终区伴精神压力与天气影响「时间12点的太阳直射」的アンカー（关键人物）荣耀承载地，ラストスパート（最终冲刺）常决冠军与シード（种子）权，ゴール（终点）泪与歓喜交织的箱根駅伝大结局象征。`,
    }

    const intervalMeta = useMemo(() => {
        return Object.fromEntries(Array.from({ length: 10 }, (_, i) => {
            const n = i + 1
            return [n, { name: `${n}区`, desc: `第${n}区`, elevation: hakone_qujian[n as keyof typeof hakone_qujian], map: undefined }]
        })) as Record<number, { name: string; desc?: string; elevation?: string; map?: string | undefined }>
    }, [])

    const slotMinuteRanges: Record<number, [number, number]> = {
        1: [59, 70],
        2: [63, 75],
        3: [57, 70],
        4: [58, 70],
        5: [65, 80],
        6: [54, 65],
        7: [59, 70],
        8: [61, 70],
        9: [65, 75],
        10: [65, 75],
    }

    function clampToSlotRange(slot: number, totalSec: number) {
        const [minM, maxM] = slotMinuteRanges[slot] || [55, 80]
        const totalM = Math.floor(totalSec / 60)
        const sec = totalSec % 60
        const clampedM = Math.min(Math.max(totalM, minM), maxM)
        return clampedM * 60 + sec
    }

    function togglePredictMode() {
        setPredictMode(prev => {
            const next = !prev
            if (next) {
                setPredictions(p => {
                    const copy = { ...p }
                    for (let slot = 1; slot <= 10; slot++) {
                        copy[slot] = clampToSlotRange(slot, copy[slot])
                    }
                    return copy
                })
            }
            return next
        })
    }

    function renderEntriesGrid(p: Player) {
        const grades: Grade[] = [1, 2, 3, 4]
        const cols: EkidenType[] = ["出雲", "全日本", "箱根"]
        const lookup = new Map<string, EntryRecord>();
        (p.entries || []).forEach(r => lookup.set(`${r.grade}-${r.ekiden}`, r))
        function cellBg(rec?: EntryRecord) {
            if (!rec) return undefined
            if (rec.dnf) return "#ffe5e5"
            if (rec.symbol === "△") return "#d6ecff"
            if (rec.rank === 1) return "#ffd700"
            if (rec.rank === 2) return "#c0c0c0"
            if (rec.rank === 3) return "#cd7f32"
            return undefined
        }
        return (
            <div style={{ border: "1px solid #969696" }}>
                <div style={{ background: "#fffa9f", padding: 6, fontWeight: 600 }}>駅伝エントリー</div>
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
                                const text = rec?.symbol
                                    ? rec.symbol
                                    : rec?.intervalName
                                        ? `${rec.intervalName}${rec.rank ?? ""}位`
                                        : ""
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
                                        <div style={{ whiteSpace: "nowrap", color: rec?.isNewRecord ? "red" : undefined }}>{text}</div>
                                        {rec?.time && (
                                            <div style={{ fontSize: 12, color: rec?.isNewRecord ? "red" : "#555", marginTop: 2, whiteSpace: "nowrap" }}>{rec.time}{rec?.isNewRecord ? <span style={{ color: "red", marginRight: 2 }}>『新』</span> : null}</div>
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

    function handleAssign(slot: number, player: Player) {
        if (assignedIds.has(player.id)) return
        if (assignments[slot]) return
        setAssignments(prev => ({ ...prev, [slot]: player }))
        setSelectedPlayerId(null)
        setSelectedSlot(null)
    }

    function handleUnassign(slot: number) {
        setAssignments(prev => ({ ...prev, [slot]: null }))
    }

    function onDragStart(e: React.DragEvent<HTMLDivElement>, playerId: number) {
        e.dataTransfer.setData("text/plain", String(playerId))
    }

    function onDrop(e: React.DragEvent<HTMLDivElement>, slot: number) {
        const id = Number(e.dataTransfer.getData("text/plain"))
        const player = players.find(p => p.id === id)
        if (player) handleAssign(slot, player)
    }

    function onExport() {
        const slots = Array.from({ length: 10 }, (_, i) => i + 1).map(slot => {
            const p = assignments[slot] as Player | null
            const sec = predictions[slot]
            return { slot, playerId: p ? p.id : null, playerName: p ? p.name : null, predictSec: (predictMode && typeof sec === "number") ? sec : null }
        })
        const playerEntries = players.reduce<Record<number, EntryRecord[]>>((acc, p) => { acc[p.id] = p.entries || []; return acc }, {})
        const playerScores = players.reduce<Record<number, { score1500m?: string; score5000m?: string; score10000m?: string; scoreHalf?: string }>>(
            (acc, p) => { acc[p.id] = { score1500m: p.score1500m, score5000m: p.score5000m, score10000m: p.score10000m, scoreHalf: p.scoreHalf }; return acc },
            {}
        )
        const schoolName = selectedSchool?.name ?? (() => {
            try {
                const t = teams.find((x: any) => x.id === selectedTeamId)
                const s = schools.find((ss: any) => ss.id === t?.schoolId)
                return s?.name ?? String(t?.schoolId ?? "")
            } catch { return "" }
        })()
        const data = { year: yearLabel, school: schoolName, predicted: !!predictMode, slots, playerEntries, playerScores }
        try { localStorage.setItem("hakone_summary", JSON.stringify(data)) } catch { }
        router.push(`/predict/hakone/${yearLabel}/summary`)
    }

    function resetAll() {
        setAssignments(Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, null])))
        setSelectedPlayerId(null)
        setSelectedSlot(null)
        setDetailPlayer(null)
    }

    function handleSchoolChange(id: number) {
        const opt = schoolOptions.find(s => s.id === id)
        if (!opt) return
        setSelectedSchool(opt)
        setSelectedTeamId(opt.teamId)
        resetAll()
    }

    useEffect(() => {
        ; (async () => {
            const ekidensData = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            setEkidens(ekidensData)
            const schoolsData = await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools")
            setSchools(schoolsData)
            const hakone = ekidensData.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
            setEditions(eds)
            const ed = eds.find((x: any) => String(x.ekiden_th) === String(yearLabel))
            if (ed) { setHakoneThId(ed.id); setEventYear(Number(ed.year)) }
        })()
    }, [yearLabel])

    useEffect(() => {
        ; (async () => {
            if (!hakoneThId) { setTeams([]); return }
            const list = await fetchPublicOrApi<any[]>("public-teams", Number(hakoneThId), `/api/teams?Ekiden_thId=${hakoneThId}`)
            setTeams(list)
            if (list.length > 0) {
                const qSchoolId = Number(searchParams.get("schoolId"))
                const target = Number.isFinite(qSchoolId) ? list.find((t: any) => t.schoolId === qSchoolId) || list[list.length - 1] : list[list.length - 1]
                const opt = { id: target.schoolId, name: (schools.find((s: any) => s.id === target.schoolId)?.name ?? String(target.schoolId)), teamId: target.id }
                setSelectedSchool(opt)
                setSelectedTeamId(opt.teamId)
                // setSelectedTeamId(5)
            }
        })()


    }, [hakoneThId, schools, searchParams])

    useEffect(() => {
        ; (async () => {
            if (!selectedTeamId) { setMembers([]); setStudents([]); setPlayers([]); setTeamResults([]); return }
            const t = teams.find((x: any) => x.id === selectedTeamId)
            if (!t) return
            const mems = await fetchPublicOrApi<any[]>("public-team-members", Number(selectedTeamId), `/api/team-members?ekiden_no_teamId=${selectedTeamId}`)
            const stus = await fetchPublicOrApi<any[]>("public-students", Number(t.schoolId), `/api/students?schoolId=${t.schoolId}`)
            setMembers(mems)
            setStudents(stus)
            const items = await fetchPublicOrApi<any[]>("public-ekiden-results", { teamId: Number(selectedTeamId), thId: hakoneThId ? Number(hakoneThId) : null }, `/api/ekiden-results?ekiden_no_teamId=${selectedTeamId}${hakoneThId ? `&Ekiden_thId=${hakoneThId}` : ""}`)
            setTeamResults(items)
            const ekidensData = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            const nameToId = Object.fromEntries(ekidensData.map((e: any) => [e.name, e.id])) as Record<string, number>
            const map = new Map<number, any>()
            stus.forEach((s: any) => map.set(s.id, s))
            const pad2 = (n: number) => String(n).padStart(2, "0")
            const fmtMMSS = (v?: number | null) => {
                if (v == null) return undefined
                const t = Number(v)
                const mm = Math.floor(t / 60)
                const s = t - mm * 60
                let secStr = s.toFixed(2)
                if (secStr === "60.00") return `${pad2(mm + 1)}:00.00`
                const [si, sf] = secStr.split(".")
                return `${pad2(mm)}:${String(si).padStart(2, "0")}.${sf}`
            }
            const fmtHHMMSS = (v?: number | null) => {
                if (v == null) return undefined
                const t = Math.floor(Number(v))
                const hh = Math.floor(t / 3600)
                const mm = Math.floor((t % 3600) / 60)
                const ss = Math.floor(t % 60)
                return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`
            }
            const gradeMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 }
            const entriesById = new Map<number, EntryRecord[]>()
            items.forEach((it: any) => {
                const sid = it.studentId
                const list = entriesById.get(sid) || []
                const rec: EntryRecord = { ekiden: "箱根", grade: gradeMap[it.grade as string] as Grade, intervalName: it.intervalName as string | undefined, rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined, year: undefined, runner: undefined, runnerGrade: undefined, isNewRecord: it?.isNewRecord === true }
                list.push(rec)
                entriesById.set(sid, list)
            })
            const studentIds = mems.map((m: any) => m.studentId).join(",")
            const hist = await fetchPublicOrApi<any[]>("public-student-entries", studentIds.split(",").map(s => Number(s)).filter(n => Number.isFinite(n)).sort((a, b) => a - b), `/api/student-entries?studentIds=${studentIds}`)
            const EID = { HAKONE: nameToId["箱根"], ZENNIHON: nameToId["全日本"], IZUMO: nameToId["出雲"] }
            const presentEkidenIds = Array.from(new Set(hist.map((h: any) => h.ekidenId).filter(Boolean))) as number[]
            const intervalMaps: Record<number, Record<number, string>> = {}
            await Promise.all(presentEkidenIds.map(async (eid) => {
                const arr = await fetchPublicOrApi<any[]>("public-intervals", Number(eid), `/api/intervals?ekidenId=${eid}`)
                intervalMaps[eid] = Object.fromEntries(arr.map((x: any) => [x.id, x.name]))
            }))
            hist.forEach((it: any) => {
                const sid = it.studentId
                const list = entriesById.get(sid) || []
                let ek: EkidenType | undefined = undefined
                if (it.ekidenId === EID.IZUMO) ek = "出雲"
                else if (it.ekidenId === EID.ZENNIHON) ek = "全日本"
                else if (it.ekidenId === EID.HAKONE) ek = "箱根"
                if (!ek) return
                const g = gradeMap[it.grade as string] as Grade
                const nameFromMap = intervalMaps[it.ekidenId]?.[it.intervalId]
                const rec: EntryRecord = { ekiden: ek, grade: g, intervalName: (typeof it.intervalName === "string" ? it.intervalName : nameFromMap), rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined, year: undefined, runner: undefined, runnerGrade: undefined, isNewRecord: it?.isNewRecord === true }
                list.push(rec)
                entriesById.set(sid, list)
            })
            const playersNew: Player[] = mems.map((m: any, i: number) => {
                const s = map.get(m.studentId)
                return {
                    id: s?.id ?? i + 1,
                    name: s?.name ?? String(m.studentId),
                    role: m.role,
                    score1500m: fmtMMSS(s?.score_1500m),
                    score5000m: fmtMMSS(s?.score_5000m),
                    score10000m: fmtMMSS(s?.score_10000m),
                    scoreHalf: fmtHHMMSS(s?.score_half_marathon),
                    scoreFull: fmtHHMMSS(s?.score_full_marathon),
                    collegePB: fmtMMSS(s?.score_college_pb),
                    entries: entriesById.get(s?.id ?? m.studentId) || [],
                    entryYear: s?.entryYear
                }
            })
            setPlayers(playersNew)
        })()
    }, [selectedTeamId, teams, hakoneThId])


    const [messageApi, contextHolder] = message.useMessage();
    const info = () => {
        messageApi.open({
            type: 'info',
            content: '今年箱根已结束',
            duration: 10,
        });
    };



    return (
        <>
            {contextHolder}
            <Modal
                open={detailModalOpen}
                onCancel={() => { setDetailModalOpen(false); setDetailPlayer(null) }}
                footer={null}
                width={640}
            >
                {detailPlayer ? (
                    <div style={{ borderRadius: 10, background: "#fff" }}>
                        <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>队员详情</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8, fontSize: 12 }}>
                            <div>姓名：{detailPlayer.name}</div>
                            <div>年级：{gradeText(calcGrade(detailPlayer.entryYear))}</div>
                            <div>5000m：{detailPlayer.score5000m ?? "--"}</div>
                            <div>10000m：{detailPlayer.score10000m ?? "--"}</div>
                            <div>半程：{detailPlayer.scoreHalf ?? "--"}</div>
                            <div>高校PB：{detailPlayer.collegePB ?? "--"}</div>
                        </div>
                        {renderEntriesGrid(detailPlayer)}
                    </div>
                ) : null}
            </Modal>
            <div style={{ background: '/public/2024top.jpg', padding: 16, overflowX: "auto", maxWidth: 1200, margin: "0 auto" }} >
                <div className="pageHead" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
                    <h1 style={{ fontSize: 20 }}>{`第${yearLabel}回箱根驿传 十六选十分配`}</h1>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Select
                            style={{ minWidth: 200 }}
                            value={selectedSchool?.id}
                            options={schoolOptions.map(s => ({ value: s.id, label: s.name }))}
                            onChange={handleSchoolChange}
                            placeholder="选择学校"
                        />
                        <button onClick={() => router.push(`/predict/hakone/${yearLabel}/pb/student`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>选手PB榜</button>
                        <button onClick={() => router.push(`/predict/hakone/${yearLabel}/pb/school`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>学校PB榜</button>
                        <button onClick={() => router.push(`/predict/hakone/${yearLabel}/finalPredict` + (selectedSchool ? `?schoolId=${selectedSchool.id}` : ""))} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>最终首发替换</button>
                        <button onClick={togglePredictMode} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>{predictMode ? "关闭时间" : "预测时间"}</button>
                        <button onClick={resetAll} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>清空分配</button>
                        <button
                            // onClick={onExport}
                            onClick={info}

                            disabled={assignedIds.size !== 10} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6, opacity: assignedIds.size === 10 ? 1 : 0.5 }}>完成分配</button>
                    </div>
                </div>
                {predictMode && totalPrediction.count === 10 && (
                    <div style={{ marginBottom: 8, fontSize: 14, color: "#080808" }}>总预测：{formatSeconds(totalPrediction.sum)}</div>
                )}

                <div className="layout" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                        <div>
                            <h2 style={{ fontSize: 14, marginBottom: 6 }}>10区分配</h2>
                            <div className="slotGrid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(slot => {
                                    const assigned = assignments[slot]
                                    const canAssign = selectedPlayerId !== null && !assignedIds.has(selectedPlayerId)
                                    const isSelectedSlot = selectedSlot === slot
                                    return (
                                        <Tooltip
                                            key={slot}
                                            title={
                                                <div style={{ maxWidth: 900 }}>
                                                    <div style={{ marginBottom: 6, fontWeight: 600 }}>{intervalMeta[slot]?.name}</div>
                                                    <div>地形：{intervalMeta[slot]?.elevation ?? "--"}</div>
                                                    {/* <div>说明：{intervalMeta[slot]?.desc ?? "--"}</div> */}
                                                    <img src={`/hakone/${slot}.png`} style={{
                                                        width: "100%",
                                                        marginTop: 8
                                                    }} />
                                                    {/* {intervalMeta[slot]?.map ? (
                                                    
                                                ) : (
                                                    <div style={{ marginTop: 8, color: "#888" }}>暂无地形图</div>
                                                )} */}
                                                </div>
                                            }
                                            color="#fff"
                                            styles={{ container: { border: "1px solid #000000" } }}
                                        >
                                            <div
                                                onDrop={e => onDrop(e, slot)}
                                                onDragOver={e => e.preventDefault()}
                                                onClick={() => {
                                                    if (assigned) return
                                                    if (canAssign) {
                                                        const p = players.find(x => x.id === selectedPlayerId)
                                                        if (p) handleAssign(slot, p)
                                                        return
                                                    }
                                                    setSelectedSlot(isSelectedSlot ? null : slot)
                                                }}
                                                style={{
                                                    border: isSelectedSlot && !assigned ? "3px solid #000000" : "2px dashed #ccc",
                                                    borderRadius: 10,
                                                    padding: 10,
                                                    minHeight: 56,
                                                    background: assigned
                                                        ? "#a1d49b"
                                                        : isSelectedSlot
                                                            ? "#ffd700"
                                                            : canAssign
                                                                ? "#f0fbff"
                                                                : "#fffdf2",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                                    <strong>{slot}区</strong>
                                                    {assigned && (
                                                        <button
                                                            onClick={() => handleUnassign(slot)}
                                                            style={{ padding: "4px 8px", border: "1px solid #0d0d0d", borderRadius: 6 }}
                                                        >移除</button>
                                                    )}
                                                </div>
                                                <div>
                                                    {assigned ? (
                                                        <Tooltip
                                                            title={
                                                                <div style={{ maxWidth: 280 }}>
                                                                    <div style={{ marginBottom: 8, fontWeight: 600 }}>{assigned.name}</div>
                                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", gap: 8, marginBottom: 8 }}>
                                                                        <div>5000m：{assigned.score5000m ?? "--"}</div>
                                                                        <div>10000m：{assigned.score10000m ?? "--"}</div>
                                                                        <div>半程：{assigned.scoreHalf ?? "--"}</div>
                                                                        {/* <div>全程：{assigned.scoreFull ?? "--"}</div> */}
                                                                        <div>年级：{gradeText(calcGrade(assigned.entryYear))}</div>
                                                                        <div>高校pb：{assigned.collegePB ?? "--"}</div>
                                                                    </div>
                                                                    {renderEntriesGrid(assigned)}
                                                                </div>
                                                            }
                                                            color="#fff"
                                                            styles={{ container: { border: "2px solid #010101", minWidth: 320 } }}
                                                            placement="bottomRight"
                                                        >
                                                            <div
                                                                onClick={() => { setDetailPlayer(assigned); setDetailModalOpen(true) }}
                                                                style={{ padding: 8, border: "1px solid #100f0f", borderRadius: 8 }}
                                                            >
                                                                {assigned.name}
                                                            </div>
                                                        </Tooltip>
                                                    ) : (
                                                        <div style={{ color: isSelectedSlot ? "#000000" : "#888" }}>{isSelectedSlot ? "选择一个队员分配到此" : "拖动或点击名单分配到此"}</div>
                                                    )}
                                                    {predictMode && assigned && (
                                                        <div style={{ marginTop: 8 }}>
                                                            {(() => {
                                                                const sec = predictions[slot]
                                                                const h = Math.floor(sec / 3600)
                                                                const m = Math.floor((sec % 3600) / 60)
                                                                const s = sec % 60
                                                                const value = dayjs().hour(h).minute(m).second(s)
                                                                const onChange = (val: any) => {
                                                                    if (!val) return
                                                                    let nh = val.hour()
                                                                    let nm = val.minute()
                                                                    let ns = val.second()
                                                                    const [minM, maxM] = slotMinuteRanges[slot] || [55, 80]
                                                                    // convert hh:mm to absolute minutes range
                                                                    const totalM = nh * 60 + nm
                                                                    const clampedM = Math.min(Math.max(totalM, minM), maxM)
                                                                    nh = Math.floor(clampedM / 60)
                                                                    nm = clampedM % 60
                                                                    const clamped = nh * 3600 + nm * 60 + ns
                                                                    setPredictions(prev => ({ ...prev, [slot]: clamped }))
                                                                }
                                                                const disabledTime = (_date: any) => {
                                                                    const [minM, maxM] = slotMinuteRanges[slot] || [55, 80]
                                                                    const allowedHours: number[] = []
                                                                    if (minM <= 59) allowedHours.push(0)
                                                                    if (maxM >= 60) allowedHours.push(1)
                                                                    const disabledHours = () => Array.from({ length: 24 }, (_, i) => i).filter(i => !allowedHours.includes(i))
                                                                    const disabledMinutes = (selectedHour?: number) => {
                                                                        const allowed: number[] = []
                                                                        if (selectedHour === 0 && minM <= 59) {
                                                                            const start = Math.max(0, minM)
                                                                            const end = Math.min(59, maxM)
                                                                            for (let i = start; i <= end; i++) allowed.push(i)
                                                                        } else if (selectedHour === 1 && maxM >= 60) {
                                                                            const start = Math.max(0, minM - 60)
                                                                            const end = Math.min(59, maxM - 60)
                                                                            for (let i = start; i <= end; i++) allowed.push(i)
                                                                        }
                                                                        return Array.from({ length: 60 }, (_, i) => i).filter(i => !allowed.includes(i))
                                                                    }
                                                                    const disabledSeconds = () => []
                                                                    return { disabledHours, disabledMinutes, disabledSeconds }
                                                                }
                                                                return (
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                        <span style={{ fontSize: 12, color: "#555" }}>预测</span>
                                                                        <span style={{ fontSize: 12 }}>{formatSeconds(sec)}</span>
                                                                        <TimePicker
                                                                            value={value}
                                                                            format="HH:mm:ss"
                                                                            showNow={false}
                                                                            onChange={onChange}
                                                                            disabledTime={disabledTime}
                                                                        />
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </div>
                        <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ flex: "0 0 540px" }}>
                                <h2 style={{ fontSize: 14, marginBottom: 6 }}>16人名单（未分配：{unassigned.length}）</h2>
                                <div className="playerGrid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                                    {players.map(p => {
                                        const assigned = assignedIds.has(p.id)
                                        const selected = selectedPlayerId === p.id
                                        const hasEntry = (p.entries && p.entries.length > 0)
                                        const hasHakone = (p.entries || []).some(e => e.ekiden === "箱根")
                                        return (
                                            <div
                                                key={p.id}
                                                draggable={!assigned}
                                                onDragStart={e => onDragStart(e, p.id)}
                                                onClick={() => {
                                                    if (assigned) return
                                                    if (selectedSlot) {
                                                        handleAssign(selectedSlot, p)
                                                        setDetailPlayer(p)
                                                        return
                                                    }
                                                    setSelectedPlayerId(selected ? null : p.id)
                                                    setDetailPlayer(p)
                                                }}
                                                style={{
                                                    padding: 8,
                                                    border: "1px solid #ccc",
                                                    borderRadius: 8,
                                                    background: assigned
                                                        ? "#828282"
                                                        : selected
                                                            ? "#7cbdf6"
                                                            : hasHakone
                                                                ? "#b7eb8f"
                                                                : hasEntry
                                                                    ? "#d8e370"
                                                                    : "#fffdf2",
                                                    opacity: assigned ? 0.6 : 1,
                                                    cursor: assigned ? "not-allowed" : "grab",
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span>{p.name} <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>{gradeText(calcGrade(p.entryYear))}</span></span>
                                                    {assigned && <span style={{ fontSize: 12, color: "#888" }}>已分配</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div style={{ marginTop: 6, fontSize: 12, border: "1px solid #ddd", borderRadius: 8, padding: 8, background: "rgba(var(--panel-bg-rgb), var(--panel-opacity))" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                                        <div>队伍：{selectedSchool?.name ?? "—"}</div>
                                        <div>名单：{players.length}人</div>
                                        <div>已分配：{assignedIds.size}人</div>
                                        <div>未分配：{unassigned.length}人</div>
                                    </div>
                                </div>
                            </div>
                            {detailPlayer && (
                                <div style={{ flex: "0 0 280px", border: "1px solid #8b8b8b", borderRadius: 10, background: "#fff", padding: 10 }}>
                                    <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>队员详情</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8, fontSize: 12 }}>
                                        <div>姓名：{detailPlayer.name}</div>
                                        <div>年级：{gradeText(calcGrade(detailPlayer.entryYear))}</div>
                                        <div>5000m：{detailPlayer.score5000m ?? "--"}</div>
                                        <div>10000m：{detailPlayer.score10000m ?? "--"}</div>
                                        <div>半程：{detailPlayer.scoreHalf ?? "--"}</div>
                                        <div>高校PB：{detailPlayer.collegePB ?? "--"}</div>
                                        {/* <div>全程：{detailPlayer.scoreFull ?? "--"}</div> */}
                                    </div>
                                    {renderEntriesGrid(detailPlayer)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rightCol" style={{ width: 280 }}>
                        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, background: "#fff" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                {/* <div style={{ fontWeight: 600, fontSize: 14 }}>参赛队员排行榜</div> */}
                                <Segmented
                                    options={[
                                        // "1500m", 
                                        "5000m", "10000m", "半马"]}
                                    value={metric}
                                    onChange={(val) => setMetric(val as any)}
                                />
                                <div style={{ fontSize: 12, color: "#555" }}>{top10AvgSec != null ? `前十平均：${formatSeconds(top10AvgSec)}` : "前十平均：—"}</div>
                            </div>
                            <div style={{ display: "grid", gap: 6 }}>
                                {leaderboard.map((p, idx) => {
                                    const time = metric === "1500m" ? p.score1500m : metric === "5000m" ? p.score5000m : metric === "10000m" ? p.score10000m : metric === "半马" ? p.scoreHalf : p.scoreFull
                                    const hasEntry = (p.entries && p.entries.length > 0)
                                    const hasHakone = (p.entries || []).some(e => e.ekiden === "箱根")
                                    return (
                                        <div key={p.id} onClick={() => { setDetailPlayer(p); setDetailModalOpen(true) }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 6, border: "1px solid #eee", borderRadius: 8, background: hasHakone ? "#b7eb8f" : hasEntry ? "#dbeb8a" : "#fffdf2", fontSize: 13 }}>
                                            <span style={{ width: 24, textAlign: "center" }}>{idx + 1}</span>
                                            <span style={{ flex: 1 }}>{p.name} <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>{gradeText(calcGrade(p.entryYear))}</span></span>
                                            <span style={{ color: "#555" }}>{time ?? "--"}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10, background: "#fff" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>队伍区间成绩（箱根）</div>
                        <div style={{ display: "grid", gap: 6 }}>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                                const items = teamResults.filter((it: any) => Number(it.baseIntervalId) === n)
                                const it = items[0]
                                const stu = it ? students.find((s: any) => s.id === it.studentId) : undefined
                                const name = stu?.name ?? (it ? String(it.studentId) : "—")
                                const time = it && typeof it.score === "number" ? formatSeconds(it.score) : "—"
                                const rank = it && typeof it.rank === "number" ? it.rank : "—"
                                return (
                                    <div key={n} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 6, border: "1px solid #eee", borderRadius: 8, background: "#fff", fontSize: 13 }}>
                                        <span style={{ width: 36 }}>{n}区</span>
                                        <span style={{ flex: 1 }}>{name}</span>
                                        <span style={{ width: 80, textAlign: "right", color: "#555" }}>{time}</span>
                                        <span style={{ width: 48, textAlign: "right", color: "#555" }}>{rank}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div> */}

                </div>
            </div>

            <div style={{ position: "fixed", right: 24, bottom: 80, display: "flex", flexDirection: "column", gap: 8, zIndex: 1000 }}>
                <button onClick={() => router.push(`/predict/hakone/${yearLabel}/result`)} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>查看结果</button>
                <button onClick={() => router.push(`/predict/hakone/${yearLabel}/result/rank`)} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>查看排名</button>
            </div>

            {/* 移除styled-jsx以规避解析错误 */}

        </>
    )
}

// export default Page
