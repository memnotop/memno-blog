#!/usr/bin/env node
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { Interface, createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '../src/content')

const repositoryLayouts = {
  'daily-life': { directory: 'daily life', defaultTags: [] },
  reading: { directory: 'Reading', defaultTags: ['reading'] },
  technical: { directory: 'Technical', defaultTags: ['technical'] },
  picture: { directory: 'Picture', defaultTags: ['picture'] },
  training: { file: 'Training.md', defaultTags: ['training'] }
} as const

type RepositoryKey = keyof typeof repositoryLayouts

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

function normalizeRepository(input: string) {
  return input.trim().toLowerCase().replace(/[\s_]+/g, '-')
}

function parseRepositories(input: string): RepositoryKey[] {
  const repositories = input
    .split(',')
    .map((item) => normalizeRepository(item))
    .filter(Boolean)

  if (!repositories.length) {
    throw new Error('repositories 不能为空。可选值：daily-life, reading, technical, picture, training。')
  }

  const unsupported = repositories.filter(
    (item) => !Object.hasOwn(repositoryLayouts, item)
  ) as string[]
  if (unsupported.length) {
    throw new Error(`不支持的 repositories: ${unsupported.join(', ')}`)
  }

  return repositories as RepositoryKey[]
}

function toYamlList(items: string[]) {
  if (!items.length) return ' []'
  return `\n${items.map((item) => `  - ${item}`).join('\n')}`
}

function buildPostTemplate(title: string, repositories: RepositoryKey[], tags: string[], slug: string) {
  return `---
title: "${title}"
description: "一句话摘要"
publishDate: "${nowString()}"
tags:${toYamlList(tags)}
repositories:${toYamlList(repositories)}
heroImageSrc: ./cover.webp
heroImageAlt: 封面图说明
heroImageColor: "#659EB9"
showHeroImage: true
language: "中文"
draft: false
---

<!-- 这里先写一句你想表达的核心观点。 -->

在这里写正文。

图片直接放在当前文章目录里，正文中这样引用：

\`\`\`md
![图片说明](./image.webp)
\`\`\`

如果需要封面图，frontmatter 里这样写：

\`\`\`yaml
heroImageSrc: ./cover.webp
heroImageAlt: 封面图说明
heroImageColor: "#659EB9"
\`\`\`

不想在站内显示封面时，把 \`showHeroImage\` 改成 \`false\`。

当前文章目录：

\`\`\`text
${slug}/
├─ index.md
└─ image.webp
\`\`\`
`
}

function buildTrainingTemplate(year: string, repositories: RepositoryKey[], tags: string[]) {
  return `---
title: "Training ${year}"
description: "${year} 年训练记录。"
publishDate: "${year}-01-01 00:00:00"
tags:${toYamlList(tags)}
repositories:${toYamlList(repositories)}
language: "中文"
draft: false
---

## ${year}-01-01｜训练主题｜level 3

训练内容：
- 动作 1
- 动作 2
RPE：12

训练总结写在这里。
`
}

type PromptMode =
  | {
      type: 'interactive'
      rl: Interface
    }
  | {
      type: 'buffered'
      answers: string[]
      index: number
    }

async function createPromptMode(): Promise<PromptMode> {
  if (input.isTTY) {
    return {
      type: 'interactive',
      rl: createInterface({ input, output })
    }
  }

  const chunks: Buffer[] = []
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return {
    type: 'buffered',
    answers: Buffer.concat(chunks)
      .toString('utf8')
      .split(/\r?\n/)
      .map((line) => line.trim()),
    index: 0
  }
}

async function prompt(mode: PromptMode, question: string, defaultValue?: string) {
  if (mode.type === 'buffered') {
    const answer = mode.answers[mode.index] ?? ''
    mode.index += 1
    return answer || defaultValue || ''
  }

  const suffix = defaultValue ? ` (${defaultValue})` : ''
  const answer = await mode.rl.question(`${question}${suffix}: `)
  return answer.trim() || defaultValue || ''
}

async function main() {
  const promptMode = await createPromptMode()

  try {
    const rawTitle = process.argv.slice(2).join(' ').trim()
    const currentYear = String(new Date().getFullYear())

    const year = await prompt(promptMode, '年份', currentYear)
    if (!/^\d{4}$/.test(year)) {
      console.error('年份必须是四位数字，例如 2026。')
      process.exit(1)
    }

    const repositories = parseRepositories(
      await prompt(promptMode, 'repositories（逗号分隔，首个值决定目录）', 'technical')
    )
    const primaryRepository = repositories[0]
    const layout = repositoryLayouts[primaryRepository]
    const tags = Array.from(new Set(layout.defaultTags))

    if ('file' in layout) {
      const filePath = path.join(contentDir, year, layout.file)

      try {
        await fs.access(filePath)
        console.log(`Training 文件已存在：${filePath}`)
        return
      } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, buildTrainingTemplate(year, repositories, tags), 'utf8')
        console.log(`Created: ${filePath}`)
        return
      }
    }

    const title = rawTitle || (await prompt(promptMode, '文章标题'))
    if (!title) {
      console.error('文章标题不能为空。')
      process.exit(1)
    }

    const slug = slugify(title)
    if (!slug) {
      console.error('无法根据标题生成有效目录名。')
      process.exit(1)
    }

    const articleDir = path.join(contentDir, year, layout.directory, slug)
    const filePath = path.join(articleDir, 'index.md')

    try {
      await fs.access(filePath)
      console.error(`File already exists: ${filePath}`)
      process.exit(1)
    } catch {
      await fs.mkdir(articleDir, { recursive: true })
      await fs.writeFile(filePath, buildPostTemplate(title, repositories, tags, slug), 'utf8')
      console.log(`Created: ${filePath}`)
      console.log(`Assets: ${articleDir}`)
    }
  } finally {
    if (promptMode.type === 'interactive') promptMode.rl.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
