"use client"

import React, { Suspense, useEffect, useMemo, useState } from "react"
import { Form, Input, Select, DatePicker } from "antd"
import Link from "next/link"
import { BlogCard } from "@/app/components/topImg"
import { useSearchParams } from "next/navigation"

type PostItem = {
  slug: string
  title: string
  Category: string
  createdAt: string
  Status: string
  published: boolean
  excerpt?: string
  wordCount?: number
  image?: string
  layout?: string
}

type ValueLike = { valueOf?: () => number } | number | Date | null | undefined
type Range = [ValueLike, ValueLike]

const CATEGORY_LABELS: Record<string, string> = {
  HaKoNe: "箱根",
  ZenNiHon: "全日本",
  IZuMo: "出雲",
  KouKou: "高中",
  AoYaMa: "青山",
  Joshi: "女子",
  KouKouJoshi: "高中女子",
  Other: "其他",
  ThInterval: "场地赛",
}

const LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([code, label]) => [label, code])
)

const categoryOptions = [
  { label: "箱根", value: "HaKoNe" },
  { label: "全日本", value: "ZenNiHon" },
  { label: "出雲", value: "IZuMo" },
  { label: "高中", value: "KouKou" },
  { label: "青山", value: "AoYaMa" },
  { label: "女子", value: "Joshi" },
  { label: "高中女子", value: "KouKouJoshi" },
  { label: "其他", value: "Other" },
  { label: "场地赛", value: "ThInterval" },
]

function formatTime(s?: string) {
  if (!s) return "-"
  try {
    return new Date(s).toLocaleString("zh-CN", {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch { return s || "-" }
}

function PostPageInner() {
  const [form] = Form.useForm()
  const [list, setList] = useState<PostItem[]>([])
  const [filters, setFilters] = useState<{ title?: string; category?: string; createdRange?: Range | undefined }>({})
  const searchParams = useSearchParams()

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/post')
      const data: any[] = await res.json()
      const items: PostItem[] = (data || []).map((it: any) => ({
        slug: it.slug,
        title: it.title,
        Category: it.Category,
        createdAt: it.createdAt,
        Status: it.Status,
        published: it.published === true,
        excerpt: it.excerpt ?? '',
        wordCount: typeof it.wordCount === 'number' ? it.wordCount : undefined,
        image: it.image ?? undefined,
        layout: (it.layout ? String(it.layout).toLowerCase() : 'none'),
      }))
      setList(items)
    }
    load()
  }, [])

  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) {
      const code = LABEL_TO_CODE[cat] || cat
      form.setFieldsValue({ category: code })
      setTimeout(() => {
        setFilters((prev) => ({ ...prev, category: code }))
      }, 0)
    }
  }, [searchParams, form])

  const filtered = useMemo(() => {
    return list.filter((it) => {
      const titleOk = filters.title ? it.title.toLowerCase().includes(filters.title.toLowerCase()) : true
      const categoryOk = filters.category ? it.Category === filters.category : true
      const createdOk = (() => {
        const r = filters.createdRange
        if (!r) return true
        const start = r?.[0] ? (typeof r[0] === 'number' ? r[0] : r[0]?.valueOf?.() ?? new Date(r[0] as Date).valueOf()) : -Infinity
        const end = r?.[1] ? (typeof r[1] === 'number' ? r[1] : r[1]?.valueOf?.() ?? new Date(r[1] as Date).valueOf()) : Infinity
        const ts = new Date(it.createdAt).valueOf()
        return ts >= start && ts <= end
      })()
      const publishedOk = it.published && it.Status === 'Published'
      return titleOk && categoryOk && createdOk && publishedOk
    })
  }, [list, filters])

  return (
    <main className="bg-gray-50 py-10 px-6 text-gray-900 min-h-screen h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <Form form={form} layout="inline" onValuesChange={(_, values) => setFilters(values)} style={{ marginBottom: 16 }}>
          <Form.Item name="title" label="文章名">
            <Input placeholder="输入标题关键词" allowClear />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select allowClear options={categoryOptions} style={{ minWidth: 140 }} placeholder="选择分类" />
          </Form.Item>
          <Form.Item name="createdRange" label="创建时间">
            <DatePicker.RangePicker />
          </Form.Item>
        </Form>

        <div className="space-y-4">
          {filtered.map((it) => (
            <Link key={it.slug} href={`/post/${it.slug}`} className="block">
              <BlogCard
                title={it.title}
                excerpt={it.excerpt}
                image={it.image}
                layout={it.layout}
                date={formatTime(it.createdAt)}
                wordCount={it.wordCount}
                category={CATEGORY_LABELS[it.Category] || it.Category}
              />
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 12 }}>加载中...</div>}>
      <PostPageInner />
    </Suspense>
  )
}
