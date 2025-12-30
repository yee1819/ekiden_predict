'use client'

import Link from "next/link"
import { message } from "antd"

export default function Home() {
  const year = 102
  const links = [
    { title: "区间分配", desc: "制定10个区间排兵布阵与时间预测", href: `/predict/hakone/${year}` },
    { title: "预测结果", desc: "浏览各位驿传粉丝的完整预测阵容", href: `/predict/hakone/${year}/result` },
    { title: "最终名单替换", desc: "根据首发名单进行替补更替", href: `/predict/hakone/${year}/finalPredict` },

    { title: "最终名单预测结果", desc: "查看所有用户的替换名单", href: `/predict/hakone/${year}/finalPredictSummary` },

    { title: "预测排名", desc: "查看十区间分配的预测排名页面", href: `/predict/hakone/${year}/result/rank` },
    { title: "选手PB榜", desc: "按5000/10000/半马查看PB", href: `/predict/hakone/${year}/pb/student` },
    { title: "学校PB榜", desc: "各校PB统计与对比", href: `/predict/hakone/${year}/pb/school` },
    { title: "比赛结果", desc: "本届比赛结果", href: `/ekiden/hakone/${year}/result`, isDisabled: true },
    { title: "比赛排名", desc: "本届比赛各种数据排名", href: `/ekiden/hakone/${year}/rank`, isDisabled: true },
    { title: "各个区间排名", desc: "查看每个区间的排名", href: `/ekiden/hakone/${year}/interval`, isDisabled: true }
    // { title: "预测汇总", desc: "本届整体预测与时间汇总", href: `/predict/hakone/${year}/summary` },
  ]
  return (
    <div style={{ minHeight: "100vh", background: "#f6f7fb" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>箱根驿传  数据导航</h1>
          <span style={{ fontSize: 14, color: "#666" }}>第{year}回</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {links.map((it, idx) => (
            it.isDisabled ? (
              <div
                key={idx}
                onClick={() => message.info("该功能尚未开发完成")}
                style={{ textDecoration: "none", cursor: "not-allowed" }}
              >
                <div className="card disabled" style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fafafa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#999" }}>{it.title}</div>
                    <span style={{ fontSize: 12, color: "#999", border: "1px solid #ddd", borderRadius: 999, padding: "2px 8px" }}>开发中</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#999", marginTop: 6 }}>{it.desc}</div>
                  <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#bbb", color: "#fff" }}>即将上线</div>
                </div>
              </div>
            ) : (
              <Link key={idx} href={it.href} style={{ textDecoration: "none" }}>
                <div className="card" style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, background: "#fff" }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{it.title}</div>
                  <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>{it.desc}</div>
                  <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "#1677ff", color: "#fff" }}>进入</div>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>
      <style jsx>{`
        .card { transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease; }
        .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: #d0d7de; }
        .card.disabled:hover { transform: none; box-shadow: none; border-color: #e5e7eb; }
        @media (max-width: 768px) {
          h1 { font-size: 22px; }
        }
      `}</style>
    </div>
  )
}
