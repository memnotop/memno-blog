import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

import remarkObsidian from '../src/plugins/remark-obsidian'

async function render(
  value: string,
  {
    filePath = '/tmp/example.md',
    publicAssets = 'url'
  }: { filePath?: string; publicAssets?: 'import' | 'url' } = {}
) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkObsidian, { publicAssets })
    .use(remarkRehype)
    .use(rehypeStringify)
    .process({ value, path: filePath })

  return String(file)
}

test('Obsidian tags are transformed once without nested links', async () => {
  const html = await render('正文 #标签')

  assert.equal(html.match(/<a\b/g)?.length, 1)
  assert.match(html, /href="\/tags\/%E6%A0%87%E7%AD%BE"/)
})

test('Obsidian syntax is not transformed inside existing Markdown links', async () => {
  const html = await render('[已有链接 #标签](https://example.com)')

  assert.equal(html.match(/<a\b/g)?.length, 1)
  assert.match(html, /href="https:\/\/example\.com"/)
  assert.doesNotMatch(html, /\/tags\//)
})

test('Obsidian syntax is not transformed in formatted link labels', async () => {
  const html = await render('[已有链接 **#标签**](https://example.com)')

  assert.equal(html.match(/<a\b/g)?.length, 1)
  assert.match(html, /<strong>#标签<\/strong>/)
  assert.doesNotMatch(html, /\/tags\//)
})

test('Obsidian note links resolve to the canonical Astro content route', async () => {
  const filePath = path.join(process.cwd(), 'src/content/2026/Reading/百年孤独摘要/index.md')
  const html = await render('[[红楼梦曲乐中悲#章节]]', { filePath })

  assert.match(
    html,
    /href="\/blog\/2026\/reading\/%E7%BA%A2%E6%A5%BC%E6%A2%A6%E6%9B%B2%E4%B9%90%E4%B8%AD%E6%82%B2#%E7%AB%A0%E8%8A%82"/
  )
})

test('Obsidian content paths and aliases resolve to the same article route', async () => {
  const html = await render('[[src/content/2026/Reading/红楼梦曲乐中悲/index|红楼梦曲乐中悲]]')

  assert.match(
    html,
    /href="\/blog\/2026\/reading\/%E7%BA%A2%E6%A5%BC%E6%A2%A6%E6%9B%B2%E4%B9%90%E4%B8%AD%E6%82%B2"/
  )
  assert.match(html, />红楼梦曲乐中悲<\/a>/)
})

test('public Obsidian images stay as root URLs outside the Astro image pipeline', async () => {
  const html = await render('![[/img/photos/九号猫1.webp]]')

  assert.match(html, /src="\/img\/photos\/%E4%B9%9D%E5%8F%B7%E7%8C%AB1\.webp"/)
})

test('Astro content rendering can opt public Obsidian images into asset imports', async () => {
  const filePath = path.join(process.cwd(), 'src/content/2026/Picture/九号楼的猫/index.md')
  const html = await render('![[/img/photos/九号猫1.webp]]', {
    filePath,
    publicAssets: 'import'
  })

  assert.match(html, /src="\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/public\/img\/photos\//)
})
