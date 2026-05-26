#!/usr/bin/env node
import fs from 'node:fs'

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '16f3585acc2f41a2b4ff657222850145'
const host = process.env.INDEXNOW_HOST || 'okhlopkov.com'
const siteUrl = (process.env.SITE_URL || `https://${host}`).replace(/\/+$/, '')
const keyLocation = process.env.INDEXNOW_KEY_LOCATION || `${siteUrl}/${INDEXNOW_KEY}.txt`
const endpoint = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow'
const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL || `${siteUrl}/sitemap.xml`
const sitemapFile = process.env.INDEXNOW_SITEMAP_FILE || ''
const dryRun = process.env.INDEXNOW_DRY_RUN === '1'
const skipKeyCheck = process.env.INDEXNOW_SKIP_KEY_CHECK === '1'
const maxUrlsPerRequest = Number(process.env.INDEXNOW_BATCH_SIZE || 10000)

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function xmlDecode(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function chunk(items, size) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

async function readSitemap() {
  if (sitemapFile) {
    assert(fs.existsSync(sitemapFile), `${sitemapFile}: sitemap file not found`)
    return fs.readFileSync(sitemapFile, 'utf8')
  }

  const res = await fetch(sitemapUrl, {
    headers: { 'user-agent': 'okhlopkov-indexnow-submit/1.0' },
  })
  assert(res.ok, `${sitemapUrl}: expected 200, got ${res.status}`)
  return res.text()
}

function urlsFromSitemap(xml) {
  const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)]
    .map((match) => xmlDecode(match[1].trim()))
    .filter(Boolean)

  const seen = new Set()
  return urls.filter((url) => {
    if (seen.has(url)) return false
    seen.add(url)
    const parsed = new URL(url)
    return parsed.hostname === host
  })
}

async function verifyKeyFile() {
  if (dryRun || skipKeyCheck) return
  const res = await fetch(keyLocation, {
    headers: { 'user-agent': 'okhlopkov-indexnow-submit/1.0' },
  })
  assert(res.ok, `${keyLocation}: expected 200, got ${res.status}`)
  const body = (await res.text()).trim()
  assert(body === INDEXNOW_KEY, `${keyLocation}: key file content mismatch`)
}

async function submitUrls(urlList) {
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation,
    urlList,
  }

  if (dryRun) {
    console.log(`[dry-run] would submit ${urlList.length} URLs to ${endpoint}`)
    return
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'user-agent': 'okhlopkov-indexnow-submit/1.0',
    },
    body: JSON.stringify(body),
  })
  const responseText = await res.text()
  assert(
    res.status === 200 || res.status === 202,
    `IndexNow submit failed: ${res.status} ${res.statusText}${responseText ? ` - ${responseText}` : ''}`,
  )
  console.log(`Submitted ${urlList.length} URLs to IndexNow (${res.status})`)
}

async function main() {
  assert(/^[A-Za-z0-9-]{8,128}$/.test(INDEXNOW_KEY), 'INDEXNOW_KEY must be 8-128 alphanumeric/dash characters')
  assert(maxUrlsPerRequest > 0 && maxUrlsPerRequest <= 10000, 'INDEXNOW_BATCH_SIZE must be between 1 and 10000')

  const sitemap = await readSitemap()
  const urls = urlsFromSitemap(sitemap)
  assert(urls.length > 0, 'No submit-ready URLs found in sitemap')

  await verifyKeyFile()
  const batches = chunk(urls, maxUrlsPerRequest)
  for (const batch of batches) {
    await submitUrls(batch)
  }
  console.log(`IndexNow complete: ${urls.length} URLs from ${sitemapFile || sitemapUrl}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
