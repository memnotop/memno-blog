import fs from 'node:fs'
import path from 'node:path'

const sourceRoot = '/home/liumingjian/Mycode/web'
const projectRoot = '/home/liumingjian/Mycode/web-arthals-ink'
const postSourceDir = path.join(sourceRoot, 'source/_posts')
const blogTargetDir = path.join(projectRoot, 'src/content/blog')
const trainingSourceDir = path.join(sourceRoot, 'source/training/years')
const publicImgTarget = path.join(projectRoot, 'public/img')
const sourceImgDir = path.join(sourceRoot, 'source/img')

function parseFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, body: source }
  const [, raw, body] = match
  const data = {}
  const lines = raw.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!pair) continue

    const [, key, rawValue] = pair
    if (rawValue === '') {
      const list = []
      while (lines[index + 1]?.match(/^\s*-\s+/)) {
        index += 1
        list.push(lines[index].replace(/^\s*-\s+/, '').trim())
      }
      data[key] = list.length ? list : ''
    } else {
      data[key] = rawValue.replace(/^['"]|['"]$/g, '').trim()
    }
  }

  return { data, body }
}

function yamlString(value) {
  return JSON.stringify(String(value ?? ''))
}

function safeFileName(value) {
  return String(value)
    .replace(/\.md$/i, '')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function descriptionFrom(data, body) {
  if (typeof data.description === 'string' && data.description.trim()) {
    return data.description.trim().slice(0, 160)
  }

  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[[^\]]+]\([^)]+\)/g, '')
    .replace(/[#>*_`~{}[\]-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || '来自 memnotop 的博客记录。'
}

function normalizeTags(data) {
  const tags = []
  if (Array.isArray(data.tags)) tags.push(...data.tags)
  if (typeof data.tags === 'string' && data.tags) tags.push(data.tags)
  if (typeof data.categories === 'string' && data.categories) tags.push(data.categories)
  if (Array.isArray(data.categories)) tags.push(...data.categories)
  return [...new Set(tags.filter(Boolean))]
}

function writeBlogPost(filename, data, body) {
  const tags = normalizeTags(data)
  const publishDate = data.date || data.publishDate || new Date().toISOString().slice(0, 10)
  const description = descriptionFrom(data, body)
  const frontmatter = [
    '---',
    `title: ${yamlString(data.title || filename)}`,
    `publishDate: ${yamlString(publishDate)}`,
    `description: ${yamlString(description)}`,
    'tags:',
    ...(tags.length ? tags.map((tag) => `  - ${yamlString(tag)}`) : ['  - "blog"']),
    'language: "中文"',
    '---',
    ''
  ].join('\n')

  fs.writeFileSync(path.join(blogTargetDir, `${filename}.md`), `${frontmatter}${body.trim()}\n`)
}

fs.rmSync(blogTargetDir, { recursive: true, force: true })
fs.mkdirSync(blogTargetDir, { recursive: true })
fs.rmSync(publicImgTarget, { recursive: true, force: true })
fs.cpSync(sourceImgDir, publicImgTarget, { recursive: true })
fs.copyFileSync(path.join(sourceImgDir, 'avatar.webp'), path.join(projectRoot, 'src/assets/avatar.webp'))

for (const file of fs.readdirSync(postSourceDir).filter((item) => item.endsWith('.md')).sort()) {
  const filePath = path.join(postSourceDir, file)
  const source = fs.readFileSync(filePath, 'utf8')
  const { data, body } = parseFrontmatter(source)
  if (!data.title) continue
  writeBlogPost(safeFileName(data.abbrlink || file), data, body)
}

if (fs.existsSync(trainingSourceDir)) {
  const trainingBody = fs.readdirSync(trainingSourceDir)
    .filter((file) => /^\d{4}\.md$/.test(file))
    .sort()
    .map((file) => fs.readFileSync(path.join(trainingSourceDir, file), 'utf8').replace(/^---[\s\S]*?---\s*/, '').trim())
    .join('\n\n')

  writeBlogPost('training-log', {
    title: 'Training Log',
    date: '2026-06-02 21:40:00',
    description: '训练记录归档，来自原博客 Training 页面。',
    tags: ['Training', 'daily life']
  }, trainingBody)
}

const links = {
  friends: [
    {
      id_name: 'friends',
      desc: 'Friends',
      link_list: [
        {
          name: 'icodeq',
          intro: '一个内容丰富、结构成熟的个人博客，适合参考站点组织方式。',
          link: 'https://icodeq.com/link/',
          avatar: '/img/cat-icon.png'
        },
        {
          name: 'Traveling',
          intro: '开往项目。点击后随机访问另一个独立博客。',
          link: 'https://www.travellings.cn/go',
          avatar: '/img/cat-icon.png'
        }
      ]
    },
    {
      id_name: 'bad-status',
      desc: 'Links with Bad Status',
      link_list: []
    },
    {
      id_name: 'resources',
      desc: 'Resources',
      link_list: [
        {
          name: 'Resource Notes',
          intro: '工具、资料、教程和长期会反复使用的链接。',
          link: '/blog/536d021c',
          avatar: '/img/favicon.png'
        },
        {
          name: 'GitHub',
          intro: '代码托管、开源项目和技术资料。',
          link: 'https://github.com/',
          avatar: '/img/favicon.png'
        },
        {
          name: 'MDN Web Docs',
          intro: 'Web 标准、HTML、CSS 和 JavaScript 文档。',
          link: 'https://developer.mozilla.org/',
          avatar: '/img/favicon.png'
        }
      ]
    }
  ]
}

fs.writeFileSync(path.join(projectRoot, 'public/links.json'), `${JSON.stringify(links, null, 2)}\n`)
