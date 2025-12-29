"use client"
import Link from "next/link"
import { useSession, signOut } from "@/app/lib/auth-client"
import { useRouter } from "next/navigation"
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session } = useSession()
  async function onSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.replace("/login"),
      }
    })
  }
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{ width: 220, borderRight: "1px solid #eee", padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Admin</div>
          <button onClick={onSignOut} style={{ padding: "4px 8px", border: "1px solid #ccc", borderRadius: 6 }}>退出</button>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>{session ? (session.user?.name || session.user?.email) : "未登录"}</div>
        <nav style={{ display: "grid", gap: 8 }}>
          <Link href="/admin">概览</Link>
          <Link href="/admin/ekiden">驿传</Link>
          <Link href="/admin/intervals">区间</Link>
          <Link href="/admin/editions">届数</Link>
          <Link href="/admin/schools">学校</Link>
          <Link href="/admin/students">学生</Link>
          <Link href="/admin/teams">队伍</Link>
          <Link href="/admin/ekiden-results">驿传成绩</Link>
          <Link href="/admin/starter-list">首发名单</Link>
        </nav>
      </aside>
      <main style={{ flex: 1, padding: 16 }}>{children}</main>
    </div>
  )
}
