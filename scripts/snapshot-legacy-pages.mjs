#!/usr/bin/env node
/**
 * Snapshot high-value Ghost URLs from the GSC migration inventory.
 *
 * This is intentionally public-site based, not Ghost Admin API based:
 * it can preserve indexed URLs before the Ghost service is removed, and it
 * does not require secrets in CI.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const SITE_URL = process.env.SITE_URL || 'https://okhlopkov.com'
const DEFAULT_INVENTORY = '/Users/ohld/Library/Mobile Documents/iCloud~md~obsidian/Documents/ohld/projects/personal-brand-seo/ai-docs/migration-2026-05-25/okhlopkov-url-migration-inventory.csv'
const inventoryPath = process.env.GSC_INVENTORY_PATH || DEFAULT_INVENTORY
const limit = Number(process.env.LEGACY_LIMIT || 97)
const outDir = process.env.LEGACY_OUT_DIR || 'content/legacy-pages'
const assetRoot = process.env.LEGACY_ASSET_ROOT || 'public'

const existingStaticRoutes = new Set([
  '/',
  '/en/',
  '/ru/',
  '/about/',
  '/posts/',
  '/ai-agents/',
  '/ai-course/',
  '/private-channel/',
  '/work-together/',
  '/markdown-vs-html/',
])

function isGhostServicePath(pathname) {
  return pathname === '/cn/' || pathname.startsWith('/author/') || pathname.startsWith('/tag/')
}

function parseCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && quoted && line[i + 1] === '"') {
      current += '"'
      i++
    } else if (ch === '"') {
      quoted = !quoted
    } else if (ch === ',' && !quoted) {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').trim().split('\n')
  const headers = parseCsvLine(lines.shift())
  return lines.map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']))
  })
}

function decodeEntities(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function htmlEscape(s = '') {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function attr(html, pattern) {
  const match = html.match(pattern)
  return match ? decodeEntities(match[1].trim()) : ''
}

function cleanArticleHtml(articleHtml) {
  return articleHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\sdata-[a-z0-9_-]+="[^"]*"/gi, '')
    .replace(/\stype="[^"]*text\/javascript[^"]*"/gi, '')
    .trim()
}

function extractArticle(html) {
  const article = html.match(/<article\b[\s\S]*?<\/article>/i)?.[0]
  if (article) return cleanArticleHtml(article)
  const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0]
  if (main) return cleanArticleHtml(main)
  return ''
}

function collectImageUrls(html) {
  const urls = new Set()
  const add = (raw) => {
    if (!raw) return
    const clean = raw.trim().split(/\s+/)[0]
    if (!clean) return
    if (clean.startsWith('/content/images/')) urls.add(new URL(clean, SITE_URL).toString())
    if (clean.startsWith(`${SITE_URL}/content/images/`)) urls.add(clean)
  }

  for (const match of html.matchAll(/\s(?:src|href|content)="([^"]*\/content\/images\/[^"]+)"/gi)) {
    add(match[1])
  }
  for (const match of html.matchAll(/\ssrcset="([^"]+)"/gi)) {
    for (const part of match[1].split(',')) add(part)
  }
  return [...urls]
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'okhlopkov-static-migration/1.0',
      accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.text()
}

async function downloadAsset(url) {
  const parsed = new URL(url)
  const relPath = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  const dest = path.join(assetRoot, relPath)
  try {
    await fs.access(dest)
    return { url, path: relPath, status: 'exists' }
  } catch {
    // continue
  }

  const res = await fetch(url, { headers: { 'user-agent': 'okhlopkov-static-migration/1.0' } })
  if (!res.ok) return { url, path: relPath, status: `failed:${res.status}` }
  const bytes = Buffer.from(await res.arrayBuffer())
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.writeFile(dest, bytes)
  return { url, path: relPath, status: 'downloaded' }
}

async function main() {
  const csv = await fs.readFile(inventoryPath, 'utf8')
  const rows = parseCsv(csv)
    .filter((row) => row.recommended_action === 'preserve_or_301')
    .filter((row) => row.path && !existingStaticRoutes.has(row.path))
    .filter((row) => !isGhostServicePath(row.path))
    .slice(0, limit)

  await fs.mkdir(outDir, { recursive: true })

  const pages = []
  const assets = []
  const failures = []

  for (const [index, row] of rows.entries()) {
    const url = row.url
    try {
      const html = await fetchText(url)
      const title = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i)
      const description = attr(html, /<meta\s+name="description"\s+content="([^"]*)"/i)
      const ogImage = attr(html, /<meta\s+property="og:image"\s+content="([^"]*)"/i)
      const publishedAt = attr(html, /<meta\s+property="article:published_time"\s+content="([^"]*)"/i)
      const modifiedAt = attr(html, /<meta\s+property="article:modified_time"\s+content="([^"]*)"/i)
      const lang = attr(html, /<html\s+lang="([^"]*)"/i) || row.lang_guess || 'ru'
      const articleHtml = extractArticle(html)

      if (!articleHtml) throw new Error('Could not extract article/main HTML')

      const imageUrls = collectImageUrls(`${ogImage ? `<img src="${ogImage}">` : ''}${articleHtml}`)
      for (const imageUrl of imageUrls) {
        assets.push(await downloadAsset(imageUrl))
      }

      pages.push({
        old_url: url,
        path: row.path,
        title,
        description,
        lang,
        og_image: ogImage,
        published_at: publishedAt,
        modified_at: modifiedAt,
        article_html: articleHtml,
      })
      console.log(`[${index + 1}/${rows.length}] snapshot ${row.path}`)
    } catch (err) {
      failures.push({ url, path: row.path, error: err.message })
      console.warn(`[${index + 1}/${rows.length}] failed ${row.path}: ${err.message}`)
    }
  }

  await fs.writeFile(path.join(outDir, 'pages.json'), JSON.stringify(pages, null, 2))
  await fs.writeFile(path.join(outDir, 'assets.json'), JSON.stringify(assets, null, 2))
  await fs.writeFile(path.join(outDir, 'failures.json'), JSON.stringify(failures, null, 2))

  console.log(`Snapshot complete: ${pages.length} pages, ${assets.length} assets, ${failures.length} failures`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
