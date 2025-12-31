"use client"
import React, { useEffect, useMemo, useState } from "react"
import { fetchPublicOrApi } from "@/app/lib/public-cache"

function formatPBText(v: number | string | null | undefined, kind: "5000" | "10000" | "half") {
    if (v == null) return "—"
    const sec = typeof v === "number" ? Math.round(v) : (() => {
        const parts = String(v).split(":").map(Number)
        if (parts.length === 2) return parts[0] * 60 + parts[1]
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
        return NaN
    })()
    if (!Number.isFinite(sec)) return "—"
    const mm = Math.floor(sec / 60)
    const ss = sec % 60
    const hh = Math.floor(mm / 60)
    const rem = mm % 60
    if (kind === "half") return `${String(hh).padStart(2, "0")}:${String(rem).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`
}

type Grade = 1 | 2 | 3 | 4
function calcGrade(entryYear?: number | null, eventYear?: number | null): Grade | undefined {
    if (!eventYear || !entryYear) return undefined
    const g = Number(eventYear) - Number(entryYear) + 1
    if (g < 1) return 1 as Grade
    if (g > 4) return 4 as Grade
    return g as Grade
}
function gradeText(g?: Grade) {
    if (!g) return "—"
    return g === 1 ? "一年" : g === 2 ? "二年" : g === 3 ? "三年" : "四年"
}

function HakonePredictFinal({ schoolId, ekidenUserPredictDetailId, year }: { schoolId: string, ekidenUserPredictDetailId?: string, year: string }) {
    const schoolIdNum = useMemo(() => Number(schoolId), [schoolId])
    const yearNum = useMemo(() => Number(year), [year])

    const [ekidenThId, setEkidenThId] = useState<number | undefined>(undefined)
    const [eventYear, setEventYear] = useState<number | undefined>(undefined)
    const [teamId, setTeamId] = useState<number | undefined>(undefined)
    const [schoolName, setSchoolName] = useState<string>("")
    const [group, setGroup] = useState<any | null>(null)

    useEffect(() => {
        ; (async () => {
            const ekidens = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            const hakone = ekidens.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const editions = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
            const target = editions.find((x: any) => Number(x.year) === yearNum)
            if (!target) return
            setEkidenThId(Number(target.id))
            setEventYear(Number(target.year))
            const teams = await fetchPublicOrApi<any[]>("public-teams", Number(target.id), `/api/teams?Ekiden_thId=${target.id}`)
            const team = teams.find((t: any) => Number(t.schoolId) === schoolIdNum)
            if (!team) return
            setTeamId(Number(team.id))
            const res = await fetch(`/api/predict/hakone/final/list?ekidenThId=${target.id}&ekiden_no_teamId=${team.id}`)
            const j = res.ok ? await res.json() : null
            const gs = (j?.groups || []) as any[]
            const picked = gs.slice().sort((a: any, b: any) => new Date(b?.meta?.createdAt || 0).getTime() - new Date(a?.meta?.createdAt || 0).getTime()).at(0) || null
            setGroup(picked)
            setSchoolName(String(j?.meta?.schoolName || team.schoolName || ""))
        })()
    }, [schoolIdNum, yearNum])

    const items = useMemo(() => {
        const arr = (group?.items || []) as any[]
        return arr
    }, [group])

    if (!group) return <div style={{ padding: 8, borderWidth: 1, borderStyle: "solid", borderColor: "#eee", borderRadius: 8, background: "#fff" }}>未找到该校该年最终预测</div>

    return (
        <div style={{ borderRadius: 10, borderWidth: 1, borderColor: "#ddd", borderStyle: "solid", background: "#fff", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{schoolName}</div>
                    <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>{group?.meta?.name ?? "—"}</div>
                </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {items.slice(0, 5).map((it: any) => {
                    const s = it.student || {}
                    return (
                        <div key={`f-${it.slot}`}>
                            <div style={{ borderWidth: 1, borderStyle: "solid", borderColor: "#ddd", borderRadius: 8, padding: 10, background: it.isSub ? "#fff7e6" : undefined, position: "relative" }}>
                                {it.isSub ? (<div style={{ position: "absolute", top: 6, right: 6, background: "#fa541c", color: "#fff", borderRadius: 6, fontSize: 12, lineHeight: 1, padding: "2px 6px" }}>更换</div>) : null}
                                <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</div>
                                <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{it.playerName ?? "—"}
                                    <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((s as any)?.entryYear ?? undefined, eventYear))}</span>
                                </div>
                                <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((s as any)?.score5000m, "5000")} <br /> 10000 {formatPBText((s as any)?.score10000m, "10000")} <br /> 半马 {formatPBText((s as any)?.scoreHalf, "half")}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginTop: 6 }}>
                {items.slice(5, 10).map((it: any) => {
                    const s = it.student || {}
                    return (
                        <div key={`r-${it.slot}`} style={{ borderWidth: 1, borderStyle: "solid", borderColor: "#ddd", borderRadius: 8, padding: 10, background: it.isSub ? "#fff7e6" : undefined, position: "relative" }}>
                            {it.isSub ? (<div style={{ position: "absolute", top: 6, right: 6, background: "#fa541c", color: "#fff", borderRadius: 6, fontSize: 12, lineHeight: 1, padding: "2px 6px" }}>更换</div>) : null}
                            <div style={{ fontSize: 16, fontWeight: 800 }}>{it.slot}区</div>
                            <div style={{ fontSize: 20, fontWeight: 900, marginTop: 6 }}>{it.playerName ?? "—"} <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 6 }}>{gradeText(calcGrade((s as any)?.entryYear ?? undefined, eventYear))}</span></div>
                            <div style={{ fontSize: 10, color: "#555", fontWeight: 500, marginTop: 4 }}>5000 {formatPBText((s as any)?.score5000m, "5000")} <br /> 10000 {formatPBText((s as any)?.score10000m, "10000")} <br /> 半马 {formatPBText((s as any)?.scoreHalf, "half")}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default HakonePredictFinal
