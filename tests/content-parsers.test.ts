import assert from 'node:assert/strict'
import test from 'node:test'

import { groupNotesByMonth, parseNotesMarkdown } from '@/utils/notes'
import { normalizeTrainingMarkdown, parseTrainingMarkdown } from '@/utils/training'

test('notes parser renders markdown, sorts entries, and groups months', async () => {
  const notes = await parseNotesMarkdown(
    `---
title: Notes
---

## 2026-06-01｜First

Some **text**.

## 2026-07-02

Later note.
`,
    '/tmp/notes.md'
  )

  assert.equal(notes.length, 2)
  assert.equal(notes[0]?.date, '2026-07-02')
  assert.match(notes[1]?.htmlBody ?? '', /<strong>text<\/strong>/)

  const groups = groupNotesByMonth(notes)
  assert.deepEqual(
    groups.map((group) => group.key),
    ['2026-07', '2026-06']
  )
})

test('training parser keeps structured fields and escapes multiplier asterisks', async () => {
  const source = `---
title: Training 2026
---

## 2026-07-01｜Pull｜level 4

训练内容：
- Pull-up 3*10
- Row 4*8
RPE：15

今天状态不错。
`

  const normalized = normalizeTrainingMarkdown('Pull-up 3*10')
  assert.equal(normalized, 'Pull-up 3\\*10')

  const records = await parseTrainingMarkdown(source, '/tmp/Training.md')
  assert.equal(records.length, 1)
  assert.deepEqual(records[0]?.items, ['Pull-up 3*10', 'Row 4*8'])
  assert.equal(records[0]?.rpe, '15')
  assert.equal(records[0]?.level, 4)
  assert.match(records[0]?.htmlBody ?? '', /Pull-up 3\*10/)
})
