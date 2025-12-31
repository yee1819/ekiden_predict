"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { compile } from '@mdx-js/mdx'
import * as jsxRuntime from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import { convert } from 'html-to-text'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import { Button, Form, Input, Select, Space, message } from 'antd'
import type { PostCategory, PostStatus } from '@/app/generated/prisma/client'
import type { ImageLayout } from '@/app/generated/prisma/client'
import MDXCSR from '@/app/components/mdxCSR'
import { useParams } from 'next/navigation'

type FormValues = {
  slug?: string
  title?: string
  content?: string
  excerpt?: string
  image?: string
  layout?: ImageLayout
  published?: boolean
  Status?: PostStatus
  Category?: PostCategory
  authorId?: string
}

const categoryOptions: { label: string; value: PostCategory }[] = [
  { label: '箱根', value: 'HaKoNe' },
  { label: '全日本', value: 'ZenNiHon' },
  { label: '出雲', value: 'IZuMo' },
  { label: '高中', value: 'KouKou' },
  { label: '青山', value: 'AoYaMa' },
  { label: '女子', value: 'Joshi' },
  { label: '高中女子', value: 'KouKouJoshi' },
  { label: '其他', value: 'Other' },
  { label: '场地赛', value: 'ThInterval' },
]

const statusOptions: { label: string; value: PostStatus }[] = [
  { label: '草稿', value: 'Draft' },
  { label: '发布', value: 'Published' },
  { label: '删除', value: 'Deleted' },
  { label: '私密', value: 'Private' },
]

function Page() {
  const [form] = Form.useForm<FormValues>()
  const [content, setContent] = useState<string>("")
  const params = useParams() as { slug?: string }
  const slugParam = params?.slug ? String(params.slug) : undefined

  const [wordCount, setWordCount] = useState<number>(0)



  const [wordCount2, setWordCount2] = useState<number>(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const code = String(
          await compile(content || '', {
            outputFormat: 'function-body',
            remarkPlugins: [remarkGfm, remarkMath],
            rehypePlugins: [rehypeKatex, rehypePrettyCode],
          })
        )
        const fn = new Function('jsxRuntime', `${code}; return { default: MDXContent };`)
        const { default: Component } = fn({ ...jsxRuntime, Fragment: jsxRuntime.Fragment })
        const html = renderToStaticMarkup(Component({}))
        const plain = convert(html, { wordwrap: false })
        const n = (plain.match(/[\u4e00-\u9fff\u3040-\u30ff]|[a-zA-Z]|[0-9]/gi) || []).length
        if (!cancelled) setWordCount(n)
      } catch {
        if (!cancelled) setWordCount(0)
      }
    })()
    return () => { cancelled = true }
  }, [content])

  useEffect(() => {
    async function load() {
      if (!slugParam) return
      const res = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slugParam)}`)
      if (!res.ok) return
      const data = await res.json()
      if (!data) return
      form.setFieldsValue({
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt ?? undefined,
        image: data.image ?? undefined,
        layout: data.layout ?? 'None',
        Status: data.Status,
        Category: data.Category,
        authorId: data.authorId ?? undefined,
      })
      setContent(data.content ?? '')
    }
    load()
  }, [slugParam])

  async function onSubmit() {
    const v = form.getFieldsValue()
    const payload = { ...v, slug: slugParam ?? v.slug, content, wordCount2, published: v.Status === 'Published' }
    const res = await fetch('/api/admin/posts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (res.ok) {
      message.success('已保存')
    } else {
      message.error('保存失败')
    }
  }

  return (
    <>
      <h1>编辑文章</h1>
      <Space orientation="vertical" style={{ width: '100%', marginTop: 12 }} size={12}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(200px, 1fr))', gap: 12 }}>
            <Form.Item name="slug" label="Slug" rules={[{ required: true, message: '请输入唯一的 slug' }]}>
              <Input placeholder="例如 hakone-preview-2025" />
            </Form.Item>
            <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
              <Input placeholder="文章标题" />
            </Form.Item>
            <Form.Item name="Status" label="发布状态" rules={[{ required: true, message: '请选择发布状态' }]}>
              <Select options={statusOptions} style={{ minWidth: 180 }} placeholder="选择状态" />
            </Form.Item>
            <Form.Item name="Category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
              <Select options={categoryOptions} style={{ minWidth: 220 }} placeholder="选择分类" />
            </Form.Item>
          </div>
          <Form.Item name="image" label="封面图片">
            <Input placeholder="图片 URL（可选）" />
          </Form.Item>
          <Form.Item name="layout" label="图片布局">
            <Select
              options={[
                { label: '顶部', value: 'Top' },
                { label: '左侧', value: 'Left' },
                { label: '右侧', value: 'Right' },
                { label: '无图', value: 'None' },
              ]}
              style={{ minWidth: 160 }}
              placeholder="选择布局"
            />
          </Form.Item>
          <Form.Item name="excerpt" label="摘要">
            <Input.TextArea placeholder="用于列表与SEO的简短摘要" autoSize={{ minRows: 2, maxRows: 6 }} />
          </Form.Item>
          <Form.Item name="authorId" label="作者ID">
            <Input placeholder="作者用户ID（可选）" style={{ minWidth: 220 }} />
          </Form.Item>
          <Form.Item label="字数统计">
            <div>{wordCount}</div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
          </Form.Item>
        </Form>

        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>正文</div>
          <MDXCSR text={content} onTextChange={setContent}  setWordCount2={setWordCount2}  wordCount2={wordCount2} />
        </div>
      </Space>
    </>
  )
}

export default Page
