#!/usr/bin/env node
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

const candidateRoots = ['public/img', 'src/assets/projects', 'src/assets/tools', 'src/content']
const extensionlessImageRoots = new Set(['public/img/covers'])
const excludedRelativePaths = new Set(['public/img/signature-memnotop.png'])
const ignoredDirectories = new Set(['.astro', '.git', '.trash', 'dist', 'node_modules'])
const rasterExtensions = new Set(['.png', '.jpg', '.jpeg'])
const textExtensions = new Set([
  '.astro',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mdx',
  '.txt',
  '.ts',
  '.tsx',
  '.webmanifest',
  '.xml',
  '.xsl',
  '.yaml',
  '.yml'
])

type ImageMapping = {
  sourceAbsolutePath: string
  sourceRelativePath: string
  targetAbsolutePath: string
  targetRelativePath: string
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function isExtensionlessImageCandidate(relativePath: string) {
  return extensionlessImageRoots.has(toPosix(path.dirname(relativePath))) && !path.extname(relativePath)
}

function shouldSkipDirectory(entryPath: string) {
  return ignoredDirectories.has(path.basename(entryPath))
}

async function walk(directoryPath: string): Promise<string[]> {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = path.join(directoryPath, entry.name)
    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entryPath)) continue
      files.push(...(await walk(entryPath)))
      continue
    }

    if (entry.isFile()) files.push(entryPath)
  }

  return files
}

async function exists(targetPath: string) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

function toRelativePath(absolutePath: string) {
  return toPosix(path.relative(repoRoot, absolutePath))
}

function getTargetRelativePath(sourceRelativePath: string) {
  const extension = path.extname(sourceRelativePath)
  return extension
    ? `${sourceRelativePath.slice(0, -extension.length)}.webp`
    : `${sourceRelativePath}.webp`
}

function getWebpOptions(sourceRelativePath: string, metadata: sharp.Metadata): sharp.WebpOptions {
  const lowerCaseExtension = path.extname(sourceRelativePath).toLowerCase()
  const isPhotograph = lowerCaseExtension === '.jpg' || lowerCaseExtension === '.jpeg'

  if (isPhotograph) {
    return {
      alphaQuality: 85,
      effort: 6,
      quality: 78,
      smartSubsample: true
    }
  }

  return {
    alphaQuality: 86,
    effort: 6,
    nearLossless: true,
    quality: metadata.hasAlpha ? 84 : 80,
    smartSubsample: true
  }
}

async function collectImageCandidates() {
  const absoluteFiles = (
    await Promise.all(candidateRoots.map((root) => walk(path.join(repoRoot, root))))
  ).flat()

  return absoluteFiles
    .filter((absolutePath) => {
      const relativePath = toRelativePath(absolutePath)
      if (excludedRelativePaths.has(relativePath)) return false

      const extension = path.extname(relativePath).toLowerCase()
      return rasterExtensions.has(extension) || isExtensionlessImageCandidate(relativePath)
    })
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

async function convertImages(imagePaths: string[]) {
  const mappings: ImageMapping[] = []
  let convertedCount = 0
  let reusedCount = 0

  for (const sourceAbsolutePath of imagePaths) {
    const sourceRelativePath = toRelativePath(sourceAbsolutePath)
    const targetRelativePath = getTargetRelativePath(sourceRelativePath)
    const targetAbsolutePath = path.join(repoRoot, targetRelativePath)

    if (!(await exists(targetAbsolutePath))) {
      const image = sharp(sourceAbsolutePath).rotate()
      const metadata = await image.metadata()
      await fs.mkdir(path.dirname(targetAbsolutePath), { recursive: true })
      await image.webp(getWebpOptions(sourceRelativePath, metadata)).toFile(targetAbsolutePath)
      convertedCount += 1
    } else {
      reusedCount += 1
    }

    mappings.push({
      sourceAbsolutePath,
      sourceRelativePath,
      targetAbsolutePath,
      targetRelativePath
    })
  }

  return { convertedCount, mappings, reusedCount }
}

function buildAliasPair(
  sourcePrefix: string,
  targetPrefix: string,
  sourceRelativePath: string,
  targetRelativePath: string
) {
  if (!sourceRelativePath.startsWith(sourcePrefix)) return null
  const sourceSuffix = sourceRelativePath.slice(sourcePrefix.length)
  const targetSuffix = targetRelativePath.slice(sourcePrefix.length)
  return {
    source: `${targetPrefix}${sourceSuffix}`,
    target: `${targetPrefix}${targetSuffix}`
  }
}

function getRelativeReferenceVariants(fromDirectory: string, toPath: string) {
  const relativePath = toPosix(path.relative(fromDirectory, toPath))
  if (!relativePath) return []
  if (relativePath.startsWith('.')) return [relativePath]
  return [relativePath, `./${relativePath}`]
}

function buildReplacementPairs(textFileAbsolutePath: string, mapping: ImageMapping) {
  const textDirectory = path.dirname(textFileAbsolutePath)
  const replacementPairs = new Map<string, string>()

  replacementPairs.set(mapping.sourceAbsolutePath, mapping.targetAbsolutePath)
  replacementPairs.set(mapping.sourceRelativePath, mapping.targetRelativePath)

  for (const sourceVariant of getRelativeReferenceVariants(textDirectory, mapping.sourceAbsolutePath)) {
    const targetVariants = getRelativeReferenceVariants(textDirectory, mapping.targetAbsolutePath)
    const targetVariant =
      targetVariants[targetVariants.length === 2 && sourceVariant.startsWith('./') ? 1 : 0]

    if (targetVariant) replacementPairs.set(sourceVariant, targetVariant)
  }

  if (mapping.sourceRelativePath.startsWith('public/')) {
    const sourcePublicPath = `/${mapping.sourceRelativePath.slice('public/'.length)}`
    const targetPublicPath = `/${mapping.targetRelativePath.slice('public/'.length)}`
    replacementPairs.set(sourcePublicPath, targetPublicPath)
  }

  replacementPairs.set(`/${mapping.sourceRelativePath}`, `/${mapping.targetRelativePath}`)

  const assetAliasPair = buildAliasPair(
    'src/assets/',
    '@/assets/',
    mapping.sourceRelativePath,
    mapping.targetRelativePath
  )
  if (assetAliasPair) replacementPairs.set(assetAliasPair.source, assetAliasPair.target)

  return replacementPairs
}

async function collectTextFiles() {
  const absoluteFiles = await walk(repoRoot)
  return absoluteFiles.filter((absolutePath) => {
    const extension = path.extname(absolutePath).toLowerCase()
    return textExtensions.has(extension)
  })
}

async function rewriteReferences(mappings: ImageMapping[]) {
  const textFiles = await collectTextFiles()
  let updatedFileCount = 0

  for (const textFileAbsolutePath of textFiles) {
    const originalContent = await fs.readFile(textFileAbsolutePath, 'utf8')
    let nextContent = originalContent

    for (const mapping of mappings) {
      const replacementPairs = buildReplacementPairs(textFileAbsolutePath, mapping)
      for (const [sourceValue, targetValue] of replacementPairs.entries()) {
        if (!sourceValue || sourceValue === targetValue) continue
        if (!nextContent.includes(sourceValue)) continue
        nextContent = nextContent.split(sourceValue).join(targetValue)
      }
    }

    if (nextContent === originalContent) continue
    await fs.writeFile(textFileAbsolutePath, nextContent, 'utf8')
    updatedFileCount += 1
  }

  return updatedFileCount
}

async function removeSourceImages(mappings: ImageMapping[]) {
  for (const mapping of mappings) {
    await fs.rm(mapping.sourceAbsolutePath)
  }
}

async function main() {
  const imageCandidates = await collectImageCandidates()
  if (!imageCandidates.length) {
    console.log('No raster images found to optimize.')
    return
  }

  const { convertedCount, mappings, reusedCount } = await convertImages(imageCandidates)
  const updatedFileCount = await rewriteReferences(mappings)
  await removeSourceImages(mappings)

  console.log(
    [
      `Converted: ${convertedCount}`,
      `Reused existing webp: ${reusedCount}`,
      `Updated files: ${updatedFileCount}`,
      `Removed originals: ${mappings.length}`
    ].join('\n')
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
