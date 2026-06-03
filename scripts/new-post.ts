#!/usr/bin/env node
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const blogDir = path.join(__dirname, '../src/content/blog')

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function nowString() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

async function main() {
  const rawTitle = process.argv.slice(2).join(' ').trim()
  if (!rawTitle) {
    console.error('Usage: npm run new:post -- "文章标题"')
    process.exit(1)
  }

  const slug = slugify(rawTitle)
  if (!slug) {
    console.error('Could not generate a valid filename from the title.')
    process.exit(1)
  }

  const filePath = path.join(blogDir, `${slug}.md`)
  const assetsDir = path.join(blogDir, slug)

  try {
    await fs.access(filePath)
    console.error(`File already exists: ${filePath}`)
    process.exit(1)
  } catch {
    // expected
  }

  const template = `---
title: "${rawTitle}"
description: "一句话摘要"
publishDate: "${nowString()}"
tags:
  - technical
repositories:
  - technical
# heroImage:
#   src: ./${slug}/cover.webp
#   alt: "封面图说明"
#   color: "#659EB9"
language: "中文"
draft: false
---

在这里写正文。

图片放在 \`src/content/blog/${slug}/\` 目录里，正文中这样引用：

\`\`\`md
![图片说明](./${slug}/image.webp)
\`\`\`
`

  await fs.mkdir(assetsDir, { recursive: true })
  await fs.writeFile(filePath, template, 'utf8')
  console.log(`Created: ${filePath}`)
  console.log(`Assets: ${assetsDir}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
