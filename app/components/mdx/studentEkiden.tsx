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

const ekidenIdByName: Record<EkidenType, number> = { 出雲: 5, 全日本: 4, 箱根: 3 }

function entryText(item?: any) {
    const name = item?.intervalName || "—"
    const time = typeof item?.score === "number" ? formatSeconds(item?.score) : "—"
    const rank = item?.rank ? `${item.rank}位` : ""
    return `${name}${time !== "—" ? ` ${time}` : ""}${rank ? ` ${rank}` : ""}`
}

function StudentEkiden({ id, studentID }: { id?: string, studentID?: string }) {
    const studentId = useMemo(() => {
        const raw = id ?? studentID
        const n = Number(raw)
        return Number.isFinite(n) ? n : undefined
    }, [id, studentID])

    const [eventYear, setEventYear] = useState<number | undefined>(undefined)
    const [editionByEkidenName, setEditionByEkidenName] = useState<Record<EkidenType, number | undefined>>({ 出雲: undefined, 全日本: undefined, 箱根: undefined })
    const [student, setStudent] = useState<any | null>(null)
    const [entries, setEntries] = useState<any[]>([])

    useEffect(() => {
        ; (async () => {
            const ekidens = await fetchPublicOrApi<any[]>("public-ekidens", "all", "/api/ekidens")
            const hakone = ekidens.find((e: any) => e.name === "箱根")
            if (!hakone) return
            const hakoneEds = await fetchPublicOrApi<any[]>("public-editions", Number(hakone.id), `/api/editions?ekidenId=${hakone.id}`)
            const latestHakone = hakoneEds.slice().sort((a: any, b: any) => Number(a.year) - Number(b.year)).at(-1)
            if (latestHakone) setEventYear(Number(latestHakone.year))

            const izumo = ekidens.find((e: any) => e.name === "出雲")
            const zennihon = ekidens.find((e: any) => e.name === "全日本")
            const izumoEd = izumo ? (await fetchPublicOrApi<any[]>("public-editions", Number(izumo.id), `/api/editions?ekidenId=${izumo.id}`)).find((x: any) => Number(x.year) === Number(latestHakone?.year)) : undefined
            const zenEd = zennihon ? (await fetchPublicOrApi<any[]>("public-editions", Number(zennihon.id), `/api/editions?ekidenId=${zennihon.id}`)).find((x: any) => Number(x.year) === Number(latestHakone?.year)) : undefined
            setEditionByEkidenName({ 出雲: izumoEd?.id, 全日本: zenEd?.id, 箱根: latestHakone?.id })
        })()
    }, [])

    useEffect(() => {
        ; (async () => {
            if (!studentId) return
            const allStudents = await fetchPublicOrApi<any[]>("public-students", "all", "/api/students")
            const s = (allStudents || []).find((x: any) => Number(x.id) === Number(studentId)) || null
            setStudent(s)
            const ent = await fetchPublicOrApi<any[]>("public-student-entries", [studentId], `/api/student-entries?studentIds=${studentId}`)
            setEntries(Array.isArray(ent) ? ent : [])
        })()
    }, [studentId])

    const currentEntry = (ekiden?: EkidenType) => {
        if (!ekiden || !studentId) return undefined as any
        const thId = ekiden ? editionByEkidenName[ekiden] : undefined
        const list = entries || []
        return thId ? list.find((x: any) => Number(x.thId) === Number(thId)) : undefined
    }

    const latestByName = (ekiden?: EkidenType) => {
        if (!ekiden || !studentId) return undefined as any
        const targetId = ekidenIdByName[ekiden]
        const arr = (entries || []).filter((x: any) => Number(x.ekidenId) === Number(targetId))
        if (!arr.length) return undefined
        return arr.slice().sort((a: any, b: any) => Number(a.thId) - Number(b.thId)).at(-1)
    }

    const show = (ekiden: EkidenType) => {
        const it = currentEntry(ekiden) || latestByName(ekiden)
        return entryText(it)
    }

    function cellBgRank(rank?: number) {
        if (rank === 1) return "#ffd700"
        if (rank === 2) return "#c0c0c0"
        if (rank === 3) return "#cd7f32"
        return undefined
    }

    return (
        <div style={{ border: "3px solid #000", borderRadius: 8, background: "#fff", padding: 8, marginBottom: 8 ,maxWidth: 500}}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, fontSize: 12 }}>
                <div>姓名：{student?.name ?? "—"}</div>
                <div>年级：{gradeText(calcGrade(student?.entryYear ?? null, eventYear))}</div>
                <div>5000m：{formatPBText(student?.score_5000m, "5000") ?? "--"}</div>
                <div>10000m：{formatPBText(student?.score_10000m, "10000") ?? "--"}</div>
                <div>半程：{formatPBText(student?.score_half_marathon, "half") ?? "--"}</div>
                <div>高校PB：{formatPBText(student?.score_college_pb, "5000") ?? "--"}</div>
            </div>
            {(() => {
                const raw = entries || []
                const gradeMap: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4 }
                const grades = [1, 2, 3, 4] as number[]
                const cols: EkidenType[] = ["出雲", "全日本", "箱根"]
                const lookup = new Map<string, { intervalName?: string; rank?: number; time?: string }>()
                raw.forEach((it: any) => {
                    const g = gradeMap[String(it.grade)] as number
                    const name = (it.ekidenId === 5 ? "出雲" : it.ekidenId === 4 ? "全日本" : it.ekidenId === 3 ? "箱根" : undefined) as EkidenType | undefined
                    if (!name || !g) return
                    lookup.set(`${g}-${name}`, { intervalName: it.intervalName, rank: typeof it.rank === "number" ? it.rank : undefined, time: typeof it.score === "number" ? formatSeconds(it.score) : undefined })
                })
                return (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "120px repeat(3, 1fr)", gap: 0, fontSize: 12, border: "3px solid #000", borderRadius: 6 }}>
                            <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", textAlign: "center" }}>年级</div>
                            <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", textAlign: "center" }}>出雲</div>
                            <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", textAlign: "center" }}>全日本</div>
                            <div style={{ padding: 6, fontWeight: 700, borderBottom: "1px solid #eee", textAlign: "center" }}>箱根</div>
                            {grades.map((g) => (
                                [
                                    <div key={`glabel-${g}`} style={{ padding: 6, borderTop: "1px solid #eee", textAlign: "center" }}>{gradeText(g as any)}</div>,
                                    ...cols.map((c) => {
                                        const rec = lookup.get(`${g}-${c}`)
                                        const text = rec?.intervalName ? `${rec.intervalName}${rec?.rank ? ` ${rec.rank}位` : ""}${rec?.time ? ` ${rec.time}` : ""}` : "—"
                                        return (
                                            <div key={`${g}-${c}`} style={{ padding: 6, borderTop: "1px solid #eee", textAlign: "center", background: cellBgRank(rec?.rank) }}>{text}</div>
                                        )
                                    })
                                ]
                            ))}
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}

export default StudentEkiden
