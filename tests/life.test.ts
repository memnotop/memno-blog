import assert from 'node:assert/strict'
import test from 'node:test'

import { formatLocalDate, parseLocalDate } from '@/utils/date'
import { getElapsedParts, getLifeSnapshot } from '@/utils/life'

test('local date helpers reject rolled-over calendar dates', () => {
  assert.equal(formatLocalDate(new Date(2026, 6, 12)), '2026-07-12')
  assert.equal(parseLocalDate('2026-02-29'), null)
  assert.equal(parseLocalDate('not-a-date'), null)

  const leapDay = parseLocalDate('2024-02-29')
  assert.ok(leapDay)
  assert.equal(formatLocalDate(leapDay), '2024-02-29')
})

test('elapsed life parts and aggregate snapshot stay consistent', () => {
  const birthday = new Date(2000, 0, 15, 0, 0, 0)
  const now = new Date(2024, 2, 20, 2, 3, 4)
  const elapsed = getElapsedParts(birthday, now)

  assert.deepEqual(elapsed, {
    years: 24,
    months: 2,
    days: 5,
    hours: 2,
    minutes: 3,
    seconds: 4
  })

  const snapshot = getLifeSnapshot(birthday, now, 80, 400)
  assert.equal(snapshot.elapsedParts.years, elapsed.years)
  assert.equal(snapshot.totalMonths, 290)
  assert.ok(snapshot.ratio > 0 && snapshot.ratio < 1)
  assert.equal(snapshot.filledCells, Math.floor(snapshot.ratio * 400))
})
