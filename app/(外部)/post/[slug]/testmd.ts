export const  text =`# Hello MDX
这是个按钮：Markdown 样式示例

this is测试


\`\`\`python {2}#add {1}#del  /def/#b 
def hello():
    print('Hello, Wdodarldddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd!')
    print('你好，世界！')
    return 0
\`\`\`  



\`\`\`python    data-line-start="4"
def hello():
    print('Hello, Wdodarldddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd!')
    print('你好，世界！')
    return 0
\`\`\`  

This is an array \`[1, 2, 3]{:js}\` of numbers 1 through 3.

定义一个函数\`def hello(){:python}\`
定义一个变量\`a=10{:python}\`


The name of the function is \`getStringLength{:.entity.name.function}\`.

\`const{:.keyword}\` \`getStringLength{:.fn}\` = \`function{:.keyword}\`(...)


\`function{:.keyword}\`

\`function{:.keyword}\`

\`function{:.keyword}\`
\`function{:.keyword}\`
\`function{:.keyword}\`


\`12345{:.constant.numeric}\`

\`ffff{:.constant.numeric}\`

\`if{:.keyword.control}\` \`(x > 0) return{:.keyword.control}\` \`true;\`

The name of the function is \`getStringLength\`.
2024年8月12日ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
这是一篇用 Markdown 编写的演示文章。你可以使用 Markdown 语法来编写和格式化你的文章。

标题

$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

- [x] 哈哈


$f(x) = x^2 + 2x + 1$。

# 这是一级标题

## 这是二级标题

### 这是三级标题


#### 这是四级标题

##### 这是五级标题

###### 这是六级标题

强调

**这个文本将会是加粗的**

__这个文本也会是加粗的__

这个文本将会是加粗的

这个文本也会是加粗的

列表

无序列表


- 项目 1
- 项目 2
  - 项目 2a
  - 项目 2b

项目列表


项目 1
项目 2
项目 2a
项目 2b

有序列表

1. 项目 1
2. 项目 2
3. 项目 3

有序列表

项目 1
项目 2
项目 3

链接

[GitHub](http://github.com)
GitHub

图片

![图片](https://slefboot-1251736664.file.myqcloud.com/20240808_leveldb_source_bloom_filter_visualization.png/webp1600)
图片

引用
> 这是一个引用
#### 这是四级标题

##### 这是五级标题

###### 这是六级标题

这是一个引用

这是引用中的一个列表

这是引用中的列表

正常内容

代码

行内 \`代码\`

行内 代码 在这里。

代码块

\`\`\`python {2}#w  title="你好"
def hello():
    print('Hello, World!')

\`\`\`  




\`\`\`python {2,5}#focuse title="app.tsx"
def hello():
    print('Hello, World!')
    int a = 2
    int b = 3
    int a = 2
int b = 3
\`\`\`  



\`\`\`  js

// [!code highlight:3]
int a = 2
int b = 3

    int a = 222



console.log('New feature added');  // [!code ++]

// [\!code++]  // 这行是删除的
console.log('Old code removed');  // [!code --]

\`\`\`  
表格

| 表头 1 | 表头 2 |
| ------ | ------ |
| 单元格 1 | 单元格 2 |
| 单元格 3 | 单元格 4 |

表格:

表头 1	表头 2
单元格 1	单元格 2
单元格 3	单元格 4

水平线

---
__nihao__ 

水平线上下的内容将被视为不同的段落。

---
<MyButton>点我</MyButton>`