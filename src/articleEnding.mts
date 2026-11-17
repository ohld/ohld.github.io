import importedIndex from '../content/articles/imported-index.json' with { type: 'json' }
import legacyRedirects from '../content/articles/legacy-redirects.json' with { type: 'json' }
import topicHubs from '../content/topic-hubs.json' with { type: 'json' }
import { getEnhancedArticleTitle } from './articleSeoEnhancements.ts'
import { generatedArticleMeta, generatedArticlePath, generatedBlogMeta, generatedBlogPath } from './generatedBlogMetadata.ts'

interface RelatedArticle {
  path: string
  title: string
  lang: string
  tags: readonly string[]
  publishedAt: string
}

interface TopicHub {
  aliases: readonly string[]
  articlePaths?: readonly string[]
}

function articlePathKey(path: string) {
  return path.replace(/\/+$/, '') + '/'
}

function topicMembership(article: RelatedArticle, hubs: readonly TopicHub[]) {
  const text = [article.title, ...article.tags].join(' ').toLowerCase()
  return hubs.filter((hub) =>
    hub.articlePaths?.some((path) => articlePathKey(path) === article.path) ||
    hub.aliases.some((alias) => text.includes(alias.toLowerCase())),
  )
}

export function selectRelatedArticles(
  article: RelatedArticle,
  candidates: readonly RelatedArticle[],
  hubs: readonly TopicHub[],
  preferredPaths: readonly string[] = [],
) {
  const path = articlePathKey(article.path)
  const tags = new Set(article.tags.map((tag) => tag.toLowerCase()))
  const topics = new Set(topicMembership({ ...article, path }, hubs))
  const seen = new Set([path])

  return candidates.flatMap((candidate) => {
    const path = articlePathKey(candidate.path)
    if (candidate.lang !== article.lang || seen.has(path)) return []
    seen.add(path)
    const item = { ...candidate, path }
    const sharedTags = new Set(candidate.tags.map((tag) => tag.toLowerCase()).filter((tag) => tags.has(tag)))
    const sharedTopics = topicMembership(item, hubs).filter((topic) => topics.has(topic))
    const preference = preferredPaths.indexOf(path)
    return [{ item, tagCount: sharedTags.size, topicCount: sharedTopics.length, preference }]
  })
    // Keep authored recommendations first, then use affinities and a stable tie-break.
    .sort((a, b) => Number(a.preference < 0) - Number(b.preference < 0)
      || a.preference - b.preference
      || b.tagCount - a.tagCount
      || b.topicCount - a.topicCount
      || b.item.publishedAt.localeCompare(a.item.publishedAt)
      || a.item.path.localeCompare(b.item.path, 'en'))
    .slice(0, 3)
    .map(({ item }) => item)
}

const redirectPaths = new Set(legacyRedirects.map(({ from }) => articlePathKey(from)))
const articleInventory: RelatedArticle[] = [
  ...generatedBlogMeta.map((post) => ({ ...post, path: generatedBlogPath(post.slug, post.lang) })),
  ...generatedArticleMeta.map((post) => ({ ...post, path: generatedArticlePath(post.slug, post.lang) })),
  ...importedIndex
    .filter(({ path }) => !redirectPaths.has(articlePathKey(path)))
    .map((post) => ({ ...post, title: getEnhancedArticleTitle(post.path, post.title) })),
]
const authoredRecommendations: Record<string, string[]> = {
  '/ru/blog/bot-revolution/': [
    '/ru/blog/business-on-ai-agent-claude-code-paperclip-gstack/',
    '/ru/articles/hermes-agent-vs-openclaw/',
  ],
  '/en/blog/bot-revolution/': [
    '/en/articles/hermes-agent-vps-telegram-setup/',
    '/en/articles/telegram-bot-api-vs-mtproto-methods/',
  ],
}

const relatedLinkLabels: Record<string, string> = {
  '/ru/articles/ai-reels-seo-pipeline-telegram-claude-code/': 'Как собрать AI-рилзы из трендов Telegram',
}

const copy = {
  ru: {
    about: '/about/',
    author: 'Даниил Охлопков',
    bio: 'Strategic Analytics Lead @ TOP.co. Пишет об AI-агентах, данных и автоматизации в Telegram.',
    related: 'Читать ещё',
    channel: 'Telegram-канал',
    chat: 'Telegram-чат',
  },
  en: {
    about: '/en/about/',
    author: 'Daniil Okhlopkov',
    bio: 'Strategic Analytics Lead @ TOP.co. Writes about AI agents, on-chain data, and Telegram automation.',
    related: 'Read next',
    channel: 'Telegram channel',
    chat: 'Telegram chat',
  },
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function articleEnding(path: string) {
  const key = articlePathKey(path)
  const article = articleInventory.find((entry) => entry.path === key)
  if (!article || (article.lang !== 'ru' && article.lang !== 'en')) return
  return {
    text: copy[article.lang],
    related: selectRelatedArticles(article, articleInventory, topicHubs.hubs, authoredRecommendations[key])
      .map(({ path, title }) => ({ path, title: relatedLinkLabels[path] || title })),
    ctaPrefix: key in authoredRecommendations ? 'bot_revolution' : 'article_footer',
  }
}

export function articleEndingHtml(path: string) {
  const ending = articleEnding(path)
  if (!ending) return ''
  const { text, related, ctaPrefix } = ending
  return `<aside class="article-ending">
    <div class="article-ending-author">
      <img src="/assets/drafts/bot-revolution/telegram-cards/dan-channel-96.webp" alt="${text.author}" width="48" height="48" loading="lazy" />
      <div>
        <a href="${text.about}"><strong>${text.author}</strong></a> ·
        <a href="https://www.linkedin.com/in/danokhlopkov/">LinkedIn</a>
        <p>${text.bio}</p>
      </div>
    </div>
    <nav class="article-ending-related" aria-label="${text.related}">
      <strong>${text.related}</strong>
      <ul>${related.map((item) => `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.title)}</a></li>`).join('')}</ul>
    </nav>
    <div class="article-ending-telegram">
      <a href="https://t.me/danokhlopkov" target="_blank" rel="noopener noreferrer" data-cta-id="${ctaPrefix}_channel">${text.channel}</a>
      <a href="https://t.me/ohld_chat" target="_blank" rel="noopener noreferrer" data-cta-id="${ctaPrefix}_chat">${text.chat}</a>
    </div>
  </aside>`
}

export function articleEndingMarkdown(path: string) {
  const ending = articleEnding(path)
  if (!ending) return ''
  const links = ending.related.map((item) => `- [${item.title.replace(/[\\\[\]]/g, '\\$&')}](${item.path})`)
  return `\n\n## ${ending.text.related}\n\n${links.join('\n')}`
}
