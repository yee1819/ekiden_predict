"use client";

import { useEffect, useState, useRef } from "react";
    import GithubSlugger from "github-slugger";

function findParentHelper(toc: TocItem[], item: TocItem): TocItem | null {
    const idx = toc.findIndex((t) => t.id === item.id);
    for (let i = idx - 1; i >= 0; i--) {
        if (toc[i].depth < item.depth) return toc[i];
    }
    return null;
}

function findSecondLevelHelper(toc: TocItem[], item: TocItem): TocItem | null {
    let parent = findParentHelper(toc, item);
    if (!parent) return item.depth === 2 ? item : null;
    while (parent) {
        if (parent.depth === 2) return parent;
        parent = findParentHelper(toc, parent);
    }
    return item.depth === 2 ? item : null;
}

interface TocItem {
    id: string;
    text: string;
    depth: number;
}

export default function TocSidebar({ toc }: { toc: TocItem[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [currentSecondLevelId, setCurrentSecondLevelId] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});
    const sectionRangesRef = useRef<{ id: string; start: number; end: number }[]>([]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const headings = Array.from(document.querySelectorAll(".prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6, h1, h2, h3, h4, h5, h6"));
        if (!headings.length) { sectionRangesRef.current = []; return; }

        const mapIdToEl = new Map<string, HTMLElement>();
        const slugger = new GithubSlugger();
        headings.forEach((el) => {
            const h = el as HTMLElement;
            const text = (h.textContent || "").trim();
            const key = h.id || slugger.slug(text);
            if (key) mapIdToEl.set(key, h);
        });

        const secondLevelItems = toc.filter((t) => t.depth === 2);
        const ranges: { id: string; start: number; end: number }[] = [];
        for (let i = 0; i < secondLevelItems.length; i++) {
            const item = secondLevelItems[i];
            const el = mapIdToEl.get(item.id);
            if (!el) continue;
            const start = el.offsetTop;
            let end = Number.POSITIVE_INFINITY;
            for (let j = i + 1; j < secondLevelItems.length; j++) {
                const nextEl = mapIdToEl.get(secondLevelItems[j].id);
                if (nextEl) { end = nextEl.offsetTop - 1; break; }
            }
            ranges.push({ id: item.id, start, end });
        }
        sectionRangesRef.current = ranges;
    }, [toc]);




    useEffect(() => {
        if (typeof document === 'undefined' || typeof window === 'undefined') return;
        const headings = Array.from(document.querySelectorAll(".prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6, h1, h2, h3, h4, h5, h6"));
        if (!headings.length) return;

        const handleScroll = () => {
            const scrollTop = window.scrollY + 100; // threshold for early activation

            // Active heading (deepest above threshold)
            let currentId: string | null = null;
            for (let i = headings.length - 1; i >= 0; i--) {
                const el = headings[i] as HTMLElement;
                if (el.offsetTop <= scrollTop) { currentId = el.id; break; }
            }
            if (currentId && currentId !== activeId) {
                setActiveId(currentId);
            }

            // Current second-level section range
            let currentSectionId: string | null = null;
            for (const r of sectionRangesRef.current) {
                if (scrollTop >= r.start && scrollTop <= r.end) { currentSectionId = r.id; break; }
            }
            // If the active heading belongs to a section, prefer that
            if (!currentSectionId && currentId) {
                const currentItem = toc.find((t) => t.id === currentId);
                const secondLevel = currentItem ? findSecondLevelHelper(toc, currentItem) : null;
                currentSectionId = secondLevel ? secondLevel.id : null;
            }
            setCurrentSecondLevelId(currentSectionId);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [toc, activeId]);

    useEffect(() => {
        if (activeId && itemRefs.current[activeId]) {
            itemRefs.current[activeId]!.scrollIntoView({
                block: "nearest",
                inline: "nearest",
                behavior: "smooth",
            });
        }
    }, [activeId]);

    const onTocClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        const el = document.getElementById(id);
        if (!el) return;

        const secondLevel = findSecondLevelHelper(toc, toc.find((t) => t.id === id)!);
        setCurrentSecondLevelId(secondLevel ? secondLevel.id : null);

        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${id}`);
    };

    const isVisible = (item: TocItem) => {
        if (item.depth <= 2) return true;
        const secondLevel = findSecondLevelHelper(toc, item);
        return secondLevel?.id === currentSecondLevelId;
    };

    // 获取层级对应的 CSS 类名
    const getLevelClass = (depth: number) => {
        switch (depth) {
            case 1:
                return "toc-h1";
            case 2:
                return "toc-h2";
            case 3:
                return "toc-h3";
            case 4:
                return "toc-h4";
            case 5:
                return "toc-h5";
            case 6:
                return "toc-h6";
            default:
                return "toc-default";
        }
    };
    // console.log(toc);

    return (
        <div
            ref={containerRef}
            className="toc-sidebar sticky top-20 max-h-[80vh] overflow-auto border-l pl-4 text-sm"
        >
            <style jsx>{`
                .toc-sidebar .toc-h1 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #e5e7eb;
                    color: #374151;
                }
                
                .toc-sidebar .toc-h1.active {
                    color: #2563eb;
                    border-bottom-color: #2563eb;
                    background-color: #eff6ff;
                }
                
                .toc-sidebar .toc-h2 {
                    font-size: 0.95rem;
                    font-weight: 600;
                    margin-left: 0.5rem;
                    margin-bottom: 0.5rem;
                    padding-left: 0.75rem;
                    border-left: 3px solid #3b82f6;
                    color: #4b5563;
                }
                
                .toc-sidebar .toc-h2.active {
                    color: #2563eb;
                    background-color: #eff6ff;
                    border-left-color: #2563eb;
                }
                
                .toc-sidebar .toc-h3 {
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-left: 1.5rem;
                    margin-bottom: 0.25rem;
                    padding-left: 0.75rem;
                    border-left: 2px solid #9ca3af;
                    color: #6b7280;
                }
                
                .toc-sidebar .toc-h3.active {
                    color: #2563eb;
                    background-color: #f3f4f6;
                    border-left-color: #60a5fa;
                }
                
                .toc-sidebar .toc-h4 {
                    font-size: 0.85rem;
                    font-weight: 400;
                    margin-left: 2.5rem;
                    margin-bottom: 0.25rem;
                    padding-left: 0.75rem;
                    border-left: 1px solid #d1d5db;
                    color: #9ca3af;
                }
                
                .toc-sidebar .toc-h4.active {
                    color: #2563eb;
                    background-color: #f9fafb;
                    border-left-color: #93c5fd;
                }
                
                .toc-sidebar .toc-h5,
                .toc-sidebar .toc-h6,
                .toc-sidebar .toc-default {
                    font-size: 0.8rem;
                    font-weight: 400;
                    margin-left: 3.5rem;
                    margin-bottom: 0.25rem;
                    padding-left: 0.75rem;
                    border-left: 1px dashed #d1d5db;
                    color: #9ca3af;
                }
                
                .toc-sidebar .toc-h5.active,
                .toc-sidebar .toc-h6.active,
                .toc-sidebar .toc-default.active {
                    /* color: #2563eb; */
                    /* background-color: #3fc5f6; */
                    color : white;
                    background-color: rgb(0, 196, 182);
                    border-left-color: #93c5fd;
                }


                .toc-sidebar .toc-h1.active,
                .toc-sidebar .toc-h2.active,
                .toc-sidebar .toc-h3.active,
                .toc-sidebar .toc-h4.active{
                    color : white;
                    background-color: rgb(0, 196, 182);
                }
                
                .toc-sidebar a {
                    display: block;
                    padding: 0.375rem 0.75rem;
                    /* border-radius: 0.375rem; */
                    transition: all 0.2s ease-in-out;
                }
                
                .toc-sidebar a:hover {
                    color: #2563eb;
                    background-color: #c5ff3d;
                }

                .toc-sidebar .toc-h3{
                    border-left-color: #f8ee2c;
                }
                .toc-sidebar .toc-h4{
                    border-left-color: #26f9d9;
                }
                .toc-sidebar .toc-h5{
                    border-left-color: #b565ff;
                }
                .toc-sidebar .toc-h6{
                    border-left-color: #ff6eff;
                }


            `}</style>

            <ul className="space-y-1">
                {toc.map((item) => {
                    const visible = isVisible(item);
                    const active = item.id === activeId;
                    const levelClass = getLevelClass(item.depth);

                    return (
                        <li
                            key={item.id}
                            ref={(el) => { itemRefs.current[item.id] = el; }}
                            style={{
                                opacity: visible ? 1 : 0,
                                height: visible ? "auto" : 0,
                                padding: visible ? "0" : 0,
                                margin: visible ? "0" : 0,
                                overflow: "hidden",
                                transition: "opacity 0.3s ease-in-out, height 0.3s ease-in-out",
                                // borderLeft:"1px solid red",
                            }}
                        >
                            <a
                                href={`#${item.id}`}
                                onClick={(e) => onTocClick(e, item.id)}
                                className={`${levelClass} ${active ? "active" : ""}`}

                            >
                                {item.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
