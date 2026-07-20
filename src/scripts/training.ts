import type { TrainingRecord } from '@/utils/training'
import {
  createTrainingCalendar,
  getDateInTimeZone,
  getDateKeyInTimeZone,
  TRAINING_LEVEL_LABELS,
  TRAINING_TIME_ZONE
} from '@/utils/training-calendar'
import type { TrainingCalendarDay } from '@/utils/training-calendar'

type ClientTrainingRecord = Omit<TrainingRecord, 'body'>

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

function escapeHtml(value: unknown) {
  return String(value).replace(/[&<>"']/g, (character) => ESCAPE_MAP[character] ?? character)
}

function readTrainingData() {
  const element = document.getElementById('training-data')
  if (!element?.textContent) return []

  try {
    const value: unknown = JSON.parse(element.textContent)
    return Array.isArray(value) ? (value as ClientTrainingRecord[]) : []
  } catch {
    return []
  }
}

export function initTrainingPage() {
  const board = document.getElementById('training-board')
  const grid = document.getElementById('training-grid')
  const months = document.getElementById('training-months')
  const detail = document.getElementById('training-detail')
  const status = document.getElementById('training-status')

  if (!board || !grid || !months || !detail || !status) return
  if (board.dataset.trainingReady === 'true') return

  const trainingData = readTrainingData()
  const dataMap = new Map(trainingData.map((item) => [item.date, item]))
  let dateButtons = [...grid.querySelectorAll<HTMLButtonElement>('.training-day')]
  let selectedButton = grid.querySelector<HTMLButtonElement>(
    '.training-day[aria-checked="true"]:not(:disabled)'
  )

  const announceDetail = (key: string, record?: ClientTrainingRecord) => {
    status.textContent = record ? `已选择 ${key}，${record.title}` : `已选择 ${key}，暂无训练记录`
  }

  const renderDetail = (key: string) => {
    const record = dataMap.get(key)
    if (!record) {
      detail.innerHTML = `
        <article class="training-entry active">
          <div class="training-entry-head">
            <span>${escapeHtml(key)}</span>
            <strong class="level-text level-0">暂无记录</strong>
          </div>
          <h2>这一天还没有训练记录</h2>
          <p><del>忘了吧，大概？</del></p>
        </article>
      `
      announceDetail(key)
      return
    }

    detail.innerHTML = `
      <article class="training-entry active">
        <div class="training-entry-head">
          <span>${escapeHtml(record.date)}</span>
          <strong class="level-text level-${record.level}">${record.level} - ${TRAINING_LEVEL_LABELS[record.level]}</strong>
        </div>
        <h2>${escapeHtml(record.title)}</h2>
        ${record.items.length ? `<ul>${record.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${record.rpe ? `<p class="training-rpe">RPE：${escapeHtml(record.rpe)}</p>` : ''}
        ${record.htmlBody ? `<div class="training-body">${record.htmlBody}</div>` : ''}
      </article>
    `
    announceDetail(key, record)
  }

  const selectDay = (button: HTMLButtonElement, focus = false) => {
    if (button.disabled) return

    if (selectedButton !== button) {
      if (selectedButton) {
        selectedButton.classList.remove('active')
        selectedButton.tabIndex = -1
        selectedButton.setAttribute('aria-checked', 'false')
      }

      selectedButton = button
      button.classList.add('active')
      button.tabIndex = 0
      button.setAttribute('aria-checked', 'true')
    }

    const key = button.dataset.day
    if (key) renderDetail(key)
    if (focus) button.focus()
  }

  const createDayButton = (day: TrainingCalendarDay, selectedKey: string, todayKey: string) => {
    const isSelected = day.date === selectedKey
    const button = document.createElement('button')

    button.className = [
      'training-day',
      `level-${day.level}`,
      day.isFuture ? 'future' : '',
      isSelected ? 'active' : ''
    ]
      .filter(Boolean)
      .join(' ')
    button.type = 'button'
    button.dataset.day = day.date
    button.disabled = day.isFuture
    button.tabIndex = isSelected ? 0 : -1
    button.setAttribute('role', 'radio')
    button.setAttribute('aria-checked', isSelected ? 'true' : 'false')
    button.setAttribute('aria-label', `${day.date} ${day.label}`)
    button.title = `${day.date} ${day.label}`
    if (day.date === todayKey) button.setAttribute('aria-current', 'date')

    return button
  }

  const rebuildCalendar = (calendar: ReturnType<typeof createTrainingCalendar>) => {
    const monthFragment = document.createDocumentFragment()
    const dayFragment = document.createDocumentFragment()
    const nextButtons: HTMLButtonElement[] = []

    for (const month of calendar.months) {
      const label = document.createElement('span')
      label.style.gridColumn = `${month.week + 1} / span 1`
      label.textContent = month.label
      monthFragment.append(label)
    }

    for (const day of calendar.days) {
      const button = createDayButton(day, calendar.selectedKey, calendar.todayKey)
      dayFragment.append(button)
      nextButtons.push(button)
    }

    months.style.setProperty('--training-weeks', String(calendar.weekCount))
    grid.style.setProperty('--training-weeks', String(calendar.weekCount))
    months.replaceChildren(monthFragment)
    grid.replaceChildren(dayFragment)
    dateButtons = nextButtons
    selectedButton =
      dateButtons.find((button) => button.dataset.day === calendar.selectedKey) ?? null

    if (selectedButton) renderDetail(calendar.selectedKey)
  }

  const findRowBoundary = (index: number, direction: 'start' | 'end') => {
    const row = index % 7
    const start = direction === 'start' ? 0 : dateButtons.length - 1
    const step = direction === 'start' ? 1 : -1

    for (
      let nextIndex = start;
      nextIndex >= 0 && nextIndex < dateButtons.length;
      nextIndex += step
    ) {
      const button = dateButtons[nextIndex]
      if (nextIndex % 7 === row && !button.disabled) return button
    }

    return null
  }

  const findEnabledBoundary = (direction: 'start' | 'end') => {
    const start = direction === 'start' ? 0 : dateButtons.length - 1
    const step = direction === 'start' ? 1 : -1

    for (let index = start; index >= 0 && index < dateButtons.length; index += step) {
      const button = dateButtons[index]
      if (!button.disabled) return button
    }

    return null
  }

  grid.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return

    const button = event.target.closest<HTMLButtonElement>('.training-day')
    if (!button || button.disabled || !grid.contains(button)) return
    selectDay(button)
  })

  grid.addEventListener('keydown', (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return
    if (!event.target.classList.contains('training-day') || event.target.disabled) return

    const button = event.target
    const index = dateButtons.indexOf(button)
    if (index === -1) return

    let nextButton: HTMLButtonElement | null = null
    switch (event.key) {
      case 'ArrowLeft':
        nextButton = dateButtons[index - 7] ?? null
        break
      case 'ArrowRight':
        nextButton = dateButtons[index + 7] ?? null
        break
      case 'ArrowUp':
        nextButton = index % 7 > 0 ? (dateButtons[index - 1] ?? null) : null
        break
      case 'ArrowDown':
        nextButton = index % 7 < 6 ? (dateButtons[index + 1] ?? null) : null
        break
      case 'Home':
        nextButton =
          event.ctrlKey || event.metaKey
            ? findEnabledBoundary('start')
            : findRowBoundary(index, 'start')
        break
      case 'End':
        nextButton =
          event.ctrlKey || event.metaKey
            ? findEnabledBoundary('end')
            : findRowBoundary(index, 'end')
        break
      default:
        return
    }

    event.preventDefault()
    if (nextButton && !nextButton.disabled) selectDay(nextButton, true)
  })

  const currentDate = getDateKeyInTimeZone(TRAINING_TIME_ZONE)
  let currentButton = grid.querySelector<HTMLButtonElement>(`[data-day="${currentDate}"]`)
  let clientCalendar: ReturnType<typeof createTrainingCalendar> | null = null

  if (!currentButton || currentButton.disabled) {
    clientCalendar = createTrainingCalendar(trainingData, getDateInTimeZone(TRAINING_TIME_ZONE))
  }

  if (!currentButton && clientCalendar) {
    rebuildCalendar(clientCalendar)
    currentButton = grid.querySelector<HTMLButtonElement>(`[data-day="${currentDate}"]`)
  }

  if (currentButton) {
    if (currentButton.disabled) {
      const currentIndex = dateButtons.indexOf(currentButton)

      for (const button of dateButtons.slice(Math.max(0, currentIndex - 6), currentIndex + 1)) {
        const key = button.dataset.day
        if (!button.disabled || !key || key > currentDate) continue

        const record = dataMap.get(key)
        const level = record?.level ?? 0
        const label = TRAINING_LEVEL_LABELS[level]

        button.disabled = false
        button.classList.remove('future', 'level-0')
        button.classList.add(`level-${level}`)
        button.setAttribute('aria-label', `${key} ${label}`)
        button.title = `${key} ${label}`
      }
    }

    const previousCurrentButton = grid.querySelector<HTMLButtonElement>('[aria-current="date"]')
    if (previousCurrentButton !== currentButton) {
      previousCurrentButton?.removeAttribute('aria-current')
      currentButton.setAttribute('aria-current', 'date')
    }

    if (clientCalendar) {
      const nextSelectedButton = grid.querySelector<HTMLButtonElement>(
        `[data-day="${clientCalendar.selectedKey}"]`
      )
      if (nextSelectedButton && selectedButton !== nextSelectedButton) selectDay(nextSelectedButton)
    }
  }

  board.dataset.trainingReady = 'true'

  if (!selectedButton) {
    const fallbackButton = dateButtons.find((button) => !button.disabled)
    if (fallbackButton) selectDay(fallbackButton)
  }
}
