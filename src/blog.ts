import { generatedBlogItems } from './generatedBlogPosts'
import { importedArticleListItems } from './importedArticles'

export interface BlogArticle {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  readingTime: string
  tags: string[]
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

export const russianBlogItems: BlogListItem[] = [
  ...generatedBlogItems,
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
    updatedAt: '2026-05-25',
    readingTime: '9 мин',
    tags: ['AI Agents', 'Design Engineering', 'Frontend'],
    youtube: {
      title: 'ИИ не вывозит норм дизайн или это skill issue? | Подкаст «Мой AI сетап»',
      url: 'https://www.youtube.com/watch?v=fIEMOzz0_AI',
      thumbnail: 'https://i.ytimg.com/vi/fIEMOzz0_AI/maxresdefault.jpg',
      publishedAt: '2026-05-21',
    },
  },
]

export const russianArticleItems: BlogListItem[] = [
  ...seoArticles.map((article) => ({
    path: articlePath(article.slug),
    title: article.title,
    description: article.description,
    publishedAt: article.publishedAt,
    readingTime: article.readingTime,
    tags: article.tags,
    thumbnail: article.youtube?.thumbnail,
  })),
  {
    path: '/articles/markdown-vs-html/',
    title: 'Markdown мёртв — да здравствует HTML',
    description: 'Почему HTML лучше подходит для длинных AI-agent артефактов, когда файлы пишет агент, а человек читает и шарит.',
    publishedAt: '2026-05-09',
    readingTime: '10 мин',
    tags: ['AI Agents', 'HTML', 'Claude Code'],
  },
]

export const englishArticleItems: BlogListItem[] = [
  ...importedArticleListItems([
    '/web-scraping-ai-agents-2026/',
    '/en-best-skills-mcp-claude-code-agent-browser/',
    '/claude-code-compaction-explained/',
    '/en-beads-gastown-framework-ai-agents/',
  ]),
]

export const englishBlogItems: BlogListItem[] = [
  ...importedArticleListItems([
    '/claude-code-setup-mcp-hooks-skills-2026/',
    '/en-second-brain-obsidian-claude-code-assistant/',
    '/web-scraping-ai-agents-2026/',
    '/en-best-skills-mcp-claude-code-agent-browser/',
    '/en-show-me-ai-setup-ghostty-ownyourchat-descript/',
    '/ai-tools-setup-january-2026/',
  ]),
]

export function blogPath(slug: string) {
  return `/blog/${slug}/`
}

export function articlePath(slug: string) {
  return `/articles/${slug}/`
}

export function getBlogArticle(slug: string | undefined) {
  return seoArticles.find((article) => article.slug === slug)
}
