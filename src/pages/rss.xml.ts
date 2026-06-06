import path from 'node:path'
import type { AstroGlobal, ImageMetadata } from 'astro'
import { getImage } from 'astro:assets'
import type { CollectionEntry } from 'astro:content'
import rss from '@astrojs/rss'
import type { Root } from 'mdast'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import config from 'virtual:config'

import { getBlogCollection, sortMDByDate } from 'astro-pure/server'
import { getArticlePosts } from '@/utils/blog'
import remarkObsidian from '@/plugins/remark-obsidian'

const imagesGlob = import.meta.glob<{ default: ImageMetadata }>(
  '/src/content/**/*.{jpeg,jpg,png,gif,avif,webp}'
)
const projectRoot = process.cwd()

const renderContent = async (post: CollectionEntry<'blog'>, site: URL) => {
  const getLocalImagePath = (url: string) => {
    if (/^[a-z]+:/i.test(url)) return undefined
    if (!post.filePath) return undefined

    const resolvedPath = path.resolve(path.dirname(post.filePath), url)
    const relativePath = path.relative(projectRoot, resolvedPath)
    if (relativePath.startsWith('..')) return undefined

    const globKey = `/${relativePath.split(path.sep).join('/')}`
    return imagesGlob[globKey] ? globKey : undefined
  }

  // Replace image links with the correct path
  function remarkReplaceImageLink() {
    /**
     * @param {Root} tree
     */
    return async function (tree: Root) {
      const promises: Promise<void>[] = []
      visit(tree, 'image', (node) => {
        if (node.url.startsWith('/')) {
          node.url = `${site}${node.url.replace('/', '')}`
        } else {
          const imagePath = getLocalImagePath(node.url)
          const promise =
            imagePath &&
            imagesGlob[imagePath]?.().then(async (res) => {
              const imagePath = res?.default
              if (imagePath) {
                node.url = `${site}${(await getImage({ src: imagePath })).src.replace('/', '')}`
              }
            })
          if (promise) promises.push(promise)
        }
      })
      await Promise.all(promises)
    }
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkObsidian)
    .use(remarkAlert)
    .use(remarkReplaceImageLink)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process({
      value: post.body,
      path: post.filePath ?? path.join(projectRoot, 'src/content', `${post.id}.md`)
    })

  return String(file)
}

const GET = async (context: AstroGlobal) => {
  const allPostsByDate = sortMDByDate(
    getArticlePosts(await getBlogCollection())
  ) as CollectionEntry<'blog'>[]
  const siteUrl = context.site ?? new URL(import.meta.env.SITE)

  return rss({
    // Basic configs
    trailingSlash: false,
    xmlns: { h: 'http://www.w3.org/TR/html4/' },
    stylesheet: '/scripts/pretty-feed-v3.xsl',

    // Contents
    title: config.title,
    description: config.description,
    site: import.meta.env.SITE,
    items: await Promise.all(
      allPostsByDate.map(async (post) => {
        const heroImage =
          typeof post.data.heroImageSrc === 'string'
            ? post.data.heroImageSrc
            : post.data.heroImageSrc?.src

        return {
          pubDate: post.data.publishDate,
          link: `/blog/${post.id}`,
          customData: heroImage
            ? `<h:img src="${heroImage}" /><enclosure url="${heroImage}" />`
            : undefined,
          content: await renderContent(post, siteUrl),
          ...post.data
        }
      })
    )
  })
}

export { GET }
