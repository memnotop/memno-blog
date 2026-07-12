import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { renderMarkdownFragment, stripFrontmatter } from '@/utils/markdown'

export type TrainingLevel = 0 | 1 | 2 | 3 | 4 | 5

export type TrainingRecord = {
  date: string
  title: string
  level: TrainingLevel
  items: string[]
  rpe: string
  body: string
  htmlBody: string
}

const trainingFilenames = ['Training.md', 'Training.mdx']
const legacyTrainingFiles = [
  'src/content/blog/training-log.md',
  'src/content/blog/training-log.mdx'
]

async function fileExists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export function normalizeTrainingMarkdown(value: string) {
  const normalized = value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^ {4}/, ''))
    .join('\n')
    .trim()

  return normalized.replace(/(?<!\*)\*(?!\*)/g, (marker, offset, text) => {
    const before = text.slice(Math.max(0, offset - 12), offset)
    const after = text.slice(offset + marker.length, offset + marker.length + 12)
    const looksLikeMultiplier = /\d[^\s*]{0,6}\s*$/.test(before) && /^\s*\d/.test(after)

    return looksLikeMultiplier ? '\\*' : marker
  })
}

export async function parseTrainingMarkdown(
  source: string,
  filePath: string
): Promise<TrainingRecord[]> {
  const body = stripFrontmatter(source)
  const entryPattern = /^##\s+(\d{4}-\d{2}-\d{2})\s*[|｜]\s*(.*?)\s*[|｜]\s*level\s+([0-5])\s*$/gm
  const matches = [...body.matchAll(entryPattern)]
  const records: TrainingRecord[] = []

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const next = matches[index + 1]
    const contentStart = (match.index ?? 0) + match[0].length
    const contentEnd = next?.index ?? body.length
    const content = body.slice(contentStart, contentEnd).trim()
    const rawLines = content.split(/\r?\n/).map((line) => line.trim())
    const lines = rawLines.filter(Boolean)
    const rpeLine = lines.find((line) => /^RPE[：:]/i.test(line))
    const trainingStart = rawLines.findIndex((line) => /^训练内容[：:]/.test(line))
    const items: string[] = []

    if (trainingStart !== -1) {
      for (const line of rawLines.slice(trainingStart + 1)) {
        if (!line && items.length) break
        if (!line) continue
        if (/^RPE[：:]/i.test(line)) break
        if (/^(推荐|分享|今天|做一个总结|这里对|相信|坚持|细水|野火|寒假)/.test(line)) break
        items.push(line.replace(/^[-*]\s*/, ''))
      }
    }

    records.push({
      date: match[1],
      title: match[2].trim(),
      level: Number(match[3]) as TrainingLevel,
      items,
      rpe: rpeLine ? rpeLine.replace(/^RPE[：:]\s*/i, '') : '',
      body: content,
      htmlBody: await renderMarkdownFragment(normalizeTrainingMarkdown(content), filePath)
    })
  }

  return records
}

export async function parseTrainingYearFile(filePath: string) {
  return parseTrainingMarkdown(await readFile(filePath, 'utf8'), filePath)
}

async function collectTrainingSources(projectRoot: string) {
  const contentRoot = path.join(projectRoot, 'src/content')
  const sources: string[] = []

  try {
    const entries = await readdir(contentRoot, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entry.isDirectory() || !/^\d{4}$/.test(entry.name)) continue

      for (const filename of trainingFilenames) {
        const trainingFile = path.join(contentRoot, entry.name, filename)
        if (await fileExists(trainingFile)) sources.push(trainingFile)
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  const legacyYearsDir = path.join(projectRoot, 'source/training/years')
  try {
    const legacyYearFiles = (await readdir(legacyYearsDir))
      .filter((file) => /^\d{4}\.md$/.test(file))
      .sort()
      .map((file) => path.join(legacyYearsDir, file))
    sources.push(...legacyYearFiles)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  for (const relativePath of legacyTrainingFiles) {
    const filePath = path.join(projectRoot, relativePath)
    if (await fileExists(filePath)) sources.push(filePath)
  }

  return sources
}

export async function loadTrainingRecords(projectRoot = process.cwd()) {
  const records: TrainingRecord[] = []

  for (const source of await collectTrainingSources(projectRoot)) {
    records.push(...(await parseTrainingYearFile(source)))
  }

  return [...new Map(records.map((record) => [record.date, record])).values()].sort((a, b) =>
    a.date.localeCompare(b.date)
  )
}
