/**
 * Lightweight prerender for SPA on GitHub Pages.
 *
 * For each known route, writes dist/<route>/index.html with:
 *  - Same SPA bootstrap (so React hydrates and renders the right page)
 *  - Route-specific <title>, <meta description>, og:title/description/url, twitter, canonical
 *
 * Result: direct hits on /posts, /about, /markdown-vs-html return HTTP 200
 * (instead of 404 + JS-redirect via 404.html-hack), and search engines see
 * correct per-page meta on the server side without running JS.
 *
 * Full content prerender (rendering React components server-side) is left for
 * a follow-up if Googlebot's JS execution proves insufficient.
 */
import fs from 'node:fs'
import path from 'node:path'

const dist = 'dist'
const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

const ROUTES = [
  {
    path: '/about',
    title: 'Обо мне — Даниил Охлопков',
    description: 'Head of Analytics @ TON Foundation. Опыт: InstaBot, Shazam-ботсети 13.7M юзеров, Forbes 30 under 30 (2022).',
  },
  {
    path: '/posts',
    title: 'Топ посты — Даниил Охлопков',
    description: 'Лучшие посты @danokhlopkov: AI-агенты, крипта, TON, стартапы, данные.',
  },
  {
    path: '/ai-course',
    title: 'AI Agents курс — Даниил Охлопков',
    description: 'Бесплатный курс по AI-агентам на основе моих публикаций. Claude Code, MCP, vibe-coding, реальные кейсы.',
  },
  {
    path: '/closed',
    title: 'Закрытый канал — Даниил Охлопков',
    description: 'Закрытое сообщество AI / web3 / TG+TON фаундеров и билдеров. Живые мысли без AI-слопа.',
  },
  {
    path: '/work-together',
    title: 'Го поработаем — Даниил Охлопков',
    description: 'Консалтинг по AI-агентам, web3 и TON, реклама в @danokhlopkov, коллабы.',
  },
  {
    path: '/markdown-vs-html',
    title: 'Markdown мёртв — да здравствует HTML | Даниил Охлопков',
    description: 'Почему HTML побеждает markdown как формат вывода для AI-агентов. Плотность инфы, читаемость, шеринг, интерактив. С примерами промптов и реальными кейсами.',
  },
]

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function rewrite(html, { path: routePath, title, description }) {
  const url = `https://ohld.github.io${routePath}`
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
}

let count = 0
for (const route of ROUTES) {
  const html = rewrite(indexHtml, route)
  const dir = path.join(dist, route.path)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  count++
}

console.log(`✓ Prerendered ${count} routes (per-route meta, status 200 on direct hits)`)
