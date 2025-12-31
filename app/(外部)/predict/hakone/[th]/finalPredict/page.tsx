"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Select, message, Tooltip, Segmented, Modal, Input } from "antd"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

type EkidenType = "出雲" | "全日本" | "箱根"
type Grade = 1 | 2 | 3 | 4
type EntryRecord = { ekiden: EkidenType; grade: Grade; intervalName?: string; rank?: number; symbol?: "○" | "△" | "—"; dnf?: boolean; time?: string; year?: number; runner?: string; runnerGrade?: number }
type Player = { id: number; name: string; score5000m?: string; score10000m?: string; scoreHalf?: string; collegePB?: string; entries?: EntryRecord[]; entryYear?: number }

export default function FinalPredictPage() {
  const params = useParams() as { th?: string }
  const searchParams = useSearchParams()
  const router = useRouter()

  const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
  const [eventEkidenId, setEventEkidenId] = useState<number | undefined>(undefined)
  const [schools, setSchools] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(undefined)
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined)
  const [members, setMembers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [starterList, setStarterList] = useState<any[]>([])
  const [thIntervals, setThIntervals] = useState<any[]>([])
  const [baseIntervals, setBaseIntervals] = useState<any[]>([])
  const [eventYear, setEventYear] = useState<number | undefined>(undefined)

  const [assignments, setAssignments] = useState<Record<number, Player | null>>({})
  const [bench, setBench] = useState<Player[]>([])
  const [banned, setBanned] = useState<Map<number, number>>(new Map())
  const [subsForward, setSubsForward] = useState<number>(0)
  const [subsReturn, setSubsReturn] = useState<number>(0)
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [subbedSlots, setSubbedSlots] = useState<Set<number>>(new Set())
  const [nickname, setNickname] = useState<string>("")
  const [entriesById, setEntriesById] = useState<Record<number, EntryRecord[]>>({})
  const [selectedBenchId, setSelectedBenchId] = useState<number | null>(null)
  const [metric, setMetric] = useState<"5000m" | "10000m" | "半马">("5000m")
  const [showSubmit, setShowSubmit] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    ; (async () => {
      const ekidensData = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
      const hakone = ekidensData.find((e: any) => e.name === "箱根")
      if (!hakone) return
      const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
      const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
      if (ed) { setEkidenThId(ed.id); setEventEkidenId(ed.ekidenId); setEventYear(Number(ed.year)) }
      setSchools(await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools"))
    })()
  }, [params?.th])

  useEffect(() => {
    try {
      const cookieName = (document.cookie.match(/(?:^|; )predict_nickname=([^;]+)/)?.[1] || "").trim()
      if (cookieName) setNickname(decodeURIComponent(cookieName))
    } catch { }
  }, [])

  useEffect(() => {
    ; (async () => {
      if (!ekidenThId) return
      const tlist = await fetchPublicOrApi<any[]>("public-teams", Number(ekidenThId), `/api/teams?Ekiden_thId=${ekidenThId}`)
      const listRev = [...tlist].reverse()
      setTeams(listRev)
      const searchSchoolId = searchParams.get("schoolId")
      const initSchoolId = searchSchoolId ? Number(searchSchoolId) : listRev[0]?.schoolId
      setSelectedSchoolId(initSchoolId)
      const tid = initSchoolId ? (listRev.find((t: any) => t.schoolId === initSchoolId)?.id) : listRev[0]?.id
      setSelectedTeamId(tid)
      const tis = await fetchPublicOrApi<any[]>("public-th-intervals", Number(ekidenThId), `/api/th-intervals?Ekiden_thId=${ekidenThId}`)
      setThIntervals(tis)
      if (eventEkidenId) {
        const baseIntervals = await fetchPublicOrApi<any[]>("public-intervals", Number(eventEkidenId), `/api/intervals?ekidenId=${eventEkidenId}`)
        setBaseIntervals(baseIntervals)
      } else {
        setBaseIntervals([])
      }
    })()
  }, [ekidenThId])



  useEffect(() => {
    ; (async () => {
      if (!selectedTeamId || !ekidenThId) return
      if (!thIntervals || thIntervals.length === 0) return
      const team = teams.find((t: any) => t.id === selectedTeamId)
      const studs = await fetchPublicOrApi<any[]>("public-students", Number(team?.schoolId), `/api/students?schoolId=${team?.schoolId}`)
      setStudents(studs)
      const mems = await fetchPublicOrApi<any[]>("public-team-members", Number(selectedTeamId), `/api/team-members?ekiden_no_teamId=${selectedTeamId}`)
      setMembers(mems)
      const starters = await fetchPublicOrApi<any[]>("public-starter-list", { teamId: selectedTeamId, thId: ekidenThId }, `/api/starter-list?ekiden_no_teamId=${selectedTeamId}&Ekiden_thId=${ekidenThId}`)
      setStarterList(starters)

      const bySlot: Record<number, Player | null> = {}
      const nameById = (id: number) => studs.find((s: any) => s.id === id)?.name ?? String(id)
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
      starters.forEach((row: any) => {
        const slot = findSlotByThInterval(row.Ekiden_th_intervalId)
        if (slot) bySlot[slot] = { id: row.studentId, name: nameById(row.studentId) }
      })
      setAssignments(bySlot)

      const assignedIds = new Set(starters.map((r: any) => r.studentId))
      // 构建参赛历史
      const studentIds = mems.map((m: any) => m.studentId).filter(Boolean)
      try {
        const hist = await fetchPublicOrApi<any[]>("public-student-entries", studentIds, `/api/student-entries?studentIds=${studentIds.join(",")}`)
        const nameToId = Object.fromEntries((await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")).map((e: any) => [e.name, e.id])) as Record<string, number>
        const EID = { HAKONE: nameToId["箱根"], ZENNIHON: nameToId["全日本"], IZUMO: nameToId["出雲"] }
        const presentEkidenIds = Array.from(new Set(hist.map((h: any) => h.ekidenId).filter(Boolean))) as number[]
        const intervalMaps: Record<number, Record<number, string>> = {}
        await Promise.all(presentEkidenIds.map(async (eid) => {
          const arr = await fetchPublicOrApi<any[]>("public-intervals", Number(eid), `/api/intervals?ekidenId=${eid}`)
          intervalMaps[eid] = Object.fromEntries(arr.map((x: any) => [x.id, x.name]))
        }))
        const gradeMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 }
        const eb: Record<number, EntryRecord[]> = {}
        hist.forEach((it: any) => {
          const sid = it.studentId
          const list = eb[sid] || []
          let ek: EkidenType | undefined = undefined
          if (it.ekidenId === EID.IZUMO) ek = "出雲"
          else if (it.ekidenId === EID.ZENNIHON) ek = "全日本"
          else if (it.ekidenId === EID.HAKONE) ek = "箱根"
          if (!ek) return
          const g = gradeMap[String(it.grade)] as Grade
          const nameFromMap = intervalMaps[it.ekidenId]?.[it.intervalId]
          const rec: EntryRecord = { ekiden: ek, grade: g, intervalName: (typeof it.intervalName === "string" ? it.intervalName : nameFromMap), rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined }
          list.push(rec)
          eb[sid] = list
        })
        setEntriesById(eb)
      } catch { setEntriesById({}) }

      const benchList: Player[] = mems
        .filter((m: any) => !assignedIds.has(m.studentId))
        .map((m: any) => {
          const s = studs.find((x: any) => x.id === m.studentId)
          return {
            id: m.studentId,
            name: nameById(m.studentId),
            score5000m: fmtMMSS(s?.score_5000m),
            score10000m: fmtMMSS(s?.score_10000m),
            scoreHalf: fmtHHMMSS(s?.score_half_marathon),
            collegePB: fmtMMSS(s?.score_college_pb),
            entryYear: s?.entryYear,
            entries: entriesById[m?.studentId] || []
          }
        })
      setBench(benchList)
      setBanned(new Map())
      setSubsForward(0); setSubsReturn(0)
      setSubbedSlots(new Set())
    })()
  }, [selectedTeamId, ekidenThId, teams, thIntervals])

  function findSlotByThInterval(thIntervalId: number): number | null {
    const idx = thIntervals.findIndex((x: any) => x.id === thIntervalId)
    return idx >= 0 ? (idx + 1) : null
  }

  function forwardOrReturn(slot: number) { return slot <= 5 ? "forward" : "return" }

  function checkSubReason(slot: number, playerId: number): string | null {
    if (banned.has(playerId)) return "该选手已被换下，不能再上场"
    if (subbedSlots.has(slot)) return "该区已发生替换，不能再次更换"
    const total = subsForward + subsReturn
    if (total >= 6) return "总替换数已达上限（6），不能再换"
    if (forwardOrReturn(slot) === "forward") { if (subsForward >= 4) return "往路替换已达上限（4），不能再换" } else { if (subsReturn >= 4) return "复路替换已达上限（4），不能再换" }
    return null
  }
  function canSub(slot: number, playerId: number): boolean { return checkSubReason(slot, playerId) == null }

  function doSub(slot: number, playerId: number) {
    const reason = checkSubReason(slot, playerId)
    if (reason) { message.warning(reason); return }
    const bp = bench.find(b => b.id === playerId)
    setAssignments(prev => ({ ...prev, [slot]: { id: playerId, name: bp?.name || String(playerId), score5000m: bp?.score5000m, score10000m: bp?.score10000m, scoreHalf: bp?.scoreHalf, collegePB: bp?.collegePB, entryYear: bp?.entryYear, entries: entriesById[playerId] || [] } }))
    setBanned(prev => { const m = new Map(prev); const prevId = assignments[slot]?.id; if (prevId && prevId > 0) m.set(prevId, slot); return m })
    setSubbedSlots(prev => new Set(prev).add(slot))
    setBench(prev => prev.filter(b => b.id !== playerId))
    if (forwardOrReturn(slot) === "forward") setSubsForward(v => v + 1)
    else setSubsReturn(v => v + 1)
    setSelectedBenchId(null)
  }

  function doSwap(slot: number, playerId: number) {
    const incoming = bench.find(b => b.id === playerId)
    const outgoing = assignments[slot]
    if (!incoming || !outgoing) return
    setAssignments(prev => ({ ...prev, [slot]: { id: incoming.id, name: incoming.name, score5000m: incoming.score5000m, score10000m: incoming.score10000m, scoreHalf: incoming.scoreHalf, collegePB: incoming.collegePB, entryYear: incoming.entryYear, entries: entriesById[incoming.id] || [] } }))
    setBench(prev => {
      const removed = prev.filter(b => b.id !== playerId)
      const outExists = removed.some(b => b.id === outgoing.id)
      const outPlayer = { id: outgoing.id, name: outgoing.name, score5000m: outgoing.score5000m, score10000m: outgoing.score10000m, scoreHalf: outgoing.scoreHalf, collegePB: outgoing.collegePB, entryYear: outgoing.entryYear, entries: outgoing.entries || [] }
      return outExists ? removed : [outPlayer, ...removed]
    })
    // 保持已替换状态与计数不变，banned 不变（仍是原首发）
    setSelectedBenchId(null)
  }

  function makePlayerFromStudentId(id: number): Player {
    const s = students.find((ss: any) => ss.id === id)
    return {
      id,
      name: s?.name ?? String(id),
      score5000m: fmtMMSS(s?.score_5000m),
      score10000m: fmtMMSS(s?.score_10000m),
      scoreHalf: fmtHHMMSS(s?.score_half_marathon),
      collegePB: fmtMMSS(s?.score_college_pb),
      entryYear: s?.entryYear,
      entries: entriesById[id] || []
    }
  }

  function revertSlot(slot: number) {
    const thInt = thIntervals[slot - 1]
    const starterRow = starterList.find((r: any) => r.Ekiden_th_intervalId === thInt?.id)
    const starterId = starterRow?.studentId
    if (!starterId) return
    const cur = assignments[slot]
    if (!cur || cur.id === starterId) return
    setBench(prev => {
      const exists = prev.some(b => b.id === cur.id)
      return exists ? prev : [{ id: cur.id, name: cur.name, score5000m: cur.score5000m, score10000m: cur.score10000m, scoreHalf: cur.scoreHalf, collegePB: cur.collegePB, entryYear: cur.entryYear, entries: cur.entries || [] }, ...prev]
    })
    setAssignments(prev => ({ ...prev, [slot]: makePlayerFromStudentId(starterId) }))
    setBanned(prev => { const m = new Map(prev); m.delete(starterId); return m })
    setSubbedSlots(prev => { const n = new Set(prev); n.delete(slot); return n })
    if (forwardOrReturn(slot) === "forward") setSubsForward(v => Math.max(0, v - 1))
    else setSubsReturn(v => Math.max(0, v - 1))
    setSelectedBenchId(null)
  }

  function resetAll() {
    const initAssign: Record<number, Player | null> = {}
    starterList.forEach((row: any) => {
      const slot = findSlotByThInterval(row.Ekiden_th_intervalId)
      if (slot) initAssign[slot] = makePlayerFromStudentId(row.studentId)
    })
    setAssignments(initAssign)
    const assignedIds = new Set(starterList.map((r: any) => r.studentId))
    const benchList: Player[] = members
      .filter((m: any) => !assignedIds.has(m.studentId))
      .map((m: any) => makePlayerFromStudentId(m.studentId))
    setBench(benchList)
    setBanned(new Map())
    setSubsForward(0); setSubsReturn(0)
    setSubbedSlots(new Set())
    setSelectedSlot(null)
    setSelectedBenchId(null)
  }

  function submitSummary() {
    setShowSubmit(true)
  }

  async function doSubmit() {
    if (!ekidenThId || !selectedTeamId) return
    const subs = Object.entries(assignments).filter(([slot, p]) => {
      const row = starterList.find((r: any) => findSlotByThInterval(r.Ekiden_th_intervalId) === Number(slot))
      return row && p && row.studentId !== (p as any).id
    }).map(([slot, p]) => ({ slot: Number(slot), playerId: (p as any).id }))
    const userName = (nickname || "").trim()
    if (!userName) { message.error("请输入用户名"); return }
    if (submitting) return
    setSubmitting(true)
    try { document.cookie = `predict_nickname=${encodeURIComponent(userName)}; path=/; max-age=${60 * 60 * 24 * 365}` } catch { }
    const res = await fetch("/api/predict/hakone/final/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ekidenThId, ekidenNoTeamId: selectedTeamId, userName, substitutions: subs }) })
    if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "提交失败") } catch { message.error("提交失败") }; setSubmitting(false); return }
    try { localStorage.setItem("hakone_final_predict", JSON.stringify({ thId: ekidenThId, teamId: selectedTeamId, subs })) } catch { }
    setShowSubmit(false)
    setSubmitting(false)
    router.push(`/predict/hakone/${params?.th ?? ""}/finalPredictSummary`)
  }

  function calcGrade(entryYear?: number): 1 | 2 | 3 | 4 | undefined {
    if (!eventYear || !entryYear) return undefined
    const g = eventYear - entryYear + 1
    if (g < 1) return 1
    if (g > 4) return 4
    return g as 1 | 2 | 3 | 4
  }
  function gradeText(g?: 1 | 2 | 3 | 4) {
    if (!g) return "—"
    return g === 1 ? "一年" : g === 2 ? "二年" : g === 3 ? "三年" : "四年"
  }

  function formatSeconds(sec: number) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = Math.floor(sec % 60)
    const hhStr = String(h).padStart(2, "0")
    const mmStr = String(m).padStart(2, "0")
    const ssStr = String(s).padStart(2, "0")
    return `${hhStr}:${mmStr}:${ssStr}`
  }

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

  function renderEntriesGridByPlayer(playerId?: number | null) {
    const raw = playerId && entriesById[playerId] ? entriesById[playerId] : []
    const grades: Grade[] = [1, 2, 3, 4]
    const cols: EkidenType[] = ["出雲", "全日本", "箱根"]
    const lookup = new Map<string, EntryRecord>()
    raw.forEach(r => lookup.set(`${r.grade}-${r.ekiden}`, r))
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

  const hakone_qujian: Record<number, string> = {
    1: "（21.3km，大手町 → 鹤见）几乎全程平坦，仅有桥上起伏，序盘驱け引き的起点，各队多派速度型选手。",
    2: "（23.1km，鹤见 → 户塚）花之2区，最长距离ACE区间，中盘権太坂与末尾“户塚之壁”考验体力精神。",
    3: "（21.4km，户塚 → 平塚）沿海国道134号风景最美，向かい风强时自然战，位置维持与追击关键。",
    4: "（20.9km，平塚 → 小田原）前半平坦后半上坡不断，被视为つなぎ但近年重要性提升，体力分配关键。",
    5: "（20.8km，小田原 → 箱根）箱根山上坡终点，坡度大路面差，登坂力与精神力极限，往路大势在此定。",
    6: "（20.8km，箱根 → 小田原）复路起始大下坡，速度与下坡技巧关键，易过配速需稳住节奏。",
    7: "（21.3km，小田原 → 平塚）多为つなぎ，维持顺位与追击，配速与耐力考验。",
    8: "（21.4km，平塚 → 户塚）沿海逆风概率高，耐力与抗风能力，心理与节奏管理重要。",
    9: "（23.1km，户塚 → 鹤见）复路最长“复路之花之2区”，下坡后末尾上坡，エース级对决延续。",
    10: "（23.0km，鹤见 → 大手町）平坦最终区，精神压力与天气影响大，アンカー荣耀承载地。",
  }
  const intervalMeta = useMemo(() => {
    return Object.fromEntries(Array.from({ length: 10 }, (_, i) => {
      const n = i + 1
      return [n, { name: `${n}区`, elevation: hakone_qujian[n] }]
    })) as Record<number, { name: string; elevation?: string }>
  }, [])

  const schoolOptions = useMemo(() => {
    const allowed = new Set(teams.map((t: any) => t.schoolId))
    return schools.filter((s: any) => allowed.has(s.id)).slice().reverse().map((s: any) => ({ value: s.id, label: s.name }))
  }, [schools, teams])
  const teamOptions = useMemo(() => teams.filter((t: any) => !selectedSchoolId || t.schoolId === selectedSchoolId).slice().reverse().map((t: any) => ({ value: t.id, label: (schools.find((s: any) => s.id === t.schoolId)?.name ?? t.schoolId) })), [teams, selectedSchoolId, schools])

  const leaderboardPlayers = useMemo(() => {
    return members.map((m: any) => {
      const s = students.find((ss: any) => ss.id === m.studentId)
      if (!s) return null
      return {
        id: s.id,
        name: s.name,
        entryYear: s.entryYear,
        entries: entriesById[s.id] || [],
        sec5000: typeof s.score_5000m === "number" ? s.score_5000m : Infinity,
        sec10000: typeof s.score_10000m === "number" ? s.score_10000m : Infinity,
        secHalf: typeof s.score_half_marathon === "number" ? s.score_half_marathon : Infinity,
        show5000: fmtMMSS(s.score_5000m),
        show10000: fmtMMSS(s.score_10000m),
        showHalf: fmtHHMMSS(s.score_half_marathon),
      }
    }).filter(Boolean) as Array<{ id: number; name: string; entryYear?: number; entries?: EntryRecord[]; sec5000: number; sec10000: number; secHalf: number; show5000?: string; show10000?: string; showHalf?: string }>
  }, [members, students, entriesById])

  const leaderboard = useMemo(() => {
    const key = metric
    const getSec = (p: any) => key === "5000m" ? p.sec5000 : key === "10000m" ? p.sec10000 : p.secHalf
    return [...leaderboardPlayers].sort((a, b) => getSec(a) - getSec(b))
  }, [leaderboardPlayers, metric])

  const top10AvgSec = useMemo(() => {
    const secs = leaderboard.slice(0, 10).map(p => {
      const v = metric === "5000m" ? p.sec5000 : metric === "10000m" ? p.sec10000 : p.secHalf
      return Number.isFinite(v) ? v : undefined
    }).filter((v): v is number => typeof v === "number")
    if (!secs.length) return undefined as number | undefined
    return Math.round(secs.reduce((a, b) => a + b, 0) / secs.length)
  }, [leaderboard, metric])

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>最终首发替换</h1>
        <div style={{ flex: 1 }} />
        <button onClick={resetAll} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>清空</button>
        <button onClick={submitSummary} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>提交</button>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
        <Select value={selectedSchoolId} onChange={v => { setSelectedSchoolId(v); const group = teams.filter((t: any) => t.schoolId === v); const nxt = group[0]; setSelectedTeamId(nxt?.id) }} options={schoolOptions} placeholder="学校" style={{ minWidth: 200 }} />
        <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}` + (selectedSchoolId ? `?schoolId=${selectedSchoolId}` : ""))} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>区间分配</button>
        <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}/pb/school`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>学校PB</button>
        <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}/pb/student`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>个人PB</button>
        <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}/finalPredictSummary`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>查看汇总</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "840px 320px", gap: 16, marginTop: 16 }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>10区分配</div>
          <div className="slotGrid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(slot => {
              const cur = assignments[slot]
              const isSelectedSlot = selectedSlot === slot
              const baseName = (() => { const ti = thIntervals[slot - 1]; const bi = baseIntervals.find((b: any) => b.id === ti?.ekiden_intervalId); return bi?.name ?? `${slot}区` })()
              return (
                <Tooltip
                  key={slot}
                  title={
                    <div style={{ maxWidth: 900 }}>
                      <div style={{ marginBottom: 6, fontWeight: 600 }}>{intervalMeta[slot]?.name}</div>
                      <div>地形：{intervalMeta[slot]?.elevation ?? "--"}</div>
                      <img src={`/hakone/${slot}.png`} style={{ width: "100%", marginTop: 8 }} />
                    </div>
                  }
                  color="#fff"
                  styles={{ container: { border: "1px solid #000000" } }}
                >
                  <div
                    onClick={() => {
                      if (selectedBenchId) { subbedSlots.has(slot) ? doSwap(slot, selectedBenchId) : doSub(slot, selectedBenchId); return }
                      setSelectedSlot(isSelectedSlot ? null : slot)
                    }}
                    onDragOver={(e) => { e.preventDefault(); try { e.dataTransfer.dropEffect = "move" } catch { } }}
                    onDrop={(e) => {
                      e.preventDefault()
                      const idStr = e.dataTransfer.getData("text/plain")
                      const pid = Number(idStr)
                      if (!Number.isFinite(pid)) return
                      subbedSlots.has(slot) ? doSwap(slot, pid) : doSub(slot, pid)
                    }}
                    style={{
                      border: isSelectedSlot ? "3px solid #000000" : "2px dashed #ccc",
                      borderRadius: 10,
                      padding: 10,
                      minHeight: 56,
                      background: cur ? (subbedSlots.has(slot) ? "#cfe8ff" : "#a1d49b") : isSelectedSlot ? "#ffd700" : "#fffdf2",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <strong>{slot}区</strong>
                      {subbedSlots.has(slot) && (
                        <button onClick={(e) => { e.stopPropagation(); revertSlot(slot) }} style={{ padding: "4px 8px", border: "1px solid #0d0d0d", borderRadius: 6 }}>复原</button>
                      )}
                    </div>
                    <div>
                      {cur ? (
                        <Tooltip
                          title={
                            (() => {
                              const s = students.find((ss: any) => ss.id === cur.id)
                              const p: Player = {
                                id: cur.id,
                                name: cur.name,
                                score5000m: cur.score5000m ?? fmtMMSS(s?.score_5000m),
                                score10000m: cur.score10000m ?? fmtMMSS(s?.score_10000m),
                                scoreHalf: cur.scoreHalf ?? fmtHHMMSS(s?.score_half_marathon),
                                collegePB: cur.collegePB ?? fmtMMSS(s?.score_college_pb),
                                entryYear: cur.entryYear ?? s?.entryYear,
                                entries: entriesById[cur.id] || []
                              }
                              return (
                                <div style={{ flex: "0 0 280px", minWidth: 280, border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 10 }}>
                                  <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>队员详情</div>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8, fontSize: 12 }}>
                                    <div>姓名：{p.name}</div>
                                    <div>年级：{gradeText(calcGrade(p.entryYear))}</div>
                                    <div>5000m：{p.score5000m ?? "--"}</div>
                                    <div>10000m：{p.score10000m ?? "--"}</div>
                                    <div>半程：{p.scoreHalf ?? "--"}</div>
                                    <div>高校PB：{p.collegePB ?? "--"}</div>
                                  </div>
                                  {renderEntriesGridByPlayer(p.id)}
                                </div>
                              )
                            })()
                          }
                          color="#fff"
                          styles={{ container: { border: "1px solid #000000", minWidth: 320 } }}
                        >
                          <div style={{ padding: 8, border: "1px solid #100f0f", borderRadius: 8 }}>
                            {cur.name}
                          </div>
                        </Tooltip>
                      ) : (
                        <div style={{ color: isSelectedSlot ? "#000000" : "#888" }}>{isSelectedSlot ? "在右侧选择替补上本区" : "先选择区，再在右侧选择替补"}</div>
                      )}
                      <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>{baseName}</div>
                    </div>
                  </div>
                </Tooltip>
              )
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>往路替补：{subsForward}/4 | 复路替补：{subsReturn}/4 | 总替补：{subsForward + subsReturn}/6 | 操作：先点区间再点替补</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginTop: 12 }}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>替补席（六人）</div>
              <div className="playerGrid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                {bench.slice(0, 6).map(b => {
                  const selected = selectedBenchId === b.id
                  return (
                    <Tooltip
                      key={b.id}
                      title={
                        <div style={{ flex: "0 0 320px", border: "1px solid #ddd", minWidth: 280, borderRadius: 10, background: "#fff", padding: 10 }}>
                          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>队员详情</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8, fontSize: 12 }}>
                            <div>姓名：{b.name}</div>
                            <div>年级：{gradeText(calcGrade(b.entryYear))}</div>
                            <div>5000m：{b.score5000m ?? "--"}</div>
                            <div>10000m：{b.score10000m ?? "--"}</div>
                            <div>半程：{b.scoreHalf ?? "--"}</div>
                            <div>高校PB：{b.collegePB ?? "--"}</div>
                          </div>
                          {renderEntriesGridByPlayer(b.id)}
                        </div>
                      }
                      color="#fff"
                      styles={{ container: { border: "1px solid #000000", minWidth: 320 } }}
                    >
                      <div
                        key={b.id}
                        draggable
                        onDragStart={(e) => { try { e.dataTransfer.setData("text/plain", String(b.id)); e.dataTransfer.effectAllowed = "move" } catch { } }}
                        onClick={() => { if (selectedSlot) { subbedSlots.has(selectedSlot) ? doSwap(selectedSlot, b.id) : doSub(selectedSlot, b.id) } else setSelectedBenchId(selected ? null : b.id) }}
                        style={{
                          padding: 8,
                          border: "1px solid #ccc",
                          borderRadius: 8,
                          background: selected ? "#7cbdf6" : "#fffdf2",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{b.name} <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>{gradeText(calcGrade(b.entryYear))}</span></span>
                        </div>
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>被换下的选手</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                {Array.from(banned.entries()).filter(([id]) => id > 0).map(([id, slot]) => {
                  const name = students.find((s: any) => s.id === id)?.name ?? String(id)
                  const s = students.find((ss: any) => ss.id === id)
                  const p: Player = {
                    id,
                    name,
                    score5000m: fmtMMSS(s?.score_5000m),
                    score10000m: fmtMMSS(s?.score_10000m),
                    scoreHalf: fmtHHMMSS(s?.score_half_marathon),
                    collegePB: fmtMMSS(s?.score_college_pb),
                    entryYear: s?.entryYear,
                    entries: entriesById[id] || []
                  }
                  return (
                    <Tooltip
                      key={id}
                      title={
                        <div style={{ flex: "0 0 320px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 10, minWidth: 280 }}>
                          <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>队员详情</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8, fontSize: 12 }}>
                            <div>姓名：{p.name}</div>
                            <div>年级：{gradeText(calcGrade(p.entryYear))}</div>
                            <div>5000m：{p.score5000m ?? "--"}</div>
                            <div>10000m：{p.score10000m ?? "--"}</div>
                            <div>半程：{p.scoreHalf ?? "--"}</div>
                            <div>高校PB：{p.collegePB ?? "--"}</div>
                          </div>
                          {renderEntriesGridByPlayer(p.id)}
                        </div>
                      }
                      color="#fff"
                      styles={{ container: { border: "1px solid #000000", minWidth: 320 } }}
                    >
                      <div style={{ padding: 8, border: "1px solid #ccc", borderRadius: 8, background: "#ffe5e5", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <span>{name} <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>{gradeText(calcGrade(p.entryYear))} | 原{slot}区</span></span>
                        <button onClick={(e) => { e.stopPropagation(); revertSlot(slot) }} style={{ padding: "4px 8px", border: "1px solid #0d0d0d", borderRadius: 6, background: "#fff" }}>复原</button>
                      </div>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="rightCol" style={{ width: 280 }}>
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 10, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <Segmented options={["5000m", "10000m", "半马"]} value={metric} onChange={(val) => setMetric(val as any)} />
              <div style={{ fontSize: 12, color: "#555" }}>{top10AvgSec != null ? `前十平均：${formatSeconds(top10AvgSec)}` : "前十平均：—"}</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {leaderboard.map((p, idx) => {
                const time = metric === "5000m" ? p.show5000 : metric === "10000m" ? p.show10000 : p.showHalf
                const hasEntry = (p.entries && p.entries.length > 0)
                const hasHakone = (p.entries || []).some(e => e.ekiden === "箱根")
                return (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 6, border: "1px solid #eee", borderRadius: 8, background: hasHakone ? "#b7eb8f" : hasEntry ? "#dbeb8a" : "#fffdf2", fontSize: 13 }}>
                    <span style={{ width: 24, textAlign: "center" }}>{idx + 1}</span>
                    <span style={{ flex: 1 }}>{p.name} <span style={{ fontSize: 12, color: "#666", marginLeft: 6 }}>{gradeText(calcGrade(p.entryYear))}</span></span>
                    <span style={{ color: "#555" }}>{time ?? "--"}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <Modal open={showSubmit} onOk={doSubmit} onCancel={() => setShowSubmit(false)} confirmLoading={submitting} destroyOnHidden>
        <div style={{ display: "grid", gap: 8 }}>
          <div>请输入用户名</div>
          <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="用户名" />
        </div>
      </Modal>
    </div>
  )
}
