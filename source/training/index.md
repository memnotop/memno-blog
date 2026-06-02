---
title: Training
date: 2026-06-02 21:40:00
type: training
comments: true
---

{% raw %}
<div class="training-board" id="training-board">
  <div class="training-summary">
    <div>
      <p class="training-eyebrow">Training Log</p>
      <h2>训练记录</h2>
      <p>展示最近一年的训练完成情况。2月份之前的记录是之前的训练打卡，一并放上来了。</p>
    </div>
    <div class="training-legend" aria-label="训练感受颜色说明">
      <span>轻松</span>
      <i class="training-cell level-1"></i>
      <i class="training-cell level-2"></i>
      <i class="training-cell level-3"></i>
      <i class="training-cell level-4"></i>
      <i class="training-cell level-5"></i>
      <span>困难</span>
    </div>
  </div>

  <div class="training-heatmap" aria-label="训练日期选择">
    <div class="training-chart-wrap">
      <div class="training-months" id="training-months"></div>
      <div class="training-chart">
        <div class="training-weekdays" aria-hidden="true">
          <span></span>
          <span>Mon</span>
          <span></span>
          <span>Wed</span>
          <span></span>
          <span>Fri</span>
          <span></span>
        </div>
        <div class="training-grid" id="training-grid"></div>
      </div>
    </div>
  </div>

  <div class="training-detail" id="training-detail"></div>
</div>

<script src="/js/training-data.js"></script>
<script>
(() => {
  const board = document.getElementById('training-board')
  if (!board) return

  const levels = {
    0: '暂无记录',
    1: '轻松',
    2: '较轻松',
    3: '合适',
    4: '较困难',
    5: '困难'
  }
  const trainingData = Array.isArray(window.TRAINING_DATA) ? window.TRAINING_DATA : []

  const grid = document.getElementById('training-grid')
  const months = document.getElementById('training-months')
  const detail = document.getElementById('training-detail')
  const dataMap = new Map(trainingData.map(item => [item.date, item]))
  const formatter = new Intl.DateTimeFormat('en', { month: 'short' })
  const weekCount = 53

  const pad = value => String(value).padStart(2, '0')
  const toKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const parseDate = key => {
    const [year, month, day] = key.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const addDays = (date, days) => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
  }
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]))
  const formatBody = value => escapeHtml(value)
    .split(/\n{2,}/)
    .map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`)
    .join('')

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const renderDetail = key => {
    const record = dataMap.get(key)
    if (!record) {
      detail.innerHTML = `
        <article class="training-entry active">
          <div class="training-entry-head">
            <span>${escapeHtml(key)}</span>
            <strong class="level-text level-0">暂无记录</strong>
          </div>
          <h3>这一天还没有训练记录</h3>
          <p><del>忘了吧，大概？</del></p>
        </article>
      `
      return
    }

    detail.innerHTML = `
      <article class="training-entry active">
        <div class="training-entry-head">
          <span>${escapeHtml(record.date)}</span>
          <strong class="level-text level-${record.level}">${record.level} - ${levels[record.level]}</strong>
        </div>
        <h3>${escapeHtml(record.title)}</h3>
        ${record.items.length ? `<ul>${record.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        ${record.rpe ? `<p class="training-rpe">RPE：${escapeHtml(record.rpe)}</p>` : ''}
        <div class="training-body">${formatBody(record.body)}</div>
      </article>
    `
  }

  const renderChart = activeKey => {
    const dates = []
    const currentWeekStart = addDays(today, -today.getDay())
    const gridStart = addDays(currentWeekStart, -(weekCount - 1) * 7)

    for (let index = 0; index < weekCount * 7; index += 1) {
      dates.push(addDays(gridStart, index))
    }

    grid.innerHTML = ''
    months.innerHTML = ''
    grid.style.setProperty('--training-weeks', weekCount)
    months.style.setProperty('--training-weeks', weekCount)

    let lastMonth = ''
    for (let week = 0; week < weekCount; week += 1) {
      const weekDate = addDays(gridStart, week * 7)
      const month = formatter.format(weekDate)
      const label = document.createElement('span')
      label.style.gridColumn = `${week + 1} / span 1`
      label.textContent = month !== lastMonth ? month : ''
      months.appendChild(label)
      lastMonth = month
    }

    dates.forEach((date, index) => {
      const key = toKey(date)
      const week = Math.floor(index / 7)
      const day = date.getDay()
      const isFuture = date > today
      const record = dataMap.get(key)
      const button = document.createElement('button')
      button.className = `training-day level-${record && !isFuture ? record.level : 0}${isFuture ? ' future' : ''}`
      button.type = 'button'
      button.dataset.day = key
      button.style.gridColumn = week + 1
      button.style.gridRow = day + 1
      button.disabled = isFuture
      button.setAttribute('aria-label', `${key} ${isFuture ? '未来日期' : record ? levels[record.level] : '暂无记录'}`)
      button.title = `${key} ${isFuture ? '未来日期' : record ? levels[record.level] : '暂无记录'}`
      button.addEventListener('click', () => {
        if (isFuture) return
        grid.querySelectorAll('.training-day').forEach(item => item.classList.toggle('active', item === button))
        renderDetail(key)
      })
      grid.appendChild(button)
    })

    const selectedKey = activeKey && dates.some(date => toKey(date) === activeKey) ? activeKey : toKey(today)
    const selectedButton = grid.querySelector(`[data-day="${selectedKey}"]`)
    if (selectedButton) {
      selectedButton.classList.add('active')
      renderDetail(selectedKey)
    }
  }

  renderChart(toKey(today))
})()
</script>
{% endraw %}
