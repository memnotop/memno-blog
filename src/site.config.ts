import type { Config, IntegrationUserConfig, ThemeUserConfig } from 'astro-pure/types';

export type BlogTopicSourceField = 'tags' | 'repositories'

export type BlogTopic = {
  slug: string
  title: string
  description: string
  source: {
    field: BlogTopicSourceField
    values: string[]
  }
}

export const blogTopics = [
  {
    slug: 'daily-life',
    title: 'daily life',
    description: '生活记录、想法、训练和日常记录。',
    source: {
      field: 'repositories',
      values: ['daily-life']
    }
  },
  {
    slug: 'reading',
    title: 'Reading',
    description: '阅读笔记、书籍、论文和资料整理。',
    source: {
      field: 'tags',
      values: ['reading', '收藏', '工具']
    }
  },
  {
    slug: 'technical',
    title: 'Technical',
    description: '技术分享、工具使用、网页搭建与项目复盘。',
    source: {
      field: 'tags',
      values: ['technical']
    }
  },
  {
    slug: 'picture',
    title: 'Picture',
    description: '照片、旅行和一些值得保存的画面。',
    source: {
      field: 'tags',
      values: ['picture', 'photo', 'photos', '照片']
    }
  }
] satisfies BlogTopic[]

export function getBlogTopic(slug: string) {
  const topic = blogTopics.find((item) => item.slug === slug)
  if (!topic) throw new Error(`Unknown blog topic: ${slug}`)
  return topic
}

export const theme: ThemeUserConfig = {
  // === Basic configuration ===
  /** Title for your website. Will be used in metadata and as browser tab title. */
  title: "memnotop's ink",
  /** Will be used in index page & copyright declaration */
  author: 'memnotop',
  /** Description metadata for your website. Can be used in page metadata. */
  description: '如切如磋，如琢如磨。',
  /** The default favicon for your site which should be a path to an image in the `public/` directory. */
  favicon: '/favicon/favicon.ico',
  /** Specify the default language for this site. */
  locale: {
    lang: 'zh-CN',
    attrs: 'zh_CN',
    // Date locale
    dateLocale: 'zh-CN',
    dateOptions: {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  },
  /** Set a logo image to show in the homepage. */
  logo: {
    src: 'src/assets/avatar.webp',
    alt: 'Avatar'
  },

  // === Global configuration ===
  titleDelimiter: '•',
  prerender: true,
  npmCDN: 'https://cdn.jsdelivr.net/npm',

  // Still in test
  head: [
    /* Telegram channel */
    // {
    //   tag: 'meta',
    //   attrs: { name: 'telegram:channel', content: '@cworld0_cn' },
    //   content: ''
    // }
  ],
  customCss: [],

  /** Configure the header of your site. */
  header: {
    menu: [
      { title: 'Home', link: '/' },
      {
        title: 'Blog',
        link: '/blog',
        children: [
          ...blogTopics.map(({ slug, title }) => ({ title, link: `/blog/${slug}` })),
          { title: 'Training', link: '/training' },
        ]
      },
      { title: 'Archives', link: '/archives' },
      { title: 'Links', link: '/links' },
      { title: 'About', link: '/about' },

    ]
  },

  /** Configure the footer of your site. */
  footer: {
    // Year format
    year: `© ${new Date().getFullYear()}`,
    // year: `© 2019 - ${new Date().getFullYear()}`,
    links: [
      // Registration link
      {
        title: 'memno.top',
        link: 'https://memno.top/',
        style: 'text-xs text-muted-foreground' // Uno/TW CSS class
      },
      {
        title: 'GitHub Pages',
        link: 'https://pages.github.com/',
        style: 'text-xs text-muted-foreground' // Uno/TW CSS class
      }
    ],
    /** Enable displaying a “Astro & Pure theme powered” link in your site’s footer. */
    credits: false,
    /** Optional details about the social media accounts for this site. */
    social: { github: 'https://github.com/memnotop', email: 'mailto:a3124884661@163.com' }
  },

  content: {
    /** External links configuration */
    externalLinks: {
      content: ' ↗',
      /** Properties for the external links element */
      properties: {
        style: 'user-select:none'
      }
    },
    /** Blog page size for pagination (optional) */
    blogPageSize: 8,
    // Currently support weibo, x, bluesky
    share: ['weibo']
  }
}

export const integ: IntegrationUserConfig = {
  // Links management
  // See: https://astro-pure.js.org/docs/integrations/links
  links: {
    // Friend logbook
    logbook: [{ date: '2026-06-02', content: '开始整理资源和友链。' }],
    // Yourself link info
    applyTip: [
      { name: 'Name', val: theme.title },
      { name: 'Desc', val: theme.description || 'Null' },
      { name: 'Link', val: 'https://memno.top/' },
      { name: 'Avatar', val: 'https://memno.top/img/avatar.webp' }
    ],
    // Cache avatars in `public/avatars/` to improve user experience.
    cacheAvatar: false,
  },
  // Enable page search function
  pagefind: true,
  // Add a random quote to the footer (default on homepage footer)
  // See: https://astro-pure.js.org/docs/integrations/advanced#web-content-render
  quote: {
    // https://developer.hitokoto.cn/sentence/#%E8%AF%B7%E6%B1%82%E5%9C%B0%E5%9D%80
    server: 'https://v1.hitokoto.cn/?c=i',
    target: `(data) => data.hitokoto || 'Error'`
    // https://github.com/lukePeavey/quotable
    // server: 'https://api.quotable.io/quotes/random?maxLength=60',
    // target: `(data) => data[0].content || 'Error'`
  },
  // UnoCSS typography
  // See: https://unocss.dev/presets/typography
  typography: {
    class: 'prose text-base text-muted-foreground',
    // The style of blockquote font, normal or italic (default to italic in typography)
    blockquoteStyle: 'italic',
    // The style of inline code block, code or modern (default to code in typography)
    inlineCodeBlockStyle: 'modern'
  },
  // A lightbox library that can add zoom effect
  // See: https://astro-pure.js.org/docs/integrations/others#medium-zoom
  mediumZoom: {
    enable: true, // disable it will not load the whole library
    selector: '.prose .zoomable',
    options: {
      className: 'zoomable'
    }
  },
  // Comment system
  waline: {
    enable: false,
    // Fill in your own Waline service URL before enabling comments.
    server: '',
    // Refer https://waline.js.org/en/guide/features/emoji.html
    emoji: ['bmoji', 'weibo'],
    // Refer https://waline.js.org/en/reference/client/props.html
    additionalConfigs: {
      // search: false,
      pageview: true,
      comment: true,
      locale: {
        reaction0: 'Like',
        placeholder: 'Welcome to comment. (Email to receive replies. Login is unnecessary)'
      },
      imageUploader: false
    }
  }
}

const config = { ...theme, integ } as Config
export default config
