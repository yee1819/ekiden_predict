"use client";
import { useState, useEffect, useRef } from "react";
import { compile } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import "katex/dist/katex.min.css";
// import MyLabel from "@/components/mdx/labelColor";
// import MyButton from "@/components/mdx/button";
// import { Button } from "@mantine/core";
import WordCount from "./wordCount";
import { Button } from "antd";
import MyButton from "@/app/components/mdx/button";
import type { Element } from "hast";

// import { renderToStaticMarkup } from 'react-dom/server';
// // import { compile as mdxCompile  } from '@mdx-js/mdx';
// import { convert } from 'html-to-text';
import { transformerNotationDiff, transformerNotationHighlight, transformerRenderWhitespace } from '@shikijs/transformers';

let currentStartLine = 0;

const components = {
  // MyLabel,
  MyButton
};
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


export default function Preview({ text, onTextChange }: { text: string, onTextChange?: (value: string) => void }) {
  const [Compiled, setCompiled] = useState<React.ComponentType<any> | null>(null);
  const [value, setValue] = useState<string>(text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);




  const [viewMode, setViewMode] = useState<'both' | 'edit' | 'preview'>('both');






  const [code, setMdxSource] = useState<Promise<string | undefined>>(Promise.resolve(undefined));
  useEffect(() => {
    async function compileMdx() {
      const code = String(
        await compile(value, {
          outputFormat: "function-body",
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            [
              rehypeKatex,
              {
                strict: false,
                throwOnError: false,
                output: "html",
              },
            ],[rehypePrettyCode, options]
          ],
          development: false,
        })
      );
      setMdxSource(Promise.resolve(code));

      const fn = new Function(
        "jsxRuntime",
        "components",
        `${code}; return { default: MDXContent };`
      );

      const { default: Component } = fn(
        {
          ...jsxRuntime,
          Fragment: jsxRuntime.Fragment,
        },
        components
      );

      setCompiled(() => Component);
    }

    compileMdx();


  }, [value]);

  useEffect(() => {
    setValue((prev) => (prev === (text || "") ? prev : (text || "")));
  }, [text]);



  // 使用百分比同步滚动
  const syncScroll = (event: React.UIEvent<HTMLDivElement | HTMLTextAreaElement>) => {
    const source = event.target as HTMLDivElement | HTMLTextAreaElement;
    const target = source === textareaRef.current ? previewRef.current : textareaRef.current;

    if (target) {
      const sourceScrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight);
      const targetScrollTop = sourceScrollPercentage * (target.scrollHeight - target.clientHeight);
      target.scrollTop = targetScrollTop;
      target.scrollLeft = source.scrollLeft; // 水平同步保持不变
    }
  };

  return (
    <div className="p-4 w-full overflow-x-hidden">
      {/* <WordCount mdxContent={value}  /> */}
      <WordCount Compiled={Compiled}
      components={components}
      />

      <div className="mb-4">
        <Button
          onClick={() => setViewMode(viewMode === 'both' ? 'edit' : viewMode === 'edit' ? 'preview' : 'both')}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {viewMode === 'both' ? '仅编辑' : viewMode === 'edit' ? '仅预览' : '编辑+预览'}
        </Button>
      </div>
      <div className={`flex ${viewMode === 'both' ? 'flex-row' : 'flex-col'} gap-4`}>
        {viewMode !== 'preview' && (
          <div className={viewMode === 'edit' ? 'w-full' : 'flex-1 min-w-0'}>
            <textarea
              ref={textareaRef}
              className="border p-2 w-full h-96 min-h-[96vh] resize-none font-mono rounded-md"
              value={value}
              aria-label="MDX 输入框"
              onChange={(e) => { const v = e.target.value; setValue(v); onTextChange?.(v); }}
              onScroll={syncScroll}
            />
          </div>
        )}
        {viewMode !== 'edit' && (
          <div className={viewMode === 'preview' ? 'w-full' : 'flex-1 min-w-0'}>
            <div
              ref={previewRef}
              className="border p-4 w-full prose prose-zinc rounded-md max-w-none min-h-[96vh]"
              style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', maxHeight: '96vh', overflowY: 'auto' }}
              onScroll={syncScroll}
            >
              {Compiled ? <Compiled
              components={components}
              /> : "编译中..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
