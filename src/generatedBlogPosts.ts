import blogAiAgentsSChegoNachat from '../content/blog-posts/ai-agents-s-chego-nachat.md?raw'
import blogAiTransformaciyaKompaniiObshchiyKontekstSkillsGbrain from '../content/blog-posts/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain.md?raw'
import blogBotRevolutionEn from '../content/blog-posts/bot-revolution-en.md?raw'
import blogBotRevolution from '../content/blog-posts/bot-revolution.md?raw'
import blogBusinessOnAiAgentClaudeCodePaperclipGstack from '../content/blog-posts/business-on-ai-agent-claude-code-paperclip-gstack.md?raw'
import blogClaudeCodeVsCodexPerehod from '../content/blog-posts/claude-code-vs-codex-perehod.md?raw'
import blogGstackGoalOfficeHoursAiWorkflow from '../content/blog-posts/gstack-goal-office-hours-ai-workflow.md?raw'
import blogImproveCodebaseArchitecturePrompt from '../content/blog-posts/improve-codebase-architecture-prompt.md?raw'
import blogMyAiSetup2026ClaudeCodeCursorSpokenlyGhostty from '../content/blog-posts/my-ai-setup-2026-claude-code-cursor-spokenly-ghostty.md?raw'
import blogVibecodingTelegramMiniAppClaudeCode from '../content/blog-posts/vibecoding-telegram-mini-app-claude-code.md?raw'
import articleAiAgentVTelegramRabochiyInterfeis from '../content/seo-articles/ai-agent-v-telegram-rabochiy-interfeis.md?raw'
import articleAiReelsSeoPipelineTelegramClaudeCode from '../content/seo-articles/ai-reels-seo-pipeline-telegram-claude-code.md?raw'
import articleGdeDeshevleKupitTelegramStars from '../content/seo-articles/gde-deshevle-kupit-telegram-stars.md?raw'
import articleHermesAgentVpsTelegramSetup from '../content/seo-articles/hermes-agent-vps-telegram-setup.md?raw'
import articleHermesAgentVpsTelegramUstanovka from '../content/seo-articles/hermes-agent-vps-telegram-ustanovka.md?raw'
import articleHermesAgentVsOpenclaw from '../content/seo-articles/hermes-agent-vs-openclaw.md?raw'
import articleHowToAnalyzeTonUsersAndTokenFlowsOnDune from '../content/seo-articles/how-to-analyze-ton-users-and-token-flows-on-dune.md?raw'
import articleKakPravilnoPisatSkillyClaudeCode7Oshibok from '../content/seo-articles/kak-pravilno-pisat-skilly-claude-code-7-oshibok.md?raw'
import articleTelegramBotApiVsMtprotoMethods from '../content/seo-articles/telegram-bot-api-vs-mtproto-methods.md?raw'
import articleTelegramBotsMiniAppsTrendsAugust2026En from '../content/seo-articles/telegram-bots-mini-apps-trends-august-2026-en.md?raw'
import articleTelegramBotsMiniAppsTrendsAugust2026 from '../content/seo-articles/telegram-bots-mini-apps-trends-august-2026.md?raw'
import articleTonOnChainDataAnalysisDune from '../content/seo-articles/ton-on-chain-data-analysis-dune.md?raw'

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
  seoTitle?: string
  seoDescription?: string
  publishedAt: string
  updatedAt: string
  lang: string
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
  blogAiAgentsSChegoNachat,
  blogAiTransformaciyaKompaniiObshchiyKontekstSkillsGbrain,
  blogBotRevolutionEn,
  blogBotRevolution,
  blogBusinessOnAiAgentClaudeCodePaperclipGstack,
  blogClaudeCodeVsCodexPerehod,
  blogGstackGoalOfficeHoursAiWorkflow,
  blogImproveCodebaseArchitecturePrompt,
  blogMyAiSetup2026ClaudeCodeCursorSpokenlyGhostty,
  blogVibecodingTelegramMiniAppClaudeCode,
]

const articleSources = [
  articleAiAgentVTelegramRabochiyInterfeis,
  articleAiReelsSeoPipelineTelegramClaudeCode,
  articleGdeDeshevleKupitTelegramStars,
  articleHermesAgentVpsTelegramSetup,
  articleHermesAgentVpsTelegramUstanovka,
  articleHermesAgentVsOpenclaw,
  articleHowToAnalyzeTonUsersAndTokenFlowsOnDune,
  articleKakPravilnoPisatSkillyClaudeCode7Oshibok,
  articleTelegramBotApiVsMtprotoMethods,
  articleTelegramBotsMiniAppsTrendsAugust2026En,
  articleTelegramBotsMiniAppsTrendsAugust2026,
  articleTonOnChainDataAnalysisDune,
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
    seoTitle: meta.seoTitle,
    seoDescription: meta.seoDescription,
    publishedAt: meta.publishedAt,
    updatedAt: meta.updatedAt,
    lang: meta.lang || 'ru',
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

export const generatedArticlePosts = articleSources
  .map(parseFrontmatter)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export const generatedBlogItems: BlogListItem[] = generatedBlogPosts.map((post) => ({
  path: generatedBlogPath(post.slug, post.lang),
  title: post.title,
  description: post.description,
  publishedAt: post.publishedAt,
  readingTime: post.readingTime,
  tags: post.tags,
  thumbnail: post.coverImage,
}))

export const generatedEnglishBlogItems: BlogListItem[] = generatedBlogPosts
  .filter((post) => post.lang === 'en')
  .map((post) => ({
    path: generatedBlogPath(post.slug, post.lang),
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    tags: post.tags,
    thumbnail: post.coverImage,
  }))

export const generatedRussianBlogItems: BlogListItem[] = generatedBlogPosts
  .filter((post) => post.lang !== 'en')
  .map((post) => ({
    path: generatedBlogPath(post.slug, post.lang),
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    tags: post.tags,
    thumbnail: post.coverImage,
  }))

export function getGeneratedBlogPost(slug: string | undefined, lang?: string) {
  return generatedBlogPosts.find((post) => post.slug === slug && (!lang || post.lang === lang))
}

export function generatedBlogPath(slug: string, lang = 'ru') {
  return lang === 'en' ? `/en/blog/${slug}/` : `/ru/blog/${slug}/`
}

export const generatedEnglishArticleItems: BlogListItem[] = generatedArticlePosts
  .filter((post) => post.lang === 'en')
  .map((post) => ({
    path: generatedArticlePath(post.slug, post.lang),
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    tags: post.tags,
    thumbnail: post.coverImage,
  }))

export const generatedRussianArticleItems: BlogListItem[] = generatedArticlePosts
  .filter((post) => post.lang !== 'en')
  .map((post) => ({
    path: generatedArticlePath(post.slug, post.lang),
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
    readingTime: post.readingTime,
    tags: post.tags,
    thumbnail: post.coverImage,
  }))

export function getGeneratedArticlePost(slug: string | undefined) {
  return generatedArticlePosts.find((post) => post.slug === slug)
}

export function generatedArticlePath(slug: string, lang = 'ru') {
  return lang === 'en' ? `/en/articles/${slug}/` : `/ru/articles/${slug}/`
}
