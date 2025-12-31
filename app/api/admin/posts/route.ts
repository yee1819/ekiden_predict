import { NextRequest } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { headers } from "next/headers"
import { auth } from "@/app/lib/auth"
import type { PostCategory, PostStatus, ImageLayout } from "@/app/generated/prisma/client"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  const id = searchParams.get("id")
  if (slug) {
    const item = await prisma.post.findFirst({ where: { slug } })
    return new Response(JSON.stringify(item ?? null), { status: 200, headers: { "Content-Type": "application/json" } })
  }
  if (id) {
    const item = await prisma.post.findUnique({ where: { id: Number(id) } })
    return new Response(JSON.stringify(item ?? null), { status: 200, headers: { "Content-Type": "application/json" } })
  }
  const list = await prisma.post.findMany({ orderBy: { updatedAt: "desc" } })
  return new Response(JSON.stringify(list), { status: 200, headers: { "Content-Type": "application/json" } })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
  const body = await req.json()
  const payload = {
    slug: String(body.slug || ""),
    title: String(body.title || ""),
    content: body.content == null ? null : String(body.content),
    excerpt: body.excerpt == null ? null : String(body.excerpt),
    image: body.image == null ? null : String(body.image),
    layout: String(body.layout || 'None') as ImageLayout,
    published: body.published === true,
    wordCount: Number(body.wordCount2 ?? body.wordCount ?? 0),
    Status: String(body.Status) as PostStatus,
    Category: String(body.Category) as PostCategory,
    authorId: body.authorId ? String(body.authorId) : null,
    lastEditedAt: new Date(),
  }
  await prisma.post.create({ data: payload })
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
  const body = await req.json()
  const slug = body.slug ? String(body.slug) : undefined
  const id = body.id != null ? Number(body.id) : undefined
  const data: any = {}
  if (body.title != null) data.title = String(body.title)
  if (body.content != null) data.content = body.content == null ? null : String(body.content)
  if (body.excerpt != null) data.excerpt = body.excerpt == null ? null : String(body.excerpt)
  if (body.image !== undefined) data.image = body.image == null ? null : String(body.image)
  if (body.layout != null) data.layout = String(body.layout) as ImageLayout
  if (body.published != null) data.published = body.published === true
  if (body.wordCount2 != null) data.wordCount = Number(body.wordCount2)
  else if (body.wordCount != null) data.wordCount = Number(body.wordCount)
  if (body.Status != null) data.Status = String(body.Status) as PostStatus
  if (body.Category != null) data.Category = String(body.Category) as PostCategory
  if (body.authorId !== undefined) data.authorId = body.authorId ? String(body.authorId) : null
  if (id != null) {
    if (body.content !== undefined) {
      const existing = await prisma.post.findUnique({ where: { id } })
      const nextContent = body.content == null ? null : String(body.content)
      if (existing && existing.content !== nextContent) data.lastEditedAt = new Date()
    }
    await prisma.post.update({ where: { id }, data })
  } else if (slug) {
    const found = await prisma.post.findFirst({ where: { slug } })
    if (!found) return new Response(JSON.stringify({ ok: false, error: "not found" }), { status: 404 })
    if (body.content !== undefined) {
      const nextContent = body.content == null ? null : String(body.content)
      if (found.content !== nextContent) data.lastEditedAt = new Date()
    }
    await prisma.post.update({ where: { id: found.id }, data })
  } else {
    return new Response(JSON.stringify({ ok: false, error: "missing id or slug" }), { status: 400 })
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get("slug")
  const id = searchParams.get("id")
  if (id) {
    await prisma.post.delete({ where: { id: Number(id) } })
  } else if (slug) {
    const found = await prisma.post.findFirst({ where: { slug } })
    if (!found) return new Response(JSON.stringify({ ok: false, error: "not found" }), { status: 404 })
    await prisma.post.delete({ where: { id: found.id } })
  } else {
    return new Response(JSON.stringify({ ok: false, error: "missing id or slug" }), { status: 400 })
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })
}
