"use client"
import { useState, useEffect } from "react"
import { Input, Button, message } from "antd"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "@/app/lib/auth-client"

export default function Page() {
    const router = useRouter()
    const { data: session } = useSession()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (session) router.replace("/admin")
    }, [session])
    async function onSubmit() {
        if (!email || !password) { message.error("请输入邮箱和密码"); return }
        setLoading(true)
        const { error } = await signIn.email({ email, password })
        setLoading(false)
        if (error) { message.error(error.message || "登录失败"); return }
        router.replace("/admin")
    }
    return (
        <div style={{ maxWidth: 360 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>管理员登录</h1>
            <div style={{ display: "grid", gap: 12 }}>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" />
                <Input.Password value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" />
                <Button type="primary" onClick={onSubmit} loading={loading}>登录</Button>
                <div>
                    没有账号？<Link href="/register">注册</Link>
                </div>
            </div>
        </div>
    )
}
