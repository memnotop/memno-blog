# memno-blog

`~/Mycode/web` 是当前实际发布到 `https://memno.top` 的仓库。  
`~/Mycode/web-arthals-ink` 只是之前下载和整理时用的副本，后续维护请以这个仓库为准。

## 开发命令

```bash
npm install
npm run dev
```

本地预览地址通常是 `http://localhost:4321`。

## 常改的位置

- 站点基础信息：[src/site.config.ts](./src/site.config.ts)
  - 站点标题、作者、导航、页脚、社交链接都在这里
- 首页内容：[src/pages/index.astro](./src/pages/index.astro)
- About 页面：[src/pages/about.astro](./src/pages/about.astro)
- Training 页面：[src/pages/training.astro](./src/pages/training.astro)
- 友链数据：[public/links.json](./public/links.json)
- favicon 和站点图标：`public/favicon/`
- 公共图片：`public/img/`

## 写新文章

文章目录：

```text
src/content/blog/
```

新建一个 `*.md` 或 `*.mdx` 文件即可，例如：

```md
---
title: "文章标题"
description: "一句话摘要"
publishDate: "2026-06-03 10:00:00"
tags:
  - technical
language: "中文"
draft: false
---

这里写正文。
```

训练记录也已经收进博客内容里，位置是：

```text
src/content/blog/training-log.md
```

## 修改界面内容

常见改法：

1. 改导航、站点名、页脚链接：编辑 `src/site.config.ts`
2. 改首页文案和卡片：编辑 `src/pages/index.astro`
3. 改训练页样式：编辑 `src/pages/training.astro` 和 `src/assets/styles/training.css`
4. 改首页样式：编辑 `src/assets/styles/mem-home.css`
5. 改头像或 favicon：替换 `src/assets/avatar.webp`、`public/favicon/*`

修改后先本地检查：

```bash
npm run build
```

## 发布到网站

```bash
git add .
git commit -m "update site content"
git push origin main
```

推送后 GitHub Actions 会自动构建并发布到 GitHub Pages。

检查位置：

1. GitHub 仓库 `Actions`
2. 最新的 `Deploy Astro to GitHub Pages`
3. 状态变成绿色后访问 `https://memno.top`

## 辅助脚本

- `npm run date`：根据文章内容变化自动刷新 `updatedDate`
- `npm run cache:avatars`：缓存友链头像

## License

博客文本内容以 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 协议发布。
