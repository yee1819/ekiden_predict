import React from "react"
export const dynamic = "force-dynamic"
export const revalidate = 0
import { prisma } from "@/app/lib/prisma"
import { getIntervalsData } from "@/app/api/ekiden/hakone/intervals/route"
import IntervalClientView from "./IntervalClientView"
import { cacheKey } from "@/app/lib/public-cache"
import fs from "fs/promises"
import path from "path"

export default async function Page({ params }: { params: Promise<{ th: string }> }) {
    const { th } = await params
    const thNum = Number(th)
    if (!Number.isFinite(thNum)) {
        return <div style={{ padding: 16 }}>参数错误</div>
    }

    const key = cacheKey("ekiden-hakone-interval", { th: thNum })
    const dir = path.join(process.cwd(), "public", "data")
    const file = path.join(dir, `${key}.json`)
    let cached: any = null
    try {
        const txt = await fs.readFile(file, "utf-8")
        cached = JSON.parse(txt)
    } catch { }

    if (cached) {
        return (
            <main className="bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto py-10 px-6">
                    <h1 className="text-2xl font-bold mb-6 text-center">
                        箱根驿传 第{cached.thEntry.ekiden_th}届（{cached.thEntry.year}）
                    </h1>
                    <IntervalClientView data={cached.data} year={cached.thEntry.year} />
                </div>
            </main>
        )
    }

    const thEntry = await prisma.ekiden_th.findFirst({
        where: {
            ekiden_th: thNum,
            OR: [
                { ekiden: { is: { name: { contains: "箱根" } } } },
                { ekiden: { is: { name: { contains: "Hakone" } } } },
            ],
        },
        include: { ekiden: true },
    })
    if (!thEntry) {
        return <div style={{ padding: 16 }}>未找到该届箱根驿传</div>
    }

    const data = await getIntervalsData(thEntry.id)
    try {
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(file, JSON.stringify({
            thEntry: { ekiden_th: thEntry.ekiden_th, year: thEntry.year },
            data
        }))
    } catch { }

    return (
        <main className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto py-10 px-6">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    箱根驿传 第{thEntry.ekiden_th}届（{thEntry.year}）
                </h1>
                <IntervalClientView data={data as any} year={thEntry.year} />
            </div>
        </main>
    )
}
