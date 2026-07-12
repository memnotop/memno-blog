export function initNotesPage() {
  const input = document.getElementById('notes-search')
  const empty = document.getElementById('notes-empty')
  const expandAll = document.getElementById('notes-expand-all')
  const collapseAll = document.getElementById('notes-collapse-all')
  const months = Array.from(document.querySelectorAll<HTMLDetailsElement>('[data-notes-month]'))

  if (!(input instanceof HTMLInputElement) || !empty || months.length === 0) return
  if (input.dataset.notesReady === 'true') return

  const filterNotes = () => {
    const query = input.value.trim().toLowerCase()
    let hasVisibleEntry = false

    for (const month of months) {
      const entries = Array.from(month.querySelectorAll<HTMLElement>('[data-note-entry]'))
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

  input.addEventListener('input', filterNotes)
  expandAll?.addEventListener('click', () => {
    for (const month of months) {
      if (!month.hidden) month.open = true
    }
  })
  collapseAll?.addEventListener('click', () => {
    for (const month of months) month.open = false
  })

  input.dataset.notesReady = 'true'
}
