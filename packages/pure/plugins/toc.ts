import type { MarkdownHeading } from 'astro'

export interface TocItem extends MarkdownHeading {
  subheadings: TocItem[]
}

export function generateToc(headings: readonly MarkdownHeading[]) {
  const bodyHeadings = headings.filter(({ depth }) => depth > 1)
  const toc: TocItem[] = []
  const stack: TocItem[] = []

  bodyHeadings.forEach((heading) => {
    const item: TocItem = { ...heading, subheadings: [] }

    while (stack.length && stack[stack.length - 1].depth >= item.depth) {
      stack.pop()
    }

    const parent = stack[stack.length - 1]
    if (parent) parent.subheadings.push(item)
    else toc.push(item)

    stack.push(item)
  })

  return toc
}
