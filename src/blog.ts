import {
  generatedEnglishArticleItems,
  generatedEnglishBlogItems,
  generatedRussianArticleItems,
  generatedRussianBlogItems,
  generatedArticlePath,
} from './generatedBlogMetadata'
import { importedArticleListItems } from './importedArticles'

export interface BlogArticle {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  readingTime: string
  tags: string[]
  coverImage?: string
  coverAlt?: string
  youtube?: {
    title: string
    url: string
    thumbnail: string
    publishedAt: string
  }
}

export interface BlogListItem {
  path: string
  title: string
  description: string
  publishedAt: string
  readingTime: string
  tags: string[]
  thumbnail?: string
}

function listItemKey(path: string) {
  return path.replace(/\/+$/, '') || '/'
}

export function latestUniqueItems(items: BlogListItem[], limit: number): BlogListItem[] {
  const byPath = new Map<string, { item: BlogListItem; index: number }>()

  items.forEach((item, index) => {
    const key = listItemKey(item.path)
    if (!byPath.has(key)) {
      byPath.set(key, { item, index })
    }
  })

  return [...byPath.values()]
    .sort((a, b) => {
      const byDate = b.item.publishedAt.localeCompare(a.item.publishedAt)
      return byDate || a.index - b.index
    })
    .slice(0, limit)
    .map(({ item }) => item)
}

function withoutItemPaths(items: BlogListItem[], excludedItems: BlogListItem[]): BlogListItem[] {
  const excluded = new Set(excludedItems.map((item) => listItemKey(item.path)))
  return items.filter((item) => !excluded.has(listItemKey(item.path)))
}

export const russianBlogItems: BlogListItem[] = [
  {
    path: '/karta-postov-telegram/',
    title: 'Карта моих постов в Telegram',
    description: 'Интерактивная карта 1 556 постов @danokhlopkov за 2020–2026 годы: темы, связи, поиск и эволюция интересов.',
    publishedAt: '2026-07-20',
    readingTime: 'Интерактивная карта',
    tags: ['Telegram', 'Данные', 'Личный архив'],
    thumbnail: '/assets/blog/karta-postov-telegram/telegram-posts-map-cover-20260720.webp',
  },
  ...generatedRussianBlogItems,
  ...importedArticleListItems([
    '/claude-code-nastrojka-mcp-hooks-skills-2026/',
    '/vtoroj-mozg-ai-assistent-obsidian-claude-code/',
    '/luchshie-skills-mcp-claude-code-agent-browser/',
    '/claude-code-compaction-kak-rabotaet/',
    '/claude-codex-dual-review/',
    '/ai-agent-forum-telegram-chat-agenty/',
  ]),
]

export const seoArticles: BlogArticle[] = [
  {
    slug: 'ai-tools-for-designers-design-engineering-agents',
    title: 'AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code',
    description: 'Разбор стрима про design engineering: как дизайнерам работать с AI-агентами, почему появляется AI-slop, зачем нужны design tokens, Paper, Mobbin MCP и хороший контекст для Codex/Claude Code.',
    publishedAt: '2026-05-25',
    updatedAt: '2026-05-28',
    readingTime: '9 мин',
    tags: ['AI Agents', 'Design Engineering', 'Frontend'],
    coverImage: '/assets/articles/ai-tools-for-designers-design-engineering-agents/design-engineering-cover.webp',
    coverAlt: 'Мем-обложка AI-SLOP про design engineering и AI-инструменты для дизайнеров',
    youtube: {
      title: 'ИИ не вывозит норм дизайн или это skill issue? | Подкаст «Мой AI сетап»',
      url: 'https://www.youtube.com/watch?v=fIEMOzz0_AI',
      thumbnail: 'https://i.ytimg.com/vi/fIEMOzz0_AI/maxresdefault.jpg',
      publishedAt: '2026-05-21',
    },
  },
]

export const russianArticleItems: BlogListItem[] = [
  ...generatedRussianArticleItems,
  ...seoArticles.map((article) => ({
    path: articlePath(article.slug),
    title: article.title,
    description: article.description,
    publishedAt: article.publishedAt,
    readingTime: article.readingTime,
    tags: article.tags,
    thumbnail: article.coverImage || article.youtube?.thumbnail,
  })),
  {
    path: '/articles/markdown-vs-html/',
    title: 'Markdown vs HTML для AI-агентов',
    description: 'Почему HTML лучше Markdown для длинных AI-agent артефактов, когда агент пишет, а человек читает, ревьюит и шарит.',
    publishedAt: '2026-05-09',
    readingTime: '10 мин',
    tags: ['AI Agents', 'HTML', 'Markdown', 'Claude Code'],
    thumbnail: '/assets/articles/markdown-vs-html/html-vs-markdown-cover.webp',
  },
]

export const englishArticleItems: BlogListItem[] = [
  ...generatedEnglishArticleItems,
  ...importedArticleListItems([
    '/web-scraping-ai-agents-2026/',
    '/en-best-skills-mcp-claude-code-agent-browser/',
    '/claude-code-compaction-explained/',
    '/en-beads-gastown-framework-ai-agents/',
  ]),
]

export const englishBlogItems: BlogListItem[] = withoutItemPaths([
  ...generatedEnglishBlogItems,
  ...importedArticleListItems([
    '/claude-code-setup-mcp-hooks-skills-2026/',
    '/en-second-brain-obsidian-claude-code-assistant/',
    '/web-scraping-ai-agents-2026/',
    '/en-best-skills-mcp-claude-code-agent-browser/',
    '/en-show-me-ai-setup-ghostty-ownyourchat-descript/',
    '/ai-tools-setup-january-2026/',
  ]),
], englishArticleItems)

export function blogPath(slug: string) {
  return `/ru/blog/${slug}/`
}

export function articlePath(slug: string, lang = 'ru') {
  return generatedArticlePath(slug, lang)
}

export function getBlogArticle(slug: string | undefined) {
  return seoArticles.find((article) => article.slug === slug)
}
