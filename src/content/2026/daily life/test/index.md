---
title: "test"
description: "一句话摘要"
publishDate: "2026-06-05 10:37:06"
tags: []
repositories:
  - daily-life
language: "中文"
draft: true
---

在这里写正文。

图片直接放在当前文章目录里，正文中这样引用：

```md
![图片说明](./image.webp)
```

如果需要封面图，frontmatter 里这样写：

```yaml
heroImageSrc: ./cover.webp
heroImageAlt: 封面图说明
heroImageColor: "#659EB9"
```

不想在站内显示封面时，把 `showHeroImage` 改成 `false`。

当前文章目录：

```text
test/
├─ index.md
└─ image.webp
```
