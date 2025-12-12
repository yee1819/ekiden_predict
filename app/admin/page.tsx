"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/app/lib/auth-client"

export default function AdminHome() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  useEffect(() => {
    if (!isPending && !session) router.replace("/login")
  }, [isPending, session])
  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 700 }}>管理后台</h1>
      <p style={{ marginTop: 8 }}>在左侧选择需要管理的数据类型，进行增删查改。</p>
    </div>
  )
}
