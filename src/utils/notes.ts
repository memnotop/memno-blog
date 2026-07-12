import { readFile } from 'node:fs/promises'

import { parseLocalDate } from '@/utils/date'
import { renderMarkdownFragment, stripFrontmatter } from '@/utils/markdown'

export type NoteEntry = {
  id: string
  date: string
  day: string
  month: string
  monthKey: string
  monthLabel: string
  title: string
  body: string
  htmlBody: string
  searchableText: string
}

export type NoteMonth = {
  key: string
  label: string
  entries: NoteEntry[]
}

const dateFormatter = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' })
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

export function normalizeNoteMarkdown(value: string) {
  return value.replace(/\r\n/g, '\n').trim()
}

export async function parseNotesMarkdown(source: string, filePath: string): Promise<NoteEntry[]> {
  const body = stripFrontmatter(source)
  const entryPattern = /^##\s+(\d{4}-\d{2}-\d{2})(?:\s*[|｜]\s*(.*?))?\s*$/gm
  const matches = [...body.matchAll(entryPattern)]
  const entries: NoteEntry[] = []

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const next = matches[index + 1]
    const date = match[1]
    const localDate = parseLocalDate(date)
    if (!localDate) continue

    const title = (match[2] ?? '').trim()
    const contentStart = (match.index ?? 0) + match[0].length
    const contentEnd = next?.index ?? body.length
    const noteBody = body.slice(contentStart, contentEnd).trim()
    const [month, day] = dateFormatter.format(localDate).split(' ')
    const monthKey = date.slice(0, 7)

    entries.push({
      id: `${date}-${index}`,
      date,
      day,
      month,
      monthKey,
      monthLabel: monthFormatter.format(localDate),
      title,
      body: noteBody,
      htmlBody: await renderMarkdownFragment(normalizeNoteMarkdown(noteBody), filePath),
      searchableText: `${date} ${title} ${noteBody}`.toLowerCase()
    })
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date))
}

export async function loadNotes(filePath: string) {
  try {
    return await parseNotesMarkdown(await readFile(filePath, 'utf8'), filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}

export function groupNotesByMonth(entries: NoteEntry[]): NoteMonth[] {
  const groups = new Map<string, NoteMonth>()

  for (const entry of entries) {
    const group = groups.get(entry.monthKey) ?? {
      key: entry.monthKey,
      label: entry.monthLabel,
      entries: []
    }
    group.entries.push(entry)
    groups.set(entry.monthKey, group)
  }

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key))
}
