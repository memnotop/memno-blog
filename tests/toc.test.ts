import assert from 'node:assert/strict'
import test from 'node:test'
import { generateToc } from '../packages/pure/plugins/toc'

test('TOC supports documents that start with h3 headings', () => {
  const toc = generateToc([
    { depth: 3, slug: 'cats', text: '猫狗' },
    { depth: 3, slug: 'status', text: '近况' }
  ])

  assert.deepEqual(
    toc.map(({ depth, slug, text, subheadings }) => ({ depth, slug, text, subheadings })),
    [
      { depth: 3, slug: 'cats', text: '猫狗', subheadings: [] },
      { depth: 3, slug: 'status', text: '近况', subheadings: [] }
    ]
  )
})
