"use client"
import React, { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Input, Tooltip, Modal, message } from "antd"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

type EkidenType = "出雲" | "全日本" | "箱根"
type Grade = 1 | 2 | 3 | 4
type EntryRecord = { ekiden: EkidenType; grade: Grade; intervalName?: string; rank?: number; symbol?: "○" | "△" | "—"; dnf?: boolean; time?: string; year?: number; runner?: string; runnerGrade?: number }

function formatSeconds(sec: number | null | undefined) {
  if (!sec && sec !== 0) return "--"
  const h = Math.floor((sec as number) / 3600)
  const m = Math.floor(((sec as number) % 3600) / 60)
  const s = (sec as number) % 60
  const hhStr = String(h).padStart(2, "0")
  const mmStr = String(m).padStart(2, "0")
  const ssStr = String(s).padStart(2, "0")
  return `${hhStr}:${mmStr}:${ssStr}`
}

// 不展示四年三大驿传，改为仅展示基础成绩

export default function SummaryPage() {
  const params = useParams() as { th?: string }
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [opinion, setOpinion] = useState<string>("")
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [showSubmit, setShowSubmit] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [nickname, setNickname] = useState<string>("")
  const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
  const leftRef = React.useRef<HTMLDivElement>(null)
  const [rightHeight, setRightHeight] = useState<number>(0)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const exportRef = React.useRef<HTMLDivElement>(null)
  const rightRef = React.useRef<HTMLDivElement>(null)

  const [messageApi, contextHolder] = message.useMessage();
  const info = () => {
    messageApi.open({
      type: 'info',
      content: '今年箱根已结束',
      duration: 10,
    });
  };


  useEffect(() => {
    try {
      const raw = localStorage.getItem("hakone_summary")
      if (raw) setData(JSON.parse(raw))
      const rawOpinion = localStorage.getItem("hakone_summary_opinion")
      if (rawOpinion) setOpinion(rawOpinion)
      const cookieName = (document.cookie.match(/(?:^|; )predict_nickname=([^;]+)/)?.[1] || "").trim()
      if (cookieName) setNickname(decodeURIComponent(cookieName))
      setOpinion('')
    } catch { }

  }, [])

  useEffect(() => {
    ; (async () => {
      const ekidensData = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
      const hakone = ekidensData.find((e: any) => e.name === "箱根")
      if (!hakone) return
      const eds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
      const ed = eds.find((x: any) => String(x.ekiden_th) === String(params?.th ?? ""))
      if (ed) setEkidenThId(ed.id)
    })()
  }, [params?.th])

  function saveOpinion(v: string) {
    setOpinion(v)
    try { localStorage.setItem("hakone_summary_opinion", v) } catch { }
  }

  function submitSummary() {
    setShowSubmit(true)
  }

  async function doSubmit() {
    if (!data || !ekidenThId) return
    if (!nickname || !nickname.trim()) { message.error("请输入昵称"); return }
    if (submitting) return
    setSubmitting(true)
    const slots = Array.isArray(data.slots) ? data.slots : []
    const payload = {
      ekidenThId,
      schoolName: data.school,
      userName: nickname || undefined,
      opinion: opinion || undefined,
      slots: slots.map((s: any) => ({ slot: s.slot, predictSec: s.predictSec ?? null, playerId: s.playerId ?? null }))
    }
    const res = await fetch("/api/predict/hakone/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
    if (!res.ok) { try { const j = await res.json(); message.error(j?.error || "提交失败") } catch { message.error("提交失败") }; setSubmitting(false); return }
    try { localStorage.setItem("hakone_summary_submitted_at", String(Date.now())) } catch { }
    try { document.cookie = `predict_nickname=${encodeURIComponent(nickname)}; path=/; max-age=${60 * 60 * 24 * 365}` } catch { }
    setShowSubmit(false)
    setSubmitting(false)
    router.push(`/predict/hakone/${params?.th ?? ""}/result`)
  }

  function exportIntervalsImage() {
    const el = leftRef.current
    if (!el) return
    const width = el.scrollWidth
    const height = el.scrollHeight
    const serializer = new XMLSerializer()
    const cloned = el.cloneNode(true) as HTMLElement
    const wrapper = document.createElement("div")
    wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")
    wrapper.style.width = `${width}px`
    wrapper.style.height = `${height}px`
    wrapper.appendChild(cloned)
    const html = serializer.serializeToString(wrapper)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0)
        try {
          canvas.toBlob(b => {
            if (!b) return
            const link = document.createElement("a")
            link.download = `intervals-${params?.th ?? ""}.png`
            link.href = URL.createObjectURL(b)
            document.body.appendChild(link)
            link.click()
            setTimeout(() => {
              URL.revokeObjectURL(link.href)
              document.body.removeChild(link)
            }, 300)
          }, "image/png")
        } catch {
          const link = document.createElement("a")
          const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
          link.download = `intervals-${params?.th ?? ""}.svg`
          link.href = URL.createObjectURL(svgBlob)
          document.body.appendChild(link)
          link.click()
          setTimeout(() => {
            URL.revokeObjectURL(link.href)
            document.body.removeChild(link)
          }, 300)
        }
      }
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  function exportImage() {
    const el = exportRef.current
    if (!el) return
    const prevRightHeight = rightRef.current ? rightRef.current.style.height : undefined
    if (rightRef.current) rightRef.current.style.height = "auto"
    const textareas = rightRef.current ? rightRef.current.querySelectorAll("textarea") as NodeListOf<HTMLTextAreaElement> : undefined
    if (textareas && textareas.length) {
      textareas.forEach(ta => {
        ta.style.height = `${ta.scrollHeight}px`
      })
    }
    const width = el.scrollWidth
    const height = el.scrollHeight
    const serializer = new XMLSerializer()
    const cloned = el.cloneNode(true) as HTMLElement
    const wrapper = document.createElement("div")
    wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")
    wrapper.style.width = `${width}px`
    wrapper.style.height = `${height}px`
    wrapper.appendChild(cloned)
    const html = serializer.serializeToString(wrapper)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0)
        try {
          canvas.toBlob(b => {
            if (!b) return
            const link = document.createElement("a")
            link.download = `summary-${params?.th ?? ""}.png`
            link.href = URL.createObjectURL(b)
            document.body.appendChild(link)
            link.click()
            setTimeout(() => {
              URL.revokeObjectURL(link.href)
              document.body.removeChild(link)
            }, 300)
          }, "image/png")
        } catch {
          const link = document.createElement("a")
          const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
          link.download = `summary-${params?.th ?? ""}.svg`
          link.href = URL.createObjectURL(svgBlob)
          document.body.appendChild(link)
          link.click()
          setTimeout(() => {
            URL.revokeObjectURL(link.href)
            document.body.removeChild(link)
          }, 300)
        }
      }
      if (rightRef.current) rightRef.current.style.height = prevRightHeight || ""
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  // 初始高度在下方计算完 forward/return 后再绑定

  const totalSec = ((data?.slots ?? []) as any[]).reduce((sum: number, it: any) => sum + (typeof it.predictSec === "number" ? it.predictSec : 0), 0)
  const allHavePredict = data?.predicted === true ? ((data?.slots ?? []) as any[]).every((it: any) => typeof it.predictSec === "number") : false
  const slotsSorted = ((data?.slots ?? []) as any[]).slice().sort((a: any, b: any) => a.slot - b.slot)

  const slotDistances: Record<number, number> = { 1: 21.3, 2: 23.1, 3: 21.4, 4: 20.9, 5: 20.8, 6: 20.8, 7: 21.3, 8: 21.4, 9: 23.1, 10: 23.0 }

  function parseTimeStr(t?: string) {
    if (!t) return undefined
    const parts = (t || "").split(":").map(x => x.trim())
    if (parts.length === 2) {
      const m = Number(parts[0] || 0)
      const s = Number(parts[1] || 0)
      return m * 60 + s
    }
    if (parts.length === 3) {
      const h = Number(parts[0] || 0)
      const m = Number(parts[1] || 0)
      const s = Number(parts[2] || 0)
      return h * 3600 + m * 60 + s
    }
    return undefined
  }
  const displaySlotsSorted = slotsSorted
  function cumulativeList(arr: any[]) {
    let sum = 0
    return arr.map(it => {
      const sec = typeof it.predictSec === "number" ? it.predictSec : 0
      sum += sec
      return { ...it, cum: sum }
    })
  }
  const forward = displaySlotsSorted.filter((it: any) => it.slot >= 1 && it.slot <= 5)
  const returnR = displaySlotsSorted.filter((it: any) => it.slot >= 6 && it.slot <= 10)
  const forwardWithCum = cumulativeList(forward)
  const returnWithCum = cumulativeList(returnR)
  const forwardTotal = forwardWithCum.length ? forwardWithCum[forwardWithCum.length - 1].cum : 0
  const returnTotal = returnWithCum.length ? returnWithCum[returnWithCum.length - 1].cum : 0
  useEffect(() => {
    const update = () => {
      if (leftRef.current) setRightHeight(leftRef.current.offsetHeight)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [forwardWithCum, returnWithCum, showPreview, opinion])

  function formatPace(sec: number | undefined, km: number | undefined) {
    if (!sec || !km || km <= 0) return "—"
    const perKm = sec / km
    const m = Math.floor(perKm / 60)
    const s = Math.round(perKm % 60)
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}/km`
  }
  function formatPBText(v?: string | number, kind?: "5000" | "10000" | "half" | "full") {
    if (v == null) return "—"
    const sec = typeof v === "number" ? v : parseTimeStr(v)
    if (sec == null) return typeof v === "string" ? v : "—"
    if (kind === "5000" || kind === "10000") {
      const m = Math.floor(sec / 60)
      const s = sec - m * 60
      let secStr = s.toFixed(2)
      if (secStr === "60.00") return `${String(m + 1).padStart(2, "0")}:00.00`
      const [si, sf] = secStr.split(".")
      return `${String(m).padStart(2, "0")}:${String(si).padStart(2, "0")}.${sf}`
    }
    return formatSeconds(sec)
  }
  function EntriesTooltip({ playerId }: { playerId?: number }) {
    const entries: EntryRecord[] | undefined = playerId ? data?.playerEntries?.[playerId] : []
    const grades: Grade[] = [1, 2, 3, 4]
    const cols: EkidenType[] = ["出雲", "全日本", "箱根"]
    const lookup = useMemo(() => {
      const map = new Map<string, EntryRecord>();
      (entries || []).forEach(r => map.set(`${r.grade}-${r.ekiden}`, r))
      return map
    }, [playerId])
    function cellBg(rec?: EntryRecord) {
      if (!rec) return undefined
      if (rec.dnf) return "#ffe5e5"
      if (rec.symbol === "△") return "#d6ecff"
      if (rec.rank === 1) return "#ffd700"
      if (rec.rank === 2) return "#c0c0c0"
      if (rec.rank === 3) return "#cd7f32"
      return undefined
    }
    return (
      <div style={{ width: 380, overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{ border: "1px solid #080808" }}>
          <div style={{ background: "#fffa9f", padding: 6, fontWeight: 600 }}>駅伝エントリー</div>
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(3, minmax(14ch, 1fr))", gap: 0 }}>
            <div style={{ padding: 6, borderRight: "1px solid #eee", borderBottom: "1px solid #eee" }}></div>
            {cols.map(c => (
              <div key={c} style={{ padding: 6, textAlign: "center", borderBottom: "1px solid #eee", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c}</div>
            ))}
            {grades.map(g => (
              <React.Fragment key={g}>
                <div style={{ padding: 6, borderTop: "1px solid #eee", borderRight: "1px solid #eee" }}>{g}年</div>
                {cols.map(c => {
                  const rec = lookup.get(`${g}-${c}`)
                  const text = rec?.symbol ? rec.symbol : rec?.intervalName ? `${rec.intervalName}${rec.rank ?? ""}位` : ""
                  return (
                    <div key={`${g}-${c}`} style={{ padding: 6, textAlign: "center", borderTop: "1px solid #eee", borderRight: "1px solid #eee", background: cellBg(rec), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>
                      {rec?.time && (<div style={{ fontSize: 12, color: "#555", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rec.time}</div>)}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function mdToHtml(md: string) {
    let html = md
    html = html.replace(/^###\s?(.*)$/gm, '<h3>$1</h3>')
    html = html.replace(/^##\s?(.*)$/gm, '<h2>$1</h2>')
    html = html.replace(/^#\s?(.*)$/gm, '<h1>$1</h1>')
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/^-\s(.*)$/gm, '<li>$1</li>')
    html = html.replace(/\n/g, '<br/>')
    // wrap orphan li into ul
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>')
    return html
  }

  return (

    <>
      {contextHolder}
      <div style={{ padding: 16, maxWidth: 1200, overflowX: "auto", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h1 style={{ fontSize: 18 }}>{`第${params?.th ?? ""}回 ${data?.school ?? ""} 完成分配`}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {allHavePredict && (<div style={{ fontSize: 14 }}>总预测：{formatSeconds(totalSec)}</div>)}
            <button
              // onClick={submitSummary}
              onClick={info}
              style={{ padding: "4px 10px", border: "1px solid #ccc", borderRadius: 6, background: "#fff" }}>提交</button>
            <button onClick={exportIntervalsImage} style={{ padding: "4px 10px", border: "1px solid #ccc", borderRadius: 6, background: "#fff" }}>导出区间图片</button>
            <button onClick={exportImage} style={{ padding: "4px 10px", border: "1px solid #ccc", borderRadius: 6, background: "#fff" }}>导出图片</button>
          </div>
        </div>

        <div ref={exportRef} className="summaryMain" style={{ display: "flex", alignItems: "flex-start", gap: 10, flexDirection: "row" }}>
          <div ref={leftRef} style={{ flex: "0 0 45%", minWidth: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong>往路（1-5区）</strong>
                  {allHavePredict && <span style={{ fontSize: 12, color: "#555" }}>总计：{formatSeconds(forwardTotal)}</span>}
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {forwardWithCum.map((it: any) => {
                    const scores = (it.playerId ? data.playerScores?.[it.playerId] : undefined)
                    const compact = !allHavePredict
                    return (
                      <Tooltip key={`f-${it.slot}`} title={<EntriesTooltip playerId={it.playerId} />} color="#fff" styles={{ container: { border: "2px solid #020202", minWidth: 400 } }}>
                        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, background: "rgba(var(--panel-bg-rgb), var(--panel-opacity))", position: "relative" }}>
                          {compact ? (
                            <>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                <span style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</span>
                                <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slotDistances[it.slot]}km</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 }}>
                                <div style={{ fontSize: 24, fontWeight: 900 }}>{it.playerName ?? "—"}</div>
                                <div style={{ textAlign: "right", fontSize: 13, color: "#111", fontWeight: 600 }}>
                                  <div>5000：{formatPBText(scores?.score5000m, "5000")}</div>
                                  <div>10000：{formatPBText(scores?.score10000m, "10000")}</div>
                                  <div>半马：{formatPBText(scores?.scoreHalf, "half")}</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                              <div style={{ fontSize: 24, fontWeight: 900 }}>{it.playerName ?? "—"}</div>
                              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(scores?.score5000m, "5000")}</div>
                              <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(scores?.score10000m, "10000")}</div>
                              <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(scores?.scoreHalf, "half")}</div>
                            </div>
                          )}
                          {!compact && (
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                              <span style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</span>
                              <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slotDistances[it.slot]}km</span>
                            </div>
                          )}
                          {!compact && (
                            <>
                              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>{formatSeconds(it.predictSec)}</div>
                              <div style={{ fontSize: 14, color: "#666" }}>配速：{formatPace(it.predictSec, slotDistances[it.slot])}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
                                <span>往路累计 {formatSeconds(it.cum)}</span>
                                <span>总时间 {formatSeconds(it.cum)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <strong>复路（6-10区）</strong>
                  {allHavePredict && <span style={{ fontSize: 12, color: "#555" }}>总计：{formatSeconds(returnTotal)}</span>}
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {returnWithCum.map((it: any) => {
                    const scores = (it.playerId ? data.playerScores?.[it.playerId] : undefined)
                    const compact = !allHavePredict
                    return (
                      <Tooltip key={`r-${it.slot}`} title={<EntriesTooltip playerId={it.playerId} />} color="#fff" styles={{ container: { border: "2px solid #000000", minWidth: 400 } }}>
                        <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 10, background: "rgba(var(--panel-bg-rgb), var(--panel-opacity))", position: "relative" }}>
                          {compact ? (
                            <>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                                <span style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</span>
                                <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slotDistances[it.slot]}km</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 }}>
                                <div style={{ fontSize: 24, fontWeight: 900 }}>{it.playerName ?? "—"}</div>
                                <div style={{ textAlign: "right", fontSize: 13, color: "#111", fontWeight: 600 }}>
                                  <div>5000：{formatPBText(scores?.score5000m, "5000")}</div>
                                  <div>10000：{formatPBText(scores?.score10000m, "10000")}</div>
                                  <div>半马：{formatPBText(scores?.scoreHalf, "half")}</div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ position: "absolute", top: 6, right: 10, textAlign: "right" }}>
                              <div style={{ fontSize: 24, fontWeight: 900 }}>{it.playerName ?? "—"}</div>
                              <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>5000 {formatPBText(scores?.score5000m, "5000")}</div>
                              <div style={{ fontSize: 12, color: "#555" }}>10000 {formatPBText(scores?.score10000m, "10000")}</div>
                              <div style={{ fontSize: 12, color: "#555" }}>半马 {formatPBText(scores?.scoreHalf, "half")}</div>
                            </div>
                          )}
                          {!compact && (
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                              <span style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</span>
                              <span style={{ fontSize: 12, color: "#666", marginTop: -2 }}>{slotDistances[it.slot]}km</span>
                            </div>
                          )}
                          {!compact && (
                            <>
                              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>{formatSeconds(it.predictSec)}</div>
                              <div style={{ fontSize: 14, color: "#666" }}>配速：{formatPace(it.predictSec, slotDistances[it.slot])}</div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
                                <span>复路累计 {formatSeconds(it.cum)}</span>
                                <span>总时间 {formatSeconds(forwardTotal + it.cum)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </Tooltip>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="mobileSeparator" />
          <div ref={rightRef} style={{ flex: "1 0 55%", maxWidth: "55%", height: (rightHeight ? rightHeight : undefined) }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, background: "#fff", padding: 12, height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>阵容看法</div>
                <button onClick={() => setShowPreview(v => !v)} style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: 6 }}>{showPreview ? "隐藏预览" : "查看预览"}</button>
              </div>
              {showPreview ? (
                <div style={{ display: "flex", gap: 8, height: "100%", flexDirection: "row" }}>
                  <Input.TextArea value={opinion} onChange={e => saveOpinion(e.target.value)} placeholder="写下你的阵容观点、策略与理由（支持 Markdown）" style={{ flex: "1 0 50%", height: "100%", overflowY: "auto", resize: "none" }} />
                  <div style={{ flex: "1 0 50%", height: "100%", overflowY: "auto", border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{opinion}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <Input.TextArea value={opinion} onChange={e => saveOpinion(e.target.value)} rows={10} placeholder="写下你的阵容观点、策略与理由（支持 Markdown）" style={{ flex: "1 0 auto", height: "100%", overflowY: "auto", resize: "none" }} />
              )}
            </div>
          </div>
        </div>
        {allHavePredict && <div style={{ marginTop: 12, fontSize: 14 }}>综合成绩：{formatSeconds(forwardTotal + returnTotal)}</div>}
        <Modal open={showSubmit} onCancel={() => setShowSubmit(false)} onOk={doSubmit} okText="提交" cancelText="取消" confirmLoading={submitting}>
          <div style={{ display: "grid", gap: 8 }}>
            <div>请输入你的昵称：</div>
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="昵称" />
          </div>
        </Modal>
        <style jsx>{`
        .mobileSeparator { display: none; }
        @media (max-width: 768px) {
          .summaryMain { flex-direction: column; }
          .mobileSeparator { display: block; height: 1px; background: #eee; margin: 12px 0; }
        }
      `}</style>
      </div>
    </>
  )
}
