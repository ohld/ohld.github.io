#!/usr/bin/env node
import fs from 'node:fs'

const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4174').replace(/\/+$/, '')
const siteUrl = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const routeList = (process.env.SMOKE_ROUTES || [
  '/',
  '/en/',
  '/en/blog/',
  '/en/articles/',
  '/en/about/',
  '/blog/',
  '/blog/ai-agents-s-chego-nachat/',
  '/blog/claude-code-vs-codex-perehod/',
  '/blog/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain/',
  '/articles/',
  '/articles/ai-tools-for-designers-design-engineering-agents/',
  '/articles/markdown-vs-html/',
  '/about/',
].join(','))
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean)

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]

const clickChecks = [
  { start: '/blog/', selector: '.blog-card', label: 'blog first card' },
  { start: '/en/blog/', selector: '.blog-card', label: 'en blog first card' },
  { start: '/', selector: '#home-blog-title + .home-card-list .home-list-link', label: 'home latest blog' },
]

const executableCandidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean)

function canonicalPath(route) {
  if (route === '/') return '/'
  return route.endsWith('/') ? route : `${route}/`
}

function expectedCanonical(route) {
  return `${siteUrl}${canonicalPath(route)}`
}

function expectedCanonicalForUrl(url) {
  const parsed = new URL(url, baseUrl)
  return `${siteUrl}${canonicalPath(parsed.pathname)}`
}

function findExecutable() {
  return executableCandidates.find((candidate) => fs.existsSync(candidate))
}

function shouldIgnoreConsoleMessage(text) {
  return [
    'Failed to load resource: net::ERR_CONNECTION_CLOSED',
    'Failed to load resource: net::ERR_BLOCKED_BY_CLIENT',
    'Failed to load resource: net::ERR_ABORTED',
  ].some((pattern) => text.includes(pattern))
}

async function loadPlaywright() {
  try {
    return await import('playwright-core')
  } catch (error) {
    throw new Error(`playwright-core is not available. Run npm install first. ${error.message}`)
  }
}

async function main() {
  const { chromium } = await loadPlaywright()
  const executablePath = findExecutable()
  const launchOptions = executablePath ? { executablePath } : {}
  const browser = await chromium.launch({ headless: true, ...launchOptions })
  const results = []

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport })
    const errors = []
    page.on('console', (message) => {
      const text = message.text()
      if (['error', 'warning'].includes(message.type()) && !shouldIgnoreConsoleMessage(text)) {
        errors.push(`${message.type()}: ${text}`)
      }
    })
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

    for (const route of routeList) {
      errors.length = 0
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForFunction(() => {
        const bodyChars = document.body.innerText.trim().length
        return Boolean(document.querySelector('.footer')) && bodyChars >= 500
      }, { timeout: 4000 }).catch(() => {})
      const data = await page.evaluate(() => {
        const header = document.querySelector('.site-header')
        const footer = document.querySelector('.footer')
        const main = document.querySelector('main') || document.querySelector('article')
        const headerBox = header?.getBoundingClientRect()
        const mainBox = main?.getBoundingClientRect()
        return {
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
          robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
          bodyChars: document.body.innerText.trim().length,
          hasHeader: Boolean(header),
          hasFooter: Boolean(footer),
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          headerMainOverlap: Boolean(headerBox && mainBox && headerBox.bottom > mainBox.top + 4),
        }
      })
      results.push({
        viewport: viewport.name,
        route,
        status: response?.status(),
        errors: [...errors],
        ...data,
      })
    }

    for (const check of clickChecks) {
      errors.length = 0
      await page.goto(`${baseUrl}${check.start}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      const link = page.locator(check.selector).first()
      const href = await link.getAttribute('href')
      await link.click()
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
      await page.waitForFunction(() => {
        const bodyChars = document.body.innerText.trim().length
        return Boolean(document.querySelector('.footer')) && bodyChars >= 500
      }, { timeout: 4000 }).catch(() => {})
      const data = await page.evaluate(() => ({
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
        bodyChars: document.body.innerText.trim().length,
        hasHeader: Boolean(document.querySelector('.site-header')),
        hasFooter: Boolean(document.querySelector('.footer')),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        headerMainOverlap: false,
      }))
      results.push({
        viewport: viewport.name,
        route: `${check.start} click:${check.label}`,
        expectedCanonical: href ? expectedCanonicalForUrl(href) : '',
        status: 200,
        errors: [...errors],
        ...data,
      })
    }

    await page.close()
  }

  await browser.close()

  let failed = false
  for (const result of results) {
    const issues = []
    const expected = result.expectedCanonical || expectedCanonical(result.route)
    if (result.status !== 200) issues.push(`status ${result.status}`)
    if (!result.hasHeader) issues.push('missing header')
    if (!result.hasFooter) issues.push('missing footer')
    if (result.bodyChars < 500) issues.push(`short body ${result.bodyChars}`)
    if (result.overflowX > 2) issues.push(`horizontal overflow ${result.overflowX}`)
    if (result.headerMainOverlap) issues.push('header/main overlap')
    if (result.canonical !== expected) issues.push(`canonical ${result.canonical || '<empty>'} != ${expected}`)
    if (!['index, follow', 'noindex, follow'].includes(result.robots)) issues.push(`robots ${result.robots || '<empty>'}`)
    if (result.errors.length) issues.push(result.errors.join('; '))
    if (issues.length) failed = true
    console.log(`${issues.length ? 'FAIL' : 'OK'} ${result.viewport} ${result.route} :: ${result.title} :: ${issues.join(' | ')}`)
  }

  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
