import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createTrainingCalendar,
  getDateInTimeZone,
  getDateKeyInTimeZone,
  TRAINING_WEEK_COUNT
} from '@/utils/training-calendar'

test('training calendar emits a complete 53-week server-rendered grid', () => {
  const calendar = createTrainingCalendar(
    [
      {
        date: '2026-07-10',
        level: 4
      }
    ],
    new Date(2026, 6, 12)
  )

  assert.equal(calendar.weekCount, TRAINING_WEEK_COUNT)
  assert.equal(calendar.days.length, 371)
  assert.equal(calendar.days[0]?.date, '2025-07-13')
  assert.equal(calendar.days[6]?.date, '2025-07-19')
  assert.equal(calendar.days[7]?.date, '2025-07-20')
  assert.equal(calendar.days.at(-1)?.date, '2026-07-18')
  assert.equal(calendar.selectedKey, '2026-07-10')
  assert.equal(calendar.days.find((day) => day.date === '2026-07-10')?.level, 4)
  assert.deepEqual(
    calendar.days.filter((day) => day.isFuture).map((day) => day.date),
    ['2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18']
  )
  assert.equal(calendar.months[0]?.label, 'Jul')
  assert.equal(calendar.months[0]?.week, 0)
})

test('training calendar prefers today records and otherwise falls back to today', () => {
  const today = new Date(2026, 6, 12)
  const withTodayRecord = createTrainingCalendar([{ date: '2026-07-12', level: 3 }], today)
  const withoutRecords = createTrainingCalendar([], today)

  assert.equal(withTodayRecord.selectedKey, '2026-07-12')
  assert.equal(withoutRecords.selectedKey, '2026-07-12')
})

test('training calendar rolls forward when the static server window expires', () => {
  const serverCalendar = createTrainingCalendar([], new Date(2026, 6, 12))
  const clientCalendar = createTrainingCalendar(
    [{ date: '2026-07-19', level: 3 }],
    new Date(2026, 6, 19)
  )

  assert.equal(
    serverCalendar.days.some((day) => day.date === '2026-07-19'),
    false
  )
  assert.equal(clientCalendar.days.length, 371)
  assert.equal(clientCalendar.days[0]?.date, '2025-07-20')
  assert.equal(clientCalendar.days[6]?.date, '2025-07-26')
  assert.equal(clientCalendar.days[7]?.date, '2025-07-27')
  assert.equal(clientCalendar.days.at(-1)?.date, '2026-07-25')
  assert.equal(clientCalendar.selectedKey, '2026-07-19')
})

test('training calendar resolves the build date in the site time zone', () => {
  const now = new Date('2026-07-11T16:30:00.000Z')
  const date = getDateInTimeZone('Asia/Shanghai', now)

  assert.equal(getDateKeyInTimeZone('Asia/Shanghai', now), '2026-07-12')
  assert.equal(date.getFullYear(), 2026)
  assert.equal(date.getMonth(), 6)
  assert.equal(date.getDate(), 12)
})
