// @ts-check

import eslint from '@eslint/js'
import eslintPluginAstro from 'eslint-plugin-astro'
import tseslint from 'typescript-eslint'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: [
      '.astro/**',
      '.obsidian/**',
      'dist/**',
      'node_modules/**',
      'packages/pure/**',
      'public/**',
      'source/**',
      'src/content/**',
      'src/env.d.ts'
    ]
  }
]
