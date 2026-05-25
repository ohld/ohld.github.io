#!/usr/bin/env node
import fs from 'node:fs'

const legacyPagesPath = process.env.LEGACY_PAGES_PATH || 'content/legacy-pages/pages.json'
const baseUrl = (process.env.LEGACY_LIVE_BASE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const concurrency = Number.parseInt(process.env.LEGACY_DRIFT_CONCURRENCY || '6', 10)
const timeoutMs = Number.parseInt(process.env.LEGACY_DRIFT_TIMEOUT_MS || '12000', 10)
const verbose = process.env.LEGACY_DRIFT_VERBOSE === '1'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function decodeHtml(s = '') {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function normalizeText(s = '') {
  return decodeHtml(s).replace(/\s+/g, ' ').trim()
}

function readTitle(html) {
  return normalizeText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
}

async function fetchWithTimeout(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'okhlopkov-legacy-drift-check/1.0' },
    })
  } finally {
    clearTimeout(timer)
  }
}

async function checkPage(page) {
  const url = `${baseUrl}${page.path}`
  const res = await fetchWithTimeout(url)
  if (res.status !== 200) {
    return {
      path: page.path,
      ok: false,
      message: `expected live 200, got ${res.status}`,
    }
  }

  const html = await res.text()
  const liveTitle = readTitle(html)
  const expectedTitle = normalizeText(page.title || '')
  if (expectedTitle && liveTitle !== expectedTitle) {
    return {
      path: page.path,
      ok: false,
      message: `title changed: expected "${expectedTitle}", got "${liveTitle}"`,
    }
  }

  return {
    path: page.path,
    ok: true,
    message: 'ok',
  }
}

async function mapPool(items, workerCount, fn) {
  const results = []
  let index = 0

  async function worker() {
    while (index < items.length) {
      const itemIndex = index
      index += 1
      try {
        results[itemIndex] = await fn(items[itemIndex])
      } catch (error) {
        results[itemIndex] = {
          path: items[itemIndex]?.path || `#${itemIndex}`,
          ok: false,
          message: error.name === 'AbortError' ? `timed out after ${timeoutMs}ms` : error.message,
        }
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

async function main() {
  assert(fs.existsSync(legacyPagesPath), `${legacyPagesPath}: missing legacy snapshot`)
  const pages = JSON.parse(fs.readFileSync(legacyPagesPath, 'utf8'))
  assert(Array.isArray(pages) && pages.length > 0, `${legacyPagesPath}: no legacy pages loaded`)

  console.log(`Checking live legacy drift for ${pages.length} pages at ${baseUrl}`)
  const results = await mapPool(pages, Math.max(1, concurrency), checkPage)
  const failures = results.filter((result) => !result.ok)

  if (verbose) {
    for (const result of results) {
      console.log(`${result.ok ? '✓' : '✗'} ${result.path}: ${result.message}`)
    }
  }

  if (failures.length > 0) {
    console.error(`Legacy live drift check failed (${failures.length}/${pages.length})`)
    for (const failure of failures.slice(0, 30)) {
      console.error(`- ${failure.path}: ${failure.message}`)
    }
    if (failures.length > 30) {
      console.error(`... ${failures.length - 30} more failures`)
    }
    process.exit(1)
  }

  console.log(`Legacy live drift check passed (${pages.length} pages)`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
