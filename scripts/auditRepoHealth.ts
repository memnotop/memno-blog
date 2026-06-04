#!/usr/bin/env node
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFile = promisify(execFileCallback)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const BYTES_IN_KB = 1024
const BYTES_IN_MB = BYTES_IN_KB * 1024

const thresholds = {
  gitWarnBytes: 300 * BYTES_IN_MB,
  gitFailBytes: 700 * BYTES_IN_MB,
  distWarnBytes: 200 * BYTES_IN_MB,
  distFailBytes: 700 * BYTES_IN_MB,
  imageWarnBytes: 500 * BYTES_IN_KB,
  imageFailBytes: 2 * BYTES_IN_MB,
  optimizedImageWarnBytes: 300 * BYTES_IN_KB
} as const

const contentRoots = ['src/content', 'public', 'src/assets']
const localStatePrefixes = [
  '.astro/',
  '.makemd/',
  '.trash/',
  '.obsidian/workspace.json',
  'dist/',
  'node_modules/'
]
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif'])
const optimizedImageExtensions = new Set(['.webp', '.avif', '.svg'])

type Level = 'ok' | 'warn' | 'fail'

interface Issue {
  level: Level
  message: string
}

interface FileInfo {
  path: string
  size: number
}

function formatBytes(bytes: number) {
  if (bytes >= BYTES_IN_MB) return `${(bytes / BYTES_IN_MB).toFixed(1)} MB`
  if (bytes >= BYTES_IN_KB) return `${(bytes / BYTES_IN_KB).toFixed(1)} KB`
  return `${bytes} B`
}

function icon(level: Level) {
  if (level === 'fail') return 'FAIL'
  if (level === 'warn') return 'WARN'
  return ' OK '
}

function printSection(title: string) {
  console.log(`\n## ${title}`)
}

function printIssue(issue: Issue) {
  console.log(`[${icon(issue.level)}] ${issue.message}`)
}

async function getDirectorySize(targetPath: string): Promise<number> {
  let stats
  try {
    stats = await fs.stat(targetPath)
  } catch {
    return 0
  }

  if (stats.isFile()) return stats.size

  const entries = await fs.readdir(targetPath, { withFileTypes: true })
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(targetPath, entry.name)
      if (entry.isDirectory()) return getDirectorySize(fullPath)
      if (entry.isFile()) {
        const fileStats = await fs.stat(fullPath)
        return fileStats.size
      }
      return 0
    })
  )

  return sizes.reduce((total, size) => total + size, 0)
}

async function git(args: string[]) {
  const { stdout } = await execFile('git', args, {
    cwd: repoRoot,
    maxBuffer: 8 * BYTES_IN_MB
  })
  return stdout
}

async function getTrackedFiles() {
  const stdout = await git(['ls-files', '-z'])
  return stdout
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean)
}

async function collectTrackedFileInfo(files: string[]) {
  const infos = await Promise.all(
    files.map(async (relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath)
      try {
        const stats = await fs.stat(absolutePath)
        return stats.isFile() ? { path: relativePath, size: stats.size } : null
      } catch {
        return null
      }
    })
  )

  return infos.filter((item): item is FileInfo => item !== null)
}

function isImagePath(filePath: string) {
  return imageExtensions.has(path.extname(filePath).toLowerCase())
}

function isOptimizedImagePath(filePath: string) {
  return optimizedImageExtensions.has(path.extname(filePath).toLowerCase())
}

function isUnderTrackedContentRoot(filePath: string) {
  return contentRoots.some((prefix) => filePath === prefix || filePath.startsWith(`${prefix}/`))
}

function parseGitSizeBytes(raw: string) {
  const sizeLine = raw
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('size-pack:') || line.startsWith('size:'))

  const countLine = raw
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('count:'))

  const packLine = raw
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('size-pack:'))

  const looseLine = raw
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('size:'))

  const bytesFromHuman = (value: string) => {
    const match = value.match(/([\d.]+)\s*(KiB|MiB|GiB|B|字节)/i)
    if (!match) return 0
    const amount = Number(match[1])
    const unit = match[2].toLowerCase()
    if (unit === 'gib') return amount * 1024 * BYTES_IN_MB
    if (unit === 'mib') return amount * BYTES_IN_MB
    if (unit === 'kib') return amount * BYTES_IN_KB
    return amount
  }

  return {
    looseBytes: looseLine ? bytesFromHuman(looseLine.replace('size:', '').trim()) : 0,
    packBytes: packLine ? bytesFromHuman(packLine.replace('size-pack:', '').trim()) : 0,
    objectCount: countLine ? Number(countLine.replace('count:', '').trim()) : 0,
    raw: sizeLine ?? raw
  }
}

async function main() {
  const issues: Issue[] = []
  const trackedFiles = await getTrackedFiles()
  const trackedInfos = await collectTrackedFileInfo(trackedFiles)
  const trackedImageInfos = trackedInfos.filter(
    (file) => isImagePath(file.path) && isUnderTrackedContentRoot(file.path)
  )
  const largestTrackedFiles = [...trackedInfos].sort((a, b) => b.size - a.size).slice(0, 10)
  const largeImages = trackedImageInfos.filter((file) => file.size >= thresholds.imageWarnBytes)
  const veryLargeImages = trackedImageInfos.filter((file) => file.size >= thresholds.imageFailBytes)
  const unoptimizedLargeImages = trackedImageInfos.filter(
    (file) => !isOptimizedImagePath(file.path) && file.size >= thresholds.optimizedImageWarnBytes
  )
  const trackedLocalStateFiles = trackedFiles.filter((file) =>
    localStatePrefixes.some((prefix) => file === prefix.slice(0, -1) || file.startsWith(prefix))
  )

  const gitStatsRaw = await git(['count-objects', '-vH'])
  const gitStats = parseGitSizeBytes(gitStatsRaw)
  const gitTotalBytes = gitStats.looseBytes + gitStats.packBytes

  const distBytes = await getDirectorySize(path.join(repoRoot, 'dist'))
  const contentBytes = await getDirectorySize(path.join(repoRoot, 'src/content'))
  const publicBytes = await getDirectorySize(path.join(repoRoot, 'public'))

  printSection('Summary')
  console.log(`Tracked files: ${trackedFiles.length}`)
  console.log(`Content size: ${formatBytes(contentBytes)}`)
  console.log(`Public size: ${formatBytes(publicBytes)}`)
  console.log(`Built site size: ${formatBytes(distBytes)}`)
  console.log(`Git object store: ${formatBytes(gitTotalBytes)} (${gitStats.objectCount} loose objects)`)

  if (gitTotalBytes >= thresholds.gitFailBytes) {
    issues.push({
      level: 'fail',
      message: `Git object store is ${formatBytes(gitTotalBytes)}. Start history cleanup before it approaches GitHub's 1 GB Pages recommendation.`
    })
  } else if (gitTotalBytes >= thresholds.gitWarnBytes) {
    issues.push({
      level: 'warn',
      message: `Git object store is ${formatBytes(gitTotalBytes)}. Review large tracked binaries and old image history soon.`
    })
  } else {
    issues.push({
      level: 'ok',
      message: `Git object store is ${formatBytes(gitTotalBytes)}.`
    })
  }

  if (distBytes >= thresholds.distFailBytes) {
    issues.push({
      level: 'fail',
      message: `dist/ is ${formatBytes(distBytes)}. That is too close to GitHub Pages' 1 GB published-site limit.`
    })
  } else if (distBytes >= thresholds.distWarnBytes) {
    issues.push({
      level: 'warn',
      message: `dist/ is ${formatBytes(distBytes)}. Review image sizes, search index size, and static asset duplication.`
    })
  } else {
    issues.push({
      level: 'ok',
      message: `dist/ is ${formatBytes(distBytes)}.`
    })
  }

  if (trackedLocalStateFiles.length) {
    issues.push({
      level: 'fail',
      message: `Tracked local-state files detected: ${trackedLocalStateFiles.slice(0, 5).join(', ')}${trackedLocalStateFiles.length > 5 ? ' ...' : ''}`
    })
  } else {
    issues.push({
      level: 'ok',
      message: 'No tracked local-state files under .astro/, .makemd/, .trash/, dist/, node_modules/, or .obsidian/workspace.json.'
    })
  }

  if (veryLargeImages.length) {
    issues.push({
      level: 'fail',
      message: `${veryLargeImages.length} tracked image(s) exceed ${formatBytes(thresholds.imageFailBytes)}. Move originals out of the repo or compress them.`
    })
  } else if (largeImages.length) {
    issues.push({
      level: 'warn',
      message: `${largeImages.length} tracked image(s) exceed ${formatBytes(thresholds.imageWarnBytes)}. Review them before the library grows.`
    })
  } else {
    issues.push({
      level: 'ok',
      message: `No tracked content/public image exceeds ${formatBytes(thresholds.imageWarnBytes)}.`
    })
  }

  if (unoptimizedLargeImages.length) {
    issues.push({
      level: 'warn',
      message: `${unoptimizedLargeImages.length} large PNG/JPG image(s) should probably be converted to WebP or AVIF.`
    })
  } else {
    issues.push({
      level: 'ok',
      message: 'No large PNG/JPG images above the optimization threshold were found.'
    })
  }

  printSection('Checks')
  for (const issue of issues) {
    printIssue(issue)
  }

  printSection('Largest tracked files')
  for (const file of largestTrackedFiles) {
    console.log(`${formatBytes(file.size).padStart(9)}  ${file.path}`)
  }

  if (largeImages.length) {
    printSection('Large images')
    for (const file of [...largeImages].sort((a, b) => b.size - a.size).slice(0, 15)) {
      const optimizationHint = isOptimizedImagePath(file.path) ? '' : '  -> convert to WebP/AVIF if web-facing'
      console.log(`${formatBytes(file.size).padStart(9)}  ${file.path}${optimizationHint}`)
    }
  }

  printSection('Recommendations')
  console.log('- Keep article cover images in the article directory and reference them with relative paths such as ./cover.webp.')
  console.log(`- Treat ${formatBytes(thresholds.imageWarnBytes)} as the default warning line for web-facing images.`)
  console.log('- Move original photos, raw screenshots, and downloadable attachments to external object storage before they dominate Git history.')
  console.log('- Run `npm run audit:repo` before large content imports and before release.')

  const hasFailure = issues.some((issue) => issue.level === 'fail')
  process.exitCode = hasFailure ? 1 : 0
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
