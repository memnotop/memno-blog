---
sticker: emoji//2763-fe0f
---
# memno-blog

`~/Mycode/web` 是当前实际发布到 `https://memno.top` 的仓库。  
`~/Mycode/web-arthals-ink` 只是之前下载和整理时用的副本，后续维护请以这个仓库为准。

## 项目结构

```text
web/
├─ .github/workflows/        GitHub Pages 自动部署配置
├─ public/                   直接原样发布的静态资源
│  ├─ favicon/               标签栏图标、PWA 图标
│  ├─ fonts/                 字体文件
│  ├─ img/                   站内通用图片
│  ├─ images/                站点分享图等
│  ├─ links.json             友链数据
│  └─ styles/global.css      全站公共样式
├─ scripts/                  维护脚本
├─ src/
│  ├─ assets/                由 Astro 打包处理的资源
│  │  ├─ styles/             页面样式
│  │  └─ avatar.webp         站点头像
│  ├─ components/            可复用组件
│  ├─ content/               按年份组织的博客内容
│  ├─ layouts/               页面布局
│  ├─ pages/                 各页面入口
│  ├─ plugins/               Markdown / Shiki 插件
│  ├─ content.config.ts      内容集合定义
│  └─ site.config.ts         站点配置中心
├─ package.json              常用命令入口
└─ astro.config.ts           Astro 构建配置
```

## 各目录是做什么的

- `src/site.config.ts`
  - 站点标题、导航、页脚、社交链接、排版参数
- `src/pages/`
  - 每个页面的入口
  - `index.astro` 首页
  - `about/index.astro` About
  - `training.astro` 训练记录
  - `links/index.astro` 友链页
  - `projects/index.astro` 项目页
- `src/content/`
  - 所有文章内容
  - 直接按年份组织，例如 `2026/`、`2027/`
  - 每个年份下固定分为 `daily life/`、`Reading/`、`Technical/`、`Picture/` 和 `Training.md`
  - 普通文章用 `文章目录/index.md` 组织，配图直接放在文章目录里
- `src/assets/styles/`
  - 站内页面样式
  - `app.css` 全站基准样式
  - `mem-home.css` 首页
  - `training.css` 训练页
- `public/`
  - 不经处理直接发布的文件
  - 改 favicon、友链数据、固定图片时主要看这里
- `scripts/`
  - 维护脚本，例如自动补 `updatedDate`、新建文章
- `packages/pure/`
  - 主题本体
  - 能不动尽量别动，除非你明确要改主题行为

## 常用命令

```bash
npm install
npm run dev
```

本地预览地址通常是 `http://localhost:4321`。

更多命令：

```bash
npm run new:post               # 交互式新建文章 / Training 年度文件
npm run date                   # 按内容变化更新 updatedDate
npm run verify                 # 发布前检查，等于 check + build
npm run build                  # 生成生产构建
npm run preview                # 预览生产构建
```

## 我之后通常改哪些地方

- 站点基础信息：[src/site.config.ts](./src/site.config.ts)
  - 站点标题、作者、导航、页脚、社交链接都在这里
- 首页内容：[src/pages/index.astro](./src/pages/index.astro)
- About 页面：[src/pages/about/index.astro](./src/pages/about/index.astro)
- Training 页面：[src/pages/training.astro](./src/pages/training.astro)
- 友链数据：[public/links.json](./public/links.json)
- favicon 和站点图标：`public/favicon/`
- 公共图片：`public/img/`
- 全站字体和基准字号：[src/assets/styles/app.css](./src/assets/styles/app.css)

## 如何发布新内容

### 1. 新建普通文章

最快方式：

```bash
npm run new:post
```

也可以直接带标题：

```bash
npm run new:post -- "文章标题"
```

脚本会交互询问：

- 年份，例如 `2026`
- `repositories`，例如 `technical`、`reading`、`daily-life`、`picture`、`training`

然后自动构建到对应位置：

- 普通文章：`src/content/2026/Technical/my-post/index.md`
- Training 年度文件：`src/content/2026/Training.md`

然后打开新文件，填写正文。

### 2. 手动新建文章

也可以直接手动创建内容文件。

普通文章建议放在：

```text
src/content/2026/Technical/my-post/index.md
```

Training 记录放在：

```text
src/content/2026/Training.md
```

例如：

```md
---
title: "文章标题"
description: "一句话摘要"
publishDate: "2026-06-03 10:00:00"
tags: []
repositories:
  - technical
# heroImage:
#   src: ./cover.webp
#   alt: "封面图说明"
#   color: "#659EB9"
language: "中文"
draft: false
---

这里写正文。
```

说明：

- `title`：文章标题
- `description`：摘要，列表页和 SEO 会用到
- `publishDate`：发布时间
- `tags`：普通标签页会用到，可选
- `repositories`：文章所属内容仓库，也决定默认落盘目录
- `heroImage`：文章封面图，取消注释后把 `src` 改成实际图片路径
- `draft: false`：表示允许发布；如果写成 `true`，通常不会出现在正式内容里

### 3. 组织文章图片

推荐结构：

```text
src/content/
└─ 2026/
   └─ Technical/
      └─ my-post/
         ├─ index.md
         ├─ cover.webp
         └─ image-01.webp
```

正文图片这样写：

```md
![图片说明](./image-01.webp)
```

封面图在 frontmatter 里这样写：

```yaml
heroImage:
  src: ./cover.webp
  alt: "封面图说明"
  color: "#659EB9"
```

固定站内公共图片继续放 `public/img/`，正文里用 `/img/xxx.webp` 引用。

### 4. 修改专题页来源

专题页配置在 [src/site.config.ts](./src/site.config.ts) 的 `blogTopics`。

现在四个专题页都按 `repositories` 字段筛选：

```ts
{
  slug: 'daily-life',
  title: 'daily life',
  description: '生活记录、想法和日常记录。',
  source: {
    field: 'repositories',
    values: ['daily-life']
  }
}
```

文章需要进入某个仓库时，在 frontmatter 里写：

```yaml
repositories:
  - daily-life
```

### 5. 更新训练记录

训练内容已经并入博客内容，位置是：

```text
src/content/2026/Training.md
```

按年份分别维护对应的 `Training.md` 即可。

## 如何修改界面内容

### 改站点基础信息

编辑 [src/site.config.ts](./src/site.config.ts)：

- 网站标题
- 作者名
- 顶部导航
- 页脚链接
- 社交链接
- 正文字号类名

### 改首页

- 内容：[src/pages/index.astro](./src/pages/index.astro)
- 样式：[src/assets/styles/mem-home.css](./src/assets/styles/mem-home.css)

### 改训练页

- 内容逻辑：[src/pages/training.astro](./src/pages/training.astro)
- 样式：[src/assets/styles/training.css](./src/assets/styles/training.css)

### 改 About / Projects / Links

- About：`src/pages/about/index.astro`
- Projects：`src/pages/projects/index.astro`
- Links：`src/pages/links/index.astro`
- 友链数据：`public/links.json`

### 改头像、图标、图片

- 头像：`src/assets/avatar.webp`
- favicon：`public/favicon/*`
- 固定图片：`public/img/*`

### 改全站字体大小

- 基准字号：`src/assets/styles/app.css`
- 公共样式：`public/styles/global.css`

## 每次修改后的检查步骤

### 只改了文章内容

```bash
npm run date
npm run build
```

### 改了页面、样式或配置

```bash
npm run verify
```

### 本地预览

```bash
npm run dev
```

浏览器打开 `http://localhost:4321`。

## 如何正式发布到网站

建议固定按这个顺序：

```bash
npm run verify
git status
git add .
git commit -m "update site content"
git push origin main
```

推送后会自动触发 GitHub Pages 部署。

## 发布后的检查位置

1. 打开 GitHub 仓库 `Actions`
2. 查看最新一次 `Deploy Astro to GitHub Pages`
3. 等状态变绿
4. 打开 `https://memno.top`

如果页面没立刻更新，先强刷浏览器缓存。

## 便捷命令说明

### `npm run new:post`

- 交互询问年份和 `repositories`
- 普通文章创建到 `src/content/<year>/<分类>/<slug>/index.md`
- `training` 创建到 `src/content/<year>/Training.md`
- 自动带上模板 frontmatter

### `npm run date`

- 递归检测 `src/content/` 下文章内容是否变化
- 如果变了，自动更新 `updatedDate`

### `npm run verify`

- 等于：
```bash
npm run check
npm run build
```
- 适合发布前最后跑一次

### `npm run cache:avatars`

- 把友链头像缓存到本地
- 只有在你调整友链头像策略时才需要

## 维护原则

- 以后只维护 `~/Mycode/web`
- `packages/pure/` 是主题代码，没必要不要改
- 发内容优先改 `src/content/`
- 改界面优先改 `src/pages/`、`src/assets/styles/`、`src/site.config.ts`
- 发布前至少跑一次 `npm run verify`

## License

博客文本内容以 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议发布。
