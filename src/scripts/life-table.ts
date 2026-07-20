import { clamp, DAY_MS, formatLocalDate, HOUR_MS, MINUTE_MS, parseLocalDate } from '@/utils/date'
import { getElapsedParts } from '@/utils/life'

const NUMBER_FORMATTER = new Intl.NumberFormat('en')
const STORAGE_KEY = 'memno-life-birthday'
const YEAR_MS = 365.2425 * DAY_MS
const CELL_STATE_CLASSES = [
  'is-lived',
  'is-sleep',
  'is-work',
  'is-child',
  'is-parent',
  'is-retire',
  'is-left'
]

function getSavedBirthday() {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveBirthday(value: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // The input still works for the current page view when storage is unavailable.
  }
}

function createLifeCells(grid: HTMLElement, totalCells: number) {
  const existingCells = Array.from(grid.querySelectorAll<HTMLElement>('[data-life-cell]'))
  if (existingCells.length) return existingCells

  const fragment = document.createDocumentFragment()
  for (let index = 0; index < totalCells; index += 1) {
    const cell = document.createElement('span')
    cell.dataset.lifeCell = ''
    cell.dataset.index = String(index)
    cell.setAttribute('aria-hidden', 'true')
    fragment.append(cell)
  }

  grid.append(fragment)
  return Array.from(grid.querySelectorAll<HTMLElement>('[data-life-cell]'))
}

function initLifeTable(root: HTMLElement) {
  if (root.dataset.lifeTableReady === 'true') return

  const days = root.querySelector<HTMLElement>('[data-life-days]')
  const squares = root.querySelector<HTMLElement>('[data-life-squares]')
  const yearsTotal = root.querySelector<HTMLElement>('[data-life-years-total]')
  const monthsTotal = root.querySelector<HTMLElement>('[data-life-months-total]')
  const daysTotal = root.querySelector<HTMLElement>('[data-life-days-total]')
  const hoursTotal = root.querySelector<HTMLElement>('[data-life-hours-total]')
  const minutesTotal = root.querySelector<HTMLElement>('[data-life-minutes-total]')
  const secondsTotal = root.querySelector<HTMLElement>('[data-life-seconds-total]')
  const grid = root.querySelector<HTMLElement>('[data-life-grid]')
  const percent = root.querySelector<HTMLElement>('[data-life-percent]')
  const percentFace = root.querySelector<HTMLElement>('[data-life-percent-face]')
  const age = root.querySelector<HTMLElement>('[data-life-age]')
  const liquid = root.querySelector<HTMLElement>('.mem-life-liquid')
  const birthdayInput = root.querySelector<HTMLInputElement>('[data-life-birthday-input]')

  if (!days || !grid) return

  const totalCells = Number(root.dataset.totalCells) || 400
  const defaultYears = Number(root.dataset.totalYears) || 80
  const cells = createLifeCells(grid, totalCells)
  const savedBirthday = getSavedBirthday()
  let birthDate = parseLocalDate(savedBirthday || '') ?? parseLocalDate(root.dataset.birthday || '')
  let cellStateSignature = ''
  let renderTimer: number | undefined
  const controller = new AbortController()

  if (birthdayInput) {
    birthdayInput.max = formatLocalDate(new Date())
    if (birthDate) birthdayInput.value = formatLocalDate(birthDate)
  }

  const render = () => {
    if (!birthDate) return

    const now = new Date()
    const elapsedMs = Math.max(0, now.valueOf() - birthDate.valueOf())
    const elapsedDays = Math.floor(elapsedMs / DAY_MS)
    const totalYears = clamp(defaultYears, 1, 120)
    const totalDays = Math.round(totalYears * 365.2425)
    const ratio = clamp(elapsedMs / (totalDays * DAY_MS), 0, 1)
    const livedCells = Math.min(Math.floor(ratio * totalCells), totalCells)
    const cellsPerYear = totalCells / totalYears
    const ageYears = Math.min(elapsedMs / YEAR_MS, totalYears)
    const remainingYears = Math.max(0, totalYears - ageYears)
    const retireAge = 65
    const retireCell = Math.min(totalCells - 1, Math.round((retireAge / totalYears) * totalCells))
    const sleepCells = Math.round((remainingYears / 3) * cellsPerYear)
    const workCells = Math.round((Math.max(0, retireAge - ageYears) / 3) * cellsPerYear)
    const childCells = Math.round(18 * (5 / 24) * cellsPerYear)
    const parentCells = Math.round((remainingYears / 12) * cellsPerYear)

    const getCellClass = (index: number) => {
      if (index < livedCells) return 'is-lived'
      if (index === retireCell) return 'is-retire'

      let cursor = livedCells
      if (index < cursor + sleepCells) return 'is-sleep'
      cursor += sleepCells
      if (index < cursor + workCells) return 'is-work'
      cursor += workCells
      if (index < cursor + childCells) return 'is-child'
      cursor += childCells
      if (index < cursor + parentCells) return 'is-parent'
      return 'is-left'
    }

    const nextCellStateSignature = [
      livedCells,
      retireCell,
      sleepCells,
      workCells,
      childCells,
      parentCells
    ].join(':')
    if (nextCellStateSignature !== cellStateSignature) {
      cells.forEach((cell, index) => {
        cell.classList.remove(...CELL_STATE_CLASSES)
        cell.classList.add(getCellClass(index))
      })
      cellStateSignature = nextCellStateSignature
    }

    const dayText = NUMBER_FORMATTER.format(Math.min(elapsedDays, totalDays))
    const parts = getElapsedParts(birthDate, now)
    const percentText = `${(ratio * 100).toFixed(2)}%`
    const totalMonths = parts.years * 12 + parts.months

    if (squares) squares.textContent = String(livedCells)
    if (yearsTotal) yearsTotal.textContent = NUMBER_FORMATTER.format(parts.years)
    if (monthsTotal) monthsTotal.textContent = String(totalMonths)
    if (daysTotal) daysTotal.textContent = String(Math.min(elapsedDays, totalDays))
    if (hoursTotal) hoursTotal.textContent = String(Math.floor(elapsedMs / HOUR_MS))
    if (minutesTotal) minutesTotal.textContent = String(Math.floor(elapsedMs / MINUTE_MS))
    if (secondsTotal) secondsTotal.textContent = String(Math.floor(elapsedMs / 1000))
    if (percent) percent.textContent = percentText
    if (percentFace) percentFace.textContent = `${Math.round(ratio * 100)}%`
    if (age) age.textContent = `${parts.years} 年 ${parts.months} 月 ${parts.days} 天`

    days.textContent = dayText
    root.style.setProperty('--life-fill', percentText)
    grid.setAttribute(
      'aria-label',
      `${dayText} 天已经过去，${livedCells} / ${totalCells} 个方块已填充`
    )
    liquid?.setAttribute('aria-label', `${totalYears} 岁人生尺度中已经过去 ${percentText}`)
  }

  const setBirthday = (value: string, persist = true) => {
    const nextBirthDate = parseLocalDate(value)
    if (!nextBirthDate || nextBirthDate > new Date()) {
      birthdayInput?.setAttribute('aria-invalid', 'true')
      return
    }

    const nextValue = formatLocalDate(nextBirthDate)
    birthDate = nextBirthDate
    cellStateSignature = ''
    root.dataset.birthday = nextValue
    if (birthdayInput) {
      birthdayInput.value = nextValue
      birthdayInput.removeAttribute('aria-invalid')
    }
    if (persist) saveBirthday(nextValue)
    render()
  }

  const stopRendering = () => {
    if (renderTimer === undefined) return
    window.clearInterval(renderTimer)
    renderTimer = undefined
  }

  const cleanup = () => {
    stopRendering()
    controller.abort()
    delete root.dataset.lifeTableReady
  }

  const startRendering = () => {
    if (document.hidden || renderTimer !== undefined) return
    if (!root.isConnected) {
      cleanup()
      return
    }

    render()
    renderTimer = window.setInterval(() => {
      if (!root.isConnected) cleanup()
      else render()
    }, 1000)
  }

  const handleVisibilityChange = () => {
    if (document.hidden) stopRendering()
    else startRendering()
  }

  const handlePageHide = (event: PageTransitionEvent) => {
    stopRendering()
    if (!event.persisted) cleanup()
  }

  birthdayInput?.addEventListener(
    'input',
    () => {
      if (birthdayInput.value.length === 10) setBirthday(birthdayInput.value)
    },
    { signal: controller.signal }
  )
  birthdayInput?.addEventListener('change', () => setBirthday(birthdayInput.value), {
    signal: controller.signal
  })
  document.addEventListener('visibilitychange', handleVisibilityChange, {
    signal: controller.signal
  })
  window.addEventListener('pagehide', handlePageHide, { signal: controller.signal })
  window.addEventListener('pageshow', startRendering, { signal: controller.signal })

  root.dataset.lifeTableReady = 'true'
  startRendering()
}

export function initLifeTables() {
  document.querySelectorAll<HTMLElement>('[data-life-count]').forEach(initLifeTable)
}
