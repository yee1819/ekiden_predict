"use client"
import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { Table, Select, Modal, Input, message } from "antd"
import { useSearchParams } from "next/navigation"
function TeamMembersAdminInner() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [editions, setEditions] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [ekidens, setEkidens] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
  const [teamId, setTeamId] = useState<number | undefined>(undefined)
  const [candidate, setCandidate] = useState<number | undefined>(undefined)
  const [bulkCandidates, setBulkCandidates] = useState<number[]>([])
  const [role, setRole] = useState<"STARTER" | "RESERVE">("STARTER")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [yearStart, setYearStart] = useState<number | undefined>(undefined)
  const [yearEnd, setYearEnd] = useState<number | undefined>(undefined)
  const params = useSearchParams()
  async function loadEditions() {
    const res = await fetch("/api/admin/editions")
    setEditions(await res.json())
  }
  async function loadSchools() {
    const res = await fetch("/api/admin/schools")
    setSchools(await res.json())
  }
  async function loadTeams() {
    const url = ekidenThId ? `/api/admin/teams?Ekiden_thId=${ekidenThId}` : "/api/admin/teams"
    const res = await fetch(url)
    setTeams(await res.json())
  }
  async function loadMembers() {
    const url = teamId ? `/api/admin/team-members?ekiden_no_teamId=${teamId}` : "/api/admin/team-members"
    const res = await fetch(url)
    setMembers(await res.json())
  }
  useEffect(() => { loadEditions(); loadSchools(); (async () => { const r = await fetch("/api/admin/ekidens"); setEkidens(await r.json()) })() }, [])
  useEffect(() => { loadTeams() }, [ekidenThId])
  useEffect(() => { loadMembers() }, [teamId])
  useEffect(() => {
    const tid = Number(params.get("teamId"))
    if (Number.isFinite(tid)) setTeamId(tid)
  }, [])
  useEffect(() => {
    const t = teams.find((x: any) => x.id === teamId)
    if (t) setEkidenThId(t.Ekiden_thId)
    if (t) fetch(`/api/admin/students?schoolId=${t.schoolId}`).then(r => r.json()).then(setStudents)
  }, [teamId, teams])
  const editionOptions = useMemo(() => editions.map((e: any) => {
    const ekName = ekidens.find((k: any) => k.id === e.ekidenId)?.name ?? ""
    return { value: e.id, label: `${ekName ? ekName + " " : ""}第${e.ekiden_th}回 ${e.year}` }
  }), [editions, ekidens])
  const teamOptions = useMemo(() => teams.map((t: any) => ({ value: t.id, label: `${(schools.find((s: any) => s.id === t.schoolId)?.name ?? t.schoolId)} | 第${editions.find(e => e.id === t.Ekiden_thId)?.ekiden_th ?? ""}回` })), [teams, editions, schools])
  const studentOptions = useMemo(() => {
    const picked = new Set(members.map((m: any) => m.studentId))
    const ed = editions.find((e: any) => e.id === ekidenThId)
    const start = yearStart ?? (ed ? ed.year - 3 : undefined)
    const end = yearEnd ?? (ed ? ed.year : undefined)
    const list = students
      .filter((s: any) => !picked.has(s.id))
      .filter((s: any) => s.name.includes(search))
      .filter((s: any) => {
        const y = s.entryYear != null ? Number(s.entryYear) : undefined
        if (start != null && (y == null || y < start)) return false
        if (end != null && (y == null || y > end)) return false
        return true
      })
    return list.map((s: any) => ({ value: s.id, label: s.name }))
  }, [students, members, search, yearStart, yearEnd, ekidenThId, editions])

  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 30 }, (_, i) => ({ value: y - i, label: String(y - i) }))
  }, [])

  useEffect(() => {
    const ed = editions.find((e: any) => e.id === ekidenThId)
    if (ed) { setYearStart(ed.year - 3); setYearEnd(ed.year) }
  }, [ekidenThId, editions])
  async function addMember() {
    if (!teamId || !candidate) return
    const s = students.find((x: any) => x.id === candidate)
    const isStarter = !!(s?.score_5000m || s?.score_10000m || s?.score_1500m)
    const res = await fetch("/api/admin/team-members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ekiden_no_teamId: teamId, studentId: candidate, role: isStarter ? "STARTER" : "RESERVE" }) })
    if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "添加失败") } catch { }; return }
    setCandidate(undefined)
    await loadMembers()
  }
  async function addMembersBulk() {
    if (!teamId || bulkCandidates.length === 0) return
    for (const sid of bulkCandidates) {
      const s = students.find((x: any) => x.id === sid)
      const isStarter = !!(s?.score_5000m || s?.score_10000m || s?.score_1500m)
      const res = await fetch("/api/admin/team-members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ekiden_no_teamId: teamId, studentId: sid, role: isStarter ? "STARTER" : "RESERVE" }) })
      if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "添加失败") } catch { } }
    }
    setBulkCandidates([])
    await loadMembers()
  }
  async function removeMember(id: number) {
    await fetch(`/api/admin/team-members?id=${id}`, { method: "DELETE" })
    await loadMembers()
  }
  const reqMembers = useMemo(() => {
    const t = teams.find((x: any) => x.id === teamId)
    const ed = editions.find((e: any) => e.id === t?.Ekiden_thId)
    const ek = ekidens.find((k: any) => k.id === ed?.ekidenId)
    return ek?.required_team_members ?? 16
  }, [teams, teamId, editions, ekidens])
  const columns = [
    { title: "队员", dataIndex: "studentId", key: "studentId", render: (v: number) => students.find(s => s.id === v)?.name ?? v },
    { title: "角色", dataIndex: "role", key: "role" },
    { title: "操作", key: "action", render: (_: any, r: any) => (<button onClick={() => removeMember(r.id)} style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: 6 }}>移除</button>) }
  ]
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>队伍队员</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <Select value={ekidenThId} onChange={v => setEkidenThId(v)} options={editionOptions} style={{ minWidth: 200 }} placeholder="届数" />
        <Select value={teamId} onChange={v => setTeamId(v)} options={teamOptions} style={{ minWidth: 300 }} placeholder="队伍" />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <Select value={candidate} onChange={v => setCandidate(v)} options={studentOptions} style={{ minWidth: 240 }} placeholder="选择队员" />
        <button onClick={addMember} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>添加</button>
        <button onClick={() => setPickerOpen(true)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>批量选择</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div>入学年份（起）</div>
          <Select allowClear value={yearStart} onChange={v => setYearStart(v as number | undefined)} options={yearOptions} style={{ minWidth: 120 }} />
          <div>入学年份（止）</div>
          <Select allowClear value={yearEnd} onChange={v => setYearEnd(v as number | undefined)} options={yearOptions} style={{ minWidth: 120 }} />
          <Select mode="multiple" value={bulkCandidates} onChange={(vals: number[]) => setBulkCandidates(vals)} options={studentOptions} placeholder="批量选择队员" optionFilterProp="label" style={{ minWidth: 280 }} />
          <button onClick={addMembersBulk} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>批量加入</button>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8, fontSize: 12, color: "#555" }}>已选：{members.length} / {reqMembers}</div>
        <Table size="small" columns={columns as any} dataSource={members.map(m => ({ ...m, key: m.id }))} pagination={false} />
      </div>
      <Modal open={pickerOpen} onCancel={() => setPickerOpen(false)} onOk={async () => {
        setPickerOpen(false)
      }} title="选择队员" footer={null}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索姓名" />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {studentOptions.map(opt => (
            <div key={opt.value} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
              <span>{opt.label}</span>
              <button onClick={async () => { setCandidate(opt.value as number); await addMember() }} style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: 6 }}>添加</button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default function TeamMembersAdminPage() {
  return (
    <Suspense fallback={<div style={{ padding: 12 }}>加载中...</div>}>
      <TeamMembersAdminInner />
    </Suspense>
  )
}
