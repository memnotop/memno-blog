import type { Image, Root } from 'mdast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

// Cannot use '../utils' for plugin absolute path
import mdastToString from '../utils/mdast-util-to-string'
import getReadingTime from '../utils/reading-time'

export const remarkAddZoomable: Plugin<[{ className?: string }], Root> = function ({
  className = 'zoomable'
}) {
  return function (tree) {
    visit(tree, 'image', (node: Image) => {
      const hProperties = node.data?.hProperties ?? {}
      const currentClassName = hProperties.className
      const classNames = Array.isArray(currentClassName)
        ? currentClassName.map(String)
        : typeof currentClassName === 'string'
          ? currentClassName.split(/\s+/).filter(Boolean)
          : []

      node.data = {
        ...node.data,
        hProperties: {
          ...hProperties,
          className: Array.from(new Set([...classNames, className])),
          loading: hProperties.loading ?? 'lazy',
          decoding: hProperties.decoding ?? 'async',
          layout: hProperties.layout ?? 'constrained',
          sizes: hProperties.sizes ?? '(max-width: 768px) calc(100vw - 2rem), 65ch'
        }
      }
    })
  }
}

export const remarkReadingTime: Plugin<[], Root> = function () {
  return function (tree, { data }) {
    const textOnPage = mdastToString(tree)
    const readingTime = getReadingTime(textOnPage)
    // readingTime.text will give us minutes read as a friendly string,
    // i.e. "3 min read"
    if (data.astro && data.astro.frontmatter) {
      data.astro.frontmatter.minutesRead = readingTime.text
      data.astro.frontmatter.words = readingTime.words
    }
  }
}
