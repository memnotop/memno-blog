import { existsSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { slug } from 'github-slugger'
import type {
  Blockquote,
  Image,
  Link,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Text
} from 'mdast'
import { visit } from 'unist-util-visit'

type ParentWithChildren = {
  children: RootContent[] | PhrasingContent[]
}

type MarkdownFile = {
  path?: string | null
}

type InlineToken =
  | {
      type: 'comment'
      value: string
    }
  | {
      type: 'delete'
      value: string
    }
  | {
      type: 'highlight'
      value: string
    }
  | {
      type: 'tag'
      value: string
    }
  | {
      type: 'wiki'
      embed: boolean
      value: string
    }

const OBSIDIAN_CALLOUT_TYPE_MAP: Record<string, string> = {
  abstract: 'note',
  attention: 'warning',
  bug: 'caution',
  check: 'tip',
  cite: 'note',
  danger: 'caution',
  done: 'tip',
  error: 'caution',
  example: 'important',
  fail: 'caution',
  failure: 'caution',
  faq: 'note',
  help: 'note',
  hint: 'tip',
  info: 'note',
  missing: 'caution',
  question: 'note',
  quote: 'note',
  success: 'tip',
  summary: 'note',
  todo: 'note',
  tldr: 'note',
  warn: 'warning'
}

const IMAGE_EXTENSIONS = new Set([
  'apng',
  'avif',
  'gif',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp'
])

export default function remarkObsidian() {
  return (tree: Root, file: MarkdownFile) => {
    const markdownFilePath = typeof file.path === 'string' ? file.path : undefined
    transformObsidianCallouts(tree)
    transformParagraphs(tree, markdownFilePath)
    transformInlineSyntax(tree, markdownFilePath)
  }
}

function transformParagraphs(tree: Root, markdownFilePath?: string) {
  visit(tree, 'paragraph', (node: Paragraph, index, parent) => {
    if (!parent || typeof index !== 'number') return
    const replacement = paragraphToEmbedBlock(node, markdownFilePath)
    if (!replacement) return

    parent.children.splice(index, 1, replacement)
  })
}

function paragraphToEmbedBlock(node: Paragraph, markdownFilePath?: string): Paragraph | null {
  const nonBreakChildren = node.children.filter((child) => child.type !== 'break')
  if (nonBreakChildren.length !== 1) return null

  const child = nonBreakChildren[0]
  if (child?.type !== 'text') return null

  const match = child.value.trim().match(/^!\[\[([^\]]+)\]\]$/)
  if (!match) return null

  const parsed = parseWikiTarget(match[1] ?? '')
  if (isLikelyImage(parsed.target)) {
    return {
      type: 'paragraph',
      children: [
        {
          type: 'image',
          url: resolveObsidianAssetUrl(parsed.target, markdownFilePath),
          alt: parsed.alias || parsed.target,
          title: null,
          data: {
            hProperties: {
              className: ['obsidian-image-inline'],
              loading: 'lazy',
              decoding: 'async',
              ...(parsed.width ? { width: parsed.width } : {})
            }
          }
        } satisfies Image
      ],
      data: {
        hName: 'figure',
        hProperties: {
          className: ['obsidian-embed', 'obsidian-image-embed']
        }
      }
    }
  }

  return {
    type: 'paragraph',
    children: [
      {
        type: 'link',
        url: wikiTargetToUrl(parsed),
        title: null,
        children: [{ type: 'text', value: parsed.alias || parsed.target }]
      } satisfies Link
    ],
    data: {
      hName: 'aside',
      hProperties: {
        className: ['obsidian-embed', 'obsidian-note-embed']
      }
    }
  }
}

function transformInlineSyntax(tree: Root, markdownFilePath?: string) {
  visit(tree, (node) => {
    if (!hasPhrasingChildren(node)) return

    const nextChildren: PhrasingContent[] = []
    for (const child of node.children) {
      if (child.type !== 'text') {
        nextChildren.push(child)
        continue
      }

      nextChildren.push(...transformTextNode(child, markdownFilePath))
    }

    node.children = nextChildren
  })
}

function transformTextNode(node: Text, markdownFilePath?: string): PhrasingContent[] {
  const parts: PhrasingContent[] = []
  let cursor = 0

  for (const match of findInlineTokens(node.value)) {
    if (match.start > cursor) {
      parts.push({ type: 'text', value: node.value.slice(cursor, match.start) })
    }

    const replacement = tokenToNodes(match.token, markdownFilePath)
    if (replacement.length) parts.push(...replacement)
    cursor = match.end
  }

  if (cursor < node.value.length) {
    parts.push({ type: 'text', value: node.value.slice(cursor) })
  }

  return parts.length ? parts : [node]
}

function findInlineTokens(value: string) {
  const tokens: Array<{ start: number; end: number; token: InlineToken }> = []
  let index = 0

  while (index < value.length) {
    const match = nextInlineToken(value, index)
    if (!match) break

    tokens.push(match)
    index = match.end
  }

  return tokens
}

function nextInlineToken(value: string, start: number) {
  const candidates = [
    findDelimitedToken(value, start, '%%', '%%', 'comment'),
    findDelimitedToken(value, start, '~~', '~~', 'delete'),
    findDelimitedToken(value, start, '==', '==', 'highlight'),
    findWikiToken(value, start),
    findTagToken(value, start)
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))

  candidates.sort((a, b) => a.start - b.start || b.end - a.end)
  return candidates[0]
}

function findDelimitedToken(
  value: string,
  start: number,
  opener: string,
  closer: string,
  type: 'comment' | 'delete' | 'highlight'
) {
  const openIndex = value.indexOf(opener, start)
  if (openIndex === -1) return null

  const closeIndex = value.indexOf(closer, openIndex + opener.length)
  if (closeIndex === -1) return null

  return {
    start: openIndex,
    end: closeIndex + closer.length,
    token: {
      type,
      value: value.slice(openIndex + opener.length, closeIndex)
    } satisfies InlineToken
  }
}

function findWikiToken(value: string, start: number) {
  const wikiPattern = /!?\[\[[^\]\n]+\]\]/g
  wikiPattern.lastIndex = start
  const match = wikiPattern.exec(value)
  if (!match || match.index === undefined) return null

  const raw = match[0]
  return {
    start: match.index,
    end: match.index + raw.length,
    token: {
      type: 'wiki',
      embed: raw.startsWith('!'),
      value: raw.replace(/^!?\[\[/, '').replace(/\]\]$/, '')
    } satisfies InlineToken
  }
}

function findTagToken(value: string, start: number) {
  const tagPattern = /(^|[\s([{"'，。；：！？、])#([A-Za-z0-9_\-\u4E00-\u9FFF]+(?:\/[A-Za-z0-9_\-\u4E00-\u9FFF]+)*)(?=$|[\s)\].,;:!?，。；：！？、])/g
  tagPattern.lastIndex = start
  const match = tagPattern.exec(value)
  if (!match || match.index === undefined) return null

  const prefix = match[1] ?? ''
  const tag = match[2] ?? ''
  const tagStart = match.index + prefix.length

  return {
    start: tagStart,
    end: tagStart + tag.length + 1,
    token: {
      type: 'tag',
      value: tag
    } satisfies InlineToken
  }
}

function tokenToNodes(token: InlineToken, markdownFilePath?: string): PhrasingContent[] {
  if (token.type === 'comment') return []

  if (token.type === 'delete') {
    return [
      {
        type: 'delete',
        children: [{ type: 'text', value: token.value }]
      }
    ]
  }

  if (token.type === 'highlight') {
    return [
      {
        type: 'strong',
        children: [{ type: 'text', value: token.value }],
        data: {
          hName: 'mark'
        }
      }
    ]
  }

  if (token.type === 'tag') {
    const tag = normalizeTag(token.value)
    return [
      {
        type: 'link',
        url: `/tags/${encodeURIComponent(tag)}`,
        title: null,
        children: [{ type: 'text', value: `#${token.value}` }],
        data: {
          hProperties: {
            className: ['obsidian-tag']
          }
        }
      } satisfies Link
    ]
  }

  const parsed = parseWikiTarget(token.value)

  if (token.embed && isLikelyImage(parsed.target)) {
    return [
      {
        type: 'image',
        url: resolveObsidianAssetUrl(parsed.target, markdownFilePath),
        alt: parsed.alias || parsed.target,
        title: null,
        data: {
          hProperties: {
            className: ['obsidian-image-inline'],
            loading: 'lazy',
            decoding: 'async',
            ...(parsed.width ? { width: parsed.width } : {})
          }
        }
      } satisfies Image
    ]
  }

  if (token.embed) {
    return [
      {
        type: 'link',
        url: wikiTargetToUrl(parsed),
        title: null,
        children: [{ type: 'text', value: parsed.alias || parsed.target }],
        data: {
          hProperties: {
            className: ['obsidian-wikilink', 'obsidian-embed-link']
          }
        }
      } satisfies Link
    ]
  }

  return [
    {
      type: 'link',
      url: wikiTargetToUrl(parsed),
      title: null,
      children: [{ type: 'text', value: parsed.alias || parsed.target }],
      data: {
        hProperties: {
          className: ['obsidian-wikilink']
        }
      }
    } satisfies Link
  ]
}

function transformObsidianCallouts(tree: Root) {
  visit(tree, 'blockquote', (node: Blockquote) => {
    const firstChild = node.children[0]
    if (!firstChild || firstChild.type !== 'paragraph') return

    const firstText = firstChild.children[0]
    if (!firstText || firstText.type !== 'text') return

    const match = firstText.value.match(/^\[!([A-Za-z-]+)\]([+-])?(?:\s+([^\n]+))?/)
    if (!match) return

    const obsidianType = (match[1] ?? 'note').toLowerCase()
    const alertType = OBSIDIAN_CALLOUT_TYPE_MAP[obsidianType] ?? obsidianType
    const folded = match[2]
    const title = (match[3] ?? obsidianType.toUpperCase()).trim()

    firstText.value = firstText.value.slice(match[0].length).replace(/^\n+/, '')

    if (firstText.value === '') {
      firstChild.children.shift()
      if (firstChild.children[0]?.type === 'break') firstChild.children.shift()
    }

    if (firstChild.children.length === 0) node.children.shift()

    node.data = {
      hName: 'div',
      hProperties: {
        className: [
          'markdown-alert',
          `markdown-alert-${alertType}`,
          'obsidian-callout',
          `obsidian-callout-${obsidianType}`,
          folded ? `obsidian-callout-fold-${folded === '+' ? 'open' : 'closed'}` : ''
        ].filter(Boolean),
        dir: 'auto',
        'data-callout': obsidianType
      }
    }

    node.children.unshift({
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: title
        }
      ],
      data: {
        hProperties: {
          className: ['markdown-alert-title']
        }
      }
    })
  })
}

function hasPhrasingChildren(node: unknown): node is ParentWithChildren & { children: PhrasingContent[] } {
  if (!node || typeof node !== 'object' || !('children' in node)) return false
  const children = (node as ParentWithChildren).children
  if (!Array.isArray(children)) return false

  return children.some(
    (child) =>
      child.type === 'text' ||
      child.type === 'break' ||
      child.type === 'delete' ||
      child.type === 'emphasis' ||
      child.type === 'html' ||
      child.type === 'inlineCode' ||
      child.type === 'link' ||
      child.type === 'strong'
  )
}

function parseWikiTarget(value: string) {
  const [targetWithHeadingAndBlock = '', alias = ''] = value.split('|')
  const [targetWithHeading = '', block = ''] = targetWithHeadingAndBlock.split('^')
  const [target = '', heading = ''] = targetWithHeading.split('#')
  const sizeMatch = alias.trim().match(/^(\d+)(?:x\d+)?$/i)

  return {
    alias: sizeMatch ? '' : alias.trim(),
    block: block.trim(),
    heading: heading.trim(),
    target: target.trim(),
    width: sizeMatch?.[1] ?? ''
  }
}

function wikiTargetToUrl({
  alias: _alias,
  block,
  heading,
  target
}: {
  alias: string
  block: string
  heading: string
  target: string
  width: string
}) {
  const base = target ? `/blog/${encodeURIComponent(fileBasename(target))}` : ''
  const hash = heading || block

  if (!base && hash) return `#${encodeURIComponent(slug(hash))}`
  if (!hash) return base || '#'

  return `${base}#${encodeURIComponent(slug(hash))}`
}

function resolveObsidianAssetUrl(value: string, markdownFilePath?: string) {
  if (/^(https?:|\/|\.\.\/|\.\/)/i.test(value)) return value
  if (!markdownFilePath) return `/attachments/${encodeURI(value)}`

  const currentDir = dirname(markdownFilePath)
  const noteAssetDir = fileBasename(markdownFilePath)
  const candidatePaths = [value, join(noteAssetDir, value)]

  for (const candidatePath of candidatePaths) {
    const normalizedPath = normalize(candidatePath)
    if (!existsSync(join(currentDir, normalizedPath))) continue
    return toRelativeImportPath(normalizedPath)
  }

  return `/attachments/${encodeURI(value)}`
}

function toRelativeImportPath(value: string) {
  const normalizedValue = value.replace(/\\/g, '/')
  return normalizedValue.startsWith('.') ? normalizedValue : `./${normalizedValue}`
}

function isLikelyImage(value: string) {
  const extension = fileExtension(value)
  return IMAGE_EXTENSIONS.has(extension)
}

function fileBasename(value: string) {
  const normalized = value.replace(/\\/g, '/').split('/').pop() ?? value
  return normalized.replace(/\.[A-Za-z0-9]+$/, '')
}

function fileExtension(value: string) {
  return value.split('?')[0]?.split('#')[0]?.split('.').pop()?.toLowerCase() ?? ''
}

function normalizeTag(value: string) {
  return value.split('/')[0]?.toLowerCase() ?? value.toLowerCase()
}
