export function initNotesPage() {
  const input = document.getElementById('notes-search')
  const empty = document.getElementById('notes-empty')
  const expandAll = document.getElementById('notes-expand-all')
  const collapseAll = document.getElementById('notes-collapse-all')
  const months = Array.from(document.querySelectorAll<HTMLDetailsElement>('[data-notes-month]'))

  if (!(input instanceof HTMLInputElement) || !empty || months.length === 0) return
  if (input.dataset.notesReady === 'true') return

  const controller = new AbortController()
  const monthGroups = months.map((month) => ({
    entries: Array.from(month.querySelectorAll<HTMLElement>('[data-note-entry]')),
    month
  }))
  let filterFrame: number | undefined
  let filterPending = false

  const filterNotes = () => {
    const query = input.value.trim().toLowerCase()
    let hasVisibleEntry = false

    for (const { entries, month } of monthGroups) {
      let hasVisibleMonthEntry = false

      for (const entry of entries) {
        const text = entry.dataset.noteContent ?? ''
        const isVisible = !query || text.includes(query)
        entry.hidden = !isVisible
        hasVisibleMonthEntry ||= isVisible
      }

      month.hidden = !hasVisibleMonthEntry
      if (query && hasVisibleMonthEntry) month.open = true
      hasVisibleEntry ||= hasVisibleMonthEntry
    }

    empty.hidden = hasVisibleEntry
  }

  const cancelScheduledFilter = () => {
    if (filterFrame === undefined) return
    window.cancelAnimationFrame(filterFrame)
    filterFrame = undefined
  }

  const scheduleFilter = () => {
    filterPending = true
    if (document.hidden || filterFrame !== undefined) return
    filterFrame = window.requestAnimationFrame(() => {
      filterFrame = undefined
      filterPending = false
      filterNotes()
    })
  }

  input.addEventListener('input', scheduleFilter, { signal: controller.signal })
  expandAll?.addEventListener(
    'click',
    () => {
      for (const month of months) {
        if (!month.hidden) month.open = true
      }
    },
    { signal: controller.signal }
  )
  collapseAll?.addEventListener(
    'click',
    () => {
      for (const month of months) month.open = false
    },
    { signal: controller.signal }
  )
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) cancelScheduledFilter()
      else if (filterPending) scheduleFilter()
    },
    { signal: controller.signal }
  )
  window.addEventListener(
    'pageshow',
    (event) => {
      if (event.persisted || input.value) scheduleFilter()
    },
    { signal: controller.signal }
  )
  window.addEventListener(
    'pagehide',
    (event) => {
      cancelScheduledFilter()
      if (!event.persisted) controller.abort()
    },
    { signal: controller.signal }
  )

  input.dataset.notesReady = 'true'
}
