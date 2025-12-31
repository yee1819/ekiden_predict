import React from 'react'
import { prisma } from '@/app/lib/prisma'
import RscMDX from '@/app/components/rscMDX'
// import { BlogCard } from '@/app/components/topImg'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
    HaKoNe: '箱根',
    ZenNiHon: '全日本',
    IZuMo: '出雲',
    KouKou: '高中',
    AoYaMa: '青山',
    Joshi: '女子',
    KouKouJoshi: '高中女子',
    Other: '其他',
    ThInterval: '场地赛',
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = await prisma.post.findFirst({ where: { slug } })
    if (!post || post.Status !== 'Published' || post.published !== true) {
        return <div style={{ padding: 16 }}>未找到文章或不可公开访问</div>
    }
    const date = post.createdAt ? new Date(post.createdAt).toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
    const edited = post.lastEditedAt ? new Date(post.lastEditedAt).toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
    return (
        <>
            <div id="top" />

            <div style={{ maxWidth: 1100, margin: '16px auto', paddingLeft: 12 }}>
                <h1 style={{ fontSize: 48, fontWeight: 700, margin: 0, textAlign: 'left' }}>{post.title}</h1>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                    <Link href="/post" style={{ color: '#1677ff', fontSize: 13 }}>返回列表</Link>
                    <Link href={`/post?category=${CATEGORY_LABELS[post.Category] || post.Category}`} style={{ fontSize: 12, color: '#666' }}>分类：{CATEGORY_LABELS[post.Category] || post.Category}</Link>
                    <span style={{ fontSize: 12, color: '#666' }}>创建：{date}</span>
                    <span style={{ fontSize: 12, color: '#666' }}>字数：{post.wordCount}</span>
                    <span style={{ fontSize: 12, color: '#666' }}>预计阅读：{Math.max(1, Math.ceil((post.wordCount || 0) / 300))} 分钟</span>
                </div>
            </div>
            <div style={{ maxWidth: 1400, margin: '0 auto', paddingLeft: 12 }}>
                <RscMDX content={post.content || ''} />
            </div>
            <div style={{ maxWidth: 1100, margin: '24px auto', padding: '12px 12px', color: '#555' }}>
                <hr style={{ margin: '16px 0' }} />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link href={`/post?category=${CATEGORY_LABELS[post.Category] || post.Category}`} style={{ fontSize: 12 }}>分类：{CATEGORY_LABELS[post.Category] || post.Category}</Link>
                    <span style={{ fontSize: 12 }}>创建：{date}</span>
                    <span style={{ fontSize: 12 }}>最后编辑于：{edited || '-'}</span>
                    <span style={{ fontSize: 12 }}>字数：{post.wordCount}</span>
                </div>
            </div>
            <footer style={{ width: '100%', borderTop: '1px solid #eee', marginTop: 24 }}>
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/post" style={{ color: '#1677ff' }}>返回文章列表</Link>
                    <span style={{ fontSize: 12, color: '#777' }}>© 2025 Hakone Yuce</span>
                </div>
            </footer>
            <a href="#top" style={{ position: 'fixed', right: 24, bottom: 120, background: '#1677ff', color: '#fff', borderRadius: 9999, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>回到顶部</a>
        </>
    )
}
