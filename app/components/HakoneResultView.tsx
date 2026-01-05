"use client"
import React, { useState, useMemo } from "react"

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
  isNewRecord?: boolean
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

export default function HakoneResultView({ title, teamViews }: { title: string; teamViews: TeamView[] }) {
  type RangeKey = "all" | "front" | "back"
  const [rangeKey, setRangeKey] = useState<RangeKey>("all")

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
      arr.sort((a, b) => ((a.sec && a.sec > 0) ? a.sec : Number.POSITIVE_INFINITY) - ((b.sec && b.sec > 0) ? b.sec : Number.POSITIVE_INFINITY))
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
      arr.sort((a, b) => ((a.sec && a.sec > 0) ? a.sec : Number.POSITIVE_INFINITY) - ((b.sec && b.sec > 0) ? b.sec : Number.POSITIVE_INFINITY))
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

  function asc(n?: number | null) { return (typeof n === "number" && n > 0) ? n : Number.POSITIVE_INFINITY }

  const sortedTeamViews = useMemo(() => {
    const list = teamViews.slice()
    if (rangeKey === "front") list.sort((a, b) => asc(frontTotalByTeam.get(a.id)) - asc(frontTotalByTeam.get(b.id)))
    else if (rangeKey === "back") list.sort((a, b) => asc(backTotalByTeam.get(a.id)) - asc(backTotalByTeam.get(b.id)))
    else list.sort((a, b) => asc(a.totalSec) - asc(b.totalSec))
    return list
  }, [teamViews, rangeKey, frontTotalByTeam, backTotalByTeam])

  const filterSlot = (s: Slot) => {
    if (rangeKey === "front") return s.order >= 1 && s.order <= 5
    if (rangeKey === "back") return s.order >= 6 && s.order <= 10
    return true
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <label>范围</label>
        <select value={rangeKey} onChange={e => setRangeKey(e.target.value as RangeKey)} style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 6 }}>
          <option value="all">综合</option>
          <option value="front">往路</option>
          <option value="back">复路</option>
        </select>
      </div>

      <div className="space-y-6">
        {sortedTeamViews.map((team: TeamView, teamIdx: number) => (
          <div key={team.id} className="rounded-xl border bg-white p-4 shadow-sm" style={{ borderColor: (teamIdx === 0 ? "#FFD700" : teamIdx === 1 ? "#C0C0C0" : teamIdx === 2 ? "#CD7F32" : undefined), borderWidth: (teamIdx < 3 ? 8 : 2), borderStyle: "solid" }}>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-bold">{teamIdx === 0 ? "冠军" : teamIdx === 1 ? "亚军" : teamIdx === 2 ? "季军" : `${teamIdx + 1}位`} {team.schoolName}</div>
              <div style={{ display: "grid", gap: 4, textAlign: "right" }}>
                <div className="text-sm text-gray-600">总时间：{formatSeconds(team.totalSec)}</div>
                <div className="text-sm text-gray-600">往路：{formatSeconds(frontPrefixByTeam.get(team.id)?.get(5) ?? null)}</div>
                <div className="text-sm text-gray-600">复路：{formatSeconds(backPrefixByTeam.get(team.id)?.get(10) ?? null)}</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(200px, 1fr))", gap: 12, marginTop: 12 }}>
              {team.slots.filter(filterSlot).map((slot: Slot, idx: number) => (
                <div key={idx} className="relative rounded-lg border p-3" style={{ backgroundColor: (slot.rank === 1 ? "#FFD700" : slot.rank === 2 ? "#C0C0C0" : slot.rank === 3 ? "#CD7F32" : "#F9FAFB") }}>
                  <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{slot.name}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(slot.pb5000)}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(slot.pb10000)}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(slot.pbHalf)}</div>
                    <span>此时位次：{slot.cumRank ?? "—"}位</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 800 }}>{slot.intervalName}</span>
                    <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slot.km ?? "—"}km</span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>
                    <span style={{ color: slot.isNewRecord ? "red" : undefined }}>{formatSeconds(slot.sec)}</span>
                    
                    <span style={{ fontSize: 12, color: slot.isNewRecord ? "red" : "#555", marginTop: 2 }}>{slot.rank ?? "—"}位{slot.isNewRecord ? <span style={{ color: "red", marginLeft: 4 }}>『新』</span> : null}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#666" }}>配速：{formatPace(slot.sec ?? null, slot.km ?? null)}</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#333", marginTop: 4 }}>
                    <span>用时：{formatSeconds(slot.cumSec ?? null)}</span>

                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 13, color: "#333", marginTop: 4 }}>
                    {((rangeKey === "front") || (rangeKey === "all" && slot.order <= 5)) && (
                      <span>
                        往路累计：{formatSeconds(frontPrefixByTeam.get(team.id)?.get(slot.order) ?? null)}（{frontRanksByOrder.get(slot.order)?.get(team.id) ?? "—"}位）
                      </span>
                    )}
                    {((rangeKey === "back") || (rangeKey === "all" && slot.order >= 6)) && (
                      <span>
                        复路累计：{formatSeconds(backPrefixByTeam.get(team.id)?.get(slot.order) ?? null)}（{backRanksByOrder.get(slot.order)?.get(team.id) ?? "—"}位）
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
