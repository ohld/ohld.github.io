import aiAgentsFromTelegram from '../content/blog-posts/ai-agents-s-chego-nachat.md?raw'
import claudeVsCodexFromTelegram from '../content/blog-posts/claude-code-vs-codex-perehod.md?raw'
import gstackGoalFromTelegram from '../content/blog-posts/gstack-goal-office-hours-ai-workflow.md?raw'
import companyContextFromTelegram from '../content/blog-posts/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain.md?raw'
import improveArchitectureFromTelegram from '../content/blog-posts/improve-codebase-architecture-prompt.md?raw'

interface BlogListItem {
  path: string
  title: string
  description: string
  publishedAt: string
  readingTime: string
  tags: string[]
  thumbnail?: string
}

export interface GeneratedBlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt: string
  readingTime: string
  tags: string[]
  coverImage?: string
  coverAlt?: string
  sourceTelegramId: string
  primaryKeyword: string
  secondaryKeywords: string[]
  views: string
  forwards: string
  comments: string
  reactions: string
  body: string
}

const sources = [
  aiAgentsFromTelegram,
  claudeVsCodexFromTelegram,
  gstackGoalFromTelegram,
  companyContextFromTelegram,
  improveArchitectureFromTelegram,
]

function parseFrontmatter(raw: string): GeneratedBlogPost {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error('Generated blog post is missing frontmatter')
  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  const tags = (meta.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean)
  const secondaryKeywords = (meta.secondaryKeywords || '').split(';').map((keyword) => keyword.trim()).filter(Boolean)

  return {
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    publishedAt: meta.publishedAt,
    updatedAt: meta.updatedAt,
    readingTime: meta.readingTime,
    tags,
    coverImage: meta.coverImage,
    coverAlt: meta.coverAlt,
    sourceTelegramId: meta.sourceTelegramId,
    primaryKeyword: meta.primaryKeyword,
    secondaryKeywords,
    views: meta.views,
    forwards: meta.forwards,
    comments: meta.comments,
    reactions: meta.reactions,
    body: match[2].trim(),
  }
}

export const generatedBlogPosts = sources
  .map(parseFrontmatter)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export const generatedBlogItems: BlogListItem[] = generatedBlogPosts.map((post) => ({
  path: `/blog/${post.slug}/`,
  title: post.title,
  description: post.description,
  publishedAt: post.publishedAt,
  readingTime: post.readingTime,
  tags: post.tags,
  thumbnail: post.coverImage,
}))

export function getGeneratedBlogPost(slug: string | undefined) {
  return generatedBlogPosts.find((post) => post.slug === slug)
}
