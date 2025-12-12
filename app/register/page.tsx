"use client"
import { useState, useEffect } from "react"
import { Input, Button, message } from "antd"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUp, useSession } from "@/app/lib/auth-client"

export default function Page() {
    const router = useRouter()
    const { data: session } = useSession()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (session) router.replace("/admin")
    }, [session])
    async function onSubmit() {
        if (!email || !password || !name) { message.error("请填写邮箱、密码和昵称"); return }
        setLoading(true)
        const { error } = await signUp.email({ email, password, name })
        setLoading(false)
        if (error) { message.error(error.message || "注册失败"); return }
        router.replace("/admin")
    }
    return (
        <div style={{ maxWidth: 360 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>管理员注册</h1>
            <div style={{ display: "grid", gap: 12 }}>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="昵称" />
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱" />
                <Input.Password value={password} onChange={e => setPassword(e.target.value)} placeholder="密码" />
                <Button type="primary" onClick={onSubmit} loading={loading}>注册</Button>
                <div>
                    已有账号？<Link href="/admin/login">登录</Link>
                </div>
            </div>
        </div>
    )
}
