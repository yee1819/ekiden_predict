"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { Modal, Input, message } from "antd"
export default function SchoolsAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [items, setItems] = useState<any[]>([])
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<any | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  async function load() {
    const res = await fetch("/api/admin/schools")
    const data = await res.json()
    setItems(data)
  }
  useEffect(() => { load() }, [])
  async function create() {
    if (!name) { message.error("请填写学校名称"); return }
    await fetch("/api/admin/schools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) })
    setName("")
    setOpenAdd(false)
    await load()
  }
  async function update() {
    if (!editing) return
    if (!editing.name) { message.error("请填写学校名称"); return }
    await fetch("/api/admin/schools", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) })
    setOpenEdit(false)
    setEditing(null)
    await load()
  }
  async function remove(id: number) {
    await fetch(`/api/admin/schools?id=${id}`, { method: "DELETE" })
    await load()
  }
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>学校</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setOpenAdd(true)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>新增学校</button>
      </div>
      <Modal open={openAdd} onCancel={() => setOpenAdd(false)} onOk={create} title="新增学校">
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div>学校名称</div>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
      </Modal>
      <Modal open={openEdit} onCancel={() => setOpenEdit(false)} onOk={update} title="编辑学校">
        {editing && (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div>学校名称</div>
            <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
          </div>
        )}
      </Modal>
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
          <div>学校名称</div>
          <div>操作</div>
        </div>
        {items.map(it => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
            <>
              <div>{it.name}</div>
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
