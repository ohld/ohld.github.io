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
const DEFAULT_SITE_URL = 'https://okhlopkov.com'
const SITE_URL = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '')
const indexHtml = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const STATIC_UPDATED_DATE = '2026-05-25'
const STATIC_UPDATED_AT = `${STATIC_UPDATED_DATE}T00:00:00+03:00`
const BLOG_POSTS_DIR = path.join('content', 'blog-posts')

const NAV_LINKS = [
  ['/', 'Главная'],
  ['/blog/', 'Блог'],
  ['/articles/', 'Статьи'],
  ['/about/', 'Обо мне'],
  ['/en/', 'English'],
  ['/privacy/', 'Privacy'],
]

const SOCIAL_LINKS = [
  ['https://t.me/danokhlopkov', 'Telegram'],
  ['https://youtube.com/@danokhlopkov', 'YouTube'],
  ['https://instagram.com/d7733o', 'Instagram'],
  ['https://x.com/danokhlopkov', 'X'],
  ['https://www.linkedin.com/in/danokhlopkov/', 'LinkedIn'],
  ['https://github.com/ohld', 'GitHub'],
]

const LOCALIZED_PAIRS = [
  ['/', '/en/'],
  ['/blog/', '/en/blog/'],
  ['/articles/', '/en/articles/'],
  ['/about/', '/en/about/'],
  ['/claude-code-nastrojka-mcp-hooks-skills-2026/', '/claude-code-setup-mcp-hooks-skills-2026/'],
  ['/vtoroj-mozg-ai-assistent-obsidian-claude-code/', '/en-second-brain-obsidian-claude-code-assistant/'],
  ['/claude-code-compaction-kak-rabotaet/', '/claude-code-compaction-explained/'],
  ['/luchshie-skills-mcp-claude-code-agent-browser/', '/en-best-skills-mcp-claude-code-agent-browser/'],
  ['/beads-gastown-framework-ai-agenty/', '/en-beads-gastown-framework-ai-agents/'],
  ['/show-me-ai-setup-ghostty-ownyourchat-descript/', '/en-show-me-ai-setup-ghostty-ownyourchat-descript/'],
  ['/claude-codex-dual-review/', '/en-claude-codex-dual-review/'],
  ['/ai-agenty-habr-claude-code-golosovye-komandy/', '/en-ai-agents-practice-claude-code-voice-commands/'],
  ['/telegram-mini-app-llms-txt-claude-code-stream/', '/en-telegram-mini-app-llms-txt-claude-code-stream/'],
  ['/kak-pravilno-pisat-skilly-claude-code-7-oshibok/', '/en-write-claude-code-skills-7-mistakes/'],
  ['/gde-najti-ideyu-saas-acquire-com-ai/', '/en-find-saas-ideas-acquire-com-ai-validation/'],
  ['/sovety-sozdatel-claude-code-git-worktrees/', '/en-claude-code-creator-tips-git-worktrees/'],
  ['/ai-agent-forum-telegram-chat-agenty/', '/en-ai-agent-forum-telegram-chat/'],
  ['/ton-analyst-ai-skill-ton-blockchain-dune/', '/en-ton-analyst-open-source-ai-skill-dune/'],
  ['/singularity-uzhe-sluchilas-analiz-5-metrik-ai/', '/en-singularity-already-happened-5-ai-metrics/'],
  ['/prompty-uluchshili-opyt-ai-agenty-5-lajfhakov/', '/en-5-prompts-improved-ai-agent-workflow-claude-code/'],
  ['/21-question-ai-agent/', '/21-questions-ai-agent-knowledge-gaps/'],
]

function canonicalPathname(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function localizedLegacyPath(pathname, targetLang) {
  const current = canonicalPathname(pathname)
  const pair = LOCALIZED_PAIRS.find(([ru, en]) => ru === current || en === current)
  if (pair) return targetLang === 'en' ? pair[1] : pair[0]
  return targetLang === 'en' ? '/en/' : '/'
}

const HOME_FALLBACK_MD = `# Даниил Охлопков

> AI-агенты на практике: Codex, Claude Code, MCP, OpenClaw, TON-данные и Telegram-автоматизация.

## Коротко

Это сайт Дана Охлопкова про практические AI-агенты, Claude Code, Codex, MCP, TON-данные и Telegram-автоматизацию. Главная страница — роутер: блог с моими Telegram-постами, SEO-статьи и короткий about.

## Разделы

- [Блог](/blog/) — Telegram-посты, сохранённые как индексируемые страницы.
- [Статьи](/articles/) — SEO-гайды, сравнения, туториалы и source-pack driven материалы.
- [Обо мне](/about/) — бэкграунд, опыт и ссылки.

## Последнее из блога

- [AI-трансформация в компании: общий контекст, skills и GBrain](/blog/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain/)
- [GStack, /goal и office hours: рабочий цикл для AI-агента](/blog/gstack-goal-office-hours-ai-workflow/)
- [Claude Code vs Codex: почему я на две недели перешёл на Codex](/blog/claude-code-vs-codex-perehod/)

## SEO-статьи

- [AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code](/articles/ai-tools-for-designers-design-engineering-agents/)
- [Markdown мёртв — да здравствует HTML](/articles/markdown-vs-html/)
`

function parseFrontmatter(raw, filename = 'markdown file') {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error(`${filename}: missing frontmatter`)
  const meta = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return { meta, body: match[2].trim() }
}

function splitList(value = '', separator = ',') {
  return value.split(separator).map((item) => item.trim()).filter(Boolean)
}

function loadGeneratedBlogPosts() {
  if (!fs.existsSync(BLOG_POSTS_DIR)) return []
  return fs.readdirSync(BLOG_POSTS_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const fullPath = path.join(BLOG_POSTS_DIR, file)
      const { meta, body } = parseFrontmatter(fs.readFileSync(fullPath, 'utf8'), fullPath)
      return {
        ...meta,
        tags: splitList(meta.tags || ''),
        secondaryKeywords: splitList(meta.secondaryKeywords || '', ';'),
        body,
      }
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

const GENERATED_BLOG_POSTS = loadGeneratedBlogPosts()

const ROUTES = [
  {
    path: '/en',
    slug: 'en',
    title: 'Daniil Okhlopkov — AI agents, data, TON and Telegram',
    description: 'Practical notes on AI agents, Codex, Claude Code, MCP, TON analytics and Telegram automation by Daniil Okhlopkov.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/`,
      en: `${SITE_URL}/en/`,
      'x-default': `${SITE_URL}/`,
    },
  },
  {
    path: '/en/about',
    slug: 'en-about',
    title: 'About — Daniil Okhlopkov',
    description: 'Daniil Okhlopkov: Analytics Team Lead at TON Foundation, former CTO and data scientist. AI agents, on-chain analytics and Telegram workflows.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/about/`,
      en: `${SITE_URL}/en/about/`,
      'x-default': `${SITE_URL}/about/`,
    },
  },
  {
    path: '/about',
    slug: 'about',
    title: 'Обо мне — Даниил Охлопков',
    description: 'Даниил Охлопков — Head of Analytics @ TON Foundation. Опыт: InstaBot, Shazam-ботсети 13.7M юзеров, Forbes 30 under 30 (2022).',
    alternates: {
      ru: `${SITE_URL}/about/`,
      en: `${SITE_URL}/en/about/`,
      'x-default': `${SITE_URL}/about/`,
    },
  },
  {
    path: '/en/blog',
    slug: 'en-blog',
    title: 'Blog — Daniil Okhlopkov',
    description: 'English blog posts and preserved notes by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP, data and Telegram.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/blog/`,
      en: `${SITE_URL}/en/blog/`,
      'x-default': `${SITE_URL}/blog/`,
    },
  },
  {
    path: '/blog',
    slug: 'blog',
    title: 'Блог — Даниил Охлопков',
    description: 'Блог Даниила Охлопкова: Telegram-посты, переработанные в индексируемые материалы про AI-агентов, Claude Code, Codex, MCP и рабочие флоу.',
    alternates: {
      ru: `${SITE_URL}/blog/`,
      en: `${SITE_URL}/en/blog/`,
      'x-default': `${SITE_URL}/blog/`,
    },
  },
  {
    path: '/en/articles',
    slug: 'en-articles',
    title: 'Articles — Daniil Okhlopkov',
    description: 'English SEO articles, tutorials and preserved explainers by Daniil Okhlopkov about AI agents, Claude Code, Codex, MCP and automation.',
    lang: 'en',
    alternates: {
      ru: `${SITE_URL}/articles/`,
      en: `${SITE_URL}/en/articles/`,
      'x-default': `${SITE_URL}/articles/`,
    },
  },
  {
    path: '/articles',
    slug: 'articles',
    title: 'Статьи — Даниил Охлопков',
    description: 'SEO-гайды, туториалы, сравнения AI-инструментов и плотные разборы Даниила Охлопкова: OpenClaw, Claude Code, Codex, Cursor, MCP и agent workflows.',
    alternates: {
      ru: `${SITE_URL}/articles/`,
      en: `${SITE_URL}/en/articles/`,
      'x-default': `${SITE_URL}/articles/`,
    },
  },
  {
    path: '/articles/ai-tools-for-designers-design-engineering-agents',
    slug: 'articles-ai-tools-for-designers-design-engineering-agents',
    title: 'AI-инструменты для дизайнеров: design engineering, агенты и Figma-to-code',
    description: 'Разбор стрима про design engineering: как дизайнерам работать с AI-агентами, почему появляется AI-slop, зачем нужны design tokens, Paper, Mobbin MCP и хороший контекст для Codex/Claude Code.',
  },
  {
    path: '/private-channel',
    slug: 'private-channel',
    title: 'Закрытый канал — Даниил Охлопков',
    description: 'Даниил Охлопков — закрытое сообщество AI / web3 / TG+TON фаундеров и билдеров. Живые мысли без AI-слопа.',
    robots: 'noindex, follow',
  },
  {
    path: '/articles/markdown-vs-html',
    slug: 'markdown-vs-html',
    title: 'Markdown мёртв — да здравствует HTML | Даниил Охлопков',
    description: 'Даниил Охлопков — почему HTML побеждает markdown как формат вывода для AI-агентов. Плотность инфы, читаемость, шеринг, интерактив. С примерами промптов и реальными кейсами.',
  },
  {
    path: '/privacy',
    slug: 'privacy',
    title: 'Privacy Policy — okhlopkov.com',
    description: 'Privacy policy for okhlopkov.com and the personal Pinterest Content Ideas integration.',
    lang: 'en',
    alternates: {
      en: `${SITE_URL}/privacy/`,
      'x-default': `${SITE_URL}/privacy/`,
    },
  },
]

for (const post of GENERATED_BLOG_POSTS) {
  ROUTES.push({
    path: `/blog/${post.slug}`,
    slug: `blog-${post.slug}`,
    title: post.title,
    description: post.description,
    lang: 'ru',
    alternates: {
      ru: `${SITE_URL}/blog/${post.slug}/`,
      'x-default': `${SITE_URL}/blog/${post.slug}/`,
    },
    kind: 'generated-blog-post',
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    sourceTelegramId: post.sourceTelegramId,
    sourceTelegramUrl: post.sourceTelegramUrl,
    primaryKeyword: post.primaryKeyword,
    secondaryKeywords: post.secondaryKeywords,
    tags: post.tags,
    views: post.views,
    forwards: post.forwards,
    comments: post.comments,
    reactions: post.reactions,
    markdown: post.body,
  })
}

function escape(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function applySiteUrl(html) {
  return html.replaceAll(DEFAULT_SITE_URL, SITE_URL)
}

// Inline regex md→html: only what our templates use (headings, lists,
// blockquotes, links, tables and fenced code/prompt blocks).
function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out = []
  let inList = false
  let listTag = 'ul'
  let inQuote = false
  let para = []
  let inCode = false
  let codeLines = []
  const flushPara = () => {
    if (!para.length) return
    out.push(`<p>${inlineFmt(para.join(' '))}</p>`)
    para = []
  }
  const openList = (tag) => {
    if (inList && listTag !== tag) closeList()
    if (!inList) {
      listTag = tag
      out.push(`<${tag}>`)
      inList = true
    }
  }
  const closeList = () => { if (inList) { out.push(`</${listTag}>`); inList = false } }
  const closeQuote = () => { if (inQuote) { out.push('</blockquote>'); inQuote = false } }
  const flushCode = () => {
    if (!inCode) return
    out.push(`<pre><code>${escapeCode(codeLines.join('\n'))}</code></pre>`)
    codeLines = []
    inCode = false
  }
  const escapeCode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inlineFmt = (s) => {
    let t = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
    t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) => `<img src="${url.replace(/"/g, '&quot;')}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />`)
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, txt, url) => `<a href="${url.replace(/"/g, '&quot;')}">${txt}</a>`)
    return t
  }
  const isTableDivider = (line) => /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)
  const splitTableRow = (line) => line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index]
    const line = raw.trimEnd()
    if (inCode) {
      if (line.startsWith('```')) { flushCode(); continue }
      codeLines.push(raw)
      continue
    }
    if (line.startsWith('```')) { flushPara(); closeList(); closeQuote(); inCode = true; codeLines = []; continue }
    if (!line.trim()) { flushPara(); closeList(); closeQuote(); continue }
    if (line.startsWith('|') && lines[index + 1]?.trimEnd().startsWith('|') && isTableDivider(lines[index + 1].trimEnd())) {
      flushPara(); closeList(); closeQuote()
      const headers = splitTableRow(line)
      index += 2
      const bodyRows = []
      while (index < lines.length && lines[index].trimEnd().startsWith('|')) {
        bodyRows.push(splitTableRow(lines[index].trimEnd()))
        index += 1
      }
      index -= 1
      out.push(`<table><thead><tr>${headers.map((cell) => `<th>${inlineFmt(cell)}</th>`).join('')}</tr></thead><tbody>${bodyRows.map((row) => `<tr>${row.map((cell) => `<td>${inlineFmt(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
      continue
    }
    if (line.startsWith('### ')) { flushPara(); closeList(); closeQuote(); out.push(`<h3>${inlineFmt(line.slice(4))}</h3>`); continue }
    if (line.startsWith('## ')) { flushPara(); closeList(); closeQuote(); out.push(`<h2>${inlineFmt(line.slice(3))}</h2>`); continue }
    if (line.startsWith('# ')) { flushPara(); closeList(); closeQuote(); out.push(`<h1>${inlineFmt(line.slice(2))}</h1>`); continue }
    if (line.startsWith('- ')) { flushPara(); closeQuote(); openList('ul'); out.push(`<li>${inlineFmt(line.slice(2))}</li>`); continue }
    if (/^\d+\.\s+/.test(line)) { flushPara(); closeQuote(); openList('ol'); out.push(`<li>${inlineFmt(line.replace(/^\d+\.\s+/, ''))}</li>`); continue }
    if (line.startsWith('> ')) { flushPara(); closeList(); if (!inQuote) { out.push('<blockquote>'); inQuote = true } out.push(`<p>${inlineFmt(line.slice(2))}</p>`); continue }
    if (line.startsWith('---')) { flushPara(); closeList(); closeQuote(); out.push('<hr/>'); continue }
    closeList(); closeQuote(); para.push(line)
  }
  flushPara(); closeList(); closeQuote(); flushCode()
  return out.join('\n')
}

function buildFallback(title, mdBody) {
  const article = mdToHtml(mdBody)
  const nav = NAV_LINKS.map(([href, label]) => `<a href="${href}">${label}</a>`).join(' · ')
  const socials = SOCIAL_LINKS.map(([href, label]) => `<a href="${href}" rel="me">${label}</a>`).join(' · ')
  return `<header><h1>${escape(title)}</h1></header><article>${article}</article><nav>${nav}</nav><footer>${socials}</footer>`
}

function getRouteMd(route) {
  if (route.kind === 'generated-blog-post') {
    return route.markdown || ''
  }
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
    author: { '@type': 'Person', name: 'Даниил Охлопков', url: `${SITE_URL}/` },
    image: 'https://github.com/ohld.png',
    mainEntityOfPage: `${SITE_URL}/articles/markdown-vs-html/`,
    inLanguage: 'ru',
  }),
  about: () => ({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': `${SITE_URL}/#person` },
    url: `${SITE_URL}/about/`,
  }),
  'en-about': () => ({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: { '@id': `${SITE_URL}/#person` },
    url: `${SITE_URL}/en/about/`,
    inLanguage: 'en',
  }),
  blog: (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Блог — Даниил Охлопков',
    description: r.description,
    url: `${SITE_URL}/blog/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Design engineering', 'Claude Code', 'Codex', 'MCP'],
    inLanguage: 'ru',
  }),
  'en-blog': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog — Daniil Okhlopkov',
    description: r.description,
    url: `${SITE_URL}/en/blog/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Claude Code', 'Codex', 'MCP', 'Telegram'],
    inLanguage: 'en',
  }),
  articles: (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Статьи — Даниил Охлопков',
    description: r.description,
    url: `${SITE_URL}/articles/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Claude Code', 'Codex', 'OpenClaw', 'MCP', 'AI tools'],
    inLanguage: 'ru',
  }),
  'en-articles': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Articles — Daniil Okhlopkov',
    description: r.description,
    url: `${SITE_URL}/en/articles/`,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    about: ['AI agents', 'Claude Code', 'Codex', 'MCP', 'Telegram'],
    inLanguage: 'en',
  }),
  'articles-ai-tools-for-designers-design-engineering-agents': (r) => ({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: r.title,
    description: r.description,
    datePublished: '2026-05-25',
    dateModified: '2026-05-25',
    author: { '@type': 'Person', name: 'Даниил Охлопков', url: `${SITE_URL}/` },
    publisher: { '@type': 'Person', name: 'Даниил Охлопков', url: `${SITE_URL}/` },
    image: 'https://i.ytimg.com/vi/fIEMOzz0_AI/hqdefault.jpg',
    mainEntityOfPage: `${SITE_URL}/articles/ai-tools-for-designers-design-engineering-agents/`,
    inLanguage: 'ru',
    video: {
      '@type': 'VideoObject',
      name: 'ИИ не вывозит норм дизайн или это skill issue? | Подкаст «Мой AI сетап»',
      thumbnailUrl: ['https://i.ytimg.com/vi/fIEMOzz0_AI/hqdefault.jpg'],
      uploadDate: '2026-05-21',
      embedUrl: 'https://www.youtube.com/embed/fIEMOzz0_AI',
      url: 'https://www.youtube.com/watch?v=fIEMOzz0_AI',
    },
  }),
}

function generatedBlogPostSchema(route) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: route.title,
    description: route.description,
    datePublished: route.publishedAt,
    dateModified: route.updatedAt || STATIC_UPDATED_DATE,
    author: { '@type': 'Person', name: 'Даниил Охлопков', url: `${SITE_URL}/` },
    publisher: { '@type': 'Person', name: 'Даниил Охлопков', url: `${SITE_URL}/` },
    image: 'https://github.com/ohld.png',
    mainEntityOfPage: `${SITE_URL}${route.path}/`,
    inLanguage: 'ru',
    keywords: [route.primaryKeyword, ...(route.secondaryKeywords || [])].filter(Boolean),
    isBasedOn: route.sourceTelegramUrl,
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ViewAction', userInteractionCount: Number(route.views || 0) },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/ShareAction', userInteractionCount: Number(route.forwards || 0) },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: Number(route.comments || 0) },
    ],
  }
}

const BREADCRUMBS_BY_SLUG = {
  'en': [['Home', `${SITE_URL}/`], ['English', `${SITE_URL}/en/`]],
  'en-blog': [['Home', `${SITE_URL}/en/`], ['Blog', `${SITE_URL}/en/blog/`]],
  'en-articles': [['Home', `${SITE_URL}/en/`], ['Articles', `${SITE_URL}/en/articles/`]],
  'en-about': [['Home', `${SITE_URL}/en/`], ['About', `${SITE_URL}/en/about/`]],
  'about': [['Главная', `${SITE_URL}/`], ['Обо мне', `${SITE_URL}/about/`]],
  'blog': [['Главная', `${SITE_URL}/`], ['Блог', `${SITE_URL}/blog/`]],
  'articles': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`]],
  'articles-ai-tools-for-designers-design-engineering-agents': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`], ['AI-инструменты для дизайнеров', `${SITE_URL}/articles/ai-tools-for-designers-design-engineering-agents/`]],
  'private-channel': [['Главная', `${SITE_URL}/`], ['Закрытый канал', `${SITE_URL}/private-channel/`]],
  'markdown-vs-html': [['Главная', `${SITE_URL}/`], ['Статьи', `${SITE_URL}/articles/`], ['Markdown мёртв', `${SITE_URL}/articles/markdown-vs-html/`]],
  'privacy': [['Home', `${SITE_URL}/`], ['Privacy Policy', `${SITE_URL}/privacy/`]],
}

function buildBreadcrumb(route) {
  const items = route.kind === 'generated-blog-post'
    ? [['Главная', `${SITE_URL}/`], ['Блог', `${SITE_URL}/blog/`], [route.title, `${SITE_URL}${route.path}/`]]
    : BREADCRUMBS_BY_SLUG[route.slug]
  if (!items) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], i) => ({
      '@type': 'ListItem', position: i + 1, name, item,
    })),
  }
}

function rewrite(html, route) {
  const { path: routePath, slug, title, description } = route
  // Trailing slash = canonical form on GitHub Pages (served as 200 directly;
  // non-slash variant 301-redirects). Must match sitemap.xml.
  const url = `${SITE_URL}${routePath}/`
  const mdHref = `/${slug}.md`
  const isNoindex = route.robots?.startsWith('noindex')
  const lang = route.lang || 'ru'
  const ogLocale = lang === 'en' ? 'en_US' : lang === 'zh' ? 'zh_CN' : 'ru_RU'
  const mdBody = getRouteMd(route)
  const fallback = mdBody ? buildFallback(title, mdBody) : buildFallback(title, '')
  let out = applySiteUrl(html)
    .replace(/<html lang="[^"]+">/, `<html lang="${lang}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta name="robots" content=")[^"]*(")/, `$1${route.robots || 'index, follow'}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, `$1${ogLocale}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escape(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/<link rel="alternate" hreflang="[^"]+" href="[^"]+" \/>\n?    /g, '')
    .replace('    <link rel="alternate" type="text/markdown"', `${buildHreflang(route, url)}    <link rel="alternate" type="text/markdown"`)
    .replace(/<link rel="alternate" type="text\/markdown" href="[^"]*" \/><!-- alternate-md -->/, isNoindex ? '<!-- no markdown alternate for noindex page -->' : `<link rel="alternate" type="text/markdown" href="${mdHref}" /><!-- alternate-md -->`)
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
  const extraSchema = route.kind === 'generated-blog-post'
    ? generatedBlogPostSchema(route)
    : SCHEMA_BY_SLUG[slug]?.(route)
  if (extraSchema) {
    const extraJson = JSON.stringify(extraSchema, null, 2)
    const block = `<script type="application/ld+json">\n${extraJson}\n</script>\n  </head>`
    out = out.replace('</head>', block)
  }
  const crumb = buildBreadcrumb(route)
  if (crumb) {
    const crumbJson = JSON.stringify(crumb, null, 2)
    const block = `<script type="application/ld+json">\n${crumbJson}\n</script>\n  </head>`
    out = out.replace('</head>', block)
  }
  return out
}

function buildHreflang(route, canonicalUrl) {
  const alternates = route.alternates || {
    ru: canonicalUrl,
    'x-default': canonicalUrl,
  }
  return Object.entries(alternates)
    .map(([lang, href]) => `    <link rel="alternate" hreflang="${lang}" href="${href}" />\n`)
    .join('')
}

// ---- HTML prerender ----
let htmlCount = 0
// Home: rewrite #root fallback in dist/index.html (vite build wrote it, we patch in place).
const homeFallback = buildFallback('Даниил Охлопков', HOME_FALLBACK_MD.replace(/^#\s+[^\n]*\n+/, ''))
const homeOut = applySiteUrl(indexHtml).replace('<!-- body-fallback -->', homeFallback)
fs.writeFileSync(path.join(dist, 'index.html'), homeOut)

for (const route of ROUTES) {
  const html = rewrite(indexHtml, route)
  const dir = path.join(dist, route.path)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
  htmlCount++
}

// ---- Markdown for Agents ----
// Static templates for each route.
const templatesDir = path.join('scripts', 'markdown')

let mdCount = 0
for (const route of ROUTES) {
  if (route.robots?.startsWith('noindex')) continue
  const src = path.join(templatesDir, `${route.slug}.md`)
  const dest = path.join(dist, `${route.slug}.md`)
  if (route.kind === 'generated-blog-post') {
    fs.writeFileSync(dest, `# ${route.title}\n\n${route.markdown}\n`)
  } else {
    fs.copyFileSync(src, dest)
  }
  mdCount++
}

// ---- Redirects (legacy URLs) ----
// Write stub HTML + .md for old slugs that 301-equivalent to the new canonical
// via meta-refresh + canonical tag (no real 301 possible on GH Pages).
// SPA-side React Router also handles these via <Navigate> for in-app nav.
const REDIRECTS = [
  { from: '/closed', fromSlug: 'closed', to: '/private-channel/', toSlug: 'private-channel' },
  { from: '/ru', fromSlug: 'ru', to: '/', toSlug: 'home' },
  { from: '/work-together', fromSlug: 'work-together', to: '/about/', toSlug: 'about' },
  { from: '/markdown-vs-html', fromSlug: 'markdown-vs-html-legacy', to: '/articles/markdown-vs-html/', toSlug: 'markdown-vs-html' },
  { from: '/posts', fromSlug: 'posts', to: '/blog/', toSlug: 'blog' },
  { from: '/ai-agents', fromSlug: 'ai-agents', to: '/articles/', toSlug: 'articles' },
  { from: '/ai-course', fromSlug: 'ai-course', to: '/articles/', toSlug: 'articles' },
  { from: '/blog/ai-tools-for-designers-design-engineering-agents', fromSlug: 'blog-ai-tools-for-designers-design-engineering-agents', to: '/articles/ai-tools-for-designers-design-engineering-agents/', toSlug: 'articles-ai-tools-for-designers-design-engineering-agents' },
  { from: '/author/okhlopkov', fromSlug: 'author-okhlopkov', to: '/about/', toSlug: 'about' },
  { from: '/projects', fromSlug: 'projects', to: '/about/', toSlug: 'about' },
  { from: '/tag/second-brain', fromSlug: 'tag-second-brain', to: '/vtoroj-mozg-ai-assistent-obsidian-claude-code/', toSlug: 'vtoroj-mozg-ai-assistent-obsidian-claude-code' },
  { from: '/tag/ai-agents', fromSlug: 'tag-ai-agents', to: '/articles/', toSlug: 'articles' },
  { from: '/tag/telegram', fromSlug: 'tag-telegram', to: '/blog/', toSlug: 'blog' },
  { from: '/tag/ai', fromSlug: 'tag-ai', to: '/articles/', toSlug: 'articles' },
  { from: '/tag/analytics', fromSlug: 'tag-analytics', to: '/blog/', toSlug: 'blog' },
  { from: '/tag/claude-code', fromSlug: 'tag-claude-code', to: '/articles/', toSlug: 'articles' },
  { from: '/tag/crypto', fromSlug: 'tag-crypto', to: '/blog/', toSlug: 'blog' },
  { from: '/tag/dokku', fromSlug: 'tag-dokku', to: '/cloudflare-certificates-dokku/', toSlug: 'cloudflare-certificates-dokku' },
  { from: '/tag/parsing', fromSlug: 'tag-parsing', to: '/how-to-get-a-telegram-channel-subscribers-list-in-python/', toSlug: 'how-to-get-a-telegram-channel-subscribers-list-in-python' },
  { from: '/tag/telegram-cn', fromSlug: 'tag-telegram-cn', to: '/en/', toSlug: 'en' },
  { from: '/tag/telegram-en', fromSlug: 'tag-telegram-en', to: '/en/', toSlug: 'en' },
  { from: '/tag/web-scraping', fromSlug: 'tag-web-scraping', to: '/web-scraping-ai-agents-2026/', toSlug: 'web-scraping-ai-agents-2026' },
  { from: '/cn', fromSlug: 'cn', to: '/en/', toSlug: 'en' },
]
let redirectCount = 0
for (const r of REDIRECTS) {
  const targetUrl = `${SITE_URL}${r.to}`
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
const BUNDLE_SLUGS = [
  'en',
  'en-about',
  'about',
  'blog',
  'en-blog',
  'articles',
  'en-articles',
  'articles-ai-tools-for-designers-design-engineering-agents',
  'markdown-vs-html',
  'privacy',
  ...GENERATED_BLOG_POSTS.map((post) => `blog-${post.slug}`),
]
const bundleHeader = `# Daniil Okhlopkov — Full Content Bundle

> Combined Markdown of all pages on okhlopkov.com. For AI crawlers that prefer one-shot fetch.

`
const bundleParts = BUNDLE_SLUGS.map(slug => {
  const content = fs.readFileSync(path.join(dist, `${slug}.md`), 'utf8')
  return `## Source: /${slug}.md\n\n${content}`
})
fs.writeFileSync(path.join(dist, 'llms-full.txt'), bundleHeader + bundleParts.join('\n\n---\n\n'))

const llmsPath = path.join(dist, 'llms.txt')
if (fs.existsSync(llmsPath)) {
  fs.writeFileSync(llmsPath, applySiteUrl(fs.readFileSync(llmsPath, 'utf8')))
}

fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`)

// ---- Minimal XML sitemap for Google Search Console ----
const SITEMAP_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/en/`,
  `${SITE_URL}/about/`,
  `${SITE_URL}/en/about/`,
  `${SITE_URL}/blog/`,
  `${SITE_URL}/en/blog/`,
  `${SITE_URL}/articles/`,
  `${SITE_URL}/en/articles/`,
  `${SITE_URL}/articles/ai-tools-for-designers-design-engineering-agents/`,
  `${SITE_URL}/articles/markdown-vs-html/`,
  `${SITE_URL}/privacy/`,
].map((loc) => ({
  loc,
  lastmod: STATIC_UPDATED_DATE,
}))

function addSitemapUrl(pathname, lastmod = STATIC_UPDATED_DATE) {
  SITEMAP_URLS.push({
    loc: `${SITE_URL}${pathname}`,
    lastmod,
  })
}

function sitemapUrlXml({ loc, lastmod }) {
  return `  <url>
    <loc>${xmlText(loc)}</loc>
    <lastmod>${xmlText(lastmod)}</lastmod>
  </url>`
}

function xmlText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function hasCyrillic(s = '') {
  return /[\u0400-\u04FF]/.test(s)
}

function hasCjk(s = '') {
  return /[\u3400-\u9FFF]/.test(s)
}

function inferLegacyLang(page) {
  const pathName = page.path || ''
  const sample = `${page.title || ''}\n${page.description || ''}\n${stripTags(page.article_html || '').slice(0, 1200)}`
  if (pathName.startsWith('/cn-') || pathName === '/cn/' || hasCjk(sample)) return 'zh'
  if (pathName.startsWith('/en-')) return 'en'
  if (hasCyrillic(sample)) return 'ru'
  return page.lang === 'zh' || page.lang === 'cn' ? 'zh' : page.lang === 'en' ? 'en' : 'ru'
}

function legacyLabels(lang) {
  if (lang === 'ru') {
    return {
      home: 'Главная',
      about: 'Обо мне',
      blog: 'Блог',
      articles: 'Статьи',
      note: 'Страница сохранена при статической миграции',
      originalModified: 'Дата изменения в Ghost',
      updated: 'Обновлено',
      readTime: (minutes) => `${minutes} мин чтения`,
      preserved: `Static migration update: ${STATIC_UPDATED_DATE}`,
      author: 'Дан Охлопков',
    }
  }
  if (lang === 'zh') {
    return {
      home: 'Home',
      about: 'About',
      blog: 'Blog',
      articles: 'Articles',
      note: 'Preserved during the static migration',
      originalModified: 'Original Ghost modified date',
      updated: 'Updated',
      readTime: (minutes) => `${minutes} min read`,
      preserved: `Static migration update: ${STATIC_UPDATED_DATE}`,
      author: 'Daniil Okhlopkov',
    }
  }
  return {
    home: 'Home',
    about: 'About',
    blog: 'Blog',
    articles: 'Articles',
    note: 'Preserved during the static migration',
    originalModified: 'Original Ghost modified date',
    updated: 'Updated',
    readTime: (minutes) => `${minutes} min read`,
    preserved: `Static migration update: ${STATIC_UPDATED_DATE}`,
    author: 'Daniil Okhlopkov',
  }
}

function stripTags(html = '') {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatDate(value, lang) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'zh' ? 'zh-CN' : 'en-US'
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

function readingTime(html = '', lang = 'en') {
  const text = stripTags(html)
  const units = lang === 'zh'
    ? Math.max(1, Math.round(text.replace(/\s/g, '').length / 500))
    : Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220))
  return units
}

function legacyImageUrl(url, { absolute = false } = {}) {
  if (!url) return ''
  const local = url.replace(/^https?:\/\/okhlopkov\.com/i, '').replace(/^https?:\/\/ai\.okhlopkov\.com/i, '')
  if (absolute) return local.startsWith('/') ? `${SITE_URL}${local}` : url
  return local.startsWith('/') ? local : url
}

function extractLegacyBody(articleHtml = '') {
  const content = articleHtml.match(/<section\b[^>]*class="[^"]*\bgh-content\b[^"]*"[^>]*>([\s\S]*?)<\/section>/i)?.[1] || articleHtml
  return content
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/\s(href|src)="https?:\/\/okhlopkov\.com([^"]*)"/gi, ' $1="$2"')
    .replace(/\s(href|src)="https?:\/\/ai\.okhlopkov\.com([^"]*)"/gi, ' $1="$2"')
}

function legacyPageHtml(page) {
  const title = page.title || 'Daniil Okhlopkov'
  const description = page.description || 'Archived article from okhlopkov.com'
  const canonical = `${SITE_URL}${page.path}`
  const lang = inferLegacyLang(page)
  const labels = legacyLabels(lang)
  const image = legacyImageUrl(page.og_image, { absolute: true }) || 'https://github.com/ohld.png'
  const heroImage = legacyImageUrl(page.og_image)
  const originalModifiedAt = page.modified_at || page.published_at || STATIC_UPDATED_AT
  const publishedAt = formatDate(page.published_at, lang)
  const updatedAt = formatDate(STATIC_UPDATED_AT, lang)
  const originalUpdatedAt = formatDate(originalModifiedAt, lang)
  const articleBody = extractLegacyBody(page.article_html)
  const minutes = readingTime(articleBody, lang)
  const ruPath = localizedLegacyPath(page.path, 'ru')
  const enPath = localizedLegacyPath(page.path, 'en')
  const isAuthorPage = page.path?.startsWith('/author/')
  const isCollectionPage = page.path?.startsWith('/tag/') || page.path === '/cn/'
  const schemaType = isAuthorPage ? 'ProfilePage' : isCollectionPage ? 'CollectionPage' : 'BlogPosting'
  const legacySchema = schemaType === 'BlogPosting' ? {
    '@context': 'https://schema.org',
    '@type': schemaType,
    headline: title,
    description,
    image,
    datePublished: page.published_at || originalModifiedAt,
    dateModified: STATIC_UPDATED_AT,
    author: { '@type': 'Person', name: 'Даниил Охлопков', url: `${SITE_URL}/` },
    publisher: { '@type': 'Person', name: 'Даниил Охлопков', url: `${SITE_URL}/` },
    mainEntityOfPage: canonical,
    inLanguage: lang,
  } : {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: title,
    description,
    url: canonical,
    image,
    dateModified: STATIC_UPDATED_AT,
    isPartOf: { '@type': 'WebSite', name: 'okhlopkov.com', url: SITE_URL },
    inLanguage: lang,
  }
  return `<!doctype html>
<html lang="${xmlText(lang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="${schemaType === 'BlogPosting' ? 'article' : 'website'}" />
  <meta property="og:title" content="${escape(title)}" />
  <meta property="og:description" content="${escape(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${image}" />
  ${schemaType === 'BlogPosting' && page.published_at ? `<meta property="article:published_time" content="${page.published_at}" />` : ''}
  ${schemaType === 'BlogPosting' ? `<meta property="article:modified_time" content="${STATIC_UPDATED_AT}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escape(title)}" />
  <meta name="twitter:description" content="${escape(description)}" />
  <meta name="twitter:image" content="${image}" />
  <script type="application/ld+json">
${JSON.stringify(legacySchema, null, 2)}
  </script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-9Z5T725JJD"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-9Z5T725JJD');
  </script>
  <script>
    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    ym(46266270, "init", { clickmap:true, trackLinks:true, accurateTrackBounce:true, webvisor:true });
  </script>
  <style>
    :root { --bg:#F5F5F0; --text:#1A1A1A; --accent:#5F6F85; --border:#1A1A1A; --border-light:rgba(26,26,26,.1); --white-overlay:rgba(255,255,255,.4); }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--bg); color:var(--text); font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif; line-height:1.47; -webkit-font-smoothing:antialiased; }
    a { color:inherit; text-decoration:none; }
    .site-header { width:100%; max-width:820px; margin:0 auto; padding:16px 20px 8px; display:grid; grid-template-columns:1fr auto; gap:12px; align-items:center; }
    .site-header-brand { display:inline-flex; align-items:center; gap:8px; min-height:36px; font-family:'JetBrains Mono','SF Mono',monospace; font-size:12px; color:var(--accent); }
    .site-header-mark { width:8px; height:8px; background:var(--text); border-radius:1px; }
    .site-header-nav { grid-column:1 / -1; grid-row:2; display:flex; gap:4px; overflow-x:auto; padding-bottom:2px; }
    .site-header-link, .language-switcher a, .footer-links a { min-height:36px; display:inline-flex; align-items:center; font-family:'JetBrains Mono','SF Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--accent); }
    .site-header-link { padding:0 10px; border:1px solid var(--border-light); border-radius:2px; white-space:nowrap; }
    .language-switcher { display:inline-flex; grid-column:2; grid-row:1; justify-self:end; border:1px solid var(--border); border-radius:2px; }
    .language-switcher a { min-width:42px; justify-content:center; color:var(--text); }
    .language-switcher a + a { border-left:1px solid var(--border); }
    .language-switcher-active { background:var(--text); color:var(--bg) !important; }
    .page { max-width:820px; margin:0 auto; }
    .legacy-article { display:flex; flex-direction:column; gap:28px; padding:0 16px; }
    .legacy-article-header { padding:24px 24px 20px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; align-items:flex-start; }
    .legacy-meta { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:14px; font-family:'JetBrains Mono','SF Mono',monospace; font-size:10px; color:var(--accent); text-transform:uppercase; letter-spacing:.08em; }
    .legacy-dot { width:3px; height:3px; border-radius:50%; background:var(--accent); align-self:center; }
    .legacy-title { font-size:32px; line-height:1.1; font-weight:700; letter-spacing:0; margin:0 0 12px; }
    .legacy-description { margin:0; font-size:14px; line-height:1.6; color:rgba(26,26,26,.62); }
    .legacy-hero-image { margin:0; border:1px solid var(--border); border-radius:4px; overflow:hidden; background:var(--white-overlay); }
    .legacy-hero-image img { display:block; width:100%; aspect-ratio:16 / 9; object-fit:cover; }
    .legacy-content { border-top:1px solid var(--border-light); padding-top:24px; }
    .legacy-content :first-child { margin-top:0; }
    .legacy-content h1, .legacy-content .article-title, .legacy-content .article-header, .legacy-content .article-byline, .legacy-content .article-image, .legacy-content .post-card-tags, .legacy-content .author-list { display:none !important; }
    .legacy-content h2 { font-size:24px; line-height:1.18; letter-spacing:0; margin:34px 0 12px; }
    .legacy-content h3 { font-size:19px; line-height:1.22; letter-spacing:0; margin:28px 0 10px; }
    .legacy-content p, .legacy-content li { font-size:17px; line-height:1.7; color:rgba(26,26,26,.8); }
    .legacy-content p { margin:0 0 16px; }
    .legacy-content ul, .legacy-content ol { padding-left:22px; margin:0 0 18px; }
    .legacy-content li + li { margin-top:8px; }
    .legacy-content a { color:#315E8A; text-decoration:underline; text-decoration-thickness:1px; text-underline-offset:.18em; }
    .legacy-content a:hover { color:var(--text); }
    .legacy-content img { max-width:100%; height:auto; border-radius:4px; }
    .legacy-content figure { margin:22px 0; }
    .legacy-content blockquote { margin:18px 0; padding:16px 18px; border-left:3px solid var(--text); background:rgba(255,255,255,.48); }
    .legacy-content blockquote p { margin:0; color:var(--text); }
    .legacy-content pre { overflow:auto; padding:16px; border:1px solid var(--border); border-radius:4px; background:rgba(255,255,255,.45); }
    .legacy-content code { padding:.1em .32em; border:1px solid var(--border-light); border-radius:3px; background:rgba(255,255,255,.55); font-family:'JetBrains Mono','SF Mono',monospace; font-size:.86em; color:var(--text); }
    .legacy-content pre code { padding:0; border:0; background:transparent; font-size:13px; line-height:1.55; }
    .legacy-migration-note { border-top:1px solid var(--border-light); padding-top:18px; font-size:12px; line-height:1.6; color:rgba(26,26,26,.52); }
    .footer { margin-top:auto; padding:40px 24px 24px; border-top:1px solid var(--border); display:grid; gap:20px; }
    .footer-links { display:flex; flex-wrap:wrap; gap:12px; }
    .footer-socials { display:flex; flex-wrap:wrap; gap:8px; }
    .footer-socials a { width:36px; height:36px; display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--border-light); border-radius:2px; color:var(--accent); }
    .footer-copy { font-family:'JetBrains Mono','SF Mono',monospace; font-size:10px; color:rgba(26,26,26,.46); text-transform:uppercase; letter-spacing:.08em; }
    @media (min-width:768px) { .site-header { grid-template-columns:auto 1fr auto; padding:22px 32px 10px; } .site-header-nav { grid-column:auto; grid-row:auto; justify-content:center; } .language-switcher { grid-column:auto; grid-row:auto; } .legacy-title { font-size:40px; } .legacy-article { padding-left:24px; padding-right:24px; } }
    @media (min-width:1024px) { .site-header { padding-left:40px; padding-right:40px; } .legacy-article { padding-left:40px; padding-right:40px; } .legacy-article-header { padding:40px 40px 28px; } .legacy-title { font-size:48px; } }
  </style>
</head>
<body>
  <noscript><div><img src="https://mc.yandex.ru/watch/46266270" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  <header class="site-header">
    <a class="site-header-brand" href="${lang === 'en' ? '/en/' : '/'}"><span class="site-header-mark"></span><span>okhlopkov.com</span></a>
    <nav class="site-header-nav" aria-label="${lang === 'ru' ? 'Основная навигация' : 'Primary navigation'}">
      <a class="site-header-link" href="${lang === 'en' ? '/en/' : '/'}">${labels.home}</a>
      <a class="site-header-link" href="${lang === 'en' ? '/en/blog/' : '/blog/'}">${labels.blog}</a>
      <a class="site-header-link" href="${lang === 'en' ? '/en/articles/' : '/articles/'}">${labels.articles}</a>
      <a class="site-header-link" href="${lang === 'en' ? '/en/about/' : '/about/'}">${labels.about}</a>
    </nav>
    <nav class="language-switcher" aria-label="${lang === 'ru' ? 'Выбор языка' : 'Language'}">
      <a class="${lang === 'ru' ? 'language-switcher-active' : ''}" href="${ruPath}">RU</a>
      <a class="${lang === 'en' ? 'language-switcher-active' : ''}" href="${enPath}">EN</a>
    </nav>
  </header>
  <div class="page">
    <main class="legacy-article">
      <article>
        <header class="legacy-article-header">
          <div class="legacy-meta">
            ${publishedAt ? `<span>${escape(publishedAt)}</span><span class="legacy-dot"></span>` : ''}
            <span>${labels.updated} ${escape(updatedAt)}</span>
            <span class="legacy-dot"></span>
            <span>${labels.readTime(minutes)}</span>
          </div>
          <h1 class="legacy-title">${xmlText(title)}</h1>
          ${description ? `<p class="legacy-description">${xmlText(description)}</p>` : ''}
        </header>
        ${heroImage ? `<figure class="legacy-hero-image"><img src="${escape(heroImage)}" alt="${escape(title)}" fetchpriority="high" /></figure>` : ''}
        <section class="legacy-content">${articleBody}</section>
        <aside class="legacy-migration-note">
          <p>${labels.preserved}. ${labels.note}.</p>
          ${originalUpdatedAt ? `<p>${labels.originalModified}: ${escape(originalUpdatedAt)}.</p>` : ''}
        </aside>
      </article>
    </main>
    <footer class="footer">
      <nav class="footer-links" aria-label="${lang === 'ru' ? 'Разделы сайта' : 'Site sections'}">
        <a href="/">RU</a>
        <a href="/en/">EN</a>
        <a href="${lang === 'en' ? '/en/blog/' : '/blog/'}">${labels.blog}</a>
        <a href="${lang === 'en' ? '/en/articles/' : '/articles/'}">${labels.articles}</a>
        <a href="${lang === 'en' ? '/en/about/' : '/about/'}">${labels.about}</a>
        <a href="/privacy/">Privacy</a>
      </nav>
      <div class="footer-socials">
        <a href="https://t.me/danokhlopkov" rel="me noopener noreferrer" aria-label="Telegram">TG</a>
        <a href="https://youtube.com/@danokhlopkov" rel="me noopener noreferrer" aria-label="YouTube">YT</a>
        <a href="https://instagram.com/d7733o" rel="me noopener noreferrer" aria-label="Instagram">IG</a>
        <a href="https://x.com/danokhlopkov" rel="me noopener noreferrer" aria-label="X">X</a>
        <a href="https://www.linkedin.com/in/danokhlopkov/" rel="me noopener noreferrer" aria-label="LinkedIn">IN</a>
        <a href="https://github.com/ohld" rel="me noopener noreferrer" aria-label="GitHub">GH</a>
      </div>
      <span class="footer-copy">© 2026 ${labels.author}</span>
    </footer>
  </div>
</body>
</html>
`
}

function loadLegacyPages() {
  const src = path.join('content', 'legacy-pages', 'pages.json')
  if (!fs.existsSync(src)) return []
  return JSON.parse(fs.readFileSync(src, 'utf8'))
}

function writeLegacyPages() {
  const pages = loadLegacyPages()
  for (const page of pages) {
    if (!page.path || !page.article_html) continue
    const dir = path.join(dist, page.path)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), legacyPageHtml(page))
  }
  return pages
}

const legacyPages = writeLegacyPages()
for (const post of GENERATED_BLOG_POSTS) {
  addSitemapUrl(`/blog/${post.slug}/`, post.updatedAt || STATIC_UPDATED_DATE)
}
for (const page of legacyPages) {
  if (page.path) addSitemapUrl(page.path)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_URLS.map(sitemapUrlXml).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
console.log(`✓ Sitemap: generated ${SITEMAP_URLS.length} canonical URLs`)

console.log(`✓ Prerendered ${htmlCount} HTML routes + ${mdCount} Markdown files + ${redirectCount} redirects + ${legacyPages.length} legacy pages + llms-full.txt`)
