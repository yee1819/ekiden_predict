"use client"
import { useEffect, useState, useCallback, useRef } from "react"
import { FloatButton, Drawer, ColorPicker, Select, Button, Slider } from "antd"
import { SettingOutlined } from "@ant-design/icons"

export default function AppearanceSettings({ fontSansClass, fontMonoClass, currentFont, onFontChange }: { fontSansClass: string, fontMonoClass: string, currentFont?: string, onFontChange?: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [bgColor, setBgColor] = useState<string>(() => {
    try { return localStorage.getItem("hakone_bg_color") || "" } catch { return "" }
  })
  const [bgImage, setBgImage] = useState<string>(() => {
    try { return localStorage.getItem("hakone_bg_image") || "" } catch { return "" }
  })
  const [font, setFont] = useState<string>(() => {
    return currentFont ?? (() => { try { return localStorage.getItem("hakone_font") || "sans" } catch { return "sans" } })()
  })
  const [panelOpacity, setPanelOpacity] = useState<number>(() => {
    try { return Number(localStorage.getItem("hakone_panel_opacity") || "0.92") } catch { return 0.92 }
  })
  const fileRef = useRef<HTMLInputElement | null>(null)
  const apply = useCallback(({ color, image }: { color: string, image: string }) => {
    try {
      const root = document.documentElement
      if (color) root.style.setProperty("--background", color)
      if (!color) root.style.removeProperty("--background")
      const body = document.body
      if (image) {
        body.style.backgroundImage = `url(${image})`
        body.style.backgroundSize = "cover"
        body.style.backgroundAttachment = "fixed"
        body.style.backgroundRepeat = "no-repeat"
      } else {
        body.style.backgroundImage = "none"
      }
      if (!body.classList.contains(fontSansClass)) body.classList.add(fontSansClass)
      if (!body.classList.contains(fontMonoClass)) body.classList.add(fontMonoClass)
    } catch { }
  }, [fontSansClass, fontMonoClass])
  useEffect(() => {
    apply({ color: bgColor, image: bgImage })
  }, [bgColor, bgImage, font, apply])
  useEffect(() => {
    try { document.documentElement.style.setProperty("--panel-opacity", String(panelOpacity)) } catch { }
  }, [panelOpacity])
  function onChangeColor(c: { toHexString?: () => string }) {
    const v = c?.toHexString?.() || ""
    setBgColor(v)
    try { localStorage.setItem("hakone_bg_color", v) } catch { }
  }
  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || "")
      setBgImage(dataUrl)
      try { localStorage.setItem("hakone_bg_image", dataUrl) } catch { }
    }
    reader.readAsDataURL(file)
  }
  function clearImage() {
    setBgImage("")
    try { localStorage.removeItem("hakone_bg_image") } catch { }
  }
  function onChangePanelOpacity(v: number) {
    setPanelOpacity(v)
    try { localStorage.setItem("hakone_panel_opacity", String(v)) } catch { }
  }
  function onChangeFont(v: string) {
    setFont(v)
    if (onFontChange) onFontChange(v)
    try { localStorage.setItem("hakone_font", v) } catch { }
  }
  return (
    <>
      <FloatButton icon={<SettingOutlined />} type="primary" style={{ right: 24, bottom: 24 }} onClick={() => setOpen(true)} />
      <Drawer title="外观设置" open={open} onClose={() => setOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ marginBottom: 8 }}>背景颜色</div>
            <ColorPicker value={bgColor} onChange={onChangeColor} />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>背景图片 文件上传</div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />
            <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed #999", borderRadius: 8, padding: 16, textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.6)" }}>
              <div style={{ fontSize: 14 }}>点击选择图片</div>
              <div style={{ fontSize: 12, color: "#666" }}>仅本地生效</div>
            </div>
            {bgImage && (
              <div style={{ marginTop: 8 }}>
                <img src={bgImage} alt="预览" style={{ maxWidth: "100%", borderRadius: 8 }} />
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Button onClick={clearImage}>清除背景图片</Button>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>板块不透明度</div>
            <Slider min={0.3} max={1} step={0.01} value={panelOpacity} onChange={onChangePanelOpacity} />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>字体选择</div>
            <Select value={font} onChange={onChangeFont} style={{ width: 200 }} options={[{ value: "sans", label: "默认" }, { value: "mono", label: "霞鹜文楷" }]} />
          </div>
        </div>
      </Drawer>
    </>
  )
}
