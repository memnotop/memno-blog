import { clamp, DAY_MS, HOUR_MS, MINUTE_MS } from '@/utils/date'

export const LIFE_DEFAULT_BIRTHDAY = '2005-06-05'
export const LIFE_EXPECTANCY_YEARS = 80
export const LIFE_GRID_TOTAL = 400

export type ElapsedParts = {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function getElapsedParts(birthDate: Date, nowDate = new Date()): ElapsedParts {
  const endDate = new Date(Math.max(nowDate.valueOf(), birthDate.valueOf()))
  let years = endDate.getFullYear() - birthDate.getFullYear()
  const cursor = new Date(birthDate)
  cursor.setFullYear(birthDate.getFullYear() + years)

  if (cursor > endDate) {
    years -= 1
    cursor.setTime(birthDate.valueOf())
    cursor.setFullYear(birthDate.getFullYear() + years)
  }

  let months = 0
  while (months < 12) {
    const next = new Date(cursor)
    next.setMonth(cursor.getMonth() + 1)
    if (next > endDate) break
    cursor.setTime(next.valueOf())
    months += 1
  }

  const remaining = endDate.valueOf() - cursor.valueOf()
  const days = Math.floor(remaining / DAY_MS)
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS)
  const seconds = Math.floor((remaining % MINUTE_MS) / 1000)

  return { years, months, days, hours, minutes, seconds }
}

export function getLifeSnapshot(
  birthDate: Date,
  nowDate = new Date(),
  totalYears = LIFE_EXPECTANCY_YEARS,
  totalCells = LIFE_GRID_TOTAL
) {
  const elapsedMs = Math.max(0, nowDate.valueOf() - birthDate.valueOf())
  const elapsedDays = Math.floor(elapsedMs / DAY_MS)
  const totalDays = Math.round(clamp(totalYears, 1, 120) * 365.2425)
  const ratio = clamp(elapsedMs / (totalDays * DAY_MS), 0, 1)
  const elapsedParts = getElapsedParts(birthDate, nowDate)

  return {
    elapsedDays,
    elapsedMs,
    elapsedParts,
    filledCells: Math.min(Math.floor(ratio * totalCells), totalCells),
    percent: ratio * 100,
    ratio,
    totalDays,
    totalHours: Math.floor(elapsedMs / HOUR_MS),
    totalMinutes: Math.floor(elapsedMs / MINUTE_MS),
    totalMonths: elapsedParts.years * 12 + elapsedParts.months,
    totalSeconds: Math.floor(elapsedMs / 1000)
  }
}
