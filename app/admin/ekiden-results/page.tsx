"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { Modal, Select, InputNumber, TimePicker, Input, message } from "antd"
import dayjs from "dayjs"
export default function EkidenResultsAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [editions, setEditions] = useState<any[]>([])
  const [ekidens, setEkidens] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [teamsModal, setTeamsModal] = useState<any[]>([])
  const [thIntervals, setThIntervals] = useState<any[]>([])
  const [baseIntervals, setBaseIntervals] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [studentsBySchool, setStudentsBySchool] = useState<Record<number, any[]>>({})
  const [schools, setSchools] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [ekidenFilterId, setEkidenFilterId] = useState<number | undefined>(undefined)
  const [Ekiden_thId, setEkiden_thId] = useState<number | undefined>(undefined)
  const [teamId, setTeamId] = useState<number | undefined>(undefined)
  const [intervalId, setIntervalId] = useState<number | undefined>(undefined)
  const [openAdd, setOpenAdd] = useState(false)
  const [openBulkCreate, setOpenBulkCreate] = useState(false)
  const [modalThId, setModalThId] = useState<number | undefined>(undefined)
  const [modalTeamId, setModalTeamId] = useState<number | undefined>(undefined)
  const [modalEkidenId, setModalEkidenId] = useState<number | undefined>(undefined)
  const [studentId, setStudentId] = useState<number | undefined>(undefined)
  const [rank, setRank] = useState<number | undefined>(undefined)
  const [scoreStr, setScoreStr] = useState<string>("")
  async function loadEditions() {
    const res = await fetch("/api/admin/editions")
    setEditions(await res.json())
  }
  async function loadEkidens() {
    const res = await fetch("/api/admin/ekidens")
    setEkidens(await res.json())
  }
  async function loadSchools() {
    const res = await fetch("/api/admin/schools")
    setSchools(await res.json())
  }
  async function loadStudentsOfSchool(sid?: number) {
    if (!sid) return
    const res = await fetch(`/api/admin/students?schoolId=${sid}`)
    const data = await res.json()
    setStudentsBySchool(prev => ({ ...prev, [sid]: data }))
  }
  async function loadTeams() {
    const url = Ekiden_thId ? `/api/admin/teams?Ekiden_thId=${Ekiden_thId}` : "/api/admin/teams"
    const res = await fetch(url)
    setTeams(await res.json())
  }
  async function loadIntervals() {
    if (!Ekiden_thId) { setThIntervals([]); setBaseIntervals([]); return }
    const tis = await fetch(`/api/admin/th-intervals?Ekiden_thId=${Ekiden_thId}`).then(x => x.json())
    setThIntervals(tis)
    const ed = editions.find(e => e.id === Ekiden_thId)
    if (ed) {
      const bs = await fetch(`/api/admin/intervals?ekidenId=${ed.ekidenId}`).then(x => x.json())
      setBaseIntervals(bs)
    } else {
      setBaseIntervals([])
    }
  }
  async function loadIntervalsFor(thId?: number) {
    if (!thId) { setBaseIntervals([]); return }
    const ed = editions.find(e => e.id === thId)
    if (ed) {
      const bs = await fetch(`/api/admin/intervals?ekidenId=${ed.ekidenId}`).then(x => x.json())
      setBaseIntervals(bs)
    } else {
      setBaseIntervals([])
    }
  }
  async function loadMembers() {
    if (!teamId) { setMembers([]); return }
    const res = await fetch(`/api/admin/team-members?ekiden_no_teamId=${teamId}`)
    setMembers(await res.json())
  }
  async function loadMembersFor(tid?: number) {
    if (!tid) { setMembers([]); return }
    const res = await fetch(`/api/admin/team-members?ekiden_no_teamId=${tid}`)
    setMembers(await res.json())
  }
  async function loadResults() {
    const params = new URLSearchParams()
    if (Ekiden_thId) params.set("Ekiden_thId", String(Ekiden_thId))
    if (teamId) params.set("ekiden_no_teamId", String(teamId))
    const res = await fetch(`/api/admin/ekiden-results?${params.toString()}`)
    setResults(await res.json())
  }
  async function loadResultsForTeam(tid?: number, thId?: number) {
    const params = new URLSearchParams()
    if (tid) params.set("ekiden_no_teamId", String(tid))
    if (thId) params.set("Ekiden_thId", String(thId))
    const res = await fetch(`/api/admin/ekiden-results?${params.toString()}`)
    const data = await res.json()
    setResults(data)
    return data
  }
  useEffect(() => { loadEditions(); loadEkidens(); loadSchools() }, [])
  useEffect(() => { loadTeams(); loadIntervals(); loadResults() }, [Ekiden_thId])
  useEffect(() => { setTeamId(undefined); setMembers([]); setStudents([]) }, [Ekiden_thId])
  useEffect(() => { loadResults() }, [teamId])
  useEffect(() => {
    const sids = Array.from(new Set(teams.map((t: any) => t.schoolId)))
    Promise.all(sids.filter(sid => !(studentsBySchool as any)[sid]).map(sid => loadStudentsOfSchool(sid)))
  }, [teams])
  useEffect(() => {
    const t = teams.find((x: any) => x.id === teamId)
    if (t) fetch(`/api/admin/students?schoolId=${t.schoolId}`).then(r => r.json()).then(setStudents)
    else setStudents([])
  }, [teamId, teams])

  async function loadStudentsForByTeamId(tid?: number) {
    if (!tid) { setStudents([]); return }
    const t = teamsModal.find((x: any) => x.id === tid) ?? teams.find((x: any) => x.id === tid)
    if (t) {
      const res = await fetch(`/api/admin/students?schoolId=${t.schoolId}`)
      setStudents(await res.json())
    } else {
      setStudents([])
    }
  }
  const ekidenOptions = useMemo(() => ekidens.map((k: any) => ({ value: k.id, label: k.name })), [ekidens])
  const editionOptions = useMemo(() => editions
    .filter((e: any) => !ekidenFilterId || e.ekidenId === ekidenFilterId)
    .map((e: any) => {
      const ekName = ekidens.find((k: any) => k.id === e.ekidenId)?.name ?? ""
      return { value: e.id, label: `${ekName ? ekName + " " : ""}第${e.ekiden_th}回 ${e.year}` }
    }), [editions, ekidens, ekidenFilterId])
  const editionOptionsModal = useMemo(() => editions
    .filter((e: any) => !modalEkidenId || e.ekidenId === modalEkidenId)
    .map((e: any) => {
      const ekName = ekidens.find((k: any) => k.id === e.ekidenId)?.name ?? ""
      return { value: e.id, label: `${ekName ? ekName + " " : ""}第${e.ekiden_th}回 ${e.year}` }
    }), [editions, ekidens, modalEkidenId])
  const teamOptions = useMemo(() => teams
    .filter((t: any) => {
      if (!ekidenFilterId) return true
      const ed = editions.find(e => e.id === t.Ekiden_thId)
      return ed ? ed.ekidenId === ekidenFilterId : false
    })
    .map((t: any) => ({ value: t.id, label: `${(schools.find((s: any) => s.id === t.schoolId)?.name ?? t.schoolId)} | 第${editions.find(e => e.id === t.Ekiden_thId)?.ekiden_th ?? ""}回` })), [teams, editions, ekidenFilterId, schools])
  const teamOptionsModal = useMemo(() => teamsModal.map((t: any) => ({ value: t.id, label: `${(schools.find((s: any) => s.id === t.schoolId)?.name ?? t.schoolId)} | 第${editions.find(e => e.id === t.Ekiden_thId)?.ekiden_th ?? ""}回` })), [teamsModal, editions, schools])
  const intervalOptions = useMemo(() => baseIntervals.map((b: any) => ({ value: b.id, label: b.name })), [baseIntervals])
  const memberOptions = useMemo(() => members.map((m: any) => ({ value: m.studentId, label: (students.find((s: any) => s.id === m.studentId)?.name ?? m.studentId) })), [members, students])
  const intervalTerm = useMemo(() => {
    const ed = editions.find((e: any) => e.id === Ekiden_thId)
    const ekName = ed ? (ekidens.find((k: any) => k.id === ed.ekidenId)?.name ?? "") : ""
    return ekName.includes("箱根") ? "区" : "区间"
  }, [editions, Ekiden_thId, ekidens])
  function cnNum(n: number) {
    const d = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"]
    if (n <= 10) return ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][n]
    if (n < 20) return "十" + d[n - 10]
    if (n % 10 === 0) return d[Math.floor(n / 10)] + "十"
    return d[Math.floor(n / 10)] + "十" + d[n % 10]
  }
  function tpToSeconds(v: any) { return v ? (v.hour() * 3600 + v.minute() * 60 + v.second()) : 0 }
  async function create() {
    if (!teamId || !intervalId || !studentId || !scoreStr) { message.error("请完整选择队伍、区间、队员并填写成绩"); return }
    const score = tpToSeconds(dayjs(scoreStr, "HH:mm:ss"))
    const r = await fetch("/api/admin/ekiden-results", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        Ekiden_no_teamId: teamId,
        Ekiden_th_intervalId: intervalId,
        studentId,
        score,
        rank
      })
    })
    if (!r.ok) { try { const j = await r.json(); message.error(j?.error || "创建失败") } catch { }; return }
    setOpenAdd(false)
    setStudentId(undefined)
    setRank(undefined)
    setScoreStr("")
    await loadResults()
  }
  const [rows, setRows] = useState<Array<{ id: number, studentId?: number, rank?: number, time?: string }>>([])

  useEffect(() => {
    setRows(baseIntervals.map((b: any) => ({ id: b.id, studentId: undefined, rank: undefined, time: "" })))
  }, [baseIntervals])
  async function submitAll() {
    const tgt = modalTeamId
    if (!tgt) { message.error("请选择队伍"); return }
    const entries = rows.map(r => ({ ekiden_intervalId: r.id, studentId: r.studentId as number, score: r.time ? (dayjs(r.time, "HH:mm:ss").hour() * 3600 + dayjs(r.time, "HH:mm:ss").minute() * 60 + dayjs(r.time, "HH:mm:ss").second()) : 0, rank: r.rank ?? 0 }))
    const invalid = entries.find(e => !e.studentId)
    if (invalid) { message.error("请为每个区间选择队员"); return }
    const res = await fetch("/api/admin/ekiden-results/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ Ekiden_no_teamId: tgt, entries }) })
    if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "批量创建失败") } catch { }; return }
    message.success("已提交全部区间成绩")
    await loadResults()
  }
  function prefillRows(tid?: number) {
    const teamResults = results.filter((r: any) => r.Ekiden_no_teamId === (tid ?? teamId))
    const timeFmt = (sec: number) => dayjs().startOf("day").add(Number(sec || 0), "second").format("HH:mm:ss")
    setRows(baseIntervals.map((b: any) => {
      const res = teamResults.find((r: any) => r.baseIntervalId === b.id)
      return { id: b.id, studentId: res?.studentId, rank: res?.rank, time: res ? timeFmt(res.score) : "" }
    }))
  }
  function openBulk() {
    (async () => {
      setModalThId(undefined)
      setModalTeamId(undefined)
      setRows([])
      setOpenBulkCreate(true)
    })()
  }
  useEffect(() => {
    if (!openBulkCreate) return
    (async () => {
      if (modalThId) {
        await loadIntervalsFor(modalThId)
        const url = modalThId ? `/api/admin/teams?Ekiden_thId=${modalThId}` : "/api/admin/teams"
        const r = await fetch(url)
        setTeamsModal(await r.json())
      } else {
        setTeamsModal([])
        setBaseIntervals([])
      }
      if (modalTeamId) {
        await loadMembersFor(modalTeamId)
        await loadStudentsForByTeamId(modalTeamId)
        const data = await loadResultsForTeam(modalTeamId, modalThId)
        prefillRows(modalTeamId)
      } else {
        setMembers([])
        setRows([])
      }
    })()
  }, [modalThId, modalTeamId, openBulkCreate])
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>驿传成绩</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Select value={ekidenFilterId} onChange={v => { setEkidenFilterId(v); setEkiden_thId(undefined); setTeamId(undefined); setMembers([]); setStudents([]) }} options={ekidenOptions} placeholder="驿传" style={{ minWidth: 200 }} />
        <Select value={Ekiden_thId} onChange={v => { setEkiden_thId(v); const ed = editions.find((e: any) => e.id === v); if (ed) setEkidenFilterId(ed.ekidenId) }} options={editionOptions} placeholder="届数" style={{ minWidth: 260 }} />
        <Select value={teamId} onChange={v => { setTeamId(v); const t = teams.find((x: any) => x.id === v); const ed = t ? editions.find((e: any) => e.id === t.Ekiden_thId) : undefined; if (ed) { setEkidenFilterId(ed.ekidenId); setEkiden_thId(ed.id) } }} options={teamOptions} placeholder="队伍" style={{ minWidth: 260 }} />
        <button onClick={openBulk} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>新增队伍成绩</button>
      </div>

      <Modal open={openBulkCreate} onCancel={() => setOpenBulkCreate(false)} onOk={submitAll} title="新增队伍成绩" width={760}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: 8 }}>
          <Select value={modalEkidenId} onChange={v => { setModalEkidenId(v); setModalThId(undefined); setModalTeamId(undefined); setTeamsModal([]); setMembers([]); setBaseIntervals([]); setRows([]) }} options={ekidenOptions} placeholder="驿传" />
          <Select value={modalThId} onChange={v => { setModalThId(v); const ed = editions.find((e: any) => e.id === v); if (ed) setModalEkidenId(ed.ekidenId); setModalTeamId(undefined); setTeamsModal([]); setMembers([]); setRows([]) }} options={editionOptionsModal} placeholder="届数" />
          <Select value={modalTeamId} onChange={v => { setModalTeamId(v); setMembers([]); setRows([]) }} options={teamOptionsModal} placeholder="队伍" />
        </div>
        {baseIntervals.length > 0 ? (
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 140px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
              <div>{intervalTerm}</div>
              <div>队员</div>
              <div>排名</div>
              <div>成绩</div>
            </div>
            {rows.map((r, idx) => {
              const name = baseIntervals.find((b: any) => b.id === r.id)?.name ?? (cnNum(idx + 1) + "区")
              const picked = new Set(rows.map(x => x.studentId).filter(v => v && v !== r.studentId))
              const options = memberOptions.map(opt => ({ ...opt, disabled: picked.has(opt.value) }))
              return (
                <div key={r.id} style={{ display: "grid", gridTemplateColumns: "140px 1fr 100px 140px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
                  <div>{name}</div>
                  <Select value={r.studentId} onChange={v => setRows(rows => rows.map((x, i) => i === idx ? { ...x, studentId: v } : x))} options={options} placeholder="选择队员" style={{ width: "100%" }} />
                  <InputNumber value={r.rank} onChange={v => setRows(rows => rows.map((x, i) => i === idx ? { ...x, rank: Number(v) } : x))} style={{ width: "100%" }} />
                  <TimePicker value={r.time ? dayjs(r.time, "HH:mm:ss") : null} onChange={v => setRows(rows => rows.map((x, i) => i === idx ? { ...x, time: v ? v.format("HH:mm:ss") : "" } : x))} format="HH:mm:ss" showNow={false} style={{ width: "100%" }} />
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: 12, color: "#666" }}>请选择驿传届数与队伍后开始录入成绩</div>
        )}
      </Modal>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 160px 160px 120px 120px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
          <div>{intervalTerm}</div>
          <div>队员</div>
          <div>成绩</div>
          <div>排名</div>
          <div>年级</div>
        </div>
        {results.map((r: any) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "160px 160px 160px 120px 120px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
            <div>{(() => { const ti = thIntervals.find(i => i.id === r.Ekiden_th_intervalId); const name = baseIntervals.find((b: any) => b.id === ti?.ekiden_intervalId)?.name; if (name) return name; const idx = thIntervals.findIndex(i => i.id === r.Ekiden_th_intervalId); return cnNum(idx + 1) + "区" })()}</div>
            <div>{(() => { const schId = teams.find((t: any) => t.id === r.Ekiden_no_teamId)?.schoolId; const list = schId ? (studentsBySchool[schId] || []) : students; const nm = list.find((s: any) => s.id === r.studentId)?.name; return nm ?? r.studentId })()}</div>
            <div>{dayjs().startOf("day").add(Number(r.score || 0), "second").format("HH:mm:ss")}</div>
            <div>{r.rank}</div>
            <div>{({ ONE: 1, TWO: 2, THREE: 3, FOUR: 4 } as any)[r.grade] ?? r.grade}</div>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          {Ekiden_thId && (
            <>
              {teams.map((t: any) => {
                const ed = editions.find((e: any) => e.id === t.Ekiden_thId)
                const ek = ekidens.find((k: any) => k.id === ed?.ekidenId)?.name ?? ""
                const teamResults = results.filter((r: any) => r.Ekiden_no_teamId === t.id)
                const rowsView = baseIntervals.map((b: any) => {
                  const tiId = thIntervals.find((ti: any) => ti.ekiden_intervalId === b.id)?.id
                  const res = teamResults.find((r: any) => r.Ekiden_th_intervalId === tiId)
                  const studentText = res ? ((studentsBySchool[t.schoolId] || []).find((s: any) => s.id === res.studentId)?.name ?? String(res.studentId)) : ""
                  const time = res ? dayjs().startOf("day").add(Number(res.score || 0), "second").format("HH:mm:ss") : ""
                  const rank = res?.rank ?? ""
                  return { name: b.name, student: studentText, rank, time }
                })
                return (
                  <div key={t.id} style={{ marginTop: 12, borderTop: "1px solid #eee", paddingTop: 8 }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ fontWeight: 600 }}>{schools.find((s: any) => s.id === t.schoolId)?.name ?? t.schoolId}</div>
                      <div>第{ed?.ekiden_th ?? ""}回</div>
                      <div>{ek}</div>
                      <button onClick={() => { setModalThId(ed?.id); setModalTeamId(t.id); setOpenBulkCreate(true) }} style={{ padding: "4px 10px", border: "1px solid #ccc", borderRadius: 6 }}>修改</button>
                      <button onClick={async () => { const p = new URLSearchParams(); p.set("ekiden_no_teamId", String(t.id)); p.set("Ekiden_thId", String(Ekiden_thId ?? "")); const r = await fetch(`/api/admin/ekiden-results?${p.toString()}`, { method: "DELETE" }); if (!r.ok) { try { const j = await r.json(); message.error(j?.error || "删除失败") } catch { }; return }; message.success("已删除该队伍全部成绩"); await loadResults() }} style={{ padding: "4px 10px", border: "1px solid #ccc", borderRadius: 6 }}>删除</button>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {rowsView.map((rv: any, i: number) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 160px 80px 120px", gap: 8, padding: 6, borderBottom: "1px solid #eee" }}>
                          <div>{rv.name}</div>
                          <div>{rv.student}</div>
                          <div>{rv.rank}</div>
                          <div>{rv.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
