#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const importedArticlesPath = path.join('content', 'articles', 'imported-index.json')
const legacyRedirectsPath = path.join('content', 'articles', 'legacy-redirects.json')
const blogPostsPath = path.join('content', 'blog-posts')
const seoArticlesPath = path.join('content', 'seo-articles')
const topicHubsPath = path.join('content', 'topic-hubs.json')
const outPath = path.join('migration', 'url-map.csv')

const redirects = [
  {
    old_path: '/ru/',
    new_path: '/',
    action: '308_redirect',
    source: 'ru_prefix_home_cleanup',
    note: 'Root URL is the canonical Russian homepage; /ru/ redirects to avoid duplicate homepage hreflang.',
  },
  {
    old_path: '/author/okhlopkov/',
    new_path: '/about/',
    action: '308_redirect',
    source: 'ghost_service_page',
    note: 'Author page is service content; canonical destination is the new about page.',
  },
  {
    old_path: '/tag/second-brain/',
    new_path: '/vtoroj-mozg-ai-assistent-obsidian-claude-code/',
    action: '308_redirect',
    source: 'ghost_service_page',
    note: 'Tag page redirects to the strongest preserved second-brain article.',
  },
  {
    old_path: '/projects/',
    new_path: '/about/',
    action: '308_redirect',
    source: 'external_backlink_target',
    note: 'HackerNoon links to the old projects page; redirect to About until a dedicated Projects page exists.',
  },
  {
    old_path: '/tag/ai-agents/',
    new_path: '/topics/ai-agents/',
    action: '308_redirect',
    source: 'ghost_service_page',
    note: 'Tag page redirects to the maintained AI agents topic page.',
  },
  {
    old_path: '/tag/telegram/',
    new_path: '/ru/blog/',
    action: '308_redirect',
    source: 'ghost_service_page',
    note: 'Tag page redirects to the blog collection.',
  },
  {
    old_path: '/tag/ai/',
    new_path: '/ru/articles/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old AI tag appears in imported articles; redirect to the Articles index.',
  },
  {
    old_path: '/tag/analytics/',
    new_path: '/ru/blog/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old analytics tag appears in imported articles; redirect to the blog index.',
  },
  {
    old_path: '/tag/claude-code/',
    new_path: '/ru/articles/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old Claude Code tag appears in imported articles; redirect to the Articles index.',
  },
  {
    old_path: '/tag/crypto/',
    new_path: '/ru/blog/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old crypto tag appears in imported articles; redirect to the blog index.',
  },
  {
    old_path: '/tag/dokku/',
    new_path: '/cloudflare-certificates-dokku/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old Dokku tag appears in imported articles; redirect to the strongest imported Dokku article.',
  },
  {
    old_path: '/tag/parsing/',
    new_path: '/how-to-get-a-telegram-channel-subscribers-list-in-python/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old parsing tag appears in imported articles; redirect to the strongest imported parsing article.',
  },
  {
    old_path: '/tag/workflow/',
    new_path: '/topics/workflow/',
    action: '308_redirect',
    source: 'yandex_webmaster_example',
    note: 'Old workflow tag surfaced in Yandex Webmaster; redirect to the maintained workflow topic page.',
  },
  {
    old_path: '/tag/tutorial/',
    new_path: '/en/articles/',
    action: '308_redirect',
    source: 'yandex_webmaster_example',
    note: 'Old tutorial tag surfaced in Yandex Webmaster; redirect to the maintained English articles collection.',
  },
  {
    old_path: '/tag/telegram-bot/',
    new_path: '/topics/telegram-automation/',
    action: '308_redirect',
    source: 'yandex_webmaster_example',
    note: 'Old Telegram bot tag surfaced in Yandex Webmaster; redirect to the maintained Telegram automation topic page.',
  },
  {
    old_path: '/tag/telegram-cn/',
    new_path: '/en/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old Chinese Telegram tag is not maintained as a collection; redirect to the maintained English entry.',
  },
  {
    old_path: '/tag/telegram-en/',
    new_path: '/en/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old English Telegram tag is not maintained as a collection; redirect to the maintained English entry.',
  },
  {
    old_path: '/tag/web-scraping/',
    new_path: '/web-scraping-ai-agents-2026/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old web scraping tag appears in imported articles; redirect to the strongest imported web scraping article.',
  },
  {
    old_path: '/cn/',
    new_path: '/en/',
    action: '308_redirect',
    source: 'old_language_entry',
    note: 'Old CN entry is not a maintained content surface in the static migration.',
  },
  {
    old_path: '/my-tg-bots/',
    new_path: '/about/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old Telegram bots page is folded into About and background.',
  },
  {
    old_path: '/vibe-coding-guide-2026/',
    new_path: '/ru/articles/',
    action: '308_redirect',
    source: 'old_internal_link',
    note: 'Old vibe-coding guide link redirects to the maintained Articles collection.',
  },
  {
    old_path: '/closed/',
    new_path: '/private-channel/',
    action: '308_redirect_noindex_destination',
    source: 'old_private_page',
    note: 'Private channel page is direct-only and excluded from sitemap.',
  },
  {
    old_path: '/work-together/',
    new_path: '/about/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Commercial/contact route is folded into About to keep the primary site IA focused.',
  },
  {
    old_path: '/markdown-vs-html/',
    new_path: '/articles/markdown-vs-html/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Standalone article moved under the Articles collection.',
  },
  {
    old_path: '/posts/',
    new_path: '/ru/blog/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Old mini-app posts index now collapses into the blog surface.',
  },
  {
    old_path: '/blog/',
    new_path: '/ru/blog/',
    action: '308_redirect',
    source: 'ru_prefix_migration',
    note: 'Flat Russian blog index moved under /ru/ for language-prefixed IA.',
  },
  {
    old_path: '/articles/',
    new_path: '/ru/articles/',
    action: '308_redirect',
    source: 'ru_prefix_migration',
    note: 'Flat Russian articles index moved under /ru/ for language-prefixed IA.',
  },
  {
    old_path: '/ai-agents/',
    new_path: '/topics/ai-agents/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Old AI Agents hub now points to the maintained topic page.',
  },
  {
    old_path: '/ai-course/',
    new_path: '/ru/articles/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Old AI course route is no longer a primary public surface.',
  },
  {
    old_path: '/blog/ai-tools-for-designers-design-engineering-agents/',
    new_path: '/ru/articles/ai-tools-for-designers-design-engineering-agents/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'The design engineering piece belongs in Articles, not in the personal blog feed.',
  },
  {
    old_path: '/articles/ai-tools-for-designers-design-engineering-agents/',
    new_path: '/ru/articles/ai-tools-for-designers-design-engineering-agents/',
    action: '308_redirect',
    source: 'ru_prefix_migration',
    note: 'New Russian static article moved under /ru/ before accumulating meaningful SEO signals.',
  },
  {
    old_path: '/blog/hermes-agent-vs-openclaw/',
    new_path: '/ru/articles/hermes-agent-vs-openclaw/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'SEO-generated comparison moved from Blog to Articles to keep Blog reserved for Dan-authored channel posts.',
  },
]

if (fs.existsSync(legacyRedirectsPath)) {
  const legacyRedirects = JSON.parse(fs.readFileSync(legacyRedirectsPath, 'utf8'))
  for (const redirect of legacyRedirects) {
    redirects.push({
      old_path: redirect.from.endsWith('/') ? redirect.from : `${redirect.from}/`,
      new_path: redirect.to.endsWith('/') ? redirect.to : `${redirect.to}/`,
      action: '308_redirect',
      source: 'legacy_cn_url',
      note: redirect.note || 'Old URL redirects to the closest maintained canonical article.',
    })
  }
}

const topicHubConfig = JSON.parse(fs.readFileSync(topicHubsPath, 'utf8'))
const minTopicItemsForIndex = topicHubConfig.minItemsForIndex || 2
const topicStaticPages = (topicHubConfig.hubs || []).map((topic) => [
  `/topics/${topic.slug}/`,
  'new_static_page',
  'ru',
  (topic.articlePaths || []).length >= minTopicItemsForIndex ? 'index, follow' : 'noindex, follow',
  `Topic collection for ${topic.title}`,
])

const newStaticPages = [
  ['/', 'new_static_page', 'ru', 'Canonical Russian homepage'],
  ['/en/', 'new_static_page', 'en', 'English homepage'],
  ['/en/blog/', 'new_static_page', 'en', 'English-only blog index'],
  ['/en/articles/', 'new_static_page', 'en', 'English-only article index'],
  ['/en/about/', 'new_static_page', 'en', 'English about page'],
  ['/about/', 'new_static_page', 'ru', 'About page'],
  ['/ru/blog/', 'new_static_page', 'ru', 'Indexable blog for Dan-authored posts'],
  ['/ru/articles/', 'new_static_page', 'ru', 'Article index'],
  ['/ru/articles/ai-tools-for-designers-design-engineering-agents/', 'new_static_page', 'ru', 'First YouTube-derived article with component examples'],
  ['/articles/markdown-vs-html/', 'new_static_page', 'ru', 'Existing static article route moved under Articles'],
  ['/archive/', 'new_static_page', 'ru', 'Full material archive grouped by language, topic and year'],
  ['/telegram-map/', 'new_static_page', 'ru', 'Interactive semantic map of public Telegram posts'],
  ['/privacy/', 'new_static_page', 'en', 'Privacy policy for Pinterest app review and site data practices'],
  ...topicStaticPages,
]

function parseFrontmatter(raw, filename = 'markdown file') {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error(`${filename}: missing frontmatter`)
  const meta = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return meta
}

function readGeneratedBlogPosts() {
  return readGeneratedMarkdownEntries(blogPostsPath)
}

function readGeneratedSeoArticles() {
  return readGeneratedMarkdownEntries(seoArticlesPath)
}

function generatedArticlePath(article) {
  return article.lang === 'en' ? `/en/articles/${article.slug}/` : `/ru/articles/${article.slug}/`
}

function generatedBlogPath(post) {
  return (post.lang || 'ru') === 'en' ? `/en/blog/${post.slug}/` : `/ru/blog/${post.slug}/`
}

function readGeneratedMarkdownEntries(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'), file))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

function csvCell(value) {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

function row(cells) {
  return cells.map(csvCell).join(',')
}

function readImportedArticles() {
  if (!fs.existsSync(importedArticlesPath)) {
    throw new Error(`${importedArticlesPath} does not exist. Run the article import before building the migration map.`)
  }
  return JSON.parse(fs.readFileSync(importedArticlesPath, 'utf8'))
}

function normalizePathname(value) {
  return value.endsWith('/') ? value : `${value}/`
}

const headers = [
  'old_url',
  'old_path',
  'action',
  'new_url',
  'new_path',
  'expected_status',
  'robots',
  'lang',
  'title',
  'source',
  'note',
]

const lines = [row(headers)]

const redirectedOldPaths = new Set(redirects.map((redirect) => normalizePathname(redirect.old_path)))

for (const article of readImportedArticles()) {
  if (redirectedOldPaths.has(normalizePathname(article.path))) continue

  lines.push(row([
    `${SITE_URL}${article.path}`,
    article.path,
    'preserve_same_path',
    `${SITE_URL}${article.path}`,
    article.path,
    '200',
    'index, follow',
    article.lang,
    article.title || '',
    'imported_article',
    'Imported into the normal article catalog with original path, canonical URL and shared article renderer.',
  ]))
}

for (const redirect of redirects) {
  lines.push(row([
    `${SITE_URL}${redirect.old_path}`,
    redirect.old_path,
    redirect.action,
    `${SITE_URL}${redirect.new_path}`,
    redirect.new_path,
    '308',
    redirect.action.includes('noindex') ? 'destination: noindex, follow' : 'n/a',
    '',
    '',
    redirect.source,
    redirect.note,
  ]))
}

for (const [pagePath, action, lang, robots, note] of newStaticPages.map(([pagePath, action, lang, maybeRobots, maybeNote]) => (
  maybeNote ? [pagePath, action, lang, maybeRobots, maybeNote] : [pagePath, action, lang, 'index, follow', maybeRobots]
))) {
  lines.push(row([
    '',
    '',
    action,
    `${SITE_URL}${pagePath}`,
    pagePath,
    '200',
    robots,
    lang,
    '',
    'static_app_route',
    note,
  ]))
}

for (const post of readGeneratedBlogPosts()) {
  const pagePath = generatedBlogPath(post)
  lines.push(row([
    '',
    '',
    'new_static_page',
    `${SITE_URL}${pagePath}`,
    pagePath,
    '200',
    'index, follow',
    post.lang || 'ru',
    post.title || '',
    'dan_authored_blog_post',
    'Native blog article written in Dan voice for okhlopkov.com.',
  ]))
}

for (const article of readGeneratedSeoArticles()) {
  const pagePath = generatedArticlePath(article)
  lines.push(row([
    '',
    '',
    'new_static_page',
    `${SITE_URL}${pagePath}`,
    pagePath,
    '200',
    'index, follow',
    article.lang || 'ru',
    article.title || '',
    'seo_generated_article',
    'SEO-generated source-pack article; canonical under Articles, not Blog.',
  ]))
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${lines.join('\n')}\n`)
console.log(`✓ wrote ${outPath} (${lines.length - 1} rows)`)
