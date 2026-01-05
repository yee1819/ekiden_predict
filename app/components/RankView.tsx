"use client"
import React, { useMemo, useState } from "react"
import { Select, Switch, Modal } from "antd"
import StudentEkiden from "@/app/components/mdx/studentEkiden"

type Slot = {
  name: string
  sec: number | null
  rank: number | null
  km: number | null
  intervalName: string
  order: number
  pb5000?: number | null
  pb10000?: number | null
  pbHalf?: number | null
  cumSec?: number | null
  cumRank?: number | null
  studentId?: number | null
}

type TeamView = { id: number; schoolName: string; totalSec: number; slots: Slot[] }

function formatSeconds(sec?: number | null) {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return "—"
  const s = Math.floor(sec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${m}:${String(ss).padStart(2, "0")}`
}

function formatPBText(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return "—"
  return formatSeconds(value)
}

function formatPace(sec?: number | null, km?: number | null) {
  if (!sec || !km || sec <= 0 || km <= 0) return "—"
  const pace = sec / km
  const m = Math.floor(pace / 60)
  const s = Math.round(pace % 60)
  return `${m}:${String(s).padStart(2, "0")}/km`
}

export default function RankView({
  title,
  teamViews,
  orders,
  intervalMeta,
  initialSort,
  initialInterval,
  initialLimit,
}: {
  title: string
  teamViews: TeamView[]
  orders: number[]
  intervalMeta: Array<{ order: number; name: string; km: number | null }>
  initialSort: "total" | "interval" | "cum" | "pb10000" | "pb5000" | "pbHalf"
  initialInterval: string
  initialLimit: string
}) {
  type SortKey = "total" | "interval" | "cum" | "pb10000" | "pb5000" | "pbHalf" | "frontTotal" | "backTotal" | "frontCum" | "backCum"
  const [sortKey, setSortKey] = useState<SortKey>(initialSort)
  const [intervalKey, setIntervalKey] = useState(initialInterval)
  const [limitKey, setLimitKey] = useState(initialLimit)
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([])
  const [disableMedalColors, setDisableMedalColors] = useState(false)
  const [compareKey, setCompareKey] = useState<
    | "intervalLeader"
    | "intervalSeed"
    | "cumLeader"
    | "cumSeed"
    | "totalLeader"
    | "totalSeed"
    | "schoolCum"
    | "schoolTotal"
    | "none"
  >("none")
  const [compareSchoolId, setCompareSchoolId] = useState<number | null>(null)
  const [detailOpenTeamId, setDetailOpenTeamId] = useState<number | null>(null)
  const [detailStudentId, setDetailStudentId] = useState<number | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const intervalMetaMap = useMemo(() => new Map(intervalMeta.map(m => [m.order, m])), [intervalMeta])

  function cmp(a: number, b: number) { return a - b }
  function valAsc(n?: number | null) { return typeof n === "number" && n > 0 ? n : Number.POSITIVE_INFINITY }
  function formatSignedDiff(my?: number | null, target?: number | null) {
    if (my == null || target == null || !Number.isFinite(my) || !Number.isFinite(target)) return "—"
    const diff = Math.floor(my - target)
    const sign = diff < 0 ? "-" : "+"
    const v = Math.abs(diff)
    const h = Math.floor(v / 3600)
    const m = Math.floor((v % 3600) / 60)
    const s = v % 60
    return h > 0 ? `${sign}${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${sign}${m}:${String(s).padStart(2, "0")}`
  }

  const sortLabel = {
    total: "总时间",
    interval: "区间用时",
    cum: "累计用时",
    pb10000: "万米",
    pb5000: "5000",
    pbHalf: "半马",
    frontTotal: "往路总用时",
    backTotal: "复路总用时",
    frontCum: "往路累计用时",
    backCum: "复路累计用时",
  } as const

  const ordersAll = orders
  const filteredOrders = (() => {
    if (intervalKey === "all") return ordersAll
    if (intervalKey === "front") return ordersAll.filter(o => o >= 1 && o <= 5)
    if (intervalKey === "back") return ordersAll.filter(o => o >= 6 && o <= 10)
    return ordersAll.filter(o => String(o) === String(intervalKey))
  })()

  const frontPrefixByTeam = useMemo(() => {
    const map = new Map<number, Map<number, number>>()
    for (const tv of teamViews) {
      let run = 0
      const perOrder = new Map<number, number>()
      for (let ord = 1; ord <= 5; ord++) {
        const s = tv.slots.find((x) => x.order === ord)
        if (s && s.sec && s.sec > 0) run += s.sec
        perOrder.set(ord, run > 0 ? run : 0)
      }
      map.set(tv.id, perOrder)
    }
    return map
  }, [teamViews])

  const backPrefixByTeam = useMemo(() => {
    const map = new Map<number, Map<number, number>>()
    for (const tv of teamViews) {
      let run = 0
      const perOrder = new Map<number, number>()
      for (let ord = 6; ord <= 10; ord++) {
        const s = tv.slots.find((x) => x.order === ord)
        if (s && s.sec && s.sec > 0) run += s.sec
        perOrder.set(ord, run > 0 ? run : 0)
      }
      map.set(tv.id, perOrder)
    }
    return map
  }, [teamViews])

  const frontRanksByOrder = useMemo(() => {
    const byOrder = new Map<number, Map<number, number>>()
    for (let ord = 1; ord <= 5; ord++) {
      const arr = teamViews.map(tv => ({ teamId: tv.id, sec: frontPrefixByTeam.get(tv.id)?.get(ord) ?? 0 }))
      arr.sort((a, b) => valAsc(a.sec) - valAsc(b.sec))
      const m = new Map<number, number>()
      arr.forEach((r, i) => m.set(r.teamId, i + 1))
      byOrder.set(ord, m)
    }
    return byOrder
  }, [teamViews, frontPrefixByTeam])

  const backRanksByOrder = useMemo(() => {
    const byOrder = new Map<number, Map<number, number>>()
    for (let ord = 6; ord <= 10; ord++) {
      const arr = teamViews.map(tv => ({ teamId: tv.id, sec: backPrefixByTeam.get(tv.id)?.get(ord) ?? 0 }))
      arr.sort((a, b) => valAsc(a.sec) - valAsc(b.sec))
      const m = new Map<number, number>()
      arr.forEach((r, i) => m.set(r.teamId, i + 1))
      byOrder.set(ord, m)
    }
    return byOrder
  }, [teamViews, backPrefixByTeam])

  const frontTotalByTeam = useMemo(() => {
    const m = new Map<number, number>()
    for (const tv of teamViews) {
      const total = frontPrefixByTeam.get(tv.id)?.get(5) ?? 0
      m.set(tv.id, total)
    }
    return m
  }, [teamViews, frontPrefixByTeam])

  const backTotalByTeam = useMemo(() => {
    const m = new Map<number, number>()
    for (const tv of teamViews) {
      const total = backPrefixByTeam.get(tv.id)?.get(10) ?? 0
      m.set(tv.id, total)
    }
    return m
  }, [teamViews, backPrefixByTeam])
  const teamOptions = useMemo(() => teamViews.map(tv => ({ value: tv.id, label: tv.schoolName })), [teamViews])
  function teamColor(id: number) {
    const hue = (id * 57) % 360
    return `hsl(${hue} 80% 50%)`
  }
  function teamBg(id: number) {
    const hue = (id * 57) % 360
    return `hsla(${hue}, 85%, 75%, 0.5)`
  }

  return (
    <main className="bg-gray-50 py-10 px-6 text-gray-900 min-h-screen h-full overflow-y-auto">
      <div className="mx-4 md:mx-6 lg:mx-10">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <Modal
          open={detailModalOpen}
          onCancel={() => { setDetailModalOpen(false); setDetailStudentId(null) }}
          footer={null}
          width={560}
        >
          {detailStudentId ? (
            <StudentEkiden studentID={String(detailStudentId)} />
          ) : null}
        </Modal>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label>排序</label>
          <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
            {Object.entries(sortLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
          <label>区间</label>
          <select value={intervalKey} onChange={e => setIntervalKey(e.target.value)} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
            <option value="all">全部</option>
            {(/箱根|Hakone/i.test(title)) && (<>
              <option value="front">往路</option>
              <option value="back">复路</option>
            </>)}
            {ordersAll.map(o => {
              const meta = intervalMetaMap.get(o)
              return <option key={o} value={o}>{meta?.name ?? `${o}区`}</option>
            })}
          </select>
          <label>显示</label>
          <select value={limitKey} onChange={e => setLimitKey(e.target.value)} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
            <option value="3">前三</option>
            <option value="5">前五</option>
            <option value="8">前八</option>
            <option value="10">前十</option>
            <option value="all">全部</option>
          </select>
          <label>清除三色</label>
          <Switch checked={disableMedalColors} onChange={setDisableMedalColors} />
          <label>队伍</label>
          <div style={{ minWidth: 240 }}>
            <Select
              mode="multiple"
              allowClear
              placeholder="选择队伍高亮"
              value={selectedTeamIds}
              onChange={(vals) => setSelectedTeamIds(vals as number[])}
              options={teamOptions}
              style={{ width: "100%" }}
              maxTagCount={3}
            />
          </div>
          <label>对比</label>
          <select
            value={compareKey}
            onChange={e => setCompareKey(e.target.value as (
              | "intervalLeader"
              | "intervalSeed"
              | "cumLeader"
              | "cumSeed"
              | "totalLeader"
              | "totalSeed"
              | "schoolCum"
              | "schoolTotal"
              | "none"
            ))}
            style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}
          >
            <option value="none">不对比</option>
            <option value="intervalLeader">区间第一对比</option>
            <option value="intervalSeed">区间第十对比</option>
            <option value="cumLeader">累计时间第一对比</option>
            <option value="cumSeed">累计时间第十对比</option>
            <option value="totalLeader">总时间第一对比</option>
            <option value="totalSeed">种子权时间对比</option>
            <option value="schoolCum">对比学校累计时间</option>
            <option value="schoolTotal">对比学校总时间</option>
          </select>
          {(compareKey === "schoolCum" || compareKey === "schoolTotal") && (
            <select value={compareSchoolId != null ? String(compareSchoolId) : ""} onChange={e => setCompareSchoolId(e.target.value ? Number(e.target.value) : null)} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6, minWidth: 160 }}>
              <option value="">选择学校</option>
              {teamViews.map(tv => (<option key={tv.id} value={tv.id}>{tv.schoolName}</option>))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {filteredOrders.map((ord) => {
            type Row = { teamId: number, schoolName: string, totalSec: number, slot: Slot }
            const rows = teamViews.map((tv) => {
              const slot = tv.slots.find((s) => s.order === ord) as Slot | undefined
              return { teamId: tv.id, schoolName: tv.schoolName, totalSec: tv.totalSec, slot }
            }).filter(r => !!r.slot) as Row[]

            const by: (a: Row, b: Row) => number = {
              total: (a, b) => cmp(valAsc(a.totalSec), valAsc(b.totalSec)),
              interval: (a, b) => cmp(valAsc(a.slot.sec), valAsc(b.slot.sec)),
              cum: (a, b) => cmp(valAsc(a.slot.cumSec), valAsc(b.slot.cumSec)),
              pb10000: (a, b) => cmp(valAsc(a.slot.pb10000), valAsc(b.slot.pb10000)),
              pb5000: (a, b) => cmp(valAsc(a.slot.pb5000), valAsc(b.slot.pb5000)),
              pbHalf: (a, b) => cmp(valAsc(a.slot.pbHalf), valAsc(b.slot.pbHalf)),
              frontTotal: (a, b) => cmp(valAsc(frontTotalByTeam.get(a.teamId)), valAsc(frontTotalByTeam.get(b.teamId))),
              backTotal: (a, b) => cmp(valAsc(backTotalByTeam.get(a.teamId)), valAsc(backTotalByTeam.get(b.teamId))),
              frontCum: (a, b) => cmp(valAsc(frontPrefixByTeam.get(a.teamId)?.get(ord)), valAsc(frontPrefixByTeam.get(b.teamId)?.get(ord))),
              backCum: (a, b) => cmp(valAsc(backPrefixByTeam.get(a.teamId)?.get(ord)), valAsc(backPrefixByTeam.get(b.teamId)?.get(ord))),
            }[sortKey]

            rows.sort(by)

            const limitedRows = limitKey === "all" ? rows : rows.slice(0, Number(limitKey))
            const meta = intervalMetaMap.get(ord)
            const intervalName = meta?.name ?? `${ord}区`
            const km = meta?.km ?? null

            // const isFrontOrd = ord <= 5
            function getCumSec(teamId?: number | null, order?: number) {
              if (!teamId || !order) return null
              const tv = teamViews.find(t => t.id === teamId)
              const s = tv?.slots.find(x => x.order === order)
              const v = s?.cumSec ?? null
              return (v && v > 0) ? v : null
            }
            const cumTotalArr = teamViews.map(tv => {
              const s = tv.slots.find((x) => x.order === ord)
              return { teamId: tv.id, sec: s?.cumSec ?? null }
            }).filter(x => x.sec != null).sort((a, b) => valAsc(a.sec) - valAsc(b.sec))
            const cumLeaderTime = cumTotalArr.length > 0 ? cumTotalArr[0].sec : null
            const cumSeedTime = cumTotalArr.length >= 10 ? cumTotalArr[9].sec : null
            const schoolCumTime = (compareSchoolId != null) ? getCumSec(compareSchoolId, ord) : null

            const intervalArr = teamViews.map(tv => {
              const s = tv.slots.find((x) => x.order === ord)
              return { teamId: tv.id, sec: s?.sec ?? null }
            }).filter(x => x.sec != null).sort((a, b) => valAsc(a.sec) - valAsc(b.sec))
            const intervalLeader = intervalArr.length > 0 ? intervalArr[0].sec : null
            const intervalSeed = intervalArr.length >= 10 ? intervalArr[9].sec : null

            const totalsSorted = teamViews.map(tv => ({ teamId: tv.id, sec: tv.totalSec }))
              .sort((a, b) => valAsc(a.sec) - valAsc(b.sec))
            const totalLeaderTeamId = totalsSorted.length > 0 ? totalsSorted[0].teamId : null
            const totalSeedTeamId = totalsSorted.length >= 10 ? totalsSorted[9].teamId : null
            const totalLeaderCumAtOrd = getCumSec(totalLeaderTeamId, ord)
            const totalSeedCumAtOrd = getCumSec(totalSeedTeamId, ord)

            return (
              <div key={ord} style={{ minWidth: 460, flex: "0 0 auto" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{intervalName} {km ?? "—"}km</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {limitedRows.map((r, idx) => {
                    const autoSelected = (compareSchoolId != null) && r.teamId === compareSchoolId
                    const selected = autoSelected || selectedTeamIds.includes(r.teamId)
                    const seedMode = ["intervalSeed", "cumSeed", "totalSeed"].includes(compareKey)
                    const seedColors = ["#d4380d", "#e84393", "#f15a24", "#f76733"]
                    const seedIdx = idx - 9
                    const inSeedRange = seedMode && idx >= 9 && idx <= 12
                    const color = selected ? teamColor(r.teamId) : (inSeedRange ? seedColors[Math.max(0, Math.min(3, seedIdx))] : undefined)
                    const baseBgDefault = disableMedalColors ? "#F9FAFB" : (r.slot.rank === 1 ? "#FFD700" : r.slot.rank === 2 ? "#C0C0C0" : r.slot.rank === 3 ? "#CD7F32" : "#F9FAFB")
                    const baseBg = inSeedRange ? "#fff1f0" : baseBgDefault
                    return (
                      <div key={r.teamId} style={{ display: "grid", gridTemplateColumns: "48px minmax(80px,140px) 1fr", gap: 8, alignItems: "stretch" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: color }}>{idx + 1}</div>
                        <div style={{ display: "flex", alignItems: "center", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: color }}>{r.schoolName}</div>
                        <div onClick={() => { setDetailStudentId(r.slot.studentId ?? null); setDetailModalOpen(true) }} className="relative rounded-lg border p-3" style={{ cursor: "pointer", backgroundColor: selected ? teamBg(r.teamId) : baseBg, borderColor: color, borderWidth: selected ? 2 : 1, boxShadow: selected ? `0 0 0 2px ${color}40` : undefined }}>
                          <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{r.slot.name}</div>
                            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(r.slot.pb5000)}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(r.slot.pb10000)}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(r.slot.pbHalf)}</div>
                            <span>此时位次：{r.slot.cumRank ?? "—"}位</span>
                            {compareKey !== "none" && (
                              <div style={{ fontSize: 12, fontWeight: 800 }}>
                                {(() => {
                                  let my: number | null = null
                                  let target: number | null = null
                                  if (compareKey === "intervalLeader") { my = r.slot.sec ?? null; target = intervalLeader }
                                  else if (compareKey === "intervalSeed") { my = r.slot.sec ?? null; target = intervalSeed }
                                  else if (compareKey === "cumLeader") { my = r.slot.cumSec ?? null; target = cumLeaderTime }
                                  else if (compareKey === "cumSeed") { my = r.slot.cumSec ?? null; target = cumSeedTime }
                                  else if (compareKey === "totalLeader") { my = r.slot.cumSec ?? null; target = totalLeaderCumAtOrd }
                                  else if (compareKey === "totalSeed") { my = r.slot.cumSec ?? null; target = totalSeedCumAtOrd }
                                  else if (compareKey === "schoolCum") { my = r.slot.cumSec ?? null; target = schoolCumTime }
                                  else if (compareKey === "schoolTotal") { my = r.slot.cumSec ?? null; target = schoolCumTime }
                                  return `相差：${formatSignedDiff(my ?? null, target ?? null)}`
                                })()}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>{r.slot.intervalName}</span>
                            <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{r.slot.km ?? "—"}km</span>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, color: (inSeedRange ? seedColors[Math.max(0, Math.min(3, seedIdx))] : undefined) }}>{formatSeconds(r.slot.sec)} <span style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{r.slot.rank ?? "—"}位</span></div>
                          <div style={{ fontSize: 13, color: "#666" }}>配速：{formatPace(r.slot.sec ?? null, r.slot.km ?? null)}</div>
                          <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#333", marginTop: 4 }}>
                            <span>用时：{formatSeconds(r.slot.cumSec ?? null)}</span>

                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#333", marginTop: 4 }}>
                            {((intervalKey === "front") || (intervalKey === "all" && ord <= 5)) && (
                              <span>
                                往路累计：{formatSeconds(frontPrefixByTeam.get(r.teamId)?.get(ord) ?? null)}（{frontRanksByOrder.get(ord)?.get(r.teamId) ?? "—"}位）
                              </span>
                            )}
                            {((intervalKey === "back") || (intervalKey === "all" && ord >= 6)) && (
                              <span>
                                复路累计：{formatSeconds(backPrefixByTeam.get(r.teamId)?.get(ord) ?? null)}（{backRanksByOrder.get(ord)?.get(r.teamId) ?? "—"}位）
                              </span>
                            )}
                          </div>
                        </div>
                        {idx === 9 && (
                          <div style={{ gridColumn: "1 / -1", borderTop: "2px dashed #bbb", marginTop: 8, paddingTop: 4, textAlign: "center", fontSize: 12, color: "#555" }}>种子权（第10名）</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
