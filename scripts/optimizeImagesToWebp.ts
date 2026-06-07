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
const pngOptimizationPaths = ['public/images/social-card.png']
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

type ImageOptimizationPreset = {
  maxLongEdge: number
  quality: number
}

function toPosix(filePath: string) {
  return filePath.split(path.sep).join('/')
}

function isExtensionlessImageCandidate(relativePath: string) {
  return (
    extensionlessImageRoots.has(toPosix(path.dirname(relativePath))) && !path.extname(relativePath)
  )
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
      quality: getOptimizationPreset(sourceRelativePath).quality,
      smartSubsample: true
    }
  }

  return {
    alphaQuality: 86,
    effort: 6,
    nearLossless: metadata.hasAlpha,
    quality: metadata.hasAlpha ? 82 : getOptimizationPreset(sourceRelativePath).quality,
    smartSubsample: true
  }
}

function getOptimizationPreset(relativePath: string): ImageOptimizationPreset {
  if (
    relativePath === 'public/img/signature-memnotop.png' ||
    relativePath === 'public/img/signature-memnotop.webp'
  ) {
    return { maxLongEdge: 640, quality: 76 }
  }

  if (relativePath.startsWith('public/img/uploads/')) {
    return { maxLongEdge: 1920, quality: 74 }
  }

  if (relativePath.startsWith('public/img/covers/')) {
    return { maxLongEdge: 1600, quality: 74 }
  }

  if (relativePath.startsWith('src/assets/projects/')) {
    return { maxLongEdge: 1400, quality: 72 }
  }

  if (relativePath.startsWith('src/content/')) {
    return { maxLongEdge: 1600, quality: 76 }
  }

  if (relativePath.startsWith('src/assets/tools/')) {
    return { maxLongEdge: 512, quality: 78 }
  }

  return { maxLongEdge: 1280, quality: 76 }
}

async function collectImageCandidates() {
  const absoluteFiles = (
    await Promise.all(candidateRoots.map((root) => walk(path.join(repoRoot, root))))
  ).flat()

  return absoluteFiles
    .filter((absolutePath) => {
      const relativePath = toRelativePath(absolutePath)

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
      const { maxLongEdge } = getOptimizationPreset(sourceRelativePath)
      await fs.mkdir(path.dirname(targetAbsolutePath), { recursive: true })
      await image
        .resize({
          width: maxLongEdge,
          height: maxLongEdge,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp(getWebpOptions(sourceRelativePath, metadata))
        .toFile(targetAbsolutePath)
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

  for (const sourceVariant of getRelativeReferenceVariants(
    textDirectory,
    mapping.sourceAbsolutePath
  )) {
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
    if (absolutePath === __filename) return false
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

async function getFileSize(filePath: string) {
  const stats = await fs.stat(filePath)
  return stats.size
}

async function collectOptimizableWebpImages() {
  const absoluteFiles = (
    await Promise.all(candidateRoots.map((root) => walk(path.join(repoRoot, root))))
  ).flat()

  return absoluteFiles
    .filter((absolutePath) => path.extname(absolutePath).toLowerCase() === '.webp')
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
}

async function replaceIfSmaller(
  sourceAbsolutePath: string,
  tempAbsolutePath: string,
  options: { forceIfSmaller?: boolean } = {}
) {
  const originalSize = await getFileSize(sourceAbsolutePath)
  const optimizedSize = await getFileSize(tempAbsolutePath)
  const savedBytes = originalSize - optimizedSize
  const savedRatio = savedBytes / originalSize

  if (
    optimizedSize < originalSize &&
    (options.forceIfSmaller || (savedBytes >= 16 * 1024 && savedRatio >= 0.05))
  ) {
    await fs.rename(tempAbsolutePath, sourceAbsolutePath)
    return savedBytes
  }

  await fs.rm(tempAbsolutePath)
  return 0
}

async function optimizeWebpImage(sourceAbsolutePath: string) {
  const sourceRelativePath = toRelativePath(sourceAbsolutePath)
  const { maxLongEdge, quality } = getOptimizationPreset(sourceRelativePath)
  const tempAbsolutePath = `${sourceAbsolutePath}.tmp-${process.pid}.webp`
  const metadata = await sharp(sourceAbsolutePath).metadata()
  const needsResize = Math.max(metadata.width ?? 0, metadata.height ?? 0) > maxLongEdge

  await sharp(sourceAbsolutePath)
    .rotate()
    .resize({
      width: maxLongEdge,
      height: maxLongEdge,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      alphaQuality: 84,
      effort: 6,
      quality,
      smartSubsample: true
    })
    .toFile(tempAbsolutePath)

  return replaceIfSmaller(sourceAbsolutePath, tempAbsolutePath, { forceIfSmaller: needsResize })
}

async function optimizePngImage(sourceAbsolutePath: string) {
  const sourceRelativePath = toRelativePath(sourceAbsolutePath)
  const { maxLongEdge } = getOptimizationPreset(sourceRelativePath)
  const tempAbsolutePath = `${sourceAbsolutePath}.tmp-${process.pid}.png`
  const metadata = await sharp(sourceAbsolutePath).metadata()
  const needsResize = Math.max(metadata.width ?? 0, metadata.height ?? 0) > maxLongEdge

  await sharp(sourceAbsolutePath)
    .rotate()
    .resize({
      width: maxLongEdge,
      height: maxLongEdge,
      fit: 'inside',
      withoutEnlargement: true
    })
    .png({
      adaptiveFiltering: true,
      compressionLevel: 9,
      effort: 10
    })
    .toFile(tempAbsolutePath)

  return replaceIfSmaller(sourceAbsolutePath, tempAbsolutePath, { forceIfSmaller: needsResize })
}

async function optimizeExistingImages() {
  const webpImages = await collectOptimizableWebpImages()
  const pngImages = pngOptimizationPaths.map((relativePath) => path.join(repoRoot, relativePath))

  let optimizedCount = 0
  let savedBytes = 0

  for (const imagePath of webpImages) {
    const saved = await optimizeWebpImage(imagePath)
    if (!saved) continue
    optimizedCount += 1
    savedBytes += saved
  }

  for (const imagePath of pngImages) {
    if (!(await exists(imagePath))) continue
    const saved = await optimizePngImage(imagePath)
    if (!saved) continue
    optimizedCount += 1
    savedBytes += saved
  }

  return { optimizedCount, savedBytes }
}

function formatBytes(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

async function main() {
  const imageCandidates = await collectImageCandidates()
  let convertedCount = 0
  let reusedCount = 0
  let updatedFileCount = 0
  let removedOriginalCount = 0

  if (imageCandidates.length) {
    const result = await convertImages(imageCandidates)
    convertedCount = result.convertedCount
    reusedCount = result.reusedCount
    updatedFileCount = await rewriteReferences(result.mappings)
    await removeSourceImages(result.mappings)
    removedOriginalCount = result.mappings.length
  }

  const { optimizedCount, savedBytes } = await optimizeExistingImages()

  console.log(
    [
      `Converted: ${convertedCount}`,
      `Reused existing webp: ${reusedCount}`,
      `Updated files: ${updatedFileCount}`,
      `Removed originals: ${removedOriginalCount}`,
      `Optimized existing images: ${optimizedCount}`,
      `Saved: ${formatBytes(savedBytes)}`
    ].join('\n')
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
