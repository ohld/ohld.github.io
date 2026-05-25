#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const legacyPagesPath = path.join('content', 'legacy-pages', 'pages.json')
const blogPostsPath = path.join('content', 'blog-posts')
const outPath = path.join('migration', 'url-map.csv')

const redirects = [
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
    note: 'HackerNoon links to the legacy projects page; redirect to About until a dedicated Projects page exists.',
  },
  {
    old_path: '/tag/ai-agents/',
    new_path: '/articles/',
    action: '308_redirect',
    source: 'ghost_service_page',
    note: 'Tag page redirects to the new Articles index.',
  },
  {
    old_path: '/tag/telegram/',
    new_path: '/blog/',
    action: '308_redirect',
    source: 'ghost_service_page',
    note: 'Tag page redirects to the blog collection.',
  },
  {
    old_path: '/tag/ai/',
    new_path: '/articles/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old AI tag appears in preserved legacy articles; redirect to the Articles index.',
  },
  {
    old_path: '/tag/analytics/',
    new_path: '/blog/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old analytics tag appears in preserved legacy articles; redirect to the blog index.',
  },
  {
    old_path: '/tag/claude-code/',
    new_path: '/articles/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old Claude Code tag appears in preserved legacy articles; redirect to the Articles index.',
  },
  {
    old_path: '/tag/crypto/',
    new_path: '/blog/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old crypto tag appears in preserved legacy articles; redirect to the blog index.',
  },
  {
    old_path: '/tag/dokku/',
    new_path: '/cloudflare-certificates-dokku/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old Dokku tag appears in preserved legacy articles; redirect to the strongest preserved Dokku article.',
  },
  {
    old_path: '/tag/parsing/',
    new_path: '/how-to-get-a-telegram-channel-subscribers-list-in-python/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old parsing tag appears in preserved legacy articles; redirect to the strongest preserved parsing article.',
  },
  {
    old_path: '/tag/telegram-cn/',
    new_path: '/en/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old Chinese Telegram tag is not maintained as a collection; redirect to the maintained English entry.',
  },
  {
    old_path: '/tag/telegram-en/',
    new_path: '/en/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old English Telegram tag is not maintained as a collection; redirect to the maintained English entry.',
  },
  {
    old_path: '/tag/web-scraping/',
    new_path: '/web-scraping-ai-agents-2026/',
    action: '308_redirect',
    source: 'legacy_internal_link',
    note: 'Old web scraping tag appears in preserved legacy articles; redirect to the strongest preserved web scraping article.',
  },
  {
    old_path: '/cn/',
    new_path: '/en/',
    action: '308_redirect',
    source: 'legacy_language_entry',
    note: 'Legacy CN entry is not a maintained content surface in the static migration.',
  },
  {
    old_path: '/ru/',
    new_path: '/',
    action: '308_redirect',
    source: 'language_policy',
    note: 'Russian homepage is canonical at root.',
  },
  {
    old_path: '/closed/',
    new_path: '/private-channel/',
    action: '308_redirect_noindex_destination',
    source: 'legacy_private_page',
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
    new_path: '/blog/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Old mini-app posts index now collapses into the blog surface.',
  },
  {
    old_path: '/ai-agents/',
    new_path: '/articles/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Old AI Agents hub now collapses into the Articles surface.',
  },
  {
    old_path: '/ai-course/',
    new_path: '/articles/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'Old AI course route is no longer a primary public surface.',
  },
  {
    old_path: '/blog/ai-tools-for-designers-design-engineering-agents/',
    new_path: '/articles/ai-tools-for-designers-design-engineering-agents/',
    action: '308_redirect',
    source: 'static_ia_cleanup',
    note: 'The design engineering piece is an SEO article, not a Telegram-derived blog post.',
  },
]

const newStaticPages = [
  ['/', 'new_static_page', 'ru', 'Canonical Russian homepage'],
  ['/en/', 'new_static_page', 'en', 'English homepage'],
  ['/en/blog/', 'new_static_page', 'en', 'English-only blog index'],
  ['/en/articles/', 'new_static_page', 'en', 'English-only article index'],
  ['/en/about/', 'new_static_page', 'en', 'English about page'],
  ['/about/', 'new_static_page', 'ru', 'About page'],
  ['/blog/', 'new_static_page', 'ru', 'Indexable blog for Telegram-derived posts'],
  ['/articles/', 'new_static_page', 'ru', 'SEO article index'],
  ['/articles/ai-tools-for-designers-design-engineering-agents/', 'new_static_page', 'ru', 'First YouTube-derived SEO article with component examples'],
  ['/articles/markdown-vs-html/', 'new_static_page', 'ru', 'Existing static article route moved under Articles'],
  ['/privacy/', 'new_static_page', 'en', 'Privacy policy for Pinterest app review and site data practices'],
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
  if (!fs.existsSync(blogPostsPath)) return []
  return fs.readdirSync(blogPostsPath)
    .filter((file) => file.endsWith('.md'))
    .map((file) => parseFrontmatter(fs.readFileSync(path.join(blogPostsPath, file), 'utf8'), file))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

function csvCell(value) {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

function row(cells) {
  return cells.map(csvCell).join(',')
}

function readLegacyPages() {
  if (!fs.existsSync(legacyPagesPath)) {
    throw new Error(`${legacyPagesPath} does not exist. Run npm run snapshot:legacy first.`)
  }
  return JSON.parse(fs.readFileSync(legacyPagesPath, 'utf8'))
}

function stripTags(html = '') {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferLegacyLang(page) {
  const pathName = page.path || ''
  const sample = `${page.title || ''}\n${page.description || ''}\n${stripTags(page.article_html || '').slice(0, 1200)}`
  if (pathName.startsWith('/cn-') || pathName === '/cn/' || /[\u3400-\u9FFF]/.test(sample)) return 'zh'
  if (pathName.startsWith('/en-')) return 'en'
  if (/[\u0400-\u04FF]/.test(sample)) return 'ru'
  return page.lang === 'zh' || page.lang === 'cn' ? 'zh' : page.lang === 'en' ? 'en' : 'ru'
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

for (const page of readLegacyPages()) {
  lines.push(row([
    page.old_url || `${SITE_URL}${page.path}`,
    page.path,
    'preserve_same_path',
    `${SITE_URL}${page.path}`,
    page.path,
    '200',
    'index, follow',
    inferLegacyLang(page),
    page.title || '',
    'gsc_preserve_or_301_snapshot',
    'Preserved as standalone static HTML with original path, canonical URL and migration dateModified.',
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

for (const [pagePath, action, lang, note] of newStaticPages) {
  lines.push(row([
    '',
    '',
    action,
    `${SITE_URL}${pagePath}`,
    pagePath,
    '200',
    'index, follow',
    lang,
    '',
    'static_app_route',
    note,
  ]))
}

for (const post of readGeneratedBlogPosts()) {
  const pagePath = `/blog/${post.slug}/`
  lines.push(row([
    '',
    '',
    'new_static_page',
    `${SITE_URL}${pagePath}`,
    pagePath,
    '200',
    'index, follow',
    'ru',
    post.title || '',
    'telegram_derived_blog_post',
    `Blog post from Telegram #${post.sourceTelegramId}; original post text preserved, SEO layer added.`,
  ]))
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, `${lines.join('\n')}\n`)
console.log(`✓ wrote ${outPath} (${lines.length - 1} rows)`)
