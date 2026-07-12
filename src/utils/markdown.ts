import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import remarkObsidian from '@/plugins/remark-obsidian'

export function stripFrontmatter(value: string) {
  return value.replace(/^---[\s\S]*?---\s*/, '')
}

export async function renderMarkdownFragment(value: string, filePath: string) {
  if (!value.trim()) return ''

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkObsidian)
    .use(remarkAlert)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process({ value, path: filePath })

  return String(file)
}
