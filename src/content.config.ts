import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

function removeDupsAndLowerCase(array: string[]) {
  if (!array.length) return array
  const lowercaseItems = array.map((str) => str.toLowerCase())
  const distinctItems = new Set(lowercaseItems)
  return Array.from(distinctItems)
}

const blog = defineCollection({
  loader: glob({ base: './src/content', pattern: '**/*.{md,mdx}' }),
  // Required
  schema: ({ image }) =>
    z.object({
      // Required
      title: z.string().max(60),
      description: z.string().max(160),
      publishDate: z.coerce.date(),
      // Optional
      updatedDate: z.coerce.date().optional(),
      heroImageSrc: image().optional(),
      heroImageAlt: z.string().optional(),
      heroImageColor: z.string().optional(),
      heroImageInferSize: z.boolean().optional(),
      heroImageWidth: z.number().optional(),
      heroImageHeight: z.number().optional(),
      showHeroImage: z.boolean().default(true),
      tags: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      repositories: z.array(z.string()).default([]).transform(removeDupsAndLowerCase),
      language: z.string().optional(),
      draft: z.boolean().default(false),
      // Special fields
      comment: z.boolean().default(true)
    })
})

export const collections = { blog }
