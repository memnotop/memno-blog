import { z } from 'astro/zod'

export const HeaderMenuSchema = () =>
  z
    .array(
      z.object({
        title: z.string(),
        link: z.string(),
        description: z.string().optional(),
        children: z
          .array(
            z.object({
              title: z.string(),
              link: z.string(),
              description: z.string().optional()
            })
          )
          .optional()
      })
    )
    .default([
      { title: 'Blog', link: '/blog' },
      { title: 'Projects', link: '/projects' },
      { title: 'Links', link: '/links' },
      { title: 'About', link: '/about' }
    ])
    .describe('The header menu items for your site.')
