/**
 * Lightweight prerender for SPA on GitHub Pages.
 *
 * For each known route, writes:
 *  - dist/<route>/index.html with route-specific <title>, meta, og, canonical
 *    (so React hydrates the right page AND search engines see correct meta
 *    without running JS).
 *  - dist/<slug>.md — plain Markdown version of the page for LLM crawlers
 *    (referenced from /llms.txt). Static-hosting equivalent of the
 *    "Markdown for Agents" Accept-negotiation pattern.
 */
import fs from 'node:fs'
import path from 'node:path'

const dist = 'dist'
const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

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

function rewrite(html, { path: routePath, slug, title, description }) {
  // Trailing slash = canonical form on GitHub Pages (served as 200 directly;
  // non-slash variant 301-redirects). Must match sitemap.xml.
  const url = `https://ohld.github.io${routePath}/`
  const mdHref = `/${slug}.md`
  return html
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
}

// ---- HTML prerender ----
let htmlCount = 0
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
