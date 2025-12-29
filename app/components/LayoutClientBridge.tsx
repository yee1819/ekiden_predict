"use client"
import { useEffect, useState, useCallback } from "react"
import AppearanceSettings from "@/app/components/AppearanceSettings"

export default function LayoutClientBridge({ fontSansClass, fontMonoClass }: { fontSansClass: string, fontMonoClass: string }) {
  const [font, setFont] = useState<string>(() => {
    try { return localStorage.getItem("hakone_font") || "sans" } catch { return "sans" }
  })
  const applyFont = useCallback((f: string) => {
    try {
      const body = document.body
      body.style.fontFamily = f === "mono" ? "var(--font-app-mono)" : "var(--font-app-sans)"
    } catch { }
  }, [fontSansClass, fontMonoClass])
  useEffect(() => { applyFont(font) }, [font, applyFont])
  function onFontChange(v: string) {
    setFont(v)
    try { localStorage.setItem("hakone_font", v) } catch { }
  }
  return <AppearanceSettings fontSansClass={fontSansClass} fontMonoClass={fontMonoClass} currentFont={font} onFontChange={onFontChange} />
}
