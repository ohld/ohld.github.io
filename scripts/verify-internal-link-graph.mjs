#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const defaultDistDir = path.resolve(process.env.VERIFY_INTERNAL_LINKS_DIST_DIR || process.env.VERIFY_DIST_DIR || 'dist')
const defaultSiteUrl = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function decodeHtml(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function decodeXml(s = '') {
  return decodeHtml(s)
}

function parseAttrs(source) {
  const attrs = {}
  for (const match of source.matchAll(/([:\w-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    attrs[match[1].toLowerCase()] = decodeHtml(match[3] ?? match[4] ?? match[5] ?? '')
  }
  return attrs
}

function normalizePagePath(pathname) {
  const cleanPath = pathname.split('?')[0].split('#')[0] || '/'
  const withoutIndex = cleanPath.replace(/\/index\.html$/i, '/')
  if (withoutIndex === '/') return '/'
  return withoutIndex.endsWith('/') ? withoutIndex : `${withoutIndex}/`
}

function isAssetPath(pathname) {
  return pathname.startsWith('/assets/')
    || pathname.startsWith('/static/')
    || /\.(?:avif|css|csv|gif|ico|jpe?g|js|json|map|md|mjs|mp3|mp4|pdf|png|svg|txt|webm|webp|woff2?|xml|zip)$/i.test(pathname)
}

function findIndexFiles(dir) {
  const files = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...findIndexFiles(fullPath))
      continue
    }
    if (entry.isFile() && entry.name === 'index.html') files.push(fullPath)
  }
  return files.sort()
}

function sourcePathFromIndexFile(file, distDir) {
  const relative = path.relative(distDir, file)
  const directory = path.dirname(relative)
  if (directory === '.') return '/'
  return normalizePagePath(`/${directory.split(path.sep).join('/')}/`)
}

function anchorScope(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]
  if (body !== undefined) return body
  return html.match(/<div\b[^>]*\bid=["']root["'][^>]*>([\s\S]*?)<\/div>/i)?.[1] || html
}

function normalizeInternalHref(href, sourcePath, site) {
  const raw = decodeHtml(href).trim()
  if (!raw || raw.startsWith('#')) return null
  if (/^(?:blob|data|javascript|mailto|sms|tel):/i.test(raw)) return null

  let url
  try {
    url = new URL(raw, `${site.url}${sourcePath}`)
  } catch {
    return null
  }

  if (url.origin !== site.origin) return null
  if (isAssetPath(url.pathname)) return null
  return normalizePagePath(url.pathname)
}

function loadSitemap(distDir, siteUrl) {
  const sitemapPath = path.join(distDir, 'sitemap.xml')
  assert(fs.existsSync(sitemapPath), `${sitemapPath}: missing; run a build before verifying internal links`)
  const xml = fs.readFileSync(sitemapPath, 'utf8')
  const site = new URL(siteUrl)
  const paths = []
  const locByPath = new Map()

  for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)) {
    const loc = decodeXml(match[1].trim())
    let url
    try {
      url = new URL(loc, siteUrl)
    } catch {
      throw new Error(`/sitemap.xml: invalid <loc> ${loc}`)
    }
    assert(url.origin === site.origin, `/sitemap.xml: unexpected origin ${loc}`)
    const normalizedPath = normalizePagePath(url.pathname)
    assert(!locByPath.has(normalizedPath), `/sitemap.xml: duplicate route ${normalizedPath}`)
    paths.push(normalizedPath)
    locByPath.set(normalizedPath, loc)
  }

  assert(paths.length > 0, '/sitemap.xml: no <loc> entries found')
  return { paths, locByPath }
}

export function verifyInternalLinkGraph({
  distDir = defaultDistDir,
  siteUrl = defaultSiteUrl,
} = {}) {
  const resolvedDistDir = path.resolve(distDir)
  const site = {
    url: siteUrl.replace(/\/+$/, ''),
    origin: new URL(siteUrl).origin,
  }
  assert(fs.existsSync(resolvedDistDir), `${resolvedDistDir}: dist directory missing; run a build before verifying internal links`)

  const { paths: sitemapPaths, locByPath } = loadSitemap(resolvedDistDir, site.url)
  const sitemapPathSet = new Set(sitemapPaths)
  const inboundByPath = new Map(sitemapPaths.map((sitemapPath) => [sitemapPath, new Set()]))
  const indexFiles = findIndexFiles(resolvedDistDir)
  assert(indexFiles.length > 0, `${resolvedDistDir}: no index.html files found`)

  let staticEdges = 0
  for (const file of indexFiles) {
    const sourcePath = sourcePathFromIndexFile(file, resolvedDistDir)
    const html = fs.readFileSync(file, 'utf8')
    for (const match of anchorScope(html).matchAll(/<a\b([^>]*)>/gi)) {
      const attrs = parseAttrs(match[1])
      if (!attrs.href) continue
      const relTokens = (attrs.rel || '').toLowerCase().split(/\s+/).filter(Boolean)
      if (relTokens.includes('canonical') || attrs.hreflang) continue
      const targetPath = normalizeInternalHref(attrs.href, sourcePath, site)
      if (!targetPath || !sitemapPathSet.has(targetPath) || targetPath === sourcePath) continue
      const inboundSources = inboundByPath.get(targetPath)
      if (!inboundSources.has(sourcePath)) staticEdges += 1
      inboundSources.add(sourcePath)
    }
  }

  const orphanPaths = sitemapPaths.filter((sitemapPath) => sitemapPath !== '/' && inboundByPath.get(sitemapPath).size === 0)
  assert(
    orphanPaths.length === 0,
    `Internal link graph has sitemap URLs with zero inbound static links:\n${orphanPaths.map((sitemapPath) => `- ${locByPath.get(sitemapPath)}`).join('\n')}`,
  )

  console.log(`✓ internal link graph (${sitemapPaths.length} sitemap URLs, ${indexFiles.length} HTML pages, ${staticEdges} inbound static edges)`)
  return {
    sitemapUrls: sitemapPaths.length,
    htmlPages: indexFiles.length,
    inboundStaticEdges: staticEdges,
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    verifyInternalLinkGraph()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
