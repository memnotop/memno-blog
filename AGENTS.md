# memno-blog Agent Notes

This repository is the active source for `https://memno.top`.

## Identity

- Canonical repo: `/home/liumingjian/Mycode/web`
- Do not treat `/home/liumingjian/Mycode/web-arthals-ink` as the active repo unless the user explicitly says so.
- This is an Astro-based personal blog/site.

## Working defaults

- Read this file before making assumptions about the blog project.
- Prefer repo-local patterns and keep edits narrow.
- Avoid changing `packages/pure/` unless the requested change really needs theme-level behavior changes.
- Preserve existing Chinese content structure and naming unless the user asks for a migration.

## Important paths

- `src/site.config.ts`: site title, author, nav, footer, social links, topic config
- `src/pages/index.astro`: homepage
- `src/pages/about/index.astro`: About page
- `src/pages/training.astro`: training page
- `public/links.json`: friend links
- `public/favicon/`: favicon and site icons
- `public/img/`: shared static images
- `src/assets/styles/app.css`: global typography and base styling
- `src/content/`: blog content by year

## Content layout

- Content is organized under `src/content/<year>/`
- Common sections include `daily life/`, `Reading/`, `Technical/`, `Picture/`, and `Training.md`
- Normal posts are typically stored as `src/content/<year>/<Section>/<slug>/index.md`
- Post assets should usually live beside the post, for example:
  `src/content/2026/Technical/my-post/{index.md,cover.webp,image-01.webp}`

## Content conventions

- Frontmatter commonly includes:
  `title`, `description`, `publishDate`, `tags`, `repositories`, `language`, `draft`
- Optional hero fields:
  `heroImageSrc`, `heroImageAlt`, `heroImageColor`, `showHeroImage`
- Shared fixed assets belong in `public/`; post-specific assets belong with the post.

## Commands

- Install: `npm install`
- Dev server: `npm run dev`
- New post: `npm run new:post`
- Update dates: `npm run date`
- Repo audit: `npm run audit:repo`
- Verify before release: `npm run verify`
- Build: `npm run build`
- Preview: `npm run preview`

## Conversation continuity

- If prior chat context was compacted, recover project context from this file and `README.md` first.
- For blog-related follow-up work, assume the user is referring to this repository unless they explicitly switch projects.
