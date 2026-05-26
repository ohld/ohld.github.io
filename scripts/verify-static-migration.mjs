#!/usr/bin/env node
import fs from 'node:fs'

const baseUrl = (process.env.VERIFY_BASE_URL || 'http://127.0.0.1:4174').replace(/\/$/, '')
const siteUrl = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const importedArticlesPath = process.env.VERIFY_IMPORTED_ARTICLES || 'content/articles/imported-index.json'
const importedArticleContentPath = process.env.VERIFY_IMPORTED_ARTICLE_CONTENT || 'content/articles/imported-content.json'
const migrationMapPath = process.env.VERIFY_MIGRATION_MAP || 'migration/url-map.csv'
const backlinkCriticalPath = process.env.VERIFY_BACKLINK_CRITICAL || 'migration/backlink-critical-urls.csv'
const blogPostsPath = process.env.VERIFY_BLOG_POSTS || 'content/blog-posts'
const verbose = process.env.VERIFY_VERBOSE === '1'
const requireStrict404 = process.env.VERIFY_REQUIRE_STRICT_404 === '1'
const requireRealRedirects = process.env.VERIFY_REQUIRE_REAL_REDIRECTS === '1'
const requireEdgeRedirects = process.env.VERIFY_REQUIRE_EDGE_REDIRECTS === '1'
const requireOriginHeaders = process.env.VERIFY_REQUIRE_ORIGIN_HEADERS === '1'
const missingPath = '/__missing-static-migration-check-404/'
const gaMeasurementId = 'G-9Z5T725JJD'
const yandexMetrikaId = '46266270'
const yandexVerificationIds = ['1b82de56693018c1', '3553f1209d48d2c4']
const expectedSitemapLastmod = process.env.VERIFY_EXPECTED_SITEMAP_LASTMOD || '2026-05-25'

const topImportedSmokePages = [
  {
    path: '/claude-code-setup-mcp-hooks-skills-2026/',
    title: 'My Claude Code Setup After 4 Months of Daily Use (2026)',
  },
  {
    path: '/claude-code-nastrojka-mcp-hooks-skills-2026/',
    title: 'Мой сетап Claude Code после 4 месяцев ежедневной работы',
  },
  {
    path: '/web-scraping-ai-agents-2026/',
    title: 'Web Scraping Is Dead: What AI Agents Replaced It With',
  },
  {
    path: '/how-to-get-a-telegram-channel-subscribers-list-in-python/',
    title: 'How to get a Telegram channel subscribers list in python',
  },
]

function parseBlogFrontmatter(raw, filename = 'markdown file') {
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

function loadGeneratedBlogPosts() {
  if (!fs.existsSync(blogPostsPath)) return []
  return fs.readdirSync(blogPostsPath)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseBlogFrontmatter(fs.readFileSync(`${blogPostsPath}/${file}`, 'utf8'), file))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

const generatedBlogPosts = loadGeneratedBlogPosts()

const topicPages = [
  ['/topics/ai-agents/', 'AI-агенты — Даниил Охлопков'],
  ['/topics/claude-code/', 'Claude Code — Даниил Охлопков'],
  ['/topics/codex/', 'Codex — Даниил Охлопков'],
  ['/topics/mcp/', 'MCP — Даниил Охлопков'],
  ['/topics/gstack/', 'GStack — Даниил Охлопков'],
  ['/topics/gbrain/', 'GBrain — Даниил Охлопков'],
  ['/topics/ai-coding/', 'AI coding — Даниил Охлопков'],
  ['/topics/ai-transformation/', 'AI-трансформация — Даниил Охлопков'],
  ['/topics/refactoring/', 'Рефакторинг — Даниил Охлопков'],
  ['/topics/ai-tools/', 'AI-инструменты — Даниил Охлопков'],
  ['/topics/design-engineering/', 'Design engineering — Даниил Охлопков'],
  ['/topics/html/', 'HTML — Даниил Охлопков'],
  ['/topics/second-brain/', 'Second Brain — Даниил Охлопков'],
  ['/topics/web-scraping/', 'Web scraping — Даниил Охлопков'],
  ['/topics/frameworks/', 'Фреймворки для агентов — Даниил Охлопков'],
  ['/topics/workflow/', 'Workflow — Даниил Охлопков'],
  ['/topics/community/', 'Community — Даниил Охлопков'],
  ['/topics/openclaw/', 'OpenClaw — Даниил Охлопков'],
  ['/topics/ton-data/', 'TON-данные — Даниил Охлопков'],
  ['/topics/telegram-automation/', 'Telegram-автоматизация — Даниил Охлопков'],
]

const staticPages = [
  {
    path: '/en/blog/',
    title: 'Blog — Daniil Okhlopkov',
    lang: 'en',
    ogLocale: 'en_US',
    hreflangs: ['ru', 'en', 'x-default'],
  },
  {
    path: '/en/articles/',
    title: 'Articles — Daniil Okhlopkov',
    lang: 'en',
    ogLocale: 'en_US',
    hreflangs: ['ru', 'en', 'x-default'],
  },
  {
    path: '/en/about/',
    title: 'About — Daniil Okhlopkov',
    lang: 'en',
    ogLocale: 'en_US',
    hreflangs: ['ru', 'en', 'x-default'],
  },
  {
    path: '/blog/',
    title: 'Блог — Даниил Охлопков',
    lang: 'ru',
    ogLocale: 'ru_RU',
    hreflangs: ['ru', 'en', 'x-default'],
  },
  {
    path: '/articles/',
    title: 'Статьи — Даниил Охлопков',
    lang: 'ru',
    ogLocale: 'ru_RU',
    hreflangs: ['ru', 'en', 'x-default'],
  },
  {
    path: '/articles/ai-tools-for-designers-design-engineering-agents/',
    title: 'AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code',
    lang: 'ru',
    ogLocale: 'ru_RU',
    hreflangs: ['ru', 'x-default'],
  },
  {
    path: '/articles/markdown-vs-html/',
    title: 'Markdown мёртв — да здравствует HTML | Даниил Охлопков',
    lang: 'ru',
    ogLocale: 'ru_RU',
    hreflangs: ['ru', 'x-default'],
  },
  {
    path: '/privacy/',
    title: 'Privacy Policy — okhlopkov.com',
    lang: 'en',
    ogLocale: 'en_US',
    hreflangs: ['en', 'x-default'],
  },
  ...topicPages.map(([path, title]) => ({
    path,
    title,
    lang: 'ru',
    ogLocale: 'ru_RU',
    hreflangs: ['ru', 'x-default'],
  })),
  ...generatedBlogPosts.map((post) => ({
    path: `/blog/${post.slug}/`,
    title: post.title,
    lang: 'ru',
    ogLocale: 'ru_RU',
    hreflangs: ['ru', 'x-default'],
  })),
]

const redirects = [
  ['/ru/', '/'],
  ['/closed/', '/private-channel/'],
  ['/work-together/', '/about/'],
  ['/markdown-vs-html/', '/articles/markdown-vs-html/'],
  ['/posts/', '/blog/'],
  ['/ai-agents/', '/articles/'],
  ['/ai-course/', '/articles/'],
  ['/blog/ai-tools-for-designers-design-engineering-agents/', '/articles/ai-tools-for-designers-design-engineering-agents/'],
  ['/author/okhlopkov/', '/about/'],
  ['/projects/', '/about/'],
  ['/tag/second-brain/', '/vtoroj-mozg-ai-assistent-obsidian-claude-code/'],
  ['/tag/ai-agents/', '/articles/'],
  ['/tag/telegram/', '/blog/'],
  ['/tag/ai/', '/articles/'],
  ['/tag/analytics/', '/blog/'],
  ['/tag/claude-code/', '/articles/'],
  ['/tag/crypto/', '/blog/'],
  ['/tag/dokku/', '/cloudflare-certificates-dokku/'],
  ['/tag/parsing/', '/how-to-get-a-telegram-channel-subscribers-list-in-python/'],
  ['/tag/telegram-cn/', '/en/'],
  ['/tag/telegram-en/', '/en/'],
  ['/tag/web-scraping/', '/web-scraping-ai-agents-2026/'],
  ['/cn/', '/en/'],
  ['/my-tg-bots/', '/about/'],
  ['/vibe-coding-guide-2026/', '/articles/'],
]

const noindexPages = [
  '/private-channel/',
]

const blogArticleChecks = [
  {
    path: '/articles/ai-tools-for-designers-design-engineering-agents/',
    thumbnail: 'https://i.ytimg.com/vi/fIEMOzz0_AI/maxresdefault.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=fIEMOzz0_AI',
    requiredText: [
      'Почему агенты делают AI-slop',
      'Промпт, который можно дать агенту',
      'Все статьи',
    ],
  },
]

const generatedBlogChecks = generatedBlogPosts.map((post) => ({
  path: `/blog/${post.slug}/`,
  title: post.title,
  requiredText: [
    'Что добавилось из обсуждений',
    'Читать ещё',
  ],
}))

const migrationMapStaticPaths = [
  '/',
  '/en/',
  '/en/blog/',
  '/en/articles/',
  '/en/about/',
  '/about/',
  '/blog/',
  '/articles/',
  '/articles/ai-tools-for-designers-design-engineering-agents/',
  '/articles/markdown-vs-html/',
  ...topicPages.map(([path]) => path),
  '/privacy/',
  ...generatedBlogPosts.map((post) => `/blog/${post.slug}/`),
]

function loadImportedArticles() {
  if (!fs.existsSync(importedArticlesPath)) return []
  return JSON.parse(fs.readFileSync(importedArticlesPath, 'utf8'))
}

function loadImportedArticleContent() {
  if (!fs.existsSync(importedArticleContentPath)) return []
  return JSON.parse(fs.readFileSync(importedArticleContentPath, 'utf8'))
}

function loadBacklinkCriticalRows() {
  assert(fs.existsSync(backlinkCriticalPath), `${backlinkCriticalPath}: missing backlink-critical URL inventory`)
  return parseCsv(fs.readFileSync(backlinkCriticalPath, 'utf8'))
}

function loadMigrationMapRows() {
  assert(fs.existsSync(migrationMapPath), `${migrationMapPath}: missing; run npm run migration:map`)
  return parseCsv(fs.readFileSync(migrationMapPath, 'utf8'))
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function absolute(path) {
  return `${baseUrl}${path}`
}

function canonicalUrl(path) {
  return `${siteUrl}${path}`
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const [headers, ...dataRows] = rows
  return dataRows.map((dataRow) => Object.fromEntries(headers.map((header, index) => [header, dataRow[index] || ''])))
}

function decodeHtml(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeText(s = '') {
  return decodeHtml(s).replace(/\s+/g, ' ').trim()
}

async function fetchManual(path) {
  return fetch(absolute(path), {
    redirect: 'manual',
    headers: { 'user-agent': 'okhlopkov-static-migration-verifier/1.0' },
  })
}

async function fetchUrlManual(url) {
  return fetch(url, {
    redirect: 'manual',
    headers: { 'user-agent': 'okhlopkov-static-migration-verifier/1.0' },
  })
}

function parseAttrs(source) {
  const attrs = {}
  for (const match of source.matchAll(/([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[3] ?? match[4] ?? match[5] ?? '')
  }
  return attrs
}

function readMeta(html, selector) {
  for (const match of html.matchAll(/<meta\s+([^>]+)>/gi)) {
    const attrs = parseAttrs(match[1])
    if (attrs.name === selector || attrs.property === selector) return attrs.content || ''
  }
  for (const match of html.matchAll(/<link\s+([^>]+)>/gi)) {
    const attrs = parseAttrs(match[1])
    if (attrs.rel === selector) return attrs.href || ''
  }
  return ''
}

function readMetaAll(html, selector) {
  const values = []
  for (const match of html.matchAll(/<meta\s+([^>]+)>/gi)) {
    const attrs = parseAttrs(match[1])
    if (attrs.name === selector || attrs.property === selector) values.push(attrs.content || '')
  }
  return values
}

function isPermanentRedirect(status) {
  return status === 301 || status === 308
}

function redirectPathMatches(location, targetPath) {
  if (!location) return false
  const actual = new URL(location, siteUrl)
  const expected = new URL(targetPath, siteUrl)
  return actual.pathname === expected.pathname
    && actual.search === expected.search
    && actual.hash === expected.hash
}

function redirectUrlMatches(location, targetUrl, base = siteUrl) {
  if (!location) return false
  const actual = new URL(location, base)
  const expected = new URL(targetUrl)
  return actual.protocol === expected.protocol
    && actual.host === expected.host
    && actual.pathname === expected.pathname
    && actual.search === expected.search
    && actual.hash === expected.hash
}

function readTitle(html) {
  return normalizeText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function verifyAnalyticsSnippet(html, path) {
  assert(html.includes(`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`), `${path}: missing GA4 loader`)
  assert(new RegExp(`gtag\\(['"]config['"],\\s*['"]${escapeRegExp(gaMeasurementId)}['"]`).test(html), `${path}: missing GA4 config`)
  assert(html.includes('https://mc.yandex.ru/metrika/tag.js'), `${path}: missing Yandex Metrika loader`)
  assert(new RegExp(`ym\\(\\s*${escapeRegExp(yandexMetrikaId)}\\s*,\\s*['"]init['"]`).test(html), `${path}: missing Yandex Metrika init`)
  assert(html.includes(`https://mc.yandex.ru/watch/${yandexMetrikaId}`), `${path}: missing Yandex Metrika noscript pixel`)
}

function verifyArticleContentAnalyticsMarkup(html, path) {
  assert(readMeta(html, 'og:type') === 'article', `${path}: og:type should be article`)
  assert(readMeta(html, 'article:author') === 'Даниил Охлопков', `${path}: missing article author meta`)
  assert(html.includes('id="page-structured-data"'), `${path}: missing page JSON-LD script id`)
  assert(html.includes(`"@id": "${canonicalUrl(path)}#article-content"`), `${path}: missing article JSON-LD @id`)
  assert(html.includes(`"url": "${canonicalUrl(path)}#article-content"`), `${path}: missing article JSON-LD content URL`)
  assert(html.includes('"text":'), `${path}: missing article JSON-LD text`)
  assert(html.includes('id="article-content"'), `${path}: missing article content anchor`)
}

function assertNoMalformedExternalLinks(html, path) {
  const malformed = []
  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const href = decodeHtml(match[1])
    if (/^(?:[a-z][a-z0-9+.-]*:|[/?#]|mailto:|tel:)/i.test(href)) continue
    if (/^[^/\s]+\.[a-z]{2,}(?:[/?#]|$)/i.test(href)) malformed.push(href)
  }
  assert(malformed.length === 0, `${path}: malformed relative external links: ${[...new Set(malformed)].join(', ')}`)
  assert(!html.includes('/cdn-cgi/l/email-protection'), `${path}: leaked Cloudflare email-protection link`)
}

async function verifyRootVerificationMeta() {
  const res = await fetchManual('/')
  assert(res.status === 200, `/: expected 200 for verification meta check, got ${res.status}`)
  const html = await res.text()
  const verificationValues = new Set(readMetaAll(html, 'yandex-verification'))
  for (const id of yandexVerificationIds) {
    assert(verificationValues.has(id), `/: missing yandex-verification ${id}`)
  }
  console.log(`✓ yandex verification meta (${yandexVerificationIds.length})`)
}

async function verifyImportedArticle({ path, title }) {
  const res = await fetchManual(path)
  assert(res.status === 200, `${path}: expected 200, got ${res.status}`)
  const html = await res.text()
  if (title) assert(readTitle(html) === normalizeText(title), `${path}: title mismatch`)
  assert(readMeta(html, 'canonical') === canonicalUrl(path), `${path}: canonical mismatch`)
  assert(readMeta(html, 'robots') === 'index, follow', `${path}: robots mismatch`)
  assert(html.includes('data-article-engine="article"'), `${path}: missing common article engine marker`)
  verifyArticleContentAnalyticsMarkup(html, path)
  assertNoMalformedExternalLinks(html, path)
  assert(!html.includes('legacy-'), `${path}: page leaked old renderer class/name`)
  assert(!html.includes('Static migration update:'), `${path}: public page leaked migration update note`)
  assert(!html.includes('Original Ghost modified date'), `${path}: public page leaked Ghost modified note`)
  assert(!html.includes('Original post:'), `${path}: public page leaked original post label`)
  assert(!html.includes('Оригинал:'), `${path}: public page leaked original post label`)
  assert(!html.includes('Continue reading'), `${path}: public page leaked old continue-reading footer`)
  assert(!html.includes('Читайте также'), `${path}: public page leaked old continue-reading footer`)
  assert(html.includes('"dateModified": "2026-05-25T00:00:00+03:00"'), `${path}: missing JSON-LD dateModified`)
  assert(!path.startsWith('/author/') && !path.startsWith('/tag/') && path !== '/cn/', `${path}: service page leaked into imported articles`)
  if (path === '/en-beads-gastown-framework-ai-agents/' || path === '/beads-gastown-framework-ai-agenty/') {
    assert(html.includes('https://x.com/trq212/status/2014480496013803643'), `${path}: missing X source link`)
    assert(!html.includes('https://platform.twitter.com/widgets.js'), `${path}: should not load broken X/Twitter widgets script`)
  }
  if (path === '/en-second-brain-obsidian-claude-code-assistant/' || path === '/vtoroj-mozg-ai-assistent-obsidian-claude-code/') {
    assert(html.includes('<ul class="article-task-list">'), `${path}: setup checklist is not normalized as a semantic list`)
  }
  if (verbose) console.log(`✓ imported article ${path}`)
}

async function verifyImportedArticles(importedArticles) {
  assert(importedArticles.length > 0, `${importedArticlesPath}: no imported articles loaded`)
  const paths = new Set()
  for (const article of importedArticles) {
    assert(article.path, 'imported article without path')
    assert(!paths.has(article.path), `duplicate imported article path: ${article.path}`)
    paths.add(article.path)
    await verifyImportedArticle(article)
  }

  for (const smoke of topImportedSmokePages) {
    assert(paths.has(smoke.path), `${importedArticlesPath}: missing top imported article ${smoke.path}`)
  }
  console.log(`✓ imported articles (${importedArticles.length})`)
}

function readHtmlLang(html) {
  return html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1] || ''
}

function readHreflangs(html) {
  const langs = []
  for (const match of html.matchAll(/<link\s+([^>]+)>/gi)) {
    const attrs = parseAttrs(match[1])
    if (attrs.rel === 'alternate' && attrs.hreflang) langs.push(attrs.hreflang)
  }
  return new Set(langs)
}

async function verifyStaticPage({ path, title, lang = 'ru', ogLocale = 'ru_RU', hreflangs = [] }) {
  const res = await fetchManual(path)
  assert(res.status === 200, `${path}: expected 200, got ${res.status}`)
  const html = await res.text()
  assert(html.includes(`<title>${title}</title>`), `${path}: title mismatch`)
  assert(readHtmlLang(html) === lang, `${path}: html lang mismatch`)
  assert(readMeta(html, 'og:locale') === ogLocale, `${path}: og:locale mismatch`)
  assert(readMeta(html, 'canonical') === canonicalUrl(path), `${path}: canonical mismatch`)
  assert(readMeta(html, 'robots') === 'index, follow', `${path}: robots mismatch`)
  const actualHreflangs = readHreflangs(html)
  for (const hreflang of hreflangs) {
    assert(actualHreflangs.has(hreflang), `${path}: missing hreflang ${hreflang}`)
  }
  assert(!html.includes('Static migration update:'), `${path}: static page should not include legacy migration note`)
  console.log(`✓ static ${path}`)
}

async function verifyBlogArticle({ path, thumbnail, youtubeUrl, requiredText }) {
  const res = await fetchManual(path)
  assert(res.status === 200, `${path}: expected 200, got ${res.status}`)
  const html = await res.text()
  assert(html.includes('"@type": "BlogPosting"'), `${path}: missing BlogPosting JSON-LD`)
  verifyArticleContentAnalyticsMarkup(html, path)
  assert(html.includes('"@type": "VideoObject"'), `${path}: missing VideoObject JSON-LD`)
  assert(html.includes('"dateModified": "2026-05-25"'), `${path}: missing article dateModified`)
  assert(html.includes(thumbnail), `${path}: missing YouTube thumbnail`)
  assert(html.includes(youtubeUrl), `${path}: missing YouTube watch URL`)
  assert(html.includes('<table>') || html.includes('<table class="article-table"'), `${path}: missing table markup`)
  assert(html.includes('<pre><code'), `${path}: missing code/prompt block`)
  for (const text of requiredText) {
    assert(html.includes(text), `${path}: missing required text "${text}"`)
  }
  console.log(`✓ blog article ${path}`)
}

async function verifyGeneratedBlogPost({ path, requiredText }) {
  const res = await fetchManual(path)
  assert(res.status === 200, `${path}: expected 200, got ${res.status}`)
  const html = await res.text()
  assert(html.includes('"@type": "BlogPosting"'), `${path}: missing BlogPosting JSON-LD`)
  verifyArticleContentAnalyticsMarkup(html, path)
  assert(!html.includes('"isBasedOn":'), `${path}: should not expose source Telegram URL in JSON-LD`)
  assert(!html.includes('Оригинальный Telegram-пост'), `${path}: should not label Telegram text as original post`)
  assert(!html.includes('Открыть пост в Telegram'), `${path}: should not link to source Telegram post`)
  assert(!html.includes('<p>&gt;</p>') && !html.includes('&gt;</p>'), `${path}: leaked bare markdown quote marker`)
  assert(!html.includes('SEO'), `${path}: leaked internal search-production label`)
  assert(!html.includes('Wordstat'), `${path}: leaked internal keyword research label`)
  assert(!html.includes('>Коротко<'), `${path}: leaked generic summary heading`)
  assert(!html.includes('Эта страница не про'), `${path}: leaked AI-tell contrast construction`)
  assert(html.includes('"dateModified": "2026-05-25"'), `${path}: missing generated post dateModified`)
  assert(html.includes('/blog/'), `${path}: missing internal blog links`)
  assert(html.includes('/articles/'), `${path}: missing internal article links`)
  for (const text of requiredText) {
    assert(html.includes(text), `${path}: missing required text "${text}"`)
  }
  console.log(`✓ generated blog post ${path}`)
}

async function verifyRedirect([from, to]) {
  const res = await fetchManual(from)
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location')
    assert(isPermanentRedirect(res.status), `${from}: expected permanent redirect 301/308, got ${res.status}`)
    assert(redirectPathMatches(location, to), `${from}: expected Location ${to}, got ${location}`)
    console.log(`✓ redirect ${from} -> ${to}`)
    return
  }

  assert(!requireRealRedirects, `${from}: expected real permanent redirect to ${to}, got ${res.status}`)
  assert(res.status === 200, `${from}: expected 3xx or static fallback 200, got ${res.status}`)
  const html = await res.text()
  assert(readMeta(html, 'robots') === 'noindex, follow', `${from}: fallback robots mismatch`)
  assert(readMeta(html, 'canonical') === canonicalUrl(to), `${from}: fallback canonical mismatch`)
  assert(html.includes(`url=${to}`), `${from}: fallback refresh target mismatch`)
  console.log(`✓ redirect fallback ${from} -> ${to}`)
}

async function verifyNoindexPage(path) {
  const res = await fetchManual(path)
  assert(res.status === 200, `${path}: expected 200, got ${res.status}`)
  const html = await res.text()
  assert(readMeta(html, 'robots') === 'noindex, follow', `${path}: robots mismatch`)
  assert(!html.includes('alternate-md'), `${path}: should not expose markdown alternate`)
  console.log(`✓ noindex ${path}`)
}

async function verifyBacklinkCriticalUrls(rows) {
  assert(rows.length > 0, `${backlinkCriticalPath}: empty backlink-critical URL inventory`)

  let deferredEdgeRows = 0
  for (const row of rows) {
    if (row.expected_status === '301_or_308_at_edge') {
      if (!requireEdgeRedirects) {
        deferredEdgeRows += 1
        continue
      }
      const res = await fetchUrlManual(row.old_url)
      assert(isPermanentRedirect(res.status), `${row.old_url}: expected edge 301/308, got ${res.status}`)
      assert(redirectUrlMatches(res.headers.get('location'), row.new_url, row.old_url), `${row.old_url}: edge Location mismatch`)
      continue
    }

    if (row.expected_status === '200') {
      const res = await fetchManual(row.old_path)
      assert(res.status === 200, `${row.old_path}: backlink-critical URL expected 200, got ${res.status}`)
      const html = await res.text()
      assert(readMeta(html, 'canonical') === canonicalUrl(row.new_path || row.old_path), `${row.old_path}: backlink-critical canonical mismatch`)
      continue
    }

    if (row.expected_status === '308') {
      await verifyRedirect([row.old_path, row.new_path])
      continue
    }

    throw new Error(`${backlinkCriticalPath}: unsupported expected_status "${row.expected_status}" for ${row.old_path}`)
  }

  const suffix = deferredEdgeRows ? `, ${deferredEdgeRows} edge row deferred` : ''
  console.log(`✓ backlink-critical URLs (${rows.length}${suffix})`)
}

function decodeXml(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

async function verifySitemap(migrationRows) {
  const res = await fetchManual('/sitemap.xml')
  assert(res.status === 200, `/sitemap.xml: expected 200, got ${res.status}`)
  const xml = await res.text()
  const sitemapRows = [...xml.matchAll(/<url>\s*<loc>([\s\S]*?)<\/loc>\s*<lastmod>([\s\S]*?)<\/lastmod>\s*<\/url>/g)]
    .map((match) => ({
      loc: decodeXml(match[1].trim()),
      lastmod: decodeXml(match[2].trim()),
    }))
  const actualLocs = new Set(sitemapRows.map((row) => row.loc))
  const lastmodByLoc = new Map(sitemapRows.map((row) => [row.loc, row.lastmod]))
  const expectedLocs = new Set(
    migrationRows
      .filter((row) => row.expected_status === '200' && row.robots === 'index, follow' && row.new_path)
      .map((row) => canonicalUrl(row.new_path))
  )

  assert(sitemapRows.length > 0, '/sitemap.xml: missing <url><loc><lastmod> entries')
  for (const loc of expectedLocs) {
    assert(actualLocs.has(loc), `/sitemap.xml: missing ${loc}`)
    assert(lastmodByLoc.get(loc) === expectedSitemapLastmod, `/sitemap.xml: ${loc} lastmod mismatch`)
  }
  for (const loc of actualLocs) {
    assert(expectedLocs.has(loc), `/sitemap.xml: unexpected ${loc}`)
  }
  console.log(`✓ sitemap (${actualLocs.size} URLs, lastmod ${expectedSitemapLastmod})`)
}

async function verifyCrawlerFiles() {
  const robotsRes = await fetchManual('/robots.txt')
  assert(robotsRes.status === 200, `/robots.txt: expected 200, got ${robotsRes.status}`)
  const robots = await robotsRes.text()
  assert(robots.includes('User-agent: *'), '/robots.txt: missing wildcard user-agent')
  assert(robots.includes('Allow: /'), '/robots.txt: missing Allow: /')
  assert(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), '/robots.txt: sitemap host mismatch')
  assert(!robots.includes('Disallow: /'), '/robots.txt: blocks crawling')

  const llmsRes = await fetchManual('/llms.txt')
  assert(llmsRes.status === 200, `/llms.txt: expected 200, got ${llmsRes.status}`)
  const llms = await llmsRes.text()
  assert(llms.includes(siteUrl), '/llms.txt: missing canonical site URL')
  assert(llms.includes('## Контент'), '/llms.txt: missing content section')
  assert(llms.includes(`${siteUrl}/blog.md`), '/llms.txt: missing blog markdown link')
  assert(llms.includes(`${siteUrl}/blog-ai-agents-s-chego-nachat.md`), '/llms.txt: missing generated blog markdown link')
  assert(llms.includes(`${siteUrl}/privacy.md`), '/llms.txt: missing privacy markdown link')

  const bundleRes = await fetchManual('/llms-full.txt')
  assert(bundleRes.status === 200, `/llms-full.txt: expected 200, got ${bundleRes.status}`)
  const bundle = await bundleRes.text()
  assert(bundle.includes('## Source: /about.md'), '/llms-full.txt: missing about bundle source')
  assert(bundle.includes('## Source: /articles.md'), '/llms-full.txt: missing articles bundle source')
  assert(bundle.includes('## Source: /blog-ai-agents-s-chego-nachat.md'), '/llms-full.txt: missing generated blog bundle source')
  assert(bundle.includes('## Source: /privacy.md'), '/llms-full.txt: missing privacy bundle source')
  console.log('✓ crawler files')
}

function assertShortCacheHeader(res, path) {
  const cacheControl = res.headers.get('cache-control') || ''
  assert(/max-age=600\b/.test(cacheControl), `${path}: expected short cache max-age=600, got "${cacheControl || '<empty>'}"`)
  assert(!/no-store|no-cache/i.test(cacheControl), `${path}: unexpected non-cacheable response "${cacheControl}"`)
}

function assertImmutableAssetCacheHeader(res, path) {
  const cacheControl = res.headers.get('cache-control') || ''
  assert(/max-age=2592000\b/.test(cacheControl), `${path}: expected asset max-age=2592000, got "${cacheControl || '<empty>'}"`)
  assert(/immutable/i.test(cacheControl), `${path}: expected immutable asset cache, got "${cacheControl || '<empty>'}"`)
}

async function verifyOriginHeaders() {
  if (!requireOriginHeaders) return

  const homeRes = await fetchManual('/')
  assert(homeRes.status === 200, `/: origin header check expected 200, got ${homeRes.status}`)
  assertShortCacheHeader(homeRes, '/')
  const homeHtml = await homeRes.text()
  const assetMatch = homeHtml.match(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+\.(?:js|css))"/i)
  assert(assetMatch, '/: missing JS/CSS asset reference for cache check')
  const assetPath = new URL(assetMatch[1], siteUrl).pathname
  const assetRes = await fetchManual(assetPath)
  assert(assetRes.status === 200, `${assetPath}: origin header check expected 200, got ${assetRes.status}`)
  assertImmutableAssetCacheHeader(assetRes, assetPath)

  const sitemapRes = await fetchManual('/sitemap.xml')
  assert(sitemapRes.status === 200, `/sitemap.xml: origin header check expected 200, got ${sitemapRes.status}`)
  assertShortCacheHeader(sitemapRes, '/sitemap.xml')

  const robotsRes = await fetchManual('/robots.txt')
  assert(robotsRes.status === 200, `/robots.txt: origin header check expected 200, got ${robotsRes.status}`)
  assertShortCacheHeader(robotsRes, '/robots.txt')
  console.log('✓ origin cache headers')
}

function verifyMigrationMap(importedArticles) {
  const rows = loadMigrationMapRows()
  const byNewPath = new Map(rows.filter((row) => row.new_path).map((row) => [row.new_path, row]))
  const byOldPath = new Map(rows.filter((row) => row.old_path).map((row) => [row.old_path, row]))

  for (const article of importedArticles) {
    const row = byOldPath.get(article.path)
    assert(row, `${migrationMapPath}: missing preserved imported article path ${article.path}`)
    assert(row.action === 'preserve_same_path', `${migrationMapPath}: ${article.path} action mismatch`)
    assert(row.new_path === article.path, `${migrationMapPath}: ${article.path} new_path mismatch`)
    assert(row.expected_status === '200', `${migrationMapPath}: ${article.path} expected_status mismatch`)
  }

  for (const [from, to] of redirects) {
    const row = byOldPath.get(from)
    assert(row, `${migrationMapPath}: missing redirect path ${from}`)
    assert(row.action.startsWith('308_redirect'), `${migrationMapPath}: ${from} action mismatch`)
    assert(row.new_path === to, `${migrationMapPath}: ${from} target mismatch`)
  }

  for (const staticPath of migrationMapStaticPaths) {
    const row = byNewPath.get(staticPath)
    assert(row, `${migrationMapPath}: missing static route ${staticPath}`)
    assert(row.action === 'new_static_page', `${migrationMapPath}: ${staticPath} static action mismatch`)
  }

  console.log(`✓ migration map (${rows.length} rows)`)
  return rows
}

async function verifyMigrationMapUrls(rows) {
  let pageCount = 0
  let redirectCount = 0

  for (const row of rows) {
    if (row.expected_status === '200' && row.new_path) {
      const path = row.old_path || row.new_path
      const res = await fetchManual(path)
      assert(res.status === 200, `${path}: URL map expected 200, got ${res.status}`)
      const html = await res.text()
      assert(readMeta(html, 'canonical') === canonicalUrl(row.new_path), `${path}: URL map canonical mismatch`)
      if (row.robots === 'index, follow') {
        assert(readMeta(html, 'robots') === 'index, follow', `${path}: URL map robots mismatch`)
      }
      verifyAnalyticsSnippet(html, path)
      pageCount += 1
      continue
    }

    if (row.expected_status === '308' && row.old_path) {
      await verifyRedirect([row.old_path, row.new_path])
      redirectCount += 1
    }
  }

  console.log(`✓ migration URL rows (${pageCount} pages, ${redirectCount} redirects)`)
}

function verifyImportedInternalLinks(importedContent, migrationRows) {
  const knownPaths = new Set()
  for (const row of migrationRows) {
    if (row.old_path) knownPaths.add(row.old_path)
    if (row.new_path) knownPaths.add(row.new_path)
  }
  const unmapped = new Map()

  for (const article of importedContent) {
    for (const match of (article.bodyHtml || '').matchAll(/href=["']([^"']+)["']/g)) {
      const href = match[1]
      if (!href.startsWith('/')) continue
      const url = new URL(href, siteUrl)
      if (url.pathname.startsWith('/cdn-cgi/')) continue
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) continue
      const pathname = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`
      if (knownPaths.has(pathname)) continue
      if (!unmapped.has(pathname)) unmapped.set(pathname, new Set())
      unmapped.get(pathname).add(article.path)
    }
  }

  assert(unmapped.size === 0, `imported article internal links missing from URL map: ${[...unmapped.keys()].join(', ')}`)
  console.log('✓ imported article internal links')
}

async function verifyMissingUrl() {
  const res = await fetchManual(missingPath)
  if (res.status === 404) {
    const html = await res.text()
    assert(readMeta(html, 'robots') === 'noindex, follow', `${missingPath}: 404 page robots mismatch`)
    console.log(`✓ 404 ${missingPath}`)
    return
  }

  if (!requireStrict404 && res.status === 200) {
    console.log(`! 404 ${missingPath}: got 200 on non-strict preview host`)
    return
  }

  assert(false, `${missingPath}: expected 404, got ${res.status}`)
}

async function main() {
  const importedArticles = loadImportedArticles()
  const importedContent = loadImportedArticleContent()
  const backlinkCriticalRows = loadBacklinkCriticalRows()
  console.log(`Verifying ${baseUrl}`)
  for (const page of staticPages) await verifyStaticPage(page)
  for (const page of blogArticleChecks) await verifyBlogArticle(page)
  for (const page of generatedBlogChecks) await verifyGeneratedBlogPost(page)
  await verifyImportedArticles(importedArticles)
  for (const redirect of redirects) await verifyRedirect(redirect)
  for (const path of noindexPages) await verifyNoindexPage(path)
  await verifyBacklinkCriticalUrls(backlinkCriticalRows)
  const migrationRows = verifyMigrationMap(importedArticles)
  await verifyMigrationMapUrls(migrationRows)
  verifyImportedInternalLinks(importedContent, migrationRows)
  await verifySitemap(migrationRows)
  await verifyCrawlerFiles()
  await verifyRootVerificationMeta()
  await verifyOriginHeaders()
  await verifyMissingUrl()
  console.log('Static migration verification passed')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
