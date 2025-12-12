"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { Modal, Input, InputNumber, Select, message } from "antd"
export default function EditionsAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [ekidens, setEkidens] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [ekidenId, setEkidenId] = useState<number | undefined>(undefined)
  const [form, setForm] = useState<any>({ ekiden_th: "", year: "", ekidenId: undefined })
  const [editing, setEditing] = useState<any | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 30 }, (_, i) => ({ value: y - i, label: String(y - i) }))
  }, [])
  async function loadEkidens() {
    const res = await fetch("/api/admin/ekidens")
    setEkidens(await res.json())
  }
  async function load() {
    const url = ekidenId ? `/api/admin/editions?ekidenId=${ekidenId}` : "/api/admin/editions"
    const res = await fetch(url)
    setItems(await res.json())
  }
  useEffect(() => { loadEkidens() }, [])
  useEffect(() => { load() }, [ekidenId])
  const ekidenOptions = useMemo(() => ekidens.map((e: any) => ({ value: e.id, label: e.name })), [ekidens])
  async function create() {
    if (!form.ekiden_th || !form.year || !form.ekidenId) { message.error("请完整填写届数、年份和驿传"); return }
    const payload = { ...form, ekidenId: Number(form.ekidenId) }
    await fetch("/api/admin/editions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setForm({ ekiden_th: "", year: "", ekidenId: ekidenId })
    setOpenAdd(false)
    await load()
  }
  async function update() {
    if (!editing) return
    if (!editing.ekiden_th || !editing.year || !editing.ekidenId) { message.error("请完整填写届数、年份和驿传"); return }
    const payload = { ...editing, ekidenId: Number(editing.ekidenId) }
    await fetch("/api/admin/editions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    setOpenEdit(false)
    setEditing(null)
    await load()
  }
  async function remove(id: number) {
    const r = await fetch(`/api/admin/editions?id=${id}`, { method: "DELETE" })
    if (!r.ok) { try { const j = await r.json(); message.error(j?.error || "删除失败") } catch { message.error("删除失败") }; return }
    message.success("已删除届数")
    await load()
  }
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>届数</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <select value={ekidenId ?? ""} onChange={e => setEkidenId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}>
          <option value="">全部驿传</option>
          {ekidenOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <button onClick={() => setOpenAdd(true)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>新增届数</button>
      </div>
      <Modal open={openAdd} onCancel={() => setOpenAdd(false)} onOk={create} title="新增届数">
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div>第几回</div>
          <InputNumber value={form.ekiden_th ? Number(form.ekiden_th) : undefined} onChange={v => setForm({ ...form, ekiden_th: v })} style={{ width: "100%" }} />
          <div>年份</div>
          <Select value={form.year ? Number(form.year) : undefined} onChange={v => setForm({ ...form, year: v })} options={yearOptions} />
          <div>驿传</div>
          <Select value={form.ekidenId} onChange={v => setForm({ ...form, ekidenId: v })} options={ekidenOptions} />
        </div>
      </Modal>
      <Modal open={openEdit} onCancel={() => setOpenEdit(false)} onOk={update} title="编辑届数">
        {editing && (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div>第几回</div>
            <InputNumber value={editing.ekiden_th} onChange={v => setEditing({ ...editing, ekiden_th: v })} style={{ width: "100%" }} />
            <div>年份</div>
            <Select value={editing.year} onChange={v => setEditing({ ...editing, year: v })} options={yearOptions} />
            <div>驿传</div>
            <Select value={editing.ekidenId} onChange={v => setEditing({ ...editing, ekidenId: v })} options={ekidenOptions} />
          </div>
        )}
      </Modal>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 140px 1fr 240px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
          <div>第几回</div>
          <div>年份</div>
          <div>驿传</div>
          <div>操作</div>
        </div>
        {items.map(it => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "140px 140px 1fr 240px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
            <>
              <div>{it.ekiden_th}</div>
              <div>{it.year}</div>
              <div>{ekidens.find(e => e.id === it.ekidenId)?.name ?? it.ekidenId}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { setEditing(it); setOpenEdit(true) }} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>编辑</button>
                <button onClick={() => remove(it.id)} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>删除</button>
              </div>
            </>
          </div>
        ))}
      </div>
    </div>
  )
}
