import { AstroError } from 'astro/errors'
import type { z } from 'astro/zod'

/** Parse user configuration and surface concise, path-aware validation errors. */
export function parseWithFriendlyErrors<T extends z.ZodType>(
  schema: T,
  input: z.input<T>,
  message: string
): z.output<T> {
  const result = schema.safeParse(input)
  if (result.success) return result.data

  const details = result.error.issues
    .map((issue) => {
      const issuePath = issue.path.length ? `${issue.path.join('.')}: ` : ''
      return `${issuePath}${issue.message}`
    })
    .join('\n')

  throw new AstroError(message, details)
}
