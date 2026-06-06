import path from 'node:path'
import type { CollectionEntry } from 'astro:content'

type BlogPost = CollectionEntry<'blog'>

const trainingFilenames = new Set(['training.md', 'training.mdx'])

export function isTrainingPost(post: BlogPost) {
  const filename = post.filePath ? path.basename(post.filePath).toLowerCase() : ''

  if (filename) return trainingFilenames.has(filename)

  return /^training\b/i.test(post.data.title)
}

export function getArticlePosts(posts: BlogPost[]) {
  return posts.filter((post) => !isTrainingPost(post))
}
