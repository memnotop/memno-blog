import { addDays, formatLocalDate } from '@/utils/date'
import type { TrainingLevel, TrainingRecord } from '@/utils/training'

export const TRAINING_WEEK_COUNT = 53
export const TRAINING_TIME_ZONE = 'Asia/Shanghai'

export const TRAINING_LEVEL_LABELS: Record<TrainingLevel, string> = {
  0: '暂无记录',
  1: '轻松',
  2: '较轻松',
  3: '合适',
  4: '较困难',
  5: '困难'
}

type CalendarRecord = Pick<TrainingRecord, 'date' | 'level'>

export type TrainingCalendarDay = {
  date: string
  level: TrainingLevel
  isFuture: boolean
  label: string
}

export type TrainingCalendarMonth = {
  label: string
  week: number
}

export function getDateKeyInTimeZone(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))

  return `${values.year}-${values.month}-${values.day}`
}

export function getDateInTimeZone(timeZone: string, now = new Date()) {
  const [year, month, day] = getDateKeyInTimeZone(timeZone, now).split('-').map(Number)
  const date = new Date(year, month - 1, day)

  date.setHours(0, 0, 0, 0)
  return date
}

export function createTrainingCalendar(
  records: CalendarRecord[],
  today: Date,
  weekCount = TRAINING_WEEK_COUNT
) {
  const normalizedToday = new Date(today)
  normalizedToday.setHours(0, 0, 0, 0)

  const recordMap = new Map(records.map((record) => [record.date, record]))
  const currentWeekStart = addDays(normalizedToday, -normalizedToday.getDay())
  const gridStart = addDays(currentWeekStart, -(weekCount - 1) * 7)
  const days: TrainingCalendarDay[] = []
  const months: TrainingCalendarMonth[] = []
  const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short' })
  let previousMonth = -1

  for (let week = 0; week < weekCount; week += 1) {
    const weekDate = addDays(gridStart, week * 7)
    const month = weekDate.getMonth()

    if (month !== previousMonth) {
      months.push({ label: monthFormatter.format(weekDate), week })
      previousMonth = month
    }

    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = addDays(weekDate, weekday)
      const dateKey = formatLocalDate(date)
      const isFuture = date > normalizedToday
      const record = recordMap.get(dateKey)
      const level = record && !isFuture ? record.level : 0

      days.push({
        date: dateKey,
        level,
        isFuture,
        label: isFuture ? '未来日期' : TRAINING_LEVEL_LABELS[level]
      })
    }
  }

  const todayKey = formatLocalDate(normalizedToday)
  const todayDay = days.find((day) => day.date === todayKey && !day.isFuture)
  const latestRecordedDay = [...days]
    .reverse()
    .find((day) => !day.isFuture && recordMap.has(day.date))
  const selectedKey =
    (todayDay && recordMap.has(todayKey) ? todayKey : latestRecordedDay?.date) ??
    todayDay?.date ??
    ''

  return {
    days,
    months,
    selectedKey,
    todayKey,
    weekCount
  }
}
