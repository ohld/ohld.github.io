import fs from 'node:fs'
import path from 'node:path'

const SITE_URL = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const distDir = process.env.HREFLANG_DIST_DIR || 'dist'
const groupsPath = path.join('content', 'articles', 'localized-groups.json')
const importedIndexPath = path.join('content', 'articles', 'imported-index.json')
const langs = ['ru', 'en', 'zh']
const issues = []

const groups = JSON.parse(fs.readFileSync(groupsPath, 'utf8'))
const importedArticles = JSON.parse(fs.readFileSync(importedIndexPath, 'utf8'))
const importedByPath = new Map(importedArticles.map((article) => [canonicalPath(article.path), article]))
const pages = readDistPages()
const pagesByUrl = new Map(pages.map((page) => [page.canonical, page]))

validateLocalizedGroups()
validatePages()

if (issues.length) {
  console.error(`✗ hreflang verification failed (${issues.length} issue${issues.length === 1 ? '' : 's'})`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exit(1)
}

console.log(`✓ hreflang: ${pages.length} indexable HTML pages, ${groups.length} localized article groups`)

function validateLocalizedGroups() {
  const groupedPaths = new Set()
  groups.forEach((group, index) => {
    const entries = langs.map((lang) => [lang, canonicalPath(group[lang])]).filter(([, href]) => href)
    if (entries.length < 2) issues.push(`${groupsPath}#${index + 1}: group must contain at least two languages`)
    if (group.xDefault && !group[group.xDefault]) issues.push(`${groupsPath}#${index + 1}: xDefault points to missing ${group.xDefault}`)
    for (const [lang, href] of entries) {
      const article = importedByPath.get(href)
      if (!article) {
        issues.push(`${groupsPath}#${index + 1}: ${lang} URL ${href} is not in imported-index.json`)
      } else if (article.lang !== lang) {
        issues.push(`${groupsPath}#${index + 1}: ${href} is marked ${article.lang}, not ${lang}`)
      }
      groupedPaths.add(href)
    }
  })

  for (const article of importedArticles) {
    if (article.lang === 'zh' && !groupedPaths.has(canonicalPath(article.path))) {
      issues.push(`${article.path}: Chinese imported article is not listed in ${groupsPath}`)
    }
  }
}

function validatePages() {
  for (const page of pages) {
    const selfRefs = Object.values(page.hreflangs).filter((href) => href === page.canonical).length
    if (!selfRefs) issues.push(`${page.path}: missing self-referencing hreflang for ${page.canonical}`)
    if (page.duplicates.length) issues.push(`${page.path}: duplicate hreflang values ${page.duplicates.join(', ')}`)

    for (const [lang, href] of Object.entries(page.hreflangs)) {
      if (!isValidLang(lang)) issues.push(`${page.path}: invalid hreflang ${lang}`)
      if (!href.startsWith(`${SITE_URL}/`)) {
        issues.push(`${page.path}: hreflang ${lang} points outside canonical host: ${href}`)
        continue
      }

      const target = pagesByUrl.get(href)
      if (!target) {
        issues.push(`${page.path}: hreflang ${lang} target is missing from dist: ${href}`)
        continue
      }
      if (!Object.values(target.hreflangs).includes(page.canonical)) {
        issues.push(`${page.path}: ${href} does not return-link to ${page.canonical}`)
      }
      if (signature(page.hreflangs) !== signature(target.hreflangs)) {
        issues.push(`${page.path}: hreflang set differs from ${target.path}`)
      }
    }
  }
}

function readDistPages() {
  return walk(distDir)
    .filter((file) => file.endsWith(`${path.sep}index.html`) || file === path.join(distDir, 'index.html'))
    .map(parsePage)
    .filter(Boolean)
}

function parsePage(file) {
  const html = fs.readFileSync(file, 'utf8')
  const robots = (readMeta(html, 'robots') || '').toLowerCase()
  if (robots.includes('noindex')) return null

  const canonical = readCanonical(html)
  if (!canonical) return null
  const hreflangs = {}
  const duplicates = []
  for (const match of html.matchAll(/<link\b([^>]+)>/gi)) {
    const attrs = parseAttrs(match[1])
    if (!attrs.hreflang || !hasRel(attrs.rel, 'alternate')) continue
    const lang = attrs.hreflang
    if (hreflangs[lang]) duplicates.push(lang)
    hreflangs[lang] = normalizeUrl(attrs.href, `${file}: hreflang ${lang}`)
  }

  return {
    path: routePathForFile(file),
    canonical: normalizeUrl(canonical, `${file}: canonical`),
    hreflangs,
    duplicates,
  }
}

function readCanonical(html) {
  for (const match of html.matchAll(/<link\b([^>]+)>/gi)) {
    const attrs = parseAttrs(match[1])
    if (hasRel(attrs.rel, 'canonical')) return attrs.href || ''
  }
  return ''
}

function readMeta(html, name) {
  for (const match of html.matchAll(/<meta\b([^>]+)>/gi)) {
    const attrs = parseAttrs(match[1])
    if ((attrs.name || attrs.property || '').toLowerCase() === name) return attrs.content || ''
  }
  return ''
}

function parseAttrs(raw) {
  const attrs = {}
  for (const match of raw.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? ''
  }
  return attrs
}

function normalizeUrl(value, label) {
  try {
    const url = new URL(value)
    url.hash = ''
    return url.href
  } catch {
    issues.push(`${label}: URL is not fully qualified: ${value || '<empty>'}`)
    return value || ''
  }
}

function hasRel(rel = '', expected) {
  return rel.toLowerCase().split(/\s+/).includes(expected)
}

function canonicalPath(value = '') {
  if (!value) return ''
  const pathOnly = value.split('?')[0].split('#')[0]
  if (pathOnly === '/') return '/'
  return pathOnly.endsWith('/') ? pathOnly : `${pathOnly}/`
}

function routePathForFile(file) {
  const relative = path.relative(distDir, path.dirname(file))
  return relative ? `/${relative.split(path.sep).join('/')}/` : '/'
}

function signature(hreflangs) {
  return JSON.stringify(Object.entries(hreflangs).sort(([a], [b]) => a.localeCompare(b)))
}

function isValidLang(lang) {
  return lang === 'x-default' || /^(?:[a-z]{2,3})(?:-[A-Za-z0-9]{2,8})*$/.test(lang)
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(fullPath) : [fullPath]
  })
}
