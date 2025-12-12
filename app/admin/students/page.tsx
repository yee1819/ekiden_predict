"use client"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"
import { TimePicker, InputNumber, Modal, Input, Select, Space, message } from "antd"
import dayjs from "dayjs"
export default function StudentsAdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => { if (!isPending && !session) router.replace("/admin/login") }, [isPending, session])
  const [schools, setSchools] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [schoolId, setSchoolId] = useState<number | undefined>(undefined)
  const [filterEntryYear, setFilterEntryYear] = useState<string | undefined>(undefined)
  const [searchName, setSearchName] = useState<string>("")
  const [form, setForm] = useState<any>({ name: "", schoolId: undefined, score_1500m: "", score_1500c: undefined, score_5000m: "", score_5000c: undefined, score_10000m: "", score_10000c: undefined, collegePB: "", collegePBc: undefined, score_half_marathon: "", score_full_marathon: "", entryYear: "" })
  const [editing, setEditing] = useState<any | null>(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openBulk, setOpenBulk] = useState(false)
  const [bulkSchoolId, setBulkSchoolId] = useState<number | undefined>(undefined)
  const [bulkNames, setBulkNames] = useState("")
  const [bulkEntryYear, setBulkEntryYear] = useState<string | undefined>(undefined)
  const [bulkCollegePB, setBulkCollegePB] = useState<string>("")
  const [bulkCollegePBc, setBulkCollegePBc] = useState<number | undefined>(undefined)
  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear()
    return Array.from({ length: 30 }, (_, i) => ({ value: String(y - i), label: String(y - i) }))
  }, [])
  async function loadSchools() {
    const res = await fetch("/api/admin/schools")
    setSchools(await res.json())
  }
  async function load() {
    const url = schoolId ? `/api/admin/students?schoolId=${schoolId}` : "/api/admin/students"
    const res = await fetch(url)
    setItems(await res.json())
  }
  useEffect(() => { loadSchools() }, [])
  useEffect(() => { load() }, [schoolId])
  const schoolOptions = useMemo(() => schools.map((s: any) => ({ value: s.id, label: s.name })), [schools])
  const filteredItems = useMemo(() => {
    return items.filter((it: any) => {
      const byYear = filterEntryYear ? String(it.entryYear) === String(filterEntryYear) : true
      const byName = searchName ? String(it.name).toLowerCase().includes(searchName.toLowerCase().trim()) : true
      return byYear && byName
    })
  }, [items, filterEntryYear, searchName])
  function toSeconds(v: any) {
    if (!v) return null
    const h = v.hour()
    const m = v.minute()
    const s = v.second()
    return h * 3600 + m * 60 + s
  }
  function inRangeSeconds(v: any, minS: number, maxS: number) {
    if (!v) return false
    const s = toSeconds(v) as number
    return s >= minS && s <= maxS
  }
  async function create() {
    if (!form.schoolId || !form.name) { message.error("请先选择学校并填写姓名"); return }
    const p1500 = form.score_1500m && inRangeSeconds(dayjs(form.score_1500m, "mm:ss"), 3 * 60 + 25, 4 * 60 + 30)
    const p5000 = form.score_5000m && inRangeSeconds(dayjs(form.score_5000m, "mm:ss"), 12 * 60, 17 * 60)
    const p10000 = form.score_10000m && inRangeSeconds(dayjs(form.score_10000m, "mm:ss"), 26 * 60, 47 * 60)
    const phalf = form.score_half_marathon && inRangeSeconds(dayjs(form.score_half_marathon, "HH:mm:ss"), 55 * 60, 70 * 60)
    const pfull = form.score_full_marathon && inRangeSeconds(dayjs(form.score_full_marathon, "HH:mm:ss"), 2 * 3600, 3 * 3600)
    if (form.score_1500m && !p1500) { message.error("1500m范围为 3:25.00 - 4:30.00"); return }
    if (form.score_5000m && !p5000) { message.error("5000m范围为 12:00.00 - 17:00.00"); return }
    if (form.score_10000m && !p10000) { message.error("10000m范围为 26:00.00 - 47:00.00"); return }
    if (form.score_half_marathon && !phalf) { message.error("半马范围为 55:00 - 70:00"); return }
    if (form.score_full_marathon && !pfull) { message.error("全马范围为 2:00:00 - 3:00:00"); return }
    const payload = {
      name: form.name,
      schoolId: Number(form.schoolId),
      score_1500m: form.score_1500m ? (toSeconds(dayjs(form.score_1500m, "mm:ss")) + (Number(form.score_1500c || 0) / 100)) : null,
      score_5000m: form.score_5000m ? (toSeconds(dayjs(form.score_5000m, "mm:ss")) + (Number(form.score_5000c || 0) / 100)) : null,
      score_10000m: form.score_10000m ? (toSeconds(dayjs(form.score_10000m, "mm:ss")) + (Number(form.score_10000c || 0) / 100)) : null,
      score_college_pb: form.collegePB ? (toSeconds(dayjs(form.collegePB, "mm:ss")) + (Number(form.collegePBc || 0) / 100)) : null,
      score_half_marathon: form.score_half_marathon ? toSeconds(dayjs(form.score_half_marathon, "HH:mm:ss")) : null,
      score_full_marathon: form.score_full_marathon ? toSeconds(dayjs(form.score_full_marathon, "HH:mm:ss")) : null,
      entryYear: form.entryYear
    }
    const res = await fetch("/api/admin/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "创建失败") } catch { }; return }
    setForm({ name: "", schoolId: schoolId, score_1500m: "", score_1500c: undefined, score_5000m: "", score_5000c: undefined, score_10000m: "", score_10000c: undefined, collegePB: "", collegePBc: undefined, score_half_marathon: "", score_full_marathon: "", entryYear: "" })
    setOpenAdd(false)
    await load()
  }
  async function update() {
    if (!editing) return
    const secHHMMSS = (s?: string) => s ? toSeconds(parseHHMMSSFlex(s)) : null
    const secMMSS = (s?: string) => s ? toSeconds(dayjs(s, "mm:ss")) : null
    const payload = {
      id: editing.id,
      name: editing.name,
      schoolId: Number(editing.schoolId),
      score_1500m: secMMSS(editing.score_1500m) != null ? (secMMSS(editing.score_1500m) as number) + (Number(editing.score_1500c || 0) / 100) : null,
      score_5000m: secMMSS(editing.score_5000m) != null ? (secMMSS(editing.score_5000m) as number) + (Number(editing.score_5000c || 0) / 100) : null,
      score_10000m: secMMSS(editing.score_10000m) != null ? (secMMSS(editing.score_10000m) as number) + (Number(editing.score_10000c || 0) / 100) : null,
      score_college_pb: secMMSS(editing.collegePB) != null ? (secMMSS(editing.collegePB) as number) + (Number(editing.collegePBc || 0) / 100) : null,
      score_half_marathon: secHHMMSS(editing.score_half_marathon),
      score_full_marathon: secHHMMSS(editing.score_full_marathon),
      entryYear: editing.entryYear
    }
    const res = await fetch("/api/admin/students", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "更新失败") } catch { }; return }
    setEditing(null)
    await load()
  }
  async function remove(id: number) {
    await fetch(`/api/admin/students?id=${id}`, { method: "DELETE" })
    await load()
  }
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>学生</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
        <select value={schoolId ?? ""} onChange={e => setSchoolId(e.target.value ? Number(e.target.value) : undefined)} style={{ padding: 6, border: "1px solid #ddd", borderRadius: 6 }}>
          <option value="">全部学校</option>
          {schoolOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>
        <Select allowClear value={filterEntryYear} onChange={v => setFilterEntryYear(v ? String(v) : undefined)} options={yearOptions} placeholder="入学年份" style={{ minWidth: 140 }} />
        <Input value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="搜索姓名" style={{ width: 200 }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={() => setOpenAdd(true)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>新增学生</button>
        <button onClick={() => { setBulkSchoolId(schoolId); setOpenBulk(true) }} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>批量添加</button>
      </div>
      <Modal open={openAdd} onCancel={() => setOpenAdd(false)} onOk={create} title="新增学生">
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div>姓名</div>
          <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div>归属学校</div>
          <Select value={form.schoolId} onChange={v => setForm({ ...form, schoolId: v })} options={schoolOptions} />
          <div>1500m</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
            <TimePicker value={form.score_1500m ? dayjs(form.score_1500m, "mm:ss") : null} onChange={v => setForm({ ...form, score_1500m: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} placeholder="1500 mm:ss" disabledTime={disabledTime1500} />
            <Space.Compact>
              <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
              <InputNumber value={form.score_1500c == null ? undefined : form.score_1500c} onChange={v => setForm({ ...form, score_1500c: v == null ? undefined : Number(v) })} min={0} max={99} style={{ width: 80 }} />
              <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
            </Space.Compact>
          </div>
          <div>5000m</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
            <TimePicker value={form.score_5000m ? dayjs(form.score_5000m, "mm:ss") : null} onChange={v => setForm({ ...form, score_5000m: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} placeholder="5000 mm:ss" disabledTime={disabledTime5000} />
            <Space.Compact>
              <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
              <InputNumber value={form.score_5000c == null ? undefined : form.score_5000c} onChange={v => setForm({ ...form, score_5000c: v == null ? undefined : Number(v) })} min={0} max={99} style={{ width: 80 }} />
              <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
            </Space.Compact>
          </div>
          <div>高校PB</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
            <TimePicker value={form.collegePB ? dayjs(form.collegePB, "mm:ss") : null} onChange={v => setForm({ ...form, collegePB: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} placeholder="高校PB mm:ss" disabledTime={disabledTime5000} />
            <Space.Compact>
              <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
              <InputNumber value={form.collegePBc == null ? undefined : form.collegePBc} onChange={v => setForm({ ...form, collegePBc: v == null ? undefined : Number(v) })} min={0} max={99} style={{ width: 80 }} />
              <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
            </Space.Compact>
          </div>
          <div>10000m</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
            <TimePicker value={form.score_10000m ? dayjs(form.score_10000m, "mm:ss") : null} onChange={v => setForm({ ...form, score_10000m: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} placeholder="10000 mm:ss" disabledTime={disabledTime10000} />
            <Space.Compact>
              <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
              <InputNumber value={form.score_10000c == null ? undefined : form.score_10000c} onChange={v => setForm({ ...form, score_10000c: v == null ? undefined : Number(v) })} min={0} max={99} style={{ width: 80 }} />
              <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
            </Space.Compact>
          </div>
          <div>半马</div>
          <TimePicker value={form.score_half_marathon ? dayjs(form.score_half_marathon, "HH:mm:ss") : null} onChange={v => setForm({ ...form, score_half_marathon: v ? v.format("HH:mm:ss") : "" })} format="HH:mm:ss" showNow={false} disabledTime={disabledTimeHalf} />
          <div>全马</div>
          <TimePicker value={form.score_full_marathon ? dayjs(form.score_full_marathon, "HH:mm:ss") : null} onChange={v => setForm({ ...form, score_full_marathon: v ? v.format("HH:mm:ss") : "" })} format="HH:mm:ss" showNow={false} disabledTime={disabledTimeFull} />
          <div>入学年份</div>
          <Select value={form.entryYear} onChange={v => setForm({ ...form, entryYear: v })} options={yearOptions} />
        </div>
      </Modal>
      <Modal open={openBulk} onCancel={() => setOpenBulk(false)} onOk={async () => {
        const names = bulkNames.split(/\r?\n/).map(s => s.trim()).filter(s => s.length > 0)
        if (!bulkSchoolId) { message.error("请选择学校"); return }
        if (names.length === 0) { message.error("请输入至少一名学生姓名\\n一行一个姓名"); return }
        const collegePB = (bulkCollegePB && bulkCollegePB.trim()) ? (toSeconds(dayjs(bulkCollegePB, "mm:ss")) + (Number(bulkCollegePBc || 0) / 100)) : null
        const res = await fetch("/api/admin/students/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ schoolId: bulkSchoolId, names, entryYear: bulkEntryYear, collegePB }) })
        if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "批量创建失败") } catch { }; return }
        setOpenBulk(false)
        setBulkNames("")
        setBulkEntryYear(undefined)
        setBulkCollegePB("")
        setBulkCollegePBc(undefined)
        await load()
      }} title="批量添加学生">
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
          <div>归属学校</div>
          <Select value={bulkSchoolId} onChange={v => setBulkSchoolId(v)} options={schoolOptions} />
          <div>入学年份</div>
          <Select value={bulkEntryYear} onChange={v => setBulkEntryYear(String(v))} options={yearOptions} />
          <div>姓名列表</div>
          <Input.TextArea value={bulkNames} onChange={e => setBulkNames(e.target.value)} rows={8} placeholder={"每行一个姓名"} />
          <div>高校PB</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
            <TimePicker value={bulkCollegePB ? dayjs(bulkCollegePB, "mm:ss") : null} onChange={v => setBulkCollegePB(v ? v.format("mm:ss") : "")} format="mm:ss" showNow={false} placeholder="高校PB mm:ss" disabledTime={disabledTime5000} />
            <Space.Compact>
              <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
              <InputNumber value={bulkCollegePBc == null ? undefined : bulkCollegePBc} onChange={v => setBulkCollegePBc(v == null ? undefined : Number(v))} min={0} max={99} style={{ width: 80 }} />
              <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
            </Space.Compact>
          </div>
        </div>
      </Modal>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 160px 100px 100px 100px 100px 120px 120px 100px 240px", gap: 8, alignItems: "center", padding: 8, background: "#fafafa", borderBottom: "1px solid #eee", fontWeight: 600 }}>
          <div>姓名</div>
          <div>学校</div>
          <div>1500m</div>
          <div>5000m</div>
          <div>10000m</div>
          <div>高校PB</div>
          <div>半马</div>
          <div>全马</div>
          <div>入学年份</div>
          <div>操作</div>
        </div>
        {filteredItems.map(it => (
          <div key={it.id} style={{ display: "grid", gridTemplateColumns: "140px 160px 100px 100px 100px 100px 120px 120px 100px 240px", gap: 8, alignItems: "center", padding: 8, borderBottom: "1px solid #eee" }}>
            {
              <>
                <div>{it.name}</div>
                <div>{schools.find(s => s.id === it.schoolId)?.name ?? it.schoolId}</div>
                <div>{fmtMMSS2(it.score_1500m)}</div>
                <div>{fmtMMSS2(it.score_5000m)}</div>
                <div>{fmtMMSS2(it.score_10000m)}</div>
                <div>{fmtMMSS2(it.score_college_pb)}</div>
                <div>{fmtMMSS(it.score_half_marathon)}</div>
                <div>{fmtHHMMSS(it.score_full_marathon)}</div>
                <div>{it.entryYear}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => {
                    const sec = (n?: number | null) => (n == null ? 0 : Math.floor(Number(n)))
                    const cs = (n?: number | null) => (n == null ? 0 : Math.round((Number(n) - Math.floor(Number(n))) * 100))
                    const mmss = (n?: number | null) => {
                      const t = sec(n); const mm = String(Math.floor(t / 60)).padStart(2, "0"); const ss = String(t % 60).padStart(2, "0"); return `${mm}:${ss}`
                    }
                    const hhmmss = (n?: number | null) => {
                      const t = sec(n); const hh = String(Math.floor(t / 3600)).padStart(2, "0"); const mm = String(Math.floor((t % 3600) / 60)).padStart(2, "0"); const ss = String(t % 60).padStart(2, "0"); return `${hh}:${mm}:${ss}`
                    }
                    setEditing({
                      ...it,
                      score_1500m: it.score_1500m == null ? "" : mmss(it.score_1500m),
                      score_5000m: it.score_5000m == null ? "" : mmss(it.score_5000m),
                      score_10000m: it.score_10000m == null ? "" : mmss(it.score_10000m),
                      collegePB: it.score_college_pb == null ? "" : mmss(it.score_college_pb),
                      score_half_marathon: it.score_half_marathon == null ? "" : hhmmss(it.score_half_marathon),
                      score_full_marathon: it.score_full_marathon == null ? "" : hhmmss(it.score_full_marathon),
                      score_1500c: it.score_1500m == null ? undefined : cs(it.score_1500m),
                      score_5000c: it.score_5000m == null ? undefined : cs(it.score_5000m),
                      score_10000c: it.score_10000m == null ? undefined : cs(it.score_10000m),
                      collegePBc: it.score_college_pb == null ? undefined : cs(it.score_college_pb)
                    });
                    setOpenEdit(true)
                  }} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>编辑</button>
                  <button onClick={() => remove(it.id)} style={{ padding: "6px 10px", border: "1px solid #ccc", borderRadius: 6 }}>删除</button>
                </div>
              </>
            }
          </div>
        ))}
      </div>
      <Modal open={openEdit} onCancel={() => setOpenEdit(false)} onOk={update} title="编辑学生">
        {editing && (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "center" }}>
            <div>姓名</div>
            <Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            <div>归属学校</div>
            <Select value={editing.schoolId} onChange={v => setEditing({ ...editing, schoolId: v })} options={schoolOptions} />
            <div>1500m</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
              <TimePicker value={editing.score_1500m ? dayjs(editing.score_1500m, "mm:ss") : null} onChange={v => setEditing({ ...editing, score_1500m: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} disabledTime={disabledTime1500} />
              <Space.Compact>
                <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
                <InputNumber value={editing.score_1500c ?? 0} onChange={v => setEditing({ ...editing, score_1500c: Number(v || 0) })} min={0} max={99} style={{ width: 80 }} />
                <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
              </Space.Compact>
            </div>
            <div>5000m</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
              <TimePicker value={editing.score_5000m ? dayjs(editing.score_5000m, "mm:ss") : null} onChange={v => setEditing({ ...editing, score_5000m: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} disabledTime={disabledTime5000} />
              <Space.Compact>
                <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
                <InputNumber value={editing.score_5000c ?? 0} onChange={v => setEditing({ ...editing, score_5000c: Number(v || 0) })} min={0} max={99} style={{ width: 80 }} />
                <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
              </Space.Compact>
            </div>
            <div>高校PB</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
              <TimePicker value={editing.collegePB ? dayjs(editing.collegePB, "mm:ss") : null} onChange={v => setEditing({ ...editing, collegePB: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} disabledTime={disabledTime5000} />
              <Space.Compact>
                <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
                <InputNumber value={editing.collegePBc ?? 0} onChange={v => setEditing({ ...editing, collegePBc: Number(v || 0) })} min={0} max={99} style={{ width: 80 }} />
                <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
              </Space.Compact>
            </div>
            <div>10000m</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 8 }}>
              <TimePicker value={editing.score_10000m ? dayjs(editing.score_10000m, "mm:ss") : null} onChange={v => setEditing({ ...editing, score_10000m: v ? v.format("mm:ss") : "" })} format="mm:ss" showNow={false} disabledTime={disabledTime10000} />
              <Space.Compact>
                <Input style={{ width: 36, textAlign: "center" }} value="." readOnly />
                <InputNumber value={editing.score_10000c ?? 0} onChange={v => setEditing({ ...editing, score_10000c: Number(v || 0) })} min={0} max={99} style={{ width: 80 }} />
                <Input style={{ width: 36, textAlign: "center" }} value="SS" readOnly />
              </Space.Compact>
            </div>
            <div>半马</div>
            <TimePicker value={editing.score_half_marathon ? parseHHMMSSFlex(editing.score_half_marathon) : null} onChange={v => setEditing({ ...editing, score_half_marathon: v ? v.format("HH:mm:ss") : "" })} format="HH:mm:ss" showNow={false} disabledTime={disabledTimeHalf} />
            <div>全马</div>
            <TimePicker value={editing.score_full_marathon ? parseHHMMSSFlex(editing.score_full_marathon) : null} onChange={v => setEditing({ ...editing, score_full_marathon: v ? v.format("HH:mm:ss") : "" })} format="HH:mm:ss" showNow={false} disabledTime={disabledTimeFull} />
            <div>入学年份</div>
            <Select value={editing.entryYear} onChange={v => setEditing({ ...editing, entryYear: v })} options={yearOptions} />
          </div>
        )}
      </Modal>
    </div>
  )
}
function buildDisabledTimeMMSS(minM: number, minS: number, maxM: number, maxS: number) {
  const disabledHours = () => Array.from({ length: 24 }, (_, i) => i).filter(i => i !== 0)
  const disabledMinutes = (_h?: number) => {
    const allowed = new Set<number>()
    for (let m = minM; m <= maxM; m++) allowed.add(m)
    return Array.from({ length: 60 }, (_, i) => i).filter(i => !allowed.has(i))
  }
  const disabledSeconds = (_h?: number, m?: number) => {
    if (m === undefined) return []
    const all = Array.from({ length: 60 }, (_, i) => i)
    if (m < minM || m > maxM) return all
    if (minM === maxM && m === minM) return all.filter(sec => sec < minS || sec > maxS)
    if (m === minM) return all.filter(sec => sec < minS)
    if (m === maxM) return all.filter(sec => sec > maxS)
    return []
  }
  return { disabledHours, disabledMinutes, disabledSeconds }
}
const disabledTime1500 = () => buildDisabledTimeMMSS(3, 25, 4, 30)
const disabledTime5000 = () => buildDisabledTimeMMSS(12, 0, 17, 0)
const disabledTime10000 = () => buildDisabledTimeMMSS(26, 0, 47, 0)
const disabledTimeHalf = () => {
  const disabledHours = () => Array.from({ length: 24 }, (_, i) => i).filter(i => i !== 0 && i !== 1)
  const disabledMinutes = (h?: number) => {
    const allowed = h === 0 ? [55, 56, 57, 58, 59] : h === 1 ? Array.from({ length: 11 }, (_, k) => k) : []
    const s = new Set<number>(allowed)
    return Array.from({ length: 60 }, (_, i) => i).filter(i => !s.has(i))
  }
  const disabledSeconds = () => []
  return { disabledHours, disabledMinutes, disabledSeconds }
}
const disabledTimeFull = () => {
  const disabledHours = () => Array.from({ length: 24 }, (_, i) => i).filter(i => i !== 2 && i !== 3)
  const disabledMinutes = () => []
  const disabledSeconds = () => []
  return { disabledHours, disabledMinutes, disabledSeconds }
}
function pad2(n: number) { return String(n).padStart(2, "0") }
function parseHHMMSSFlex(s: string) {
  const str = (s || "").trim()
  if (!str) return null
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(str)) return dayjs(str, "HH:mm:ss")
  const mmss = str.match(/^(\d{1,3}):(\d{2})$/)
  if (mmss) {
    const mm = Number(mmss[1])
    const ss = Number(mmss[2])
    const h = Math.floor(mm / 60)
    const m = mm % 60
    const base = dayjs("00:00:00", "HH:mm:ss")
    return base.hour(h).minute(m).second(ss)
  }
  return null
}
function fmtMMSS2(v?: number | null) {
  if (v == null) return ""
  const t = Number(v)
  const mm = Math.floor(t / 60)
  const ss = Math.floor(t % 60)
  const cs = Math.round((t - Math.floor(t)) * 100)
  return `${pad2(mm)}:${pad2(ss)}.${pad2(cs)}`
}
function fmtMMSS(v?: number | null) {
  if (v == null) return ""
  const t = Number(v)
  const mm = Math.floor(t / 60)
  const ss = Math.floor(t % 60)
  return `${pad2(mm)}:${pad2(ss)}`
}
function fmtHHMMSS(v?: number | null) {
  if (v == null) return ""
  const t = Math.floor(Number(v))
  const hh = Math.floor(t / 3600)
  const mm = Math.floor((t % 3600) / 60)
  const ss = Math.floor(t % 60)
  return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`
}
