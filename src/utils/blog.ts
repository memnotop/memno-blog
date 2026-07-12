import path from 'node:path'
import type { CollectionEntry } from 'astro:content'

import { getBlogCollection, sortMDByDate } from 'astro-pure/server'
import type { BlogTopic } from '@/site-config'

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

export function sortArticlePosts(posts: BlogPost[]) {
  return sortMDByDate(getArticlePosts(posts))
}

export async function getSortedArticlePosts() {
  return sortArticlePosts(await getBlogCollection())
}

export function filterPostsByTopic(posts: BlogPost[], topic: BlogTopic) {
  const normalizedValues = new Set(topic.source.values.map((value) => value.toLowerCase()))
  return posts.filter((post) => {
    const values = post.data[topic.source.field] as string[]
    return values.some((value) => normalizedValues.has(value.toLowerCase()))
  })
}

export function getTopicSourceValues(posts: BlogPost[], topic: BlogTopic) {
  return [...new Set(posts.flatMap((post) => post.data[topic.source.field] as string[]))].sort(
    (a, b) => a.localeCompare(b)
  )
}
