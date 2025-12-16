"use client"
import { useEffect, useState } from "react"
import { Modal } from "antd"

export default function FirstVisitNotice() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try {
      const key = "hakone_first_visit_notice_shown"
      const v = localStorage.getItem(key)
      if (!v) setOpen(true)
    } catch {}
  }, [])
  function onOk() {
    try { localStorage.setItem("hakone_first_visit_notice_shown", "1") } catch {}
    setOpen(false)
  }
  return (
    <Modal open={open} onOk={onOk} onCancel={onOk} okText="知道了" cancelText="取消">
      <div>数据手动添加，可能会出现错漏，勿怪</div>
    </Modal>
  )
}

