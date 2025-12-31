"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { Button, DatePicker, Form, Input, Select, Space, Table, Popconfirm, Switch } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import Link from 'next/link'
import type { PostCategory, PostStatus } from '@/app/generated/prisma/client'

type PostRecord = {
    slug: string
    title: string
    category: PostCategory
    status: PostStatus
    createdAt: number
    updatedAt: number
    lastEditedAt?: number
}

const categories: { label: string; value: PostCategory }[] = [
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

async function fetchList(): Promise<PostRecord[]> {
    const res = await fetch('/api/admin/posts')
    const data = await res.json()
    const items: PostRecord[] = (data || []).map((it: any) => ({
        slug: String(it.slug || ''),
        title: String(it.title || ''),
        category: String(it.Category || 'Other') as PostCategory,
        status: String(it.Status || 'Draft') as PostStatus,
        createdAt: it.createdAt ? new Date(it.createdAt).valueOf() : Date.now(),
        updatedAt: it.updatedAt ? new Date(it.updatedAt).valueOf() : Date.now(),
        lastEditedAt: it.lastEditedAt ? new Date(it.lastEditedAt).valueOf() : undefined,
    }))
    return items
}

function formatTime(ts?: number) {
    if (!ts) return '-'
    return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

function Page() {
    const [form] = Form.useForm()
    const [data, setData] = useState<PostRecord[]>([])
    useEffect(() => {
        fetchList().then(setData)
    }, [])
    const [filters, setFilters] = useState<{
        title?: string
        category?: PostCategory
        status?: 'all' | PostStatus
        createdRange?: any
        updatedRange?: any
    }>({ status: 'all' })

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            const titleOk = filters.title
                ? item.title.toLowerCase().includes(filters.title.toLowerCase())
                : true

            const categoryOk = filters.category ? item.category === filters.category : true

            const statusOk = filters.status && filters.status !== 'all' ? item.status === filters.status : true

            const createdOk = (() => {
                const r = filters.createdRange
                if (!r) return true
                const start = r?.[0] ? r[0]?.valueOf?.() ?? r[0] : -Infinity
                const end = r?.[1] ? r[1]?.valueOf?.() ?? r[1] : Infinity
                return item.createdAt >= start && item.createdAt <= end
            })()

            const updatedOk = (() => {
                const r = filters.updatedRange
                if (!r) return true
                const start = r?.[0] ? r[0]?.valueOf?.() ?? r[0] : -Infinity
                const end = r?.[1] ? r[1]?.valueOf?.() ?? r[1] : Infinity
                return item.updatedAt >= start && item.updatedAt <= end
            })()

            return titleOk && categoryOk && statusOk && createdOk && updatedOk
        })
    }, [data, filters])

    const columns: ColumnsType<PostRecord> = [
        {
            title: '文章名',
            dataIndex: 'title',
            key: 'title',
            render: (title: string, record) => <Link href={`/admin/post/${record.slug}`}>{title}</Link>,
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (v: number) => formatTime(v),
        },
        {
            title: '最后编辑时间',
            dataIndex: 'lastEditedAt',
            key: 'lastEditedAt',
            render: (v?: number) => (<span suppressHydrationWarning>{formatTime(v)}</span>),
        },
        {
            title: '分类',
            dataIndex: 'category',
            key: 'category',
            render: (c: PostCategory, record) => (
                <Select
                    options={categories}
                    value={c}
                    style={{ minWidth: 140 }}
                    onChange={async (val: PostCategory) => {
                        setData((prev) => prev.map((it) => (it.slug === record.slug ? { ...it, category: val } : it)))
                        try {
                            await fetch('/api/admin/posts', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ slug: record.slug, Category: val })
                            })
                        } catch {}
                    }}
                />
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (s: PostStatus, record) => (
                <Select
                    style={{ minWidth: 140 }}
                    value={s}
                    options={[
                        { label: '草稿', value: 'Draft' },
                        { label: '发布', value: 'Published' },
                        { label: '删除', value: 'Deleted' },
                        { label: '私密', value: 'Private' },
                    ]}
                    onChange={async (val: PostStatus) => {
                        setData((prev) => prev.map((it) => (it.slug === record.slug ? { ...it, status: val } : it)))
                        try {
                            await fetch('/api/admin/posts', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ slug: record.slug, Status: val })
                            })
                        } catch {}
                    }}
                />
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Popconfirm
                    title="确认删除该文章？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={async () => {
                        try {
                            const res = await fetch(`/api/admin/posts?slug=${encodeURIComponent(record.slug)}`, { method: 'DELETE' })
                            if (res.ok) setData((prev) => prev.filter((it) => it.slug !== record.slug))
                        } catch {}
                    }}
                >
                    <Button danger type="link">删除</Button>
                </Popconfirm>
            ),
        },
    ]

    return (
        <>
            <h1>文章列表</h1>
            <Space style={{ marginBottom: 16 }} wrap>
                <Form
                    form={form}
                    layout="inline"
                    onValuesChange={(_, values) => {
                        setFilters({
                            title: values.title,
                            category: values.category,
                            status: values.status ?? 'all',
                            createdRange: values.createdRange,
                            updatedRange: values.updatedRange,
                        })
                    }}
                >
                    <Form.Item name="title" label="文章名">
                        <Input placeholder="输入标题关键词" allowClear />
                    </Form.Item>
                    <Form.Item name="category" label="分类">
                        <Select
                            allowClear
                            options={categories}
                            style={{ minWidth: 140 }}
                            placeholder="选择分类"
                        />
                    </Form.Item>
                    <Form.Item name="status" label="状态" initialValue="all">
                        <Select
                            style={{ minWidth: 120 }}
                            options={[
                                { label: '全部', value: 'all' },
                                { label: '草稿', value: 'Draft' },
                                { label: '发布', value: 'Published' },
                                { label: '删除', value: 'Deleted' },
                                { label: '私密', value: 'Private' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="createdRange" label="创建时间">
                        <DatePicker.RangePicker />
                    </Form.Item>
                    <Form.Item name="updatedRange" label="最后编辑时间">
                        <DatePicker.RangePicker />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button
                                onClick={() => {
                                    form.resetFields()
                                    setFilters({ status: 'all' })
                                }}
                            >
                                重置
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
                <Link href="/admin/post/new">
                    <Button type="primary">添加文章</Button>
                </Link>
            </Space>
            <Table rowKey="slug" columns={columns} dataSource={filteredData} pagination={{ pageSize: 8 }} />
        </>
    )
}

export default Page
