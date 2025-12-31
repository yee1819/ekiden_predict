import React from "react";
import { Card, CardContent } from "./card";
import Image from "next/image";

const blogs = [
    {
        id: 1,
        title: "图片在左边的博客文章",
        excerpt: "这是一个展示图片在左边的博客卡片。",
        image: "https://yee-1312555989.cos.ap-guangzhou.myqcloud.com//blog202410010410391.webp",
        layout: "left",
        date: "2023-10-25",
        wordCount: 1200,
        category: "科技",
    },
    {
        id: 2,
        title: "图片在右边的博客文章",
        excerpt: "这是一个展示图片在右边的博客卡片。",
        image: "https://yee-1312555989.cos.ap-guangzhou.myqcloud.com//blog202410010410391.webp",
        layout: "right",
        date: "2023-10-20",
        wordCount: 1500,
        category: "生活",
    },
    {
        id: 3,
        title: "图片在上方的博客文章",
        excerpt: "这是一个展示图片在上方的博客卡片。",
        image: "https://yee-1312555989.cos.ap-guangzhou.myqcloud.com//blog202410010410391.webp",
        layout: "top",
        date: "2023-10-15",
        wordCount: 800,
        category: "设计",
    },
    {
        id: 4,
        title: "无图博客文章",
        excerpt: "这是一个没有图片的博客卡片。",
        layout: "none",
        date: "2023-10-10",
        wordCount: 900,
        category: "杂谈",
    },
];

export const BlogCard = ({ title, excerpt, image, layout, date, wordCount, category }: any) => {
    const metaInfo = (
        <div className="flex items-center text-xs text-gray-500 mb-2 space-x-4">
            <span>{date}</span>
            {typeof wordCount === 'number' ? <span>{wordCount} 字</span> : null}
            <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">
                {category}
            </span>
        </div>
    );

    return (
        <Card className="overflow-hidden shadow-md rounded-2xl bg-white transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
            {/* 图片在上方 */}
            {layout === "top" && (
                <div className="relative">
                    {image && (
                        <Image
                            src={image}
                            alt={title}
                            width={300}
                            height={200}
                            className="w-full h-70 object-cover"
                        // priority={false}
                        />
                    )}
                    <CardContent className="p-4">
                        <h2 className="text-xl font-semibold mb-2">{title}</h2>
                        {metaInfo}
                        <p className="text-gray-600">{excerpt}</p>
                    </CardContent>
                </div>
            )}

            {/* 图片在左/右 */}
            {(layout === "left" || layout === "right") && (
                <div
                    className={`flex flex-col sm:flex-row ${layout === "right" ? "sm:flex-row-reverse" : ""
                        } gap-4`}
                >
                    {image && (
                        <div className="w-full sm:w-48 flex-shrink-0">
                            <Image
                                src={image}
                                alt={title}
                                width={300}
                                height={200}
                                className="w-full h-auto object-cover rounded-lg"
                            />
                        </div>
                    )}
                    <CardContent className="flex-1 p-4 flex flex-col justify-center">
                        <h2 className="text-xl font-semibold mb-2">{title}</h2>
                        {metaInfo}
                        <p className="text-gray-600">{excerpt}</p>
                    </CardContent>
                </div>
            )}

            {/* 无图 */}
            {layout === "none" && (
                <CardContent className="p-4">
                    <h2 className="text-xl font-semibold mb-2">{title}</h2>
                    {metaInfo}
                    <p className="text-gray-600">{excerpt}</p>
                </CardContent>
            )}
        </Card>
    );
};

export default function BlogList() {
    return (
        <div className="grid gap-6 max-w-4xl mx-auto p-4">
            {blogs.map((blog) => (
                <BlogCard key={blog.id} {...blog} />
            ))}
        </div>
    );
}
