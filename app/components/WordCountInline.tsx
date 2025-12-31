"use client"
/***
 * 没啥用的
 */

import { useEffect, useState } from "react"
import { compile } from "@mdx-js/mdx"
import * as jsxRuntime from "react/jsx-runtime"
import { renderToStaticMarkup } from "react-dom/server"
import { convert } from "html-to-text"

export default function WordCountInline({ content, showReadingTime = false, className, spanStyle }: { content: string; showReadingTime?: boolean; className?: string; spanStyle?: React.CSSProperties }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const code = String(await compile(content || "", { outputFormat: "function-body" }))
        const fn = new Function("jsxRuntime", `${code}; return { default: MDXContent };`)
        const { default: Component } = fn({ ...jsxRuntime, Fragment: jsxRuntime.Fragment })
        const html = renderToStaticMarkup(Component({}))
        const plain = convert(html, { wordwrap: false })
        const n = (plain.match(/[\u4e00-\u9fff\u3040-\u30ff]|[a-zA-Z]|[0-9]/gi) || []).length
        if (!cancelled) setCount(n)
      } catch {
        if (!cancelled) setCount(0)
      }
    })()
    return () => { cancelled = true }
  }, [content])
  const readMin = Math.max(1, Math.ceil(count / 300))
  return (
    <span className={className} style={spanStyle}>
      <span style={spanStyle}>字数：{count}</span>
      {showReadingTime ? <span style={{ marginLeft: 12, ...spanStyle }}>预计阅读：{readMin} 分钟</span> : null}
    </span>
  )
}

