"use client"

import React, { useState, useMemo } from "react"

// Types matching the API response
interface HistoryEntry {
  ekiden: string
  grade: number
  intervalName: string
  rank: number
  time: number
  isNewRecord: boolean
  year: number
}

interface IntervalItem {
  teamId: number
  schoolId: number
  schoolName: string
  studentId: number
  playerName: string | null
  scoreSec: number | null
  rank: number | null
  s5000: number | null
  s10000: number | null
  sHalf: number | null
  sCollegePB: number | null
  history?: HistoryEntry[]
}

interface IntervalData {
  intervalId: number
  intervalName: string
  items: IntervalItem[]
  averages: {
    avg5000: number
    avg10000: number
    avgHalf: number
    avgCollegePB: number
  }
}

interface SchoolTotal {
  schoolId: number
  schoolName: string
  total: number
}

interface SchoolAverages {
  schoolId: number
  avg5000: number
  avg10000: number
  avgHalf: number
  avgCollegePB: number
}

interface OverallAverages {
  avg5000: number
  avg10000: number
  avgHalf: number
  avgCollegePB: number
}

interface PageData {
  intervals: IntervalData[]
  schoolTotals: SchoolTotal[]
  schoolAverages: Record<string, SchoolAverages>
  overallAverages: OverallAverages
}

type SortKey = "score" | "s5000" | "s10000" | "sHalf" | "sCollegePB" | "total_time"

function formatTime(seconds: number | null | undefined, keepDecimals = true) {
  if (!seconds || !Number.isFinite(seconds)) return "—"

  const intSec = Math.floor(seconds)
  const frac = seconds % 1

  const h = Math.floor(intSec / 3600)
  const m = Math.floor((intSec % 3600) / 60)
  const s = intSec % 60

  const sStr = keepDecimals ? (s + frac).toFixed(2).padStart(5, "0") : s.toString().padStart(2, "0")

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${sStr}`
  }
  return `${m}:${sStr}`
}

function rankMap(values: Array<number | null | undefined>, asc = true) {
  const arr = values.filter((v): v is number => Number.isFinite(v as number) && (v as number) > 0)
  // Sort all valid values
  arr.sort((a, b) => (asc ? a - b : b - a))

  const m = new Map<number, number>()
  // Standard ranking: 1, 1, 3
  arr.forEach((v, idx) => {
    if (!m.has(v)) {
      m.set(v, idx + 1)
    }
  })
  return m
}

export default function IntervalClientView({ data, year }: { data: PageData; year?: number }) {
  const [sortKey, setSortKey] = useState<SortKey>("score")
  const [teamSortKey, setTeamSortKey] = useState<"rank" | "avg5000" | "avg10000" | "avgHalf" | "avgCollegePB">("rank")
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<IntervalItem | null>(null)

  // Map schoolId to Total Rank for "total_time" sorting
  const schoolRankMap = useMemo(() => {
    const map = new Map<number, number>()
    data.schoolTotals.forEach((st, idx) => {
      map.set(st.schoolId, idx + 1)
    })
    return map
  }, [data.schoolTotals])

  const sortedSchoolTotals = useMemo(() => {
    const list = [...data.schoolTotals]
    list.sort((a, b) => {
      if (teamSortKey === "rank") {
        return (a.total ?? 999999) - (b.total ?? 999999)
      }
      const avgA = data.schoolAverages[a.schoolId]
      const avgB = data.schoolAverages[b.schoolId]
      const valA = avgA ? avgA[teamSortKey] : 999999
      const valB = avgB ? avgB[teamSortKey] : 999999
      return valA - valB
    })
    return list
  }, [data.schoolTotals, data.schoolAverages, teamSortKey])

  const sortedIntervals = useMemo(() => {
    return data.intervals.map((interval) => {
      const items = [...interval.items]

      items.sort((a, b) => {
        if (sortKey === "total_time") {
          const rankA = schoolRankMap.get(a.schoolId) ?? 999
          const rankB = schoolRankMap.get(b.schoolId) ?? 999
          return rankA - rankB
        } else if (sortKey === "score") {
          // Default to scoreSec (asc)
          const valA = a.scoreSec ?? 999999
          const valB = b.scoreSec ?? 999999
          return valA - valB
        } else {
          // Sort by specific metric (asc)
          const valA = (a as any)[sortKey] ?? 999999
          const valB = (b as any)[sortKey] ?? 999999
          return valA - valB
        }
      })
      return { ...interval, items }
    })
  }, [data.intervals, sortKey, schoolRankMap])

  // Calculate ranks for display within each interval
  const getRank = (val: number | null, map: Map<number, number>) => {
    if (!val || !map.has(val)) return ""
    return `(${map.get(val)})`
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="p-4 space-y-8 bg-gray-50 min-h-screen relative">
      {/* Floating Navigation */}
      <div className="fixed bottom-10 right-10 z-40 bg-white p-4 rounded shadow-lg border border-gray-200">
        <label className="block text-xs font-bold text-gray-500 mb-1">快速导航</label>
        <select
          className="border p-2 rounded text-sm w-40"
          onChange={(e) => scrollToSection(e.target.value)}
        >
          <option value="">选择跳转...</option>
          {data.intervals.map((interval, idx) => (
            <option key={interval.intervalId} value={`interval-${interval.intervalId}`}>
              {interval.intervalName || `第${idx + 1}区`}
            </option>
          ))}
          <option value="team-ranking">队内总成绩排行</option>
          <option value="total-ranking">学校总成绩排行</option>
          <option value="global-averages">全局平均值</option>
        </select>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded shadow">
        <h1 className="text-xl font-bold">区间数据排名</h1>
        <div className="flex items-center gap-2">
          <label className="font-semibold">排序方式:</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="border p-2 rounded"
          >
            <option value="score">区间成绩</option>
            <option value="s5000">5000m</option>
            <option value="s10000">10000m</option>
            <option value="sHalf">半马</option>
            <option value="sCollegePB">高校PB</option>
            <option value="total_time">学校总成绩</option>
          </select>
        </div>
      </div>

      {sortedIntervals.map((interval, idx) => {
        // Calculate rank maps for this interval's data
        const mapScore = rankMap(interval.items.map(i => i.scoreSec))
        const map5000 = rankMap(interval.items.map(i => i.s5000))
        const map10000 = rankMap(interval.items.map(i => i.s10000))
        const mapHalf = rankMap(interval.items.map(i => i.sHalf))
        const mapPB = rankMap(interval.items.map(i => i.sCollegePB))

        return (
          <div key={interval.intervalId} id={`interval-${interval.intervalId}`} className="bg-white rounded shadow overflow-hidden">
            <div className="bg-blue-600 text-white p-3 font-bold text-lg">
              {interval.intervalName || `第${idx + 1}区`}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700 uppercase font-bold">
                  <tr>
                    <th className="p-3">排名</th>
                    <th className="p-3">学校</th>
                    <th className="p-3">姓名</th>
                    <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => setSortKey('score')}>
                      成绩 {sortKey === 'score' && '▼'}
                    </th>
                    <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => setSortKey('s5000')}>
                      5000m {sortKey === 's5000' && '▼'}
                    </th>
                    <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => setSortKey('s10000')}>
                      10000m {sortKey === 's10000' && '▼'}
                    </th>
                    <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => setSortKey('sHalf')}>
                      半马 {sortKey === 'sHalf' && '▼'}
                    </th>
                    <th className="p-3 cursor-pointer hover:text-blue-600" onClick={() => setSortKey('sCollegePB')}>
                      高校PB {sortKey === 'sCollegePB' && '▼'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {interval.items.map((item, idx) => {
                    const displayRank = sortKey === 'score' ? item.rank : idx + 1;

                    let rankDisplay: React.ReactNode = idx + 1
                    if (sortKey === 'score') rankDisplay = item.rank
                    else if (sortKey === 'total_time') rankDisplay = schoolRankMap.get(item.schoolId)

                    const teamAvg = data.schoolAverages[String(item.schoolId)]

                    return (
                      <tr key={item.studentId} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">{rankDisplay}</td>
                        <td className="p-3">{item.schoolName}</td>
                        <td className="p-3">
                          <button onClick={() => setSelectedPlayer(item)} className="hover:text-blue-600 hover:underline text-left font-medium">
                            {item.playerName}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-medium">{formatTime(item.scoreSec, false)}</span>
                          <span className="text-xs text-gray-500 ml-1">{getRank(item.scoreSec, mapScore)}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono">{formatTime(item.s5000)}</span>
                          <span className="text-xs text-gray-500 ml-1">{getRank(item.s5000, map5000)}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono">{formatTime(item.s10000)}</span>
                          <span className="text-xs text-gray-500 ml-1">{getRank(item.s10000, map10000)}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono">{formatTime(item.sHalf, false)}</span>
                          <span className="text-xs text-gray-500 ml-1">{getRank(item.sHalf, mapHalf)}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono">{formatTime(item.sCollegePB)}</span>
                          <span className="text-xs text-gray-500 ml-1">{getRank(item.sCollegePB, mapPB)}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Average Row */}
                  <tr className="bg-yellow-50 font-bold border-t-2 border-yellow-200">
                    <td className="p-3" colSpan={3}>区间平均值</td>
                    <td className="p-3 font-mono text-blue-700">
                      {formatTime(interval.items.reduce((a, b) => a + (b.scoreSec || 0), 0) / interval.items.filter(x => x.scoreSec).length, false)}
                    </td>
                    <td className="p-3 font-mono text-blue-700">{formatTime(interval.averages.avg5000)}</td>
                    <td className="p-3 font-mono text-blue-700">{formatTime(interval.averages.avg10000)}</td>
                    <td className="p-3 font-mono text-blue-700">{formatTime(interval.averages.avgHalf, false)}</td>
                    <td className="p-3 font-mono text-blue-700">{formatTime(interval.averages.avgCollegePB)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* School Master Table */}
      <div
        id="team-ranking"
        className={`bg-white rounded shadow transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 overflow-auto p-2' : 'p-6 overflow-x-auto'}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">队内总成绩排行</h2>
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm font-bold"
          >
            {isFullScreen ? '退出全屏' : '全屏展示'}
          </button>
        </div>
        <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
          <thead className="bg-gray-100 text-gray-700 font-bold">
            <tr>
              <th className="p-2 border cursor-pointer hover:bg-gray-200" onClick={() => setTeamSortKey('rank')}>
                排名 {teamSortKey === 'rank' && '▼'}
              </th>
              <th className="p-2 border sticky left-0 bg-gray-200 z-30 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)] border-r-2 border-gray-400">学校</th>
              {data.intervals.map((it, idx) => (
                <th key={it.intervalId} className="p-2 border text-center min-w-[150px]">
                  {it.intervalName || `第${idx + 1}区`}
                </th>
              ))}
              <th className="p-2 border bg-blue-50 cursor-pointer hover:bg-blue-100" onClick={() => setTeamSortKey('avg5000')}>
                平均5000 {teamSortKey === 'avg5000' && '▼'}
              </th>
              <th className="p-2 border bg-blue-50 cursor-pointer hover:bg-blue-100" onClick={() => setTeamSortKey('avg10000')}>
                平均10000 {teamSortKey === 'avg10000' && '▼'}
              </th>
              <th className="p-2 border bg-blue-50 cursor-pointer hover:bg-blue-100" onClick={() => setTeamSortKey('avgHalf')}>
                平均半马 {teamSortKey === 'avgHalf' && '▼'}
              </th>
              <th className="p-2 border bg-blue-50 cursor-pointer hover:bg-blue-100" onClick={() => setTeamSortKey('avgCollegePB')}>
                高校PB {teamSortKey === 'avgCollegePB' && '▼'}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSchoolTotals.map((st, idx) => {
              const schoolId = st.schoolId
              const avgs = data.schoolAverages[String(schoolId)]
              const totalRank = schoolRankMap.get(schoolId)

              return (
                <tr key={schoolId} className="hover:bg-gray-50">
                  <td className="p-2 border font-bold text-center">{idx + 1}</td>
                  <td className="p-2 border font-bold sticky left-0 bg-gray-50 z-30 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.2)] border-r-2 border-gray-400">
                    <div>{st.schoolName}</div>
                    {teamSortKey !== 'rank' && totalRank && (
                      <div className="text-[10px] text-gray-500 font-normal mt-1">
                        (总成绩第{totalRank}名)
                      </div>
                    )}
                  </td>
                  {data.intervals.map(it => {
                    const item = it.items.find(x => x.schoolId === schoolId)
                    if (!item) return <td key={it.intervalId} className="p-2 border text-center text-gray-300">—</td>
                    return (
                      <td key={it.intervalId} className="p-2 border align-top">
                        <div
                          className="font-bold text-blue-700 mb-1 text-sm cursor-pointer hover:underline"
                          onClick={() => setSelectedPlayer(item)}
                        >
                          {item.playerName || "—"}
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-600">
                          <span>5k: <span className="font-mono text-gray-900">{formatTime(item.s5000)}</span></span>
                          <span>10k: <span className="font-mono text-gray-900">{formatTime(item.s10000)}</span></span>
                          <span>半马: <span className="font-mono text-gray-900">{formatTime(item.sHalf, false)}</span></span>
                          <span>高校: <span className="font-mono text-gray-900">{formatTime(item.sCollegePB)}</span></span>
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-2 border bg-blue-50 font-mono font-bold text-blue-900">{avgs ? formatTime(avgs.avg5000) : '—'}</td>
                  <td className="p-2 border bg-blue-50 font-mono font-bold text-blue-900">{avgs ? formatTime(avgs.avg10000) : '—'}</td>
                  <td className="p-2 border bg-blue-50 font-mono font-bold text-blue-900">{avgs ? formatTime(avgs.avgHalf, false) : '—'}</td>
                  <td className="p-2 border bg-blue-50 font-mono font-bold text-blue-900">{avgs ? formatTime(avgs.avgCollegePB) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* School Total Ranking (Simple List) */}
      <div id="total-ranking" className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">学校总成绩排行</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase font-bold">
              <tr>
                <th className="p-3">排名</th>
                <th className="p-3">学校</th>
                <th className="p-3">总成绩</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.schoolTotals.map((t, idx) => (
                <tr key={t.schoolId} className="hover:bg-gray-50">
                  <td className="p-3 font-bold">{idx + 1}</td>
                  <td className="p-3">{t.schoolName}</td>
                  <td className="p-3 font-mono font-medium">{formatTime(t.total, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Averages */}
      <div id="global-averages" className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">全局平均值</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded text-center">
            <div className="text-gray-500 font-bold mb-1">5000m</div>
            <div className="text-xl font-mono font-bold">{formatTime(data.overallAverages.avg5000)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded text-center">
            <div className="text-gray-500 font-bold mb-1">10000m</div>
            <div className="text-xl font-mono font-bold">{formatTime(data.overallAverages.avg10000)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded text-center">
            <div className="text-gray-500 font-bold mb-1">半马</div>
            <div className="text-xl font-mono font-bold">{formatTime(data.overallAverages.avgHalf, false)}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded text-center">
            <div className="text-gray-500 font-bold mb-1">高校PB</div>
            <div className="text-xl font-mono font-bold">{formatTime(data.overallAverages.avgCollegePB)}</div>
          </div>
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPlayer.playerName}</h2>
                  <div className="text-lg text-gray-600 font-bold mt-1">{selectedPlayer.schoolName}</div>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase">5000m</div>
                  <div className="font-mono font-bold text-lg">{formatTime(selectedPlayer.s5000)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase">10000m</div>
                  <div className="font-mono font-bold text-lg">{formatTime(selectedPlayer.s10000)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase">Half Marathon</div>
                  <div className="font-mono font-bold text-lg">{formatTime(selectedPlayer.sHalf, false)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase">College PB</div>
                  <div className="font-mono font-bold text-lg text-blue-600">{formatTime(selectedPlayer.sCollegePB)}</div>
                </div>
              </div>

              <h3 className="text-lg font-bold mb-3 border-l-4 border-blue-600 pl-3">三大驿传参赛记录</h3>

              {(!selectedPlayer.history || selectedPlayer.history.length === 0) ? (
                <div className="text-gray-500 italic p-4 text-center bg-gray-50 rounded">暂无记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-xs">
                      <tr>
                        <th className="p-3">年度</th>
                        <th className="p-3">年级</th>
                        <th className="p-3">赛事</th>
                        <th className="p-3">区间</th>
                        <th className="p-3">排名</th>
                        <th className="p-3">成绩</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPlayer.history.map((h, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-3">{h.year}</td>
                          <td className="p-3">{h.grade}</td>
                          <td className="p-3">
                            <span className={`
                              px-2 py-1 rounded text-xs font-bold text-white
                              ${h.ekiden.includes('箱根') ? 'bg-indigo-600' :
                                h.ekiden.includes('全日本') ? 'bg-green-600' :
                                  'bg-pink-600'}
                            `}>
                              {h.ekiden}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{h.intervalName}</td>
                          <td className="p-3">
                            <span className={`
                              font-bold
                              ${h.rank === 1 ? 'text-yellow-600' :
                                h.rank <= 3 ? 'text-gray-600' : ''}
                            `}>
                              {h.rank}
                            </span>
                            {h.isNewRecord && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold border border-red-200">新</span>}
                          </td>
                          <td className="p-3 font-mono">{formatTime(h.time, false)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}