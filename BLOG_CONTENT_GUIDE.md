# 博客内容管理说明

这个项目可以直接用 Obsidian、VS Code 或其他 Markdown 编辑器管理内容。

## 推荐打开方式

用 Obsidian 打开整个目录：

```text
~/Mycode/web
```

主要编辑这些位置：

- 文章：`source/_posts/`
- 关于页：`source/about/index.md`
- 照片页：`source/photos/index.md`
- 资源页：`source/resources/index.md`
- 想法页：`source/thoughts/index.md`
- 图片：`source/img/`
- 写作模板：`templates/`

## 新建文章

```bash
npm run new:post -- "文章标题"
```

生成的文章会在：

```text
source/_posts/
```

## 本地预览

```bash
npm run preview
```

浏览器打开：

```text
http://localhost:4000
```

## 发布

```bash
npm run publish -- "update blog content"
```

这条命令会自动构建、提交并推送到 GitHub。推送后 GitHub Pages 会自动部署。

## 图片管理

建议按用途放图片：

```text
source/img/covers/   文章封面
source/img/photos/   照片页图片
source/img/uploads/  文章内图片
```

Markdown 引用示例：

```markdown
![图片说明](/img/uploads/example.jpg)
```
