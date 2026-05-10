/**
 * Lightweight prerender for SPA on GitHub Pages.
 *
 * For each known route, writes:
 *  - dist/<route>/index.html with route-specific <title>, meta, og, canonical,
 *    optional type-specific schema.org JSON-LD, and a static HTML body fallback
 *    inside #root (replaced by React's createRoot on mount; visible to crawlers
 *    and noJS clients).
 *  - dist/<slug>.md — plain Markdown version of the page for LLM crawlers
 *    (referenced from /llms.txt). Static-hosting equivalent of the
 *    "Markdown for Agents" Accept-negotiation pattern.
 */
import fs from 'node:fs'
import path from 'node:path'

const dist = 'dist'
const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const NAV_LINKS = [
  ['/', 'Главная'],
  ['/about/', 'Обо мне'],
  ['/posts/', 'Посты'],
  ['/ai-course/', 'AI Agents курс'],
  ['/private-channel/', 'Закрытый канал'],
  ['/work-together/', 'Го поработаем'],
]

const HOME_FALLBACK_MD = `# Даниил Охлопков

> Head of Analytics @ TON Foundation. Бесплатный курс по AI-агентам, лучшие посты, консалтинг.

Пишу про AI-агентов, on-chain аналитику и крипту. Forbes 30 Under 30 Russia (2022). Бывший CTO Via Protocol ($1.5B annual volume), фаундер InstaBot и Shazam-ботсетей (13.7M юзеров).

Telegram: [@danokhlopkov](https://t.me/danokhlopkov) · X: [@danokhlopkov](https://x.com/danokhlopkov) · GitHub: [@ohld](https://github.com/ohld)
`

const ROUTES = [
  {
    path: '/about',
    slug: 'about',
    title: 'Обо мне — Даниил Охлопков',
    description: 'Даниил Охлопков — Head of Analytics @ TON Foundation. Опыт: InstaBot, Shazam-ботсети 13.7M юзеров, Forbes 30 under 30 (2022).',
  },
  {
    path: '/posts',
    slug: 'posts',
    title: 'Топ посты — Даниил Охлопков',
    description: 'Даниил Охлопков — лучшие посты @danokhlopkov: AI-агенты, крипта, TON, стартапы, данные.',
  },
  {
    path: '/ai-course',
    slug: 'ai-course',
    title: 'AI Agents курс — Даниил Охлопков',
    description: 'Даниил Охлопков — бесплатный курс по AI-агентам на основе моих публикаций. Claude Code, MCP, vibe-coding, реальные кейсы.',
  },
  {
    path: '/private-channel',
    slug: 'private-channel',
    title: 'Закрытый канал — Даниил Охлопков',
    description: 'Даниил Охлопков — закрытое сообщество AI / web3 / TG+TON фаундеров и билдеров. Живые мысли без AI-слопа.',
  },
  {
    path: '/work-together',
    slug: 'work-together',
    title: 'Го поработаем — Даниил Охлопков',
    description: 'Даниил Охлопков — консалтинг по AI-агентам, web3 и TON, реклама в @danokhlopkov, коллабы.',
  },
  {
    path: '/markdown-vs-html',
    slug: 'markdown-vs-html',
    title: 'Markdown мёртв — да здравствует HTML | Даниил Охлопков',
    description: 'Даниил Охлопков — почему HTML побеждает markdown как формат вывода для AI-агентов. Плотность инфы, читаемость, шеринг, интерактив. С примерами промптов и реальными кейсами.',
  },
]

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

// Inline regex md→html: only what our templates use (h1-3, p, **bold**, [text](url), - lists, > quotes, tables -> stripped to <pre>).
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out = []
  let inList = false
  let inQuote = false
  let para = []
  const flushPara = () => {
    if (!para.length) return
    out.push(`<p>${inlineFmt(para.join(' '))}</p>`)
    para = []
  }
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false } }
  const closeQuote = () => { if (inQuote) { out.push('</blockquote>'); inQuote = false } }
  const inlineFmt = (s) => {
    let t = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, txt, url) => `<a href="${url.replace(/"/g, '&quot;')}">${txt}</a>`)
    return t
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) { flushPara(); closeList(); closeQuote(); continue }
    if (line.startsWith('|')) { flushPara(); closeList(); closeQuote(); continue } // skip tables
    if (line.startsWith('### ')) { flushPara(); closeList(); closeQuote(); out.push(`<h3>${inlineFmt(line.slice(4))}</h3>`); continue }
    if (line.startsWith('## ')) { flushPara(); closeList(); closeQuote(); out.push(`<h2>${inlineFmt(line.slice(3))}</h2>`); continue }
    if (line.startsWith('# ')) { flushPara(); closeList(); closeQuote(); out.push(`<h1>${inlineFmt(line.slice(2))}</h1>`); continue }
    if (line.startsWith('- ')) { flushPara(); closeQuote(); if (!inList) { out.push('<ul>'); inList = true } out.push(`<li>${inlineFmt(line.slice(2))}</li>`); continue }
    if (line.startsWith('> ')) { flushPara(); closeList(); if (!inQuote) { out.push('<blockquote>'); inQuote = true } out.push(`<p>${inlineFmt(line.slice(2))}</p>`); continue }
    if (line.startsWith('---')) { flushPara(); closeList(); closeQuote(); out.push('<hr/>'); continue }
    closeList(); closeQuote(); para.push(line)
  }
  flushPara(); closeList(); closeQuote()
  return out.join('\n')
}

function buildFallback(title, mdBody) {
  const article = mdToHtml(mdBody)
  const nav = NAV_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ')
  return `<header><h1>${escape(title)}</h1></header><article>${article}</article><nav>${nav}</nav>`
}

function getRouteMd(route) {
  const tplPath = path.join('scripts', 'markdown', `${route.slug}.md`)
  if (fs.existsSync(tplPath)) {
    // Strip the leading "# title" line so we don't duplicate the <h1> in fallback's <header>.
    const raw = fs.readFileSync(tplPath, 'utf8')
    return raw.replace(/^#\s+[^\n]*\n+/, '')
  }
  return null
}

const SCHEMA_BY_SLUG = {
  'markdown-vs-html': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Markdown мёртв — да здравствует HTML',
    description: r.description,
    datePublished: '2026-05-09',
    dateModified: '2026-05-10',
    author: { '@type': 'Person', name: 'Даниил Охлопков', url: 'https://ohld.github.io/' },
    image: 'https://github.com/ohld.png',
    mainEntityOfPage: 'https://ohld.github.io/markdown-vs-html/',
    inLanguage: 'ru',
  }),
  'ai-course': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: 'AI Agents курс',
    description: r.description,
    provider: { '@type': 'Person', name: 'Даниил Охлопков', url: 'https://ohld.github.io/' },
    inLanguage: 'ru',
    isAccessibleForFree: true,
    url: 'https://ohld.github.io/ai-course/',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online', courseWorkload: 'PT5H' },
  }),
  about: () => ({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': 'https://ohld.github.io/#person' },
    url: 'https://ohld.github.io/about/',
  }),
  posts: (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Топ посты — Даниил Охлопков',
    description: r.description,
    url: 'https://ohld.github.io/posts/',
    isPartOf: { '@id': 'https://ohld.github.io/#website' },
    inLanguage: 'ru',
  }),
}

function rewrite(html, route) {
  const { path: routePath, slug, title, description } = route
  // Trailing slash = canonical form on GitHub Pages (served as 200 directly;
  // non-slash variant 301-redirects). Must match sitemap.xml.
  const url = `https://ohld.github.io${routePath}/`
  const mdHref = `/${slug}.md`
  const mdBody = getRouteMd(route)
  const fallback = mdBody ? buildFallback(title, mdBody) : buildFallback(title, '')
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/<link rel="alternate" type="text\/markdown" href="[^"]*" \/><!-- alternate-md -->/, `<link rel="alternate" type="text/markdown" href="${mdHref}" /><!-- alternate-md -->`)
    .replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_m, open, json, close) => {
      try {
        const data = JSON.parse(json)
        data.mainEntityOfPage = url
        return `${open}\n    ${JSON.stringify(data, null, 2).replace(/\n/g, '\n    ')}\n    ${close}`
      } catch {
        return `${open}${json}${close}`
      }
    })
    .replace('<!-- body-fallback -->', fallback)
  const extraSchemaFn = SCHEMA_BY_SLUG[slug]
  if (extraSchemaFn) {
    const extraJson = JSON.stringify(extraSchemaFn(route), null, 2)
    const block = `<script type="application/ld+json">\n${extraJson}\n</script>\n  </head>`
    out = out.replace('</head>', block)
  }
  return out
}

// ---- HTML prerender ----
let htmlCount = 0
// Home: rewrite #root fallback in dist/index.html (vite build wrote it, we patch in place).
const homeFallback = buildFallback('Даниил Охлопков', HOME_FALLBACK_MD.replace(/^#\s+[^\n]*\n+/, ''))
const homeOut = indexHtml.replace('<!-- body-fallback -->', homeFallback)
fs.writeFileSync(path.join(dist, 'index.html'), homeOut)

for (const route of ROUTES) {
  const html = rewrite(indexHtml, route)
  const dir = path.join(dist, route.path)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  htmlCount++
}

// ---- Markdown for Agents ----
// Static templates for each route; posts.md generated from posts.json.
const templatesDir = path.join('scripts', 'markdown')

let mdCount = 0
for (const route of ROUTES) {
  if (route.slug === 'posts') continue
  const src = path.join(templatesDir, `${route.slug}.md`)
  const dest = path.join(dist, `${route.slug}.md`)
  fs.copyFileSync(src, dest)
  mdCount++
}

// posts.md — generated from src/data/posts.json (sorted by date desc, all posts).
const posts = JSON.parse(fs.readFileSync(path.join('src', 'data', 'posts.json'), 'utf8'))
const sortedPosts = [...posts].sort((a, b) => b.date.localeCompare(a.date))

const TAG_LABELS = {
  ai: 'AI', crypto: 'Crypto', ton: 'TON', tg_apps: 'TG Apps',
  startups: 'Startups', data: 'Data', social: 'Social', personal: 'Личное',
}

const postsLines = [
  '# Топ посты — Даниил Охлопков',
  '',
  `> Лучшие посты из канала [@danokhlopkov](https://t.me/danokhlopkov): AI-агенты, крипта, TON, стартапы, данные. Всего ${sortedPosts.length} постов.`,
  '',
  'Теги: AI, Crypto, TON, TG Apps, Startups, Data, Social, Личное.',
  '',
  '## Все посты (по дате)',
  '',
]
for (const p of sortedPosts) {
  const tagsLabel = (p.tags || []).map(t => TAG_LABELS[t] || t).join(', ')
  const tagsSuffix = tagsLabel ? ` _(${tagsLabel})_` : ''
  postsLines.push(`- **${p.date}** — [${p.title}](${p.link})${tagsSuffix}`)
}
postsLines.push('', '[← На главную](/)', '')
fs.writeFileSync(path.join(dist, 'posts.md'), postsLines.join('\n'))
mdCount++

// ---- Redirects (legacy URLs) ----
// Write stub HTML + .md for old slugs that 301-equivalent to the new canonical
// via meta-refresh + canonical tag (no real 301 possible on GH Pages).
// SPA-side React Router also handles these via <Navigate> for in-app nav.
const REDIRECTS = [
  { from: '/closed', fromSlug: 'closed', to: '/private-channel/', toSlug: 'private-channel' },
]
let redirectCount = 0
for (const r of REDIRECTS) {
  const targetUrl = `https://ohld.github.io${r.to}`
  const stub = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Redirecting…</title>
  <link rel="canonical" href="${targetUrl}" />
  <meta name="robots" content="noindex, follow" />
  <meta http-equiv="refresh" content="0; url=${r.to}" />
  <script>window.location.replace(${JSON.stringify(r.to)})</script>
</head>
<body>
  <p>Эта страница переехала на <a href="${r.to}">${r.to}</a></p>
</body>
</html>
`
  const dir = path.join(dist, r.from)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), stub)
  fs.writeFileSync(
    path.join(dist, `${r.fromSlug}.md`),
    `# Redirected\n\nThis page moved to [${targetUrl}](${targetUrl}).\n`
  )
  redirectCount++
}

// ---- llms-full.txt — concatenated bundle of all .md files ----
const BUNDLE_SLUGS = ['about', 'ai-course', 'posts', 'private-channel', 'work-together', 'markdown-vs-html']
const bundleHeader = `# Daniil Okhlopkov — Full Content Bundle

> Combined Markdown of all pages on ohld.github.io. For AI crawlers that prefer one-shot fetch.

`
const bundleParts = BUNDLE_SLUGS.map(slug => {
  const content = fs.readFileSync(path.join(dist, `${slug}.md`), 'utf8')
  return `## Source: /${slug}.md\n\n${content}`
})
fs.writeFileSync(path.join(dist, 'llms-full.txt'), bundleHeader + bundleParts.join('\n\n---\n\n'))

console.log(`✓ Prerendered ${htmlCount} HTML routes + ${mdCount} Markdown files + ${redirectCount} redirects + llms-full.txt`)
