"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { Modal, Input, InputNumber, message } from "antd"
export default function EkidenAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [items, setItems] = useState<any[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [intervalCount, setIntervalCount] = useState<number>(10)
  const [requiredMembers, setRequiredMembers] = useState<number>(16)
  const [editing, setEditing] = useState<any | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  async function load() {
    const res = await fetch("/api/admin/ekidens")
    const data = await res.json()
    setItems(data)
  }
  useEffect(() => { load() }, [])
  async function create() {
    if (!name) { message.error("请填写名称"); return }
    await fetch("/api/admin/ekidens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description, intervalCount, required_team_members: requiredMembers }) })
    setName("")
    setDescription("")
    setIntervalCount(10)
    setRequiredMembers(16)
    setOpenAdd(false)
    await load()
  }
  async function update() {
    if (!editing) return
    if (!editing.name) { message.error("请填写名称"); return }
    await fetch("/api/admin/ekidens", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) })
    setOpenEdit(false)
    setEditing(null)
    await load()
  }
  async function remove(id: number) {
    const r = await fetch(`/api/admin/ekidens?id=${id}`, { method: "DELETE" })
    if (!r.ok) { try { const j = await r.json(); message.error(j?.error || "删除失败") } catch { message.error("删除失败") }; return }
    message.success("已删除驿传")
    await load()
  }
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>驿传</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setOpenAdd(true)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>新增驿传</button>
      </div>
      <Modal open={openAdd} onCancel={() => setOpenAdd(false)} onOk={create} title="新增驿传">
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div>名称</div>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="箱根、全日本、出雲" />
          <div>介绍</div>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
          <div>区间数量</div>
          <InputNumber min={1} max={20} value={intervalCount} onChange={v => setIntervalCount(Number(v))} style={{ width: "100%" }} />
          <div>队员人数</div>
          <InputNumber min={1} max={50} value={requiredMembers} onChange={v => setRequiredMembers(Number(v || 16))} style={{ width: "100%" }} />
        </div>
      </Modal>
      <Modal open={openEdit} onCancel={() => setOpenEdit(false)} onOk={update} title="编辑驿传">
        {editing && (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div>名称</div>
            <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            <div>介绍</div>
            <Input value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            <div>队员人数</div>
            <InputNumber min={1} max={50} value={editing.required_team_members ?? 16} onChange={v => setEditing({ ...editing, required_team_members: Number(v || 16) })} />
          </div>
        )}
      </Modal>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 180px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
          <div>名称</div>
          <div>介绍</div>
          <div>操作</div>
        </div>
        {items.map(it => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "120px 1fr 180px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
            <>
              <div>{it.name}</div>
              <div>{it.description}</div>
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
