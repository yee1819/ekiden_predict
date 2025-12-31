// src/utils/RscCompileMDX.tsx
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import GithubSlugger from "github-slugger";
import { visit } from "unist-util-visit";
import MyButton from "@/app/components/mdx/button";
import type { Element } from "hast";



import { transformerNotationDiff, transformerNotationHighlight, transformerRenderWhitespace } from '@shikijs/transformers';

let currentStartLine = 0;
/** @type {import('rehype-pretty-code').Options} */
const options = {

    grid: false, // Use CSS grid instead of flexbox for layout
    // See Options section below.
    // theme: "github-dark",
    // theme: "one-dark-pro",
    theme: "vitesse-light",
    // theme: "github-light",
    defaultLang: "plaintext",
    // keepBackground: false,  


    transformers: [
        transformerNotationHighlight(),
        transformerRenderWhitespace(),
        transformerNotationDiff({
            matchAlgorithm: 'v3',  // 可选，推荐 v3
        }),
        // {
        //     name: "add-copy-button",
        //     // 在 <pre> 节点结束时追加一个 button（无 onclick）
        //     pre(node: any) {
        //         node.children.push({
        //             type: "element",
        //             tagName: "button",
        //             properties: {
        //                 className: ["copy-btn"],
        //                 type: "button",
        //                 "aria-label": "复制代码",
        //                 // 不要写 onclick！不要写 onclick！不要写 onclick！
        //             },
        //             children: [{ type: "text", value: "复制" }],

        //         });

        //     },
        // },
        {
            name: "add-line-number",

            line(node: any, lineIndex: number) {
                node.properties ??= {};
                node.properties["data-line-number"] = currentStartLine == 0 ? lineIndex : currentStartLine + lineIndex - 1;
            },

        }

    ],

    /**
     * 在 meta 字符串里提取行号信息
     */
    filterMetaString(meta: string) {
        const startMatch = meta.match(/data-line-start="(\d+)"/);
        if (startMatch) {
            currentStartLine = parseInt(startMatch[1], 10);
        } else {
            currentStartLine = 0;
        }
        return meta; // 保留原 meta
    },

    /**
     * 在 <pre> 节点创建时保存 data-line-start 属性
     */
    onVisitPre(node: Element) {
        node.properties ??= {};
        node.properties["data-line-start"] = currentStartLine;
    },

    /**
     * 每一行访问时
     */
    onVisitLine(node: Element, lineIndex: string, parent: any) {
        // parent 可能 undefined，所以我们直接使用 currentStartLine
        const start = currentStartLine || 1;
        node.properties ??= {};
        node.properties["data-line-number"] = start + lineIndex;
    },







};


export default async function serializeMDX(content: string) {
    try {
        const toc: any[] = [];

        const slugger = new GithubSlugger();

        const { content: mdxContent } = await compileMDX({
            source: content,
            options: {
                parseFrontmatter: true,
                mdxOptions: {
                    remarkPlugins: [
                        remarkGfm,
                        remarkMath,
                        /**
                         * 原来的扁平化 TOC 插入和 ID 添加插件
                         * 
                         * 
                         *  */
                        () => (tree: any) => {
                            visit(tree, "heading", (node: any) => {
                                const text = node.children
                                    .filter((c: any) => c.type === "text" || c.type === "inlineCode")
                                    .map((c: any) => c.value)
                                    .join(" ");
                                const id = slugger.slug(text);
                                toc.push({ depth: node.depth, text, id });
                                node.data = { hProperties: { id } };
                            });
                        },

                        /**
                         * 嵌套化 TOC 插入和 ID 添加插件
                         */
                        // () => (tree: any) => {
                        //     const stack: any[] = [{ children: toc }]; // 根节点，绑定到外部 toc
                        //     visit(tree, "heading", (node: any) => {
                        //         const text = node.children
                        //             .filter((c: any) => c.type === "text" || c.type === "inlineCode")
                        //             .map((c: any) => c.value)
                        //             .join(" ");
                        //         const id = slugger.slug(text);
                        //         const newNode = { depth: node.depth, text, id, children: [] };
                        //         // 找到正确的父节点
                        //         while (stack.length > 1 && stack[stack.length - 1].depth >= node.depth) {
                        //             stack.pop();
                        //         }
                        //         // 添加到父节点的 children
                        //         stack[stack.length - 1].children.push(newNode);
                        //         // 压入栈
                        //         stack.push(newNode);
                        //         // 设置 HTML 属性
                        //         node.data = { hProperties: { id } };
                        //     });
                        // }
                        // 不需要返回 toc，tree 会被修改
                    ],
                    rehypePlugins: [rehypeKatex, [rehypePrettyCode, options]],
                },
            },
            components: { MyButton },
        });

        return { source: mdxContent, toc };
    } catch (err: any) {
        return { error: err };
    }
}
