import { addDays, formatLocalDate } from '@/utils/date'
import type { TrainingRecord } from '@/utils/training'

const LEVEL_LABELS = {
  0: '暂无记录',
  1: '轻松',
  2: '较轻松',
  3: '合适',
  4: '较困难',
  5: '困难'
} as const

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

function formatBody(value: string) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((part) => `<p>${part.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function readTrainingData() {
  const element = document.getElementById('training-data')
  if (!element?.textContent) return []

  try {
    const value: unknown = JSON.parse(element.textContent)
    return Array.isArray(value) ? (value as TrainingRecord[]) : []
  } catch {
    return []
  }
}

export function initTrainingPage() {
  const board = document.getElementById('training-board')
  const grid = document.getElementById('training-grid')
  const months = document.getElementById('training-months')
  const detail = document.getElementById('training-detail')

  if (!board || !grid || !months || !detail) return
  if (board.dataset.trainingReady === 'true') return

  const trainingData = readTrainingData()
  const dataMap = new Map(trainingData.map((item) => [item.date, item]))
  const formatter = new Intl.DateTimeFormat('en', { month: 'short' })
  const weekCount = 53
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
      return
    }

    const bodyHtml = record.htmlBody || formatBody(record.body)
    detail.innerHTML = `
      <article class="training-entry active">
        <div class="training-entry-head">
          <span>${escapeHtml(record.date)}</span>
          <strong class="level-text level-${record.level}">${record.level} - ${LEVEL_LABELS[record.level]}</strong>
        </div>
        <h2>${escapeHtml(record.title)}</h2>
        ${record.items.length ? `<ul>${record.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${record.rpe ? `<p class="training-rpe">RPE：${escapeHtml(record.rpe)}</p>` : ''}
        ${bodyHtml ? `<div class="training-body">${bodyHtml}</div>` : ''}
      </article>
    `
  }

  const renderChart = (activeKey: string) => {
    const dates: Date[] = []
    const currentWeekStart = addDays(today, -today.getDay())
    const gridStart = addDays(currentWeekStart, -(weekCount - 1) * 7)

    for (let index = 0; index < weekCount * 7; index += 1) {
      dates.push(addDays(gridStart, index))
    }

    grid.replaceChildren()
    months.replaceChildren()
    grid.style.setProperty('--training-weeks', String(weekCount))
    months.style.setProperty('--training-weeks', String(weekCount))

    let lastMonth = ''
    for (let week = 0; week < weekCount; week += 1) {
      const weekDate = addDays(gridStart, week * 7)
      const month = formatter.format(weekDate)
      const label = document.createElement('span')
      label.style.gridColumn = `${week + 1} / span 1`
      label.textContent = month !== lastMonth ? month : ''
      months.append(label)
      lastMonth = month
    }

    dates.forEach((date, index) => {
      const key = formatLocalDate(date)
      const week = Math.floor(index / 7)
      const day = date.getDay()
      const isFuture = date > today
      const record = dataMap.get(key)
      const label = isFuture ? '未来日期' : record ? LEVEL_LABELS[record.level] : '暂无记录'
      const button = document.createElement('button')

      button.className = `training-day level-${record && !isFuture ? record.level : 0}${isFuture ? ' future' : ''}`
      button.type = 'button'
      button.dataset.day = key
      button.style.gridColumn = String(week + 1)
      button.style.gridRow = String(day + 1)
      button.disabled = isFuture
      button.setAttribute('aria-label', `${key} ${label}`)
      button.title = `${key} ${label}`
      button.addEventListener('click', () => {
        if (isFuture) return
        grid
          .querySelectorAll('.training-day')
          .forEach((item) => item.classList.toggle('active', item === button))
        renderDetail(key)
      })
      grid.append(button)
    })

    const fallbackRecord = [...dates]
      .reverse()
      .find((date) => date <= today && dataMap.has(formatLocalDate(date)))
    const todayKey = formatLocalDate(today)
    const selectedKey =
      activeKey && dates.some((date) => formatLocalDate(date) === activeKey)
        ? activeKey
        : dataMap.has(todayKey)
          ? todayKey
          : fallbackRecord
            ? formatLocalDate(fallbackRecord)
            : todayKey
    const selectedButton = grid.querySelector<HTMLElement>(`[data-day="${selectedKey}"]`)

    selectedButton?.classList.add('active')
    if (selectedButton) renderDetail(selectedKey)
  }

  board.dataset.trainingReady = 'true'
  renderChart(formatLocalDate(today))
}
