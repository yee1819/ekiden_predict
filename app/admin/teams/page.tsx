"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { Modal, Select, Input, message } from "antd"
export default function TeamsAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [schools, setSchools] = useState<any[]>([])
  const [editions, setEditions] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<any>({ schoolId: undefined, Ekiden_thId: undefined, coach: "", leader: "" })
  const [editing, setEditing] = useState<any | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [ekidens, setEkidens] = useState<any[]>([])
  const [roster, setRoster] = useState<number[]>([])
  const [yearStart, setYearStart] = useState<number | undefined>(undefined)
  const [yearEnd, setYearEnd] = useState<number | undefined>(undefined)
  async function loadSchools() {
    const res = await fetch("/api/admin/schools")
    setSchools(await res.json())
  }
  async function loadEditions() {
    const res = await fetch("/api/admin/editions")
    setEditions(await res.json())
  }
  async function loadEkidens() {
    const res = await fetch("/api/admin/ekidens")
    setEkidens(await res.json())
  }
  async function load() {
    const url = ekidenThId ? `/api/admin/teams?Ekiden_thId=${ekidenThId}` : "/api/admin/teams"
    const res = await fetch(url)
    setItems(await res.json())
  }
  useEffect(() => { loadSchools(); loadEditions(); loadEkidens() }, [])
  useEffect(() => { load() }, [ekidenThId])
  useEffect(() => { if (form.schoolId) { fetch(`/api/admin/students?schoolId=${form.schoolId}`).then(r => r.json()).then(setStudents); setYearStart(undefined); setYearEnd(undefined) } else { setStudents([]) } }, [form.schoolId])
  useEffect(() => {
    const ed = editions.find((e: any) => e.id === form.Ekiden_thId)
    if (ed?.year) { setYearStart(Number(ed.year) - 3); setYearEnd(Number(ed.year)) }
  }, [form.Ekiden_thId, editions])
  const schoolOptions = useMemo(() => schools.map((s: any) => ({ value: s.id, label: s.name })), [schools])
  const editionOptions = useMemo(() => editions.map((e: any) => {
    const ekName = ekidens.find((k: any) => k.id === e.ekidenId)?.name ?? ""
    return { value: e.id, label: `${ekName ? ekName + " " : ""}第${e.ekiden_th}回 ${e.year}` }
  }), [editions, ekidens])
  const yearOptions = useMemo(() => { const y = new Date().getFullYear(); return Array.from({ length: 30 }, (_, i) => ({ value: y - i, label: String(y - i) })) }, [])
  const required = useMemo(() => {
    const ed = editions.find((e: any) => e.id === form.Ekiden_thId)
    const ek = ekidens.find((k: any) => k.id === ed?.ekidenId)
    return ek?.required_team_members ?? 16
  }, [form.Ekiden_thId, editions, ekidens])
  const studentOptions = useMemo(() => {
    const list = students.filter((s: any) => {
      if (!yearStart && !yearEnd) return true
      const ey = Number(s.entryYear)
      if (!ey) return false
      if (yearStart && yearEnd) { const min = Math.min(yearStart, yearEnd); const max = Math.max(yearStart, yearEnd); return ey >= min && ey <= max }
      if (yearStart) return ey >= yearStart
      if (yearEnd) return ey <= yearEnd
      return true
    })
    return list.map((s: any) => ({ value: s.id, label: s.entryYear ? `${s.name} (${s.entryYear})` : s.name }))
  }, [students, yearStart, yearEnd])
  async function create() {
    if (!form.schoolId || !form.Ekiden_thId) { message.error("请选择学校与届数"); return }
    if (roster.length !== required) { message.error(`请按要求选择${required}名队员`); return }
    const payload = { ...form, schoolId: Number(form.schoolId), Ekiden_thId: Number(form.Ekiden_thId), members: roster }
    await fetch("/api/admin/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setForm({ schoolId: undefined, Ekiden_thId: ekidenThId, coach: "", leader: "" })
    setRoster([])
    setOpenAdd(false)
    await load()
  }
  async function update() {
    if (!editing) return
    if (!editing.schoolId || !editing.Ekiden_thId) { message.error("请选择学校与届数"); return }
    const payload = { ...editing, schoolId: Number(editing.schoolId), Ekiden_thId: Number(editing.Ekiden_thId) }
    await fetch("/api/admin/teams", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setOpenEdit(false)
    setEditing(null)
    await load()
  }
  async function remove(id: number) {
    const r = await fetch(`/api/admin/teams?id=${id}`, { method: "DELETE" })
    if (!r.ok) { try { const j = await r.json(); message.error(j?.error || "删除失败") } catch { message.error("删除失败") }; return }
    message.success("已删除队伍")
    await load()
  }
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>队伍</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <select value={ekidenThId ?? ""} onChange={e => setEkidenThId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}>
          <option value="">全部届数</option>
          {editionOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <button onClick={() => setOpenAdd(true)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>新增队伍</button>
      </div>
      <Modal open={openAdd} onCancel={() => setOpenAdd(false)} onOk={create} title="新增队伍">
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div>学校</div>
          <Select value={form.schoolId} onChange={v => setForm({ ...form, schoolId: v })} options={schoolOptions} />
          <div>届数</div>
          <Select value={form.Ekiden_thId} onChange={v => { setForm({ ...form, Ekiden_thId: v }); const ed = editions.find((e: any) => e.id === v); if (ed?.year) { setYearStart(Number(ed.year) - 3); setYearEnd(Number(ed.year)) } }} options={editionOptions} />
          <div>教练</div>
          <Input value={form.coach} onChange={e => setForm({ ...form, coach: e.target.value })} />
          <div>队长</div>
          <Input value={form.leader} onChange={e => setForm({ ...form, leader: e.target.value })} />
          <div>入学年份（起）</div>
          <Select allowClear value={yearStart} onChange={v => setYearStart(v as number | undefined)} options={yearOptions} />
          <div>入学年份（止）</div>
          <Select allowClear value={yearEnd} onChange={v => setYearEnd(v as number | undefined)} options={yearOptions} />
          <div>队员</div>
          <Select mode="multiple" value={roster} onChange={(vals: number[]) => setRoster(vals.slice(0, required))} options={studentOptions} placeholder={`需${required}人`} optionFilterProp="label" />
          <div></div>
          <div style={{ fontSize: 12, color: "#666" }}>已选：{roster.length} / {required}</div>
        </div>
      </Modal>
      <Modal open={openEdit} onCancel={() => setOpenEdit(false)} onOk={update} title="编辑队伍">
        {editing && (
          <div style={{ display: "grid", gap: 8 }}>
            <Select value={editing.schoolId} onChange={v => setEditing({ ...editing, schoolId: v })} options={schoolOptions} />
            <Select value={editing.Ekiden_thId} onChange={v => setEditing({ ...editing, Ekiden_thId: v })} options={editionOptions} />
            <Input value={editing.coach} onChange={e => setEditing({ ...editing, coach: e.target.value })} />
            <Input value={editing.leader} onChange={e => setEditing({ ...editing, leader: e.target.value })} />
          </div>
        )}
      </Modal>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 180px 160px 160px 240px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
          <div>学校</div>
          <div>届数</div>
          <div>教练</div>
          <div>队长</div>
          <div>操作</div>
        </div>
        {items.map(it => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "160px 180px 160px 160px 240px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
            {editing?.id === it.id ? (
              <>
                <select value={editing.schoolId} onChange={e => setEditing({ ...editing, schoolId: Number(e.target.value) })} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}>
                  {schoolOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
                <select value={editing.Ekiden_thId} onChange={e => setEditing({ ...editing, Ekiden_thId: Number(e.target.value) })} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}>
                  {editionOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                </select>
                <input value={editing.coach} onChange={e => setEditing({ ...editing, coach: e.target.value })} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }} />
                <input value={editing.leader} onChange={e => setEditing({ ...editing, leader: e.target.value })} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={update} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>保存</button>
                  <button onClick={() => setEditing(null)} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>取消</button>
                </div>
              </>
            ) : (
              <>
                <div>{schools.find(s => s.id === it.schoolId)?.name ?? it.schoolId}</div>
                <div>{editionOptions.find(e => e.value === it.Ekiden_thId)?.label ?? it.Ekiden_thId}</div>
                <div>{it.coach}</div>
                <div>{it.leader}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditing(it); setOpenEdit(true) }} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>编辑</button>
                  <button onClick={() => remove(it.id)} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>删除</button>
                  <a href={`/admin/team-members?teamId=${it.id}`} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6, textDecoration: "none" }}>管理队员</a>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
