'use strict'

const fs = require('fs')
const path = require('path')

function parseTrainingYearFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8')
  const body = source.replace(/^---[\s\S]*?---\s*/, '')
  const records = []
  const entryPattern = /^##\s+(\d{4}-\d{2}-\d{2})\s*[|｜]\s*(.*?)\s*[|｜]\s*level\s+([0-5])\s*$/gm
  const matches = [...body.matchAll(entryPattern)]

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]
    const next = matches[index + 1]
    const contentStart = match.index + match[0].length
    const contentEnd = next ? next.index : body.length
    const content = body.slice(contentStart, contentEnd).trim()
    const rawLines = content.split(/\r?\n/).map(line => line.trim())
    const lines = rawLines.filter(Boolean)
    const rpeLine = lines.find(line => /^RPE[：:]/i.test(line))
    const trainingStart = rawLines.findIndex(line => /^训练内容[：:]/.test(line))
    const items = []

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
      level: Number(match[3]),
      items,
      rpe: rpeLine ? rpeLine.replace(/^RPE[：:]\s*/i, '') : '',
      body: content
    })
  }

  return records
}

hexo.extend.generator.register('training_data', function () {
  const yearsDir = path.join(hexo.source_dir, 'training', 'years')
  if (!fs.existsSync(yearsDir)) {
    return {
      path: 'js/training-data.js',
      data: 'window.TRAINING_DATA = []\n'
    }
  }

  const records = fs.readdirSync(yearsDir)
    .filter(file => /^\d{4}\.md$/.test(file))
    .sort()
    .flatMap(file => parseTrainingYearFile(path.join(yearsDir, file)))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    path: 'js/training-data.js',
    data: `window.TRAINING_DATA = ${JSON.stringify(records, null, 2)}\n`
  }
})
