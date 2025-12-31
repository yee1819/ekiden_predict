"use client";
import { useEffect } from "react";

export default function MDXCodeEnhancer() {
    useEffect(() => {
        // 选取所有 code 块
        const blocks = document.querySelectorAll("pre > code");

        blocks.forEach((codeEl) => {
            const pre = codeEl.parentElement;
            if (!pre) return;

            // 避免重复添加
            if (pre.querySelector(".code-copy-btn")) return;

            // 创建按钮
            const button = document.createElement("button");
            button.innerText = "复制";
            button.className =
                "code-copy-btn absolute top-2 right-2 text-xs bg-gray-800 text-white rounded px-2 py-1 hover:bg-gray-700 transition";

            // 复制逻辑
            button.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(codeEl.textContent || "");
                    button.innerText = "已复制!";
                    setTimeout(() => (button.innerText = "复制"), 1500);
                } catch (err) {
                    button.innerText = "失败";
                    console.error("复制失败:", err);
                }
            });

            // 让 pre 相对定位，好放按钮
            pre.style.position = "relative";
            pre.appendChild(button);
        });
    }, []);

    return null;
}
