#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const siteUrl = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const distDir = path.resolve(process.env.DIST_DIR || 'dist')

const contentSets = [
  {
    dir: path.join('content', 'blog-posts'),
    route: (meta) => `/blog/${meta.slug}/`,
  },
  {
    dir: path.join('content', 'seo-articles'),
    route: (meta) => meta.lang === 'en' ? `/en/articles/${meta.slug}/` : `/articles/${meta.slug}/`,
  },
]

function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return null

  const meta = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return meta
}

function escapeAttr(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message)
}

function htmlPathForRoute(route) {
  return path.join(distDir, route.replace(/^\/+/, ''), 'index.html')
}

function verifyCover({ filePath, meta, route }, errors) {
  const coverImage = meta.coverImage
  const coverAlt = meta.coverAlt
  const label = `${filePath} (${route})`
  const absoluteImage = `${siteUrl}${coverImage}`
  const escapedAlt = escapeAttr(coverAlt || '')
  const assetPath = path.join('public', coverImage.replace(/^\/+/, ''))
  const pagePath = htmlPathForRoute(route)

  assert(Boolean(meta.slug), `${label}: missing slug`, errors)
  assert(Boolean(coverAlt), `${label}: coverImage exists but coverAlt is missing`, errors)
  assert(coverImage.startsWith('/'), `${label}: coverImage must be root-relative`, errors)
  assert(fs.existsSync(assetPath), `${label}: cover asset missing at ${assetPath}`, errors)

  if (fs.existsSync(assetPath)) {
    const size = fs.statSync(assetPath).size
    assert(size <= 350_000, `${label}: cover asset is too heavy (${size} bytes > 350000)`, errors)
  }

  assert(fs.existsSync(pagePath), `${label}: dist HTML missing at ${pagePath}`, errors)
  if (!fs.existsSync(pagePath)) return

  const html = fs.readFileSync(pagePath, 'utf8')
  assert(html.includes(`<meta property="og:image" content="${absoluteImage}" />`), `${label}: missing og:image`, errors)
  assert(html.includes(`<meta property="og:image:alt" content="${escapedAlt}" />`), `${label}: missing og:image:alt`, errors)
  assert(html.includes('<meta name="twitter:card" content="summary_large_image" />'), `${label}: twitter:card is not summary_large_image`, errors)
  assert(html.includes(`<meta name="twitter:image" content="${absoluteImage}" />`), `${label}: missing twitter:image`, errors)
  assert(html.includes(`<meta name="twitter:image:alt" content="${escapedAlt}" />`), `${label}: missing twitter:image:alt`, errors)
  assert(html.includes(`<img src="${coverImage}" alt="${escapedAlt}"`), `${label}: rendered hero/fallback img is missing cover alt`, errors)
  assert(html.includes(absoluteImage), `${label}: JSON-LD or social metadata does not reference cover image`, errors)

  const metaPath = assetPath.replace(/\.[^.]+$/, '.meta.json')
  if (fs.existsSync(metaPath)) {
    const sidecar = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    const webAsset = sidecar.web_asset || {}
    assert(html.includes('<meta property="og:image:type" content="image/webp" />'), `${label}: missing og:image:type`, errors)
    if (webAsset.width) assert(html.includes(`<meta property="og:image:width" content="${webAsset.width}" />`), `${label}: missing og:image:width`, errors)
    if (webAsset.height) assert(html.includes(`<meta property="og:image:height" content="${webAsset.height}" />`), `${label}: missing og:image:height`, errors)
  }
}

const errors = []
let checked = 0

for (const set of contentSets) {
  if (!fs.existsSync(set.dir)) continue
  for (const filename of fs.readdirSync(set.dir).filter((file) => file.endsWith('.md'))) {
    const filePath = path.join(set.dir, filename)
    const meta = parseFrontmatter(filePath)
    if (!meta?.coverImage) continue
    checked += 1
    verifyCover({ filePath, meta, route: set.route(meta) }, errors)
  }
}

if (errors.length) {
  console.error(`Image SEO verification failed (${errors.length} issues):`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`✓ image SEO: ${checked} covered pages verified`)
