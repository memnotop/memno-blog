import { z } from 'astro/zod'
import { Icons } from '../libs/icons'

const iconNames = Object.keys(Icons) as [keyof typeof Icons, ...(keyof typeof Icons)[]]

export const HeaderMenuSchema = () =>
  z
    .array(
      z.object({
        title: z.string(),
        link: z.string(),
        description: z.string().optional(),
        icon: z.enum(iconNames).optional(),
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
