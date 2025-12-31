"use client"
import React, { useMemo, useState } from "react"
import { Select, Switch } from "antd"

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
  const [sortKey, setSortKey] = useState(initialSort)
  const [intervalKey, setIntervalKey] = useState(initialInterval)
  const [limitKey, setLimitKey] = useState(initialLimit)
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([])
  const [disableMedalColors, setDisableMedalColors] = useState(false)

  const intervalMetaMap = useMemo(() => new Map(intervalMeta.map(m => [m.order, m])), [intervalMeta])

  function cmp(a: any, b: any) { return a - b }
  function valAsc(n?: number | null) { return typeof n === "number" && n > 0 ? n : Number.POSITIVE_INFINITY }

  const sortLabel = {
    total: "总时间",
    interval: "区间用时",
    cum: "累计用时",
    pb10000: "万米",
    pb5000: "5000",
    pbHalf: "半马",
  } as const

  const ordersAll = orders
  const filteredOrders = intervalKey === "all" ? ordersAll : ordersAll.filter(o => String(o) === String(intervalKey))
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
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label>排序</label>
          <select value={sortKey} onChange={e => setSortKey(e.target.value as any)} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
            {Object.entries(sortLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
          </select>
          <label>区间</label>
          <select value={intervalKey} onChange={e => setIntervalKey(e.target.value)} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
            <option value="all">全部</option>
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
        </div>

        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {filteredOrders.map((ord) => {
            const rows = teamViews.map((tv) => {
              const slot = tv.slots.find((s) => s.order === ord) as Slot | undefined
              return { teamId: tv.id, schoolName: tv.schoolName, totalSec: tv.totalSec, slot }
            }).filter(r => !!r.slot) as Array<{ teamId: number, schoolName: string, totalSec: number, slot: Slot }>

            const by = {
              total: (a: any, b: any) => cmp(valAsc(a.totalSec), valAsc(b.totalSec)),
              interval: (a: any, b: any) => cmp(valAsc(a.slot.sec), valAsc(b.slot.sec)),
              cum: (a: any, b: any) => cmp(valAsc(a.slot.cumSec), valAsc(b.slot.cumSec)),
              pb10000: (a: any, b: any) => cmp(valAsc(a.slot.pb10000), valAsc(b.slot.pb10000)),
              pb5000: (a: any, b: any) => cmp(valAsc(a.slot.pb5000), valAsc(b.slot.pb5000)),
              pbHalf: (a: any, b: any) => cmp(valAsc(a.slot.pbHalf), valAsc(b.slot.pbHalf)),
            }[sortKey]

            rows.sort(by)

            const limitedRows = limitKey === "all" ? rows : rows.slice(0, Number(limitKey))
            const meta = intervalMetaMap.get(ord)
            const intervalName = meta?.name ?? `${ord}区`
            const km = meta?.km ?? null

            return (
              <div key={ord} style={{ minWidth: 460, flex: "0 0 auto" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{intervalName} {km ?? "—"}km</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {limitedRows.map((r, idx) => {
                    const selected = selectedTeamIds.includes(r.teamId)
                    const color = selected ? teamColor(r.teamId) : undefined
                    const baseBg = disableMedalColors ? "#F9FAFB" : (r.slot.rank === 1 ? "#FFD700" : r.slot.rank === 2 ? "#C0C0C0" : r.slot.rank === 3 ? "#CD7F32" : "#F9FAFB")
                    return (
                      <div key={r.teamId} style={{ display: "grid", gridTemplateColumns: "48px minmax(80px,140px) 1fr", gap: 8, alignItems: "stretch" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: color }}>{idx + 1}</div>
                        <div style={{ display: "flex", alignItems: "center", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: color }}>{r.schoolName}</div>
                        <div className="relative rounded-lg border p-3" style={{ backgroundColor: selected ? teamBg(r.teamId) : baseBg, borderColor: color, borderWidth: selected ? 2 : 1, boxShadow: selected ? `0 0 0 2px ${color}40` : undefined }}>
                          <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{r.slot.name}</div>
                            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(r.slot.pb5000)}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(r.slot.pb10000)}</div>
                            <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(r.slot.pbHalf)}</div>
                            <span>此时位次：{r.slot.cumRank ?? "—"}位</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>{r.slot.intervalName}</span>
                            <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{r.slot.km ?? "—"}km</span>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>{formatSeconds(r.slot.sec)} <span style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{r.slot.rank ?? "—"}位</span></div>
                          <div style={{ fontSize: 13, color: "#666" }}>配速：{formatPace(r.slot.sec ?? null, r.slot.km ?? null)}</div>
                          <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#333", marginTop: 4 }}>
                            <span>用时：{formatSeconds(r.slot.cumSec ?? null)}</span>
                            {/* <span>累计位次：{r.slot.cumRank ?? "—"}位</span> */}
                          </div>
                        </div>
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
