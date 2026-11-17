#!/usr/bin/env node
// Deterministic anti-slop gate for RU/EN Markdown posts. It cannot judge voice or facts: a human or
// critic review still owns those. Banned phrases live in scripts/editorial-rules.json.
//   npm run check:editorial -- content/blog-posts/<name>.md ...
//   npm run check:editorial -- --changed     (posts added or modified since origin/main; used by preflight)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { inventory, parseMarkdown } from './content-loop/content.mjs'
import { staticPrerenderRoutes } from './prerender-routes.mjs'

const CONTENT_DIRS = ['content/blog-posts', 'content/seo-articles']
const MIN_WORDS = 600
const SITE = /^(?:https?:)?\/\/(www\.)?okhlopkov\.com(?=\/|$)/i
const PRICE = /[$€₽]\s?\d|\d\s?(₽|руб|usd|eur|€|\$)|\/(мес|mo|month)(?![\p{L}])|per month|в месяц/iu
const VERSION = /(?<![\p{L}\p{N}.])v?\d+\.\d+\.\d+(?![\p{N}.])|(?<![\p{L}\p{N}.])v\d+\.\d+(?![\p{N}.])/iu
const LIMIT = /(?:limit|quota|лимит|квот)[^.!?\n]{0,50}\d|\d[\d,.]*\s*[kmкм]?\s*(?:tokens?|токен[а-я]*|requests?|запрос[а-я]*)\s*(?:\/|per\b|в\s)/iu
const DATED = /20\d\d|\]\(|январ|феврал|март|апрел|(?<!\p{L})мая(?!\p{L})|июн|июл|август|сентябр|октябр|ноябр|декабр|january|february|march|april|\bmay\b|june|july|august|september|october|november|december/iu
const FAQ = /^#{2,3}\s+.*(faq|чаво|частые вопросы|вопросы и ответы|frequently asked)/iu

const rulesFile = fileURLToPath(new URL('./editorial-rules.json', import.meta.url))
export const loadRules = () => JSON.parse(fs.readFileSync(rulesFile, 'utf8'))

// Every canonical URL an internal link may point to.
export function routeInventory(root) {
  const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
  const redirected = new Set(read('content/articles/legacy-redirects.json').map((redirect) => redirect.from))
  return new Set([
    ...staticPrerenderRoutes(root),
    ...read('content/topic-hubs.json').hubs.map((hub) => `/topics/${hub.slug}/`),
    ...inventory(root).map((item) => item.canonical_path).filter((route) => !redirected.has(route)),
  ])
}

// Blanks fenced code and inline code so they are not read as prose; line numbers are preserved.
function proseLines(body) {
  let fence = null
  return body.split('\n').map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null
      return ''
    }
    if (marker) { fence = marker[1]; return '' }
    return line.replace(/(`+)([^`]|(?!\1)`)*?\1(?!`)/g, ' ')
  })
}

export function checkEditorial(text, { isNew = true, routes = new Set(), rules = loadRules(), assetExists = () => true } = {}) {
  const errors = []
  const warnings = []
  let parsed
  try { parsed = parseMarkdown(text) } catch (error) { return { errors: [error.message], warnings, words: 0 } }
  const { meta, body } = parsed
  const offset = text.split('\n').length - body.split('\n').length // body line → file line
  const at = (index) => `line ${index + 1 + offset}`
  const lines = proseLines(body)
  const prose = lines.join('\n')
  const selfPath = `/${meta.lang}/`

  const words = (prose.replace(/\]\([^)]*\)/g, ']').match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length
  if (words < MIN_WORDS) (isNew ? errors : warnings).push(`body has ${words} words; a new post needs at least ${MIN_WORDS}`)

  const h1 = lines.flatMap((line, index) => /^ {0,3}#\s+\S/.test(line) || /<h1\b/i.test(line) || (/^ {0,3}=+\s*$/.test(line) && lines[index - 1]?.trim()) ? [at(index)] : [])
  if (h1.length) errors.push(`body has an H1 (${h1.join(', ')}); the frontmatter title is the only H1 on the page`)
  const h2 = lines.filter((line) => /^##\s+\S/.test(line)).length
  if (h2 < 4 || h2 > 7) warnings.push(`${h2} H2 headings; aim for 4-7`)

  const hasCode = /^\s*(```|~~~)/m.test(body)
  const hasTable = /^\|.*\|\s*\n\|[\s:|-]+\|\s*$/m.test(prose)
  const hasList = /^\s*([-*+]|\d+[.)])\s+\S/m.test(prose)
  if (!hasCode && !hasTable && !hasList) errors.push('no code block, table or list: add one concrete artifact')

  const faq = lines.findIndex((line) => FAQ.test(line))
  if (faq !== -1 && words < MIN_WORDS) errors.push(`FAQ section (${at(faq)}) is not allowed in a post under ${MIN_WORDS} words`)

  // Banned phrases, in the body and in the reader-facing frontmatter fields.
  const fold = (value) => value.toLowerCase().replace(/ё/g, 'е')
  const scanned = [...lines.map((line, index) => [at(index), fold(line)]), ...['title', 'description', 'seoTitle', 'seoDescription'].filter((key) => meta[key]).map((key) => [key, fold(meta[key])])]
  for (const [level, sink] of [['error', errors], ['warn', warnings]]) {
    for (const [group, patterns] of Object.entries(rules[level] || {})) {
      const regex = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${patterns.join('|')})(?![\\p{L}\\p{N}_])`, 'iu')
      for (const [where, line] of scanned) {
        const hit = line.match(regex)
        if (hit) sink.push(`${group}: "${hit[0]}" (${where})`)
      }
    }
  }

  // Only inline Markdown links count: this is the link syntax the site renderer supports.
  // Definitions are still checked, so reference-style Markdown cannot hide a broken target.
  const internal = new Set()
  const checkTarget = (target, where, count = true) => {
      const local = target.replace(SITE, '') || '/'
      if (local.startsWith('/') && !local.startsWith('//')) {
        const pathname = local.split(/[?#]/)[0]
        if (/\.[a-z0-9]+$/i.test(pathname)) {
          if (!assetExists(pathname)) errors.push(`linked file does not exist: ${pathname} (${where})`)
        } else {
          const route = pathname.endsWith('/') ? pathname : `${pathname}/`
          if (!routes.has(route)) errors.push(`internal link is not in the route inventory: ${route} (${where})`)
          else if (count && route !== `${selfPath}blog/${meta.slug}/` && route !== `${selfPath}articles/${meta.slug}/`) internal.add(route)
        }
      }
  }
  lines.forEach((line, index) => {
    const definition = line.match(/^ {0,3}\[[^\]]+\]:\s*(\S+)/)
    if (definition) { checkTarget(definition[1], at(index), false); return }
    const withoutLinks = line.replace(/(!?)\[([^\]]*)\]\(\s*([^)\s]+)[^)]*\)/g, (_match, image, label, target) => {
      if (/^https?:\/\//i.test(label.trim())) errors.push(`bare URL as link text (${at(index)}): give the link a readable label`)
      checkTarget(target, at(index), !image)
      return ' '
    }).replace(/(href|src)=["']([^"']*)["']/gi, (_match, _attribute, target) => { checkTarget(target, at(index), false); return ' ' })
    if (/https?:\/\/\S/i.test(withoutLinks)) errors.push(`bare URL (${at(index)}): write a Markdown link with a readable label`)
  })
  if (internal.size < 2) errors.push(`${internal.size} internal links to existing pages; a post needs at least 2`)
  for (const key of ['title', 'description', 'seoTitle', 'seoDescription']) {
    if (/https?:\/\/\S/i.test(meta[key] || '')) errors.push(`bare URL (${key}): reader-facing metadata must use readable text`)
  }

  // Numeric price/version/limit claims only: checking their truth or source quality needs review.
  let start = 0
  for (const paragraph of prose.split(/\n\s*\n/)) {
    const line = prose.slice(0, prose.indexOf(paragraph, start)).split('\n').length - 1
    start = prose.indexOf(paragraph, start) + paragraph.length
    if ((PRICE.test(paragraph) || VERSION.test(paragraph) || LIMIT.test(paragraph)) && !DATED.test(paragraph)) warnings.push(`price, version or limit without a date or source in the same paragraph (${at(line)})`)
  }

  return { errors, warnings, words }
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
    const args = process.argv.slice(2)
    let base = null
    try { base = git(root, ['merge-base', 'origin/main', 'HEAD']) } catch { /* no origin/main: every file counts as new */ }
    let files = args.filter((arg) => arg !== '--changed').map((file) => path.relative(root, path.resolve(file)))
    if (args.includes('--changed')) {
      if (!base) throw new Error('check:editorial --changed needs origin/main; fetch it first (CI: actions/checkout with fetch-depth: 0)')
      files = [...git(root, ['diff', '--name-only', '--diff-filter=d', base, '--', ...CONTENT_DIRS]).split('\n'), ...git(root, ['ls-files', '--others', '--exclude-standard', '--', ...CONTENT_DIRS]).split('\n')].filter((file) => file.endsWith('.md'))
    }
    if (!files.length && !args.includes('--changed')) throw new Error('Usage: npm run check:editorial -- <post.md ...> | --changed')
    const routes = routeInventory(root)
    const rules = loadRules()
    let failed = 0
    for (const file of files) {
      let isNew = true
      try { if (base) { git(root, ['cat-file', '-e', `${base}:${file}`]); isNew = false } } catch { /* not on origin/main */ }
      const { errors, warnings, words } = checkEditorial(fs.readFileSync(path.join(root, file), 'utf8'), { isNew, routes, rules, assetExists: (asset) => fs.existsSync(path.join(root, 'public', asset)) })
      console.log(`${errors.length ? '✗' : '✓'} ${file} (${isNew ? 'new' : 'update'}, ${words} words, ${errors.length} errors, ${warnings.length} warnings)`)
      for (const error of errors) console.log(`  error: ${error}`)
      for (const warning of warnings) console.log(`  warn:  ${warning}`)
      if (errors.length) failed += 1
    }
    console.log(failed ? `Editorial check failed: ${failed} of ${files.length} files` : `✓ editorial check: ${files.length} files`)
    if (failed) process.exitCode = 1
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
