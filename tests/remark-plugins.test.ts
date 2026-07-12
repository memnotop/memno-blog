import assert from 'node:assert/strict'
import test from 'node:test'
import type { Image, Root } from 'mdast'
import { unified } from 'unified'

import { remarkAddZoomable } from '../packages/pure/plugins/remark-plugins'

test('zoomable images preserve Obsidian rendering properties', async () => {
  const image: Image = {
    type: 'image',
    url: '/attachments/example.webp',
    alt: 'example',
    data: {
      hProperties: {
        className: ['obsidian-image-inline'],
        loading: 'lazy',
        decoding: 'async',
        width: 500
      }
    }
  }
  const tree: Root = {
    type: 'root',
    children: [{ type: 'paragraph', children: [image] }]
  }

  await unified().use(remarkAddZoomable, { className: 'zoomable' }).run(tree)

  assert.deepEqual(image.data?.hProperties, {
    className: ['obsidian-image-inline', 'zoomable'],
    loading: 'lazy',
    decoding: 'async',
    width: 500
  })
})
