"use client"
import React, { useEffect, useMemo, useState } from "react"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

type EkidenType = "出雲" | "全日本" | "箱根"

function formatSeconds(sec?: number | null) {
  if (sec == null) return "—"
  const h = Math.floor((sec as number) / 3600)
  const m = Math.floor(((sec as number) % 3600) / 60)
  const s = (sec as number) % 60
  const hhStr = String(h).padStart(2, "0")
  const mmStr = String(m).padStart(2, "0")
  const ssStr = String(s).padStart(2, "0")
  if (h === 0) return `${mmStr}:${ssStr}`
  return `${hhStr}:${mmStr}:${ssStr}`
}
function pad2(n: number) { return String(n).padStart(2, "0") }
function parseTimeStr(t?: string) {
  if (!t) return undefined
  const parts = String(t).split(":").map(x => Number(x))
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return undefined
}
function formatPBText(v?: string | number, kind?: "5000" | "10000" | "half") {
  if (v == null) return "—"
  const sec = typeof v === "number" ? v : parseTimeStr(v)
  if (sec == null || sec <= 0) return "—"
  if (kind === "half") return formatSeconds(sec)
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  let secStr = s.toFixed(2)
  if (secStr === "60.00") return `${pad2(m + 1)}:00.00`
  const [si, sf] = secStr.split(".")
  return `${pad2(m)}:${String(si).padStart(2, "0")}.${sf}`
}
type Grade = 1 | 2 | 3 | 4
function calcGrade(entryYear?: number | null, eventYear?: number): Grade | undefined {
  if (!eventYear || !entryYear) return undefined
  const g = eventYear - (entryYear as number) + 1
  if (g < 1) return 1 as Grade
  if (g > 4) return 4 as Grade
  return g as Grade
}
function gradeText(g?: Grade) {
  if (!g) return "—"
  return g === 1 ? "一年" : g === 2 ? "二年" : g === 3 ? "三年" : "四年"
}

function SchoolStartHakone({ id, schoolId, year }: { id?: number | string, schoolId?: number | string, year?: number | string }) {
  const targetSchoolId = useMemo(() => {
    const raw = id ?? schoolId
    const n = typeof raw === "string" ? Number(raw) : (raw as number | undefined)
    return n != null && Number.isFinite(n) ? n : undefined
  }, [id, schoolId])

  const [eventYear, setEventYear] = useState<number | undefined>(undefined)
  const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
  const [editionTh, setEditionTh] = useState<number | undefined>(undefined)
  const [team, setTeam] = useState<any | null>(null)
  const [starters, setStarters] = useState<any[]>([])
  const [roster, setRoster] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [schools, setSchools] = useState<any[]>([])

  useEffect(() => {
    ; (async () => {
      const ekidens = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
      const hakone = ekidens.find((e: any) => e.name === "箱根")
      if (!hakone) return
      const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
      const requestedYear = year != null ? Number(year) : undefined
      let target = (requestedYear != null && Number.isFinite(requestedYear)) ? (eds.find((x: any) => Number(x.year) === Number(requestedYear)) || undefined) : undefined
      if (!target) target = eds.slice().sort((a: any, b: any) => Number(a.year) - Number(b.year)).at(-1)
      if (!target) return
      setEkidenThId(target.id)
      setEventYear(Number(target.year))
      setEditionTh(Number(target.ekiden_th))
    })()
  }, [year])

  useEffect(() => {
    ; (async () => {
      const scs = await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools")
      setSchools(Array.isArray(scs) ? scs : [])
    })()
  }, [])

  useEffect(() => {
    ; (async () => {
      if (!ekidenThId || !targetSchoolId) return
      const teams = await fetchPublicOrApi<any[]>("public-teams", Number(ekidenThId), `/api/teams?Ekiden_thId=${ekidenThId}`)
      const t = teams.find((x: any) => Number(x.schoolId) === Number(targetSchoolId)) || null
      setTeam(t)
      if (!t) return
      const st = await fetchPublicOrApi<any[]>("public-starter-list", { teamId: Number(t.id), thId: Number(ekidenThId) }, `/api/starter-list?ekiden_no_teamId=${t.id}&Ekiden_thId=${ekidenThId}`)
      setStarters(Array.isArray(st) ? st.slice().sort((a: any, b: any) => Number(a.baseIntervalId) - Number(b.baseIntervalId)) : [])
      const rm = await fetchPublicOrApi<any[]>("public-team-members", Number(t.id), `/api/team-members?ekiden_no_teamId=${t.id}`)
      setRoster(Array.isArray(rm) ? rm : [])
      const stu = await fetchPublicOrApi<any[]>("public-students", Number(targetSchoolId), `/api/students?schoolId=${targetSchoolId}`)
      setStudents(Array.isArray(stu) ? stu : [])
    })()
  }, [ekidenThId, targetSchoolId])

  const studentMap = useMemo(() => {
    const m = new Map<number, any>()
    students.forEach(s => m.set(Number(s.id), s))
    return m
  }, [students])

  const starterIds = useMemo(() => new Set(starters.map(s => Number(s.studentId)).filter(Number.isFinite)), [starters])

  const substitutes = useMemo(() => {
    const rest = (roster || []).filter((m: any) => !starterIds.has(Number(m.studentId)))
    const arr = rest.map((m: any) => {
      const s = studentMap.get(Number(m.studentId))
      const g = calcGrade(s?.entryYear ?? null, eventYear)
      return { studentId: Number(m.studentId), grade: g, name: s?.name, s }
    })
    return arr.slice().sort((a: any, b: any) => (Number(b.grade ?? 0) - Number(a.grade ?? 0)))
  }, [roster, starterIds, studentMap, eventYear])

  return (
    <div style={{ border: "3px solid #000", borderRadius: 8, background: "#fff", padding: 8 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{team ? `${(schools.find((s: any) => Number(s.id) === Number(team.schoolId))?.name) ?? `学校 ${team.schoolId}`} 首发与替补（第${editionTh ?? "—"}回箱根）` : "未找到队伍"}</div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>首发</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: 6, width: 60 }}>区</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>姓名</th>
              <th style={{ border: "1px solid #eee", padding: 6, width: 80 }}>年级</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>5000m</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>10000m</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>半程</th>
            </tr>
          </thead>
          <tbody>
            {starters.map((it: any) => {
              const s = studentMap.get(Number(it.studentId))
              const g = calcGrade(s?.entryYear ?? null, eventYear)
              const intervalName = it?.intervalName || "—"
              return (
                <tr key={it.id}>
                  <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{intervalName}</td>
                  <td style={{ border: "1px solid #eee", padding: 6 }}>{s?.name ?? it.studentName ?? "—"}</td>
                  <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{gradeText(g)}</td>
                  <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{formatPBText(s?.score_5000m, "5000")}</td>
                  <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{formatPBText(s?.score_10000m, "10000")}</td>
                  <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{formatPBText(s?.score_half_marathon, "half")}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>替补</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: 6, width: 80 }}>年级</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>姓名</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>5000m</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>10000m</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>半程</th>
            </tr>
          </thead>
          <tbody>
            {substitutes.map((it: any, idx: number) => (
              <tr key={`${it.studentId}-${idx}`}>
                <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{gradeText(it.grade)}</td>
                <td style={{ border: "1px solid #eee", padding: 6 }}>{it.s?.name ?? "—"}</td>
                <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{formatPBText(it.s?.score_5000m, "5000")}</td>
                <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{formatPBText(it.s?.score_10000m, "10000")}</td>
                <td style={{ border: "1px solid #eee", padding: 6, textAlign: "center" }}>{formatPBText(it.s?.score_half_marathon, "half")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SchoolStartHakone
