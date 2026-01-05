

import Link from "next/link";
import "@/app/styles/code.css";
import FirstVisitNotice from "@/app/components/FirstVisitNotice";
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const year = 102
    const izumoTH = 37
    const zennihonTH = 57
    const links = [

        { title: "箱根比赛结果", desc: "本届比赛结果", href: `/ekiden/hakone/${year}/result`, isDisabled: false },
        { title: "箱根比赛排名", desc: "本届比赛各种数据排名", href: `/ekiden/hakone/${year}/rank`, isDisabled: false },
        { title: "各种数据的排名", desc: "所有箱根数据的展示", href: `/ekiden/hakone/${year}/interval`, isDisabled: false },

        
        { title: "区间分配", desc: "制定10个区间排兵布阵与时间预测", href: `/predict/hakone/${year}` },
        { title: "预测结果", desc: "浏览各位驿传粉丝的完整预测阵容", href: `/predict/hakone/${year}/result` },
        { title: "最终名单替换", desc: "根据首发名单进行替补更替", href: `/predict/hakone/${year}/finalPredict` },
        { title: "最终名单预测结果", desc: "查看所有用户的替换名单", href: `/predict/hakone/${year}/finalPredictSummary` },
        { title: "预测排名", desc: "查看十区间分配的预测排名页面", href: `/predict/hakone/${year}/result/rank` },
        { title: "选手PB榜", desc: "按5000/10000/半马查看PB", href: `/predict/hakone/${year}/pb/student` },
        { title: "学校PB榜", desc: "各校PB统计与对比", href: `/predict/hakone/${year}/pb/school` },
        { title: "选手三大驿传", desc: "查看选手三大驿传", href: `/ekiden/hakone/${year}/threeEkiden` },
        { title: "出云总成绩", desc: "查看出云总成绩", href: `/ekiden/izumo/${izumoTH}/result` },
        { title: "出云驿传排行", desc: "查看出云驿传各种数据的排行", href: `/ekiden/izumo/${izumoTH}/rank` },
        { title: "全日本驿传总成绩", desc: "查看全日本总成绩", href: `/ekiden/zennihon/${zennihonTH}/result` },
        { title: "全日本驿传成绩排行", desc: "查看全日本驿传各种数据的排行", href: `/ekiden/zennihon/${zennihonTH}/rank` },


        { title: "箱根观察日志", desc: "网站开发箱根驿传的观察日志", href: `/post`, isDisabled: false }
    ]
    return (<>


        <FirstVisitNotice />
        <input id="navCollapse" type="checkbox" style={{ display: "none" }} />
        <div className="appShell">
            <aside className="sidebar">
                <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div className="navTitle" style={{ fontWeight: 800 }}>导航</div>
                        <span className="navBadge" style={{ fontSize: 12, color: "#666" }}>第{year}回</span>
                        <div style={{ flex: 1 }} />
                        <label className="label-collapse" htmlFor="navCollapse" style={{ fontSize: 12, padding: "4px 8px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", background: "#fff" }}>收起导航</label>
                    </div>
                    <div className="navList" style={{ display: "grid", gap: 8 }}>
                        {links.map((it, idx) => (
                            it.isDisabled ? (
                                <div key={idx} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10, background: "#fafafa", color: "#999" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                        <span style={{ fontWeight: 700 }}>{it.title}</span>
                                        <span className="navBadge" style={{ fontSize: 12, border: "1px solid #ddd", borderRadius: 999, padding: "2px 8px" }}>比赛未开始</span>
                                    </div>
                                    <div className="navDesc" style={{ fontSize: 12, marginTop: 4 }}>{it.desc}</div>
                                </div>
                            ) : (
                                <Link key={idx} href={it.href} style={{ textDecoration: "none" }}>
                                    <div className="navItem">
                                        <div style={{ fontWeight: 700 }}>{it.title}</div>
                                        <div className="navDesc" style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{it.desc}</div>
                                    </div>
                                </Link>
                            )
                        ))}
                    </div>
                </div>
            </aside>
            <main className="mainContent">
                {children}
            </main>
        </div>
        <label htmlFor="navCollapse" className="expandToggle">»»</label>

    </>
    );
}
