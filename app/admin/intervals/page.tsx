"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { Modal, Input, InputNumber, Select, message, TimePicker } from "antd"
import dayjs from "dayjs"
export default function IntervalsAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [ekidens, setEkidens] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [ekidenId, setEkidenId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<any>({ name: "", description: "", kilometer: "", record: "", map: "", start_point: "", end_point: "", ekidenId: undefined })
  const [editing, setEditing] = useState<any | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  async function loadEkidens() {
    const res = await fetch("/api/admin/ekidens")
    setEkidens(await res.json())
  }
  async function load() {
    const url = ekidenId ? `/api/admin/intervals?ekidenId=${ekidenId}` : "/api/admin/intervals"
    const res = await fetch(url)
    setItems(await res.json())
  }
  useEffect(() => { loadEkidens() }, [])
  useEffect(() => { load() }, [ekidenId])
  const ekidenOptions = useMemo(() => ekidens.map((e: any) => ({ value: e.id, label: e.name })), [ekidens])
  function tpToSeconds(v: any) {
    if (!v) return 0
    return v.hour() * 3600 + v.minute() * 60 + v.second()
  }
  async function create() {
    if (!form.name || !form.ekidenId) { message.error("请填写区间名称并选择驿传"); return }
    const rec = form.record ? tpToSeconds(dayjs(form.record, "HH:mm:ss")) : 0
    const payload = { ...form, ekidenId: Number(form.ekidenId), record: rec }
    await fetch("/api/admin/intervals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setForm({ name: "", description: "", kilometer: "", record: "", map: "", start_point: "", end_point: "", ekidenId: ekidenId })
    setOpenAdd(false)
    await load()
  }
  async function update() {
    if (!editing) return
    if (!editing.name || !editing.ekidenId) { message.error("请填写区间名称并选择驿传"); return }
    const payload = { ...editing, ekidenId: Number(editing.ekidenId) }
    await fetch("/api/admin/intervals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setOpenEdit(false)
    setEditing(null)
    await load()
  }
  async function remove(id: number) {
    await fetch(`/api/admin/intervals?id=${id}`, { method: "DELETE" })
    await load()
  }
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>区间</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <select value={ekidenId ?? ""} onChange={e => setEkidenId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}>
          <option value="">全部驿传</option>
          {ekidenOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <button onClick={() => setOpenAdd(true)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>新增区间</button>
      </div>
      <Modal open={openAdd} onCancel={() => setOpenAdd(false)} onOk={create} title="新增区间">
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div>区间名称</div>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div>驿传</div>
          <Select value={form.ekidenId} onChange={v => setForm({ ...form, ekidenId: v })} options={ekidenOptions} />
          <div>公里数</div>
          <InputNumber value={form.kilometer ? Number(form.kilometer) : undefined} onChange={v => setForm({ ...form, kilometer: v })} style={{ width: "100%" }} />
          <div>记录</div>
          <TimePicker value={form.record ? dayjs(form.record, "HH:mm:ss") : null} onChange={v => setForm({ ...form, record: v ? v.format("HH:mm:ss") : "" })} format="HH:mm:ss" showNow={false} />
          <div>描述</div>
          <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </Modal>
      <Modal open={openEdit} onCancel={() => setOpenEdit(false)} onOk={update} title="编辑区间">
        {editing && (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div>区间名称</div>
            <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            <div>驿传</div>
            <Select value={editing.ekidenId} onChange={v => setEditing({ ...editing, ekidenId: v })} options={ekidenOptions} />
            <div>公里数</div>
            <InputNumber value={editing.kilometer} onChange={v => setEditing({ ...editing, kilometer: v })} style={{ width: "100%" }} />
            <div>记录</div>
            <TimePicker value={editing.record != null ? dayjs().startOf("day").add(Number(editing.record), "second") : null} onChange={v => setEditing({ ...editing, record: v ? tpToSeconds(v) : 0 })} format="HH:mm:ss" showNow={false} />
            <div>描述</div>
            <Input value={editing.description ?? ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
          </div>
        )}
      </Modal>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 80px 100px 100px 120px 1fr 240px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
          <div>区间</div>
          <div>驿传</div>
          <div>公里</div>
          <div>记录</div>
          <div>地图</div>
          <div>描述</div>
          <div>操作</div>
        </div>
        {items.map(it => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "140px 80px 100px 100px 120px 1fr 240px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
            {
              <>
                <div>{it.name}</div>
                <div>{ekidens.find(e => e.id === it.ekidenId)?.name ?? it.ekidenId}</div>
                <div>{it.kilometer}</div>
                <div>{dayjs().startOf("day").add(Number(it.record || 0), "second").format("HH:mm:ss")}</div>
                <div>{it.map}</div>
                <div>{it.description}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setEditing(it); setOpenEdit(true) }} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>编辑</button>
                  <button onClick={() => remove(it.id)} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>删除</button>
                </div>
              </>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
