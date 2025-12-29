"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Tooltip, Input, Spin, Select } from "antd"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

function formatPBText(v: number | null | undefined, kind: "5000" | "10000" | "half") {
  if (v == null) return "—"
  const sec = Math.round(v)
  const mm = Math.floor(sec / 60)
  const ss = sec % 60
  const hh = Math.floor(mm / 60)
  const rem = mm % 60
  if (kind === "half") return `${String(hh).padStart(2, "0")}:${String(rem).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
}

export default function FinalPredictSummaryPage() {
  const params = useParams() as { th?: string }
  const router = useRouter()
  const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
  const [eventYear, setEventYear] = useState<number | undefined>(undefined)
  const [schools, setSchools] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | undefined>(undefined)
  const [groups, setGroups] = useState<any[]>([])
  const [schoolName, setSchoolName] = useState<string>("")
  const [teamId, setTeamId] = useState<number | undefined>(undefined)
  const [likesMap, setLikesMap] = useState<Record<string, number>>({})
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set())
  const [popBatchId, setPopBatchId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"created_desc" | "created_asc" | "likes_desc" | "likes_asc">("created_desc")
  const [entriesById, setEntriesById] = useState<Record<number, any[]>>({})
  const [ekidenIdToName, setEkidenIdToName] = useState<Record<number, "出雲" | "全日本" | "箱根" | undefined>>({})
  const [totalCount, setTotalCount] = useState<number>(0)
  const [teamCount, setTeamCount] = useState<number>(0)
  const [filterName, setFilterName] = useState<string>("")
  const [countsBySchool, setCountsBySchool] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState<boolean>(false)

  async function computeFingerprint(): Promise<string> {
    try {
      const ua = navigator.userAgent
      const lang = navigator.language
      const screenInfo = `${screen.width}x${screen.height}x${screen.colorDepth}@${(window as any).devicePixelRatio || 1}`
      const tz = String(new Date().getTimezoneOffset())
      const canvas = document.createElement("canvas")
      canvas.width = 200
      canvas.height = 50
      const ctx = canvas.getContext("2d")
      let canvasSig = ""
      if (ctx) {
        ctx.textBaseline = "top"
        ctx.font = "16px 'Arial'"
        ctx.fillStyle = "#f60"
        ctx.fillRect(10, 10, 100, 20)
        ctx.fillStyle = "#000"
        ctx.fillText(`${ua.slice(0, 32)}`, 12, 12)
        canvasSig = canvas.toDataURL()
      }
      return `${ua}|${lang}|${screenInfo}|${tz}|${canvasSig}`
    } catch {
      return `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
  }
  async function getFingerprintFromCookieOrGen() {
    try {
      const m = document.cookie.match(/(?:^|;\s*)hakone_fp=([^;]+)/)
      if (m && m[1]) return m[1]
    } catch { }
    return await computeFingerprint()
  }

  useEffect(() => {
    ; (async () => {
      const ekidensData = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
      const idNameMap: Record<number, "出雲" | "全日本" | "箱根" | undefined> = {}
      ekidensData.forEach((e: any) => { if (e?.name === "出雲" || e?.name === "全日本" || e?.name === "箱根") idNameMap[e.id] = e.name })
      setEkidenIdToName(idNameMap)
      const hakone = ekidensData.find((e: any) => e.name === "箱根")
      if (!hakone) return
      const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
      const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
      if (ed) { setEkidenThId(ed.id); setEventYear(Number(ed.year)) }
      setSchools(await fetchPublicOrApi<any[]>("public-schools", "all", "/api/schools"))
    })()
  }, [params?.th])

  useEffect(() => {
    ; (async () => {
      if (!ekidenThId) return
      const tlist = await fetchPublicOrApi<any[]>("public-teams", Number(ekidenThId), `/api/teams?Ekiden_thId=${ekidenThId}`)
      setTeams(tlist)
      if (!selectedSchoolId && tlist.length) {
        const t0 = tlist[tlist.length - 1]
        setSelectedSchoolId(t0.schoolId)
      }
    })()
  }, [ekidenThId])

  const filteredSchools = useMemo(() => {
    const allowed = new Set(teams.map((t: any) => t.schoolId))
    return schools.filter((s: any) => allowed.has(s.id))
  }, [schools, teams])

  const schoolSelectOptions = useMemo(() => {
    return filteredSchools.map((s: any) => ({
      value: s.id,
      label: (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
          <span style={{ width: "6ch", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{countsBySchool[s.id] || 0}</span>
        </div>
      )
    }))
  }, [filteredSchools, countsBySchool])

  useEffect(() => {
    ; (async () => {
      if (!ekidenThId) return
      const list = filteredSchools
      if (!list.length) { setCountsBySchool({}); return }
      try {
        const entries = await Promise.all(list.map(async (s: any) => {
          try {
            const res = await fetch(`/api/predict/hakone/final/count?ekidenThId=${ekidenThId}&schoolId=${s.id}`)
            const j = res.ok ? await res.json() : {}
            return [s.id, Number(j?.count || 0)] as [number, number]
          } catch { return [s.id, 0] as [number, number] }
        }))
        setCountsBySchool(Object.fromEntries(entries))
      } catch { setCountsBySchool({}) }
    })()
  }, [ekidenThId, filteredSchools])

  useEffect(() => {
    ; (async () => {
      setLoading(true)
      if (!ekidenThId || !selectedSchoolId) return
      const team = teams.find((t: any) => t.schoolId === selectedSchoolId)
      if (!team) { setLoading(false); return }
      try {
        const totalRes = await fetch(`/api/predict/hakone/final/count?ekidenThId=${ekidenThId}`)
        const total = totalRes.ok ? await totalRes.json() : {}
        setTotalCount(Number(total?.count || 0))
      } catch { setTotalCount(0) }
      try {
        const teamRes = await fetch(`/api/predict/hakone/final/count?ekidenThId=${ekidenThId}&schoolId=${selectedSchoolId}`)
        const tcnt = teamRes.ok ? await teamRes.json() : {}
        setTeamCount(Number(tcnt?.count || 0))
      } catch { setTeamCount(0) }
      const res = await fetch(`/api/predict/hakone/final/list?ekidenThId=${ekidenThId}&ekiden_no_teamId=${team.id}`)
      const j = await res.json()
      setGroups(j?.groups || [])
      setSchoolName(j?.meta?.schoolName || "")
      setTeamId(j?.meta?.teamId)
      try {
        const lk = await fetch(`/api/predict/hakone/likes?ekidenThId=${ekidenThId}&teamId=${team.id}`)
        const lj = await lk.json()
        setLikesMap(lj?.likes || {})
      } catch { }
      try {
        const idRaw = (j?.groups || []).flatMap((g: any) => g.items.map((it: any) => it.playerId))
        const ids = Array.from(new Set(idRaw)).filter((id): id is number => Number.isFinite(id as number))
        if (ids.length) {
          const ent = await fetchPublicOrApi<any[]>("public-student-entries", ids.slice().sort((a, b) => a - b), `/api/student-entries?studentIds=${ids.join(',')}`)
          const map: Record<number, any[]> = {}
          for (const e of ent) {
            if (!map[e.studentId]) map[e.studentId] = []
            map[e.studentId].push(e)
          }
          setEntriesById(map)
        } else {
          setEntriesById({})
        }
      } catch { setEntriesById({}) }
      setLoading(false)
    })()
  }, [ekidenThId, selectedSchoolId, teams])

  const filteredGroups = useMemo(() => {
    const gs = (groups || [])
    const q = filterName.trim().toLowerCase()
    if (!q) return gs
    return gs.filter((g: any) => String(g?.meta?.name || "").toLowerCase().includes(q))
  }, [groups, filterName])

  const sortedGroups = useMemo(() => {
    const arr = filteredGroups.slice()
    if (sortBy === "likes_desc") arr.sort((a: any, b: any) => (likesMap[b?.meta?.batchId || ""] || 0) - (likesMap[a?.meta?.batchId || ""] || 0))
    else if (sortBy === "likes_asc") arr.sort((a: any, b: any) => (likesMap[a?.meta?.batchId || ""] || 0) - (likesMap[b?.meta?.batchId || ""] || 0))
    else if (sortBy === "created_asc") arr.sort((a: any, b: any) => new Date(a?.meta?.createdAt || 0).getTime() - new Date(b?.meta?.createdAt || 0).getTime())
    else arr.sort((a: any, b: any) => new Date(b?.meta?.createdAt || 0).getTime() - new Date(a?.meta?.createdAt || 0).getTime())
    return arr
  }, [filteredGroups, likesMap, sortBy])

  type Grade = 1 | 2 | 3 | 4
  type EkidenType = "出雲" | "全日本" | "箱根"
  type EntryRecord = { ekiden: EkidenType; grade: Grade; intervalName?: string; rank?: number; time?: string }
  function calcGrade(entryYear?: number): Grade | undefined {
    if (!eventYear || !entryYear) return undefined
    const g = eventYear - entryYear + 1
    if (g < 1) return 1 as Grade
    if (g > 4) return 4 as Grade
    return g as Grade
  }
  function gradeText(g?: Grade) {
    if (!g) return "—"
    return g === 1 ? "一年" : g === 2 ? "二年" : g === 3 ? "三年" : "四年"
  }
  function formatSeconds(sec?: number | null) {
    if (sec == null) return "—"
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  function renderEntriesGridByPlayer(playerId?: number | null) {
    const raw = (playerId && entriesById[playerId]) ? entriesById[playerId] : []
    const grades: Grade[] = [1, 2, 3, 4]
    const cols: EkidenType[] = ["出雲", "全日本", "箱根"]
    const gradeMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 }
    const lookup = new Map<string, EntryRecord>()
    raw.forEach((it: any) => {
      const g = gradeMap[String(it.grade)] as Grade
      const name = ekidenIdToName[it.ekidenId]
      if (!name) return
      const rec: EntryRecord = { ekiden: name, grade: g, intervalName: it.intervalName, rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined }
      lookup.set(`${g}-${name}`, rec)
    })
    function cellBg(rec?: EntryRecord) {
      if (!rec) return undefined
      if (rec.rank === 1) return "#ffd700"
      if (rec.rank === 2) return "#c0c0c0"
      if (rec.rank === 3) return "#cd7f32"
      return undefined
    }
    return (
      <div style={{ border: "1px solid #ddd" }}>
        <div style={{ background: "#fffa9f", padding: 6, fontWeight: 600 }}>驿伝エントリー</div>
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
                const text = rec?.intervalName ? `${rec.intervalName}${rec?.rank ? `${rec.rank}位` : ""}${rec?.time ? "" : ""}` : ""
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

  function PlayerTooltip({ student, playerId }: { student: { name?: string | null; score5000m?: string | number | null; score10000m?: string | number | null; scoreHalf?: string | number | null; collegePB?: string | number | null; entryYear?: number | null } | null, playerId?: number | null }) {
    const s = student || null
    return (
      <div style={{ flex: "0 0 280px", border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 10 }}>
        <div style={{ marginBottom: 6, fontWeight: 600, fontSize: 13 }}>队员详情</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 8, fontSize: 12 }}>
          <div>姓名：{s?.name ?? "—"}</div>
          <div>年级：{gradeText(calcGrade(s?.entryYear ?? undefined))}</div>
          <div>5000m：{formatPBText(s?.score5000m as any, "5000") ?? "--"}</div>
          <div>10000m：{formatPBText(s?.score10000m as any, "10000") ?? "--"}</div>
          <div>半程：{formatPBText(s?.scoreHalf as any, "half") ?? "--"}</div>
          <div>高校PB：{formatPBText(s?.collegePB as any, "5000") ?? "--"}</div>
        </div>
        {renderEntriesGridByPlayer(playerId)}
      </div>
    )
  }

  return (<>
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>{`第${params?.th ?? ""}回箱根驿传 最终首发汇总`}</h1>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push(`/predict/hakone/${params?.th ?? ""}/finalPredict`)} style={{ padding: "6px 12px", border: "1px solid #ccc", borderRadius: 6 }}>返回替换</button>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>学校</span>
          <Select value={selectedSchoolId} onChange={(v) => setSelectedSchoolId(v)} options={schoolSelectOptions} placeholder="选择学校" style={{ minWidth: 220 }} />
          <Input value={filterName} onChange={e => setFilterName(e.target.value)} allowClear placeholder="筛选昵称" style={{ width: 200 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <span style={{ fontSize: 14 }}>排序</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: 6, border: "1px solid #ccc", borderRadius: 6 }}>
              <option value="created_desc">创建时间降序</option>
              <option value="created_asc">创建时间升序</option>
              <option value="likes_desc">点赞降序</option>
              <option value="likes_asc">点赞升序</option>
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 8, fontSize: 12 }}>
            <div>全体预测条数：{(totalCount) || 0}</div>
            <div>当前学校预测条数：{(teamCount) || 0}</div>
          </div>

        </div>
        <Spin spinning={loading} tip="加载中...">
          <div style={{ display: "grid", gap: 12 }}>
            {sortedGroups.length ? sortedGroups.map((group: any, idx: number) => (
              <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 10, background: "#fff", padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{schoolName}</div>
                    <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>用户：{group?.meta?.name ?? "—"}</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  {(() => {
                    const bid = group?.meta?.batchId as string | null
                    const count = bid ? (likesMap[bid] || 0) : 0
                    const liked = bid ? likedSet.has(bid) : false
                    async function onLike() {
                      if (!ekidenThId || !teamId || !bid) return
                      const fp = await getFingerprintFromCookieOrGen()
                      const res = await fetch(`/api/predict/hakone/likes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ekidenThId, teamId, batchId: bid, fingerprint: fp }) })
                      const data = res.ok ? await res.json() : { ok: false }
                      if (data?.ok) {
                        setLikesMap(prev => ({ ...prev, [bid]: Number(data.count || 0) }))
                        setLikedSet(prev => new Set(prev).add(bid))
                        setPopBatchId(bid)
                        setTimeout(() => { setPopBatchId(pid => (pid === bid ? null : pid)) }, 400)
                      }
                    }
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ fontSize: 14, color: "#555" }}>{group.meta?.createdAt ? new Date(group.meta.createdAt).toLocaleString() : "—"}</div>
                        {bid ? (
                          <button onClick={onLike} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", border: "1px solid #eee", borderRadius: 20, background: liked ? "#ffe6e6" : "#fff", color: liked ? "#d14" : "#d14", cursor: "pointer", animation: popBatchId === bid ? "heartPop 300ms ease" : undefined }} aria-label="点赞">
                            <span style={{ fontSize: 16, lineHeight: 1 }}>❤️</span>
                            <span style={{ fontSize: 12 }}>{count}</span>
                          </button>
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {group.items.slice(0, 5).map((it: any) => {
                    const s = it.student || {}
                    console.log(it)
                    return (
                      <div key={`f-${it.slot}`}>
                        <Tooltip title={<PlayerTooltip student={it.student || null} playerId={it.playerId} />} color="#fff" styles={{ container: { border: "2px solid #000000", minWidth: 400 } }}>
                          <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, background: it.isSub ? "#fff7e6" : undefined, position: "relative" }}>
                            {it.isSub ? (<div style={{ position: "absolute", top: 6, right: 6, background: "#fa541c", color: "#fff", borderRadius: 6, fontSize: 12, lineHeight: 1, padding: "2px 6px" }}>更换</div>) : null}
                            <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</div>

                            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{it.playerName ?? "—"}
                              <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((s as any)?.entryYear))}</span>
                            </div>


                            <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((s as any)?.score5000m, "5000")} <br /> 10000 {formatPBText((s as any)?.score10000m, "10000")} <br /> 半马 {formatPBText((s as any)?.scoreHalf, "half")}</div>
                          </div>
                        </Tooltip>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginTop: 6 }}>
                  {group.items.slice(5, 10).map((it: any) => {
                    const s = it.student || {}
                    return (
                      <div key={`r-${it.slot}`} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, background: it.isSub ? "#fff7e6" : undefined, position: "relative" }}>
                        {it.isSub ? (<div style={{ position: "absolute", top: 6, right: 6, background: "#fa541c", color: "#fff", borderRadius: 6, fontSize: 12, lineHeight: 1, padding: "2px 6px" }}>更换</div>) : null}
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</div>
                        <Tooltip title={<PlayerTooltip student={it.student || null} playerId={it.playerId} />} color="#fff" styles={{ container: { border: "2px solid #000000", minWidth: 400 } }}>
                          <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{it.playerName ?? "—"} <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((s as any)?.entryYear))}</span></div>
                        </Tooltip>
                        <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((s as any)?.score5000m, "5000")} <br /> 10000 {formatPBText((s as any)?.score10000m, "10000")} <br /> 半马 {formatPBText((s as any)?.scoreHalf, "half")}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )) : (
              <div style={{ padding: 20, textAlign: "center", color: "#666" }}>还没有人预测哦~请先去预测</div>
            )}
          </div>
        </Spin>
      </div>
    </div>
    <div style={{ position: "fixed", right: 24, bottom: 80, zIndex: 1000 }}>
      <button onClick={() => { try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch { window.scrollTo(0, 0) } }} style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 20, background: "#fff" }}>回到顶部</button>
    </div>
  </>
  )
}
