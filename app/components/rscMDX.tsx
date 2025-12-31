// src/utils/rscMDX.tsx

import serializeMDX from "./RscCompileMDX";
// import MDXCodeEnhancer from "./codeEnhancer";
import MDXCodeEnhancer2 from "./codeEnhancer2";

import "katex/dist/katex.min.css";

import TocSidebar from "./TocSidebar";
// import TocSidebarChildren from "@/utils/TocSideBarChildren";

export default async function GetPost({ content }: { content: string }) {
    const { source, toc, error }: any = await serializeMDX(content);
    // console.log("生成的嵌套 TOC:", toc);
    if (error) {
        return <p>解析失败: {String(error.message || error)}</p>;
    }

    // ✅ compileMDX 已经直接返回 ReactNode，可直接渲染
    return (
        // <div className="flex flex-row justify-center p-4 relative">
        //     {/* 主体内容区域 */}
        //     <div className="prose dark:prose-invert md:max-w-3xl w-full border rounded p-4">
        //         {source}
        //         <MDXCodeEnhancer />
        //     </div>

        //     {/* 右侧目录 */}
        //     <aside className="hidden lg:block w-64 ml-8">
        //         <TocSidebar toc={toc} />
        //     </aside>
        // </div>

        // <div className="flex gap-4 p-4 justify-center items-center ">
        /* <div className="p-2 border rounded prose md:max-w-3/5 mx-auto w-full dark:prose-invert bg-orange-100 prose-slate"> */

        <div className="flex gap-4 flex-row p-4 justify-center   relative">

            <div className="p-2 border rounded prose md:max-w-3/5  w-full dark:prose-invert bg-orange-100 prose-slate">

                {source}
                {/* <MDXCodeEnhancer></MDXCodeEnhancer>*/}
                <MDXCodeEnhancer2></MDXCodeEnhancer2>
            </div>

            {/* <ul>
                    {toc.map((item: any) => (
                        <li key={item.id} style={{ marginLeft: (item.depth - 1) * 12 }}>
                            <a href={`#${item.id}`} className="text-sm text-gray-700 hover:text-blue-600">
                                {item.text}
                            </a>
                        </li>
                    ))}
                </ul> */}
            <aside className="w-1/7  hidden lg:block w-64 ml-8">
                <TocSidebar toc={toc} />
                {/* <TocSidebarChildren toc={toc} /> */}
            </aside>

        </div>
    );
}
