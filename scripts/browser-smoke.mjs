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
  '/ru/blog/',
  '/ru/blog/ai-agents-s-chego-nachat/',
  '/ru/blog/claude-code-vs-codex-perehod/',
  '/ru/blog/ai-transformaciya-kompanii-obshchiy-kontekst-skills-gbrain/',
  '/ru/articles/',
  '/ru/articles/hermes-agent-vs-openclaw/',
  '/ru/articles/ai-reels-seo-pipeline-telegram-claude-code/',
  '/ru/articles/ai-tools-for-designers-design-engineering-agents/',
  '/articles/markdown-vs-html/',
  '/how-to-get-a-telegram-channel-subscribers-list-in-python/',
  '/claude-code-nastrojka-mcp-hooks-skills-2026/',
  '/topics/ai-agents/',
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
  { start: '/ru/blog/', selector: '.article-preview-hitarea, .blog-card-hitarea', label: 'blog first card' },
  { start: '/en/blog/', selector: '.article-preview-hitarea, .blog-card-hitarea', label: 'en blog first card' },
  { start: '/', selector: '.home-latest-section .article-preview-hitarea', label: 'home latest card' },
  { start: '/en/', selector: '.home-latest-section .article-preview-hitarea', label: 'en home latest card' },
  { start: '/', selector: '.page-header-bio a', label: 'home about link' },
]

const codeBlockChecks = [
  { route: '/claude-code-setup-mcp-hooks-skills-2026/', min: 1, label: 'imported article code blocks' },
  { route: '/ru/articles/ai-tools-for-designers-design-engineering-agents/', min: 1, label: 'article prompt code block' },
  { route: '/ru/blog/improve-codebase-architecture-prompt/', min: 1, label: 'generated blog code block' },
]

const thumbnailRoutes = new Set(['/', '/en/', '/ru/blog/', '/en/blog/', '/ru/articles/', '/en/articles/'])

const languageShellExpectations = {
  '/how-to-get-a-telegram-channel-subscribers-list-in-python/': {
    links: ['/en/', '/en/blog/', '/en/articles/', '/en/about/'],
    requiredText: ['Blog', 'Articles', 'About'],
    forbiddenText: ['Главная', 'Блог', 'Статьи', 'Обо мне'],
  },
  '/claude-code-nastrojka-mcp-hooks-skills-2026/': {
    links: ['/', '/ru/blog/', '/ru/articles/', '/about'],
    requiredText: ['Блог', 'Статьи', 'Обо мне'],
    forbiddenText: ['Home', 'Blog', 'Articles', 'About'],
  },
}

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
    'Ignoring Event: localhost',
  ].some((pattern) => text.includes(pattern))
}

async function loadPlaywright() {
  try {
    return await import('playwright-core')
  } catch (error) {
    throw new Error(`playwright-core is not available. Run npm install first. ${error.message}`)
  }
}

async function forceLoadImages(page, selector) {
  const images = page.locator(selector)
  const count = await images.count()
  for (let index = 0; index < count; index += 1) {
    const image = images.nth(index)
    await image.scrollIntoViewIfNeeded().catch(() => {})
    await image.evaluate((img) => {
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) return true
      return new Promise((resolve) => {
        const done = () => resolve(true)
        const fail = () => resolve(false)
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', fail, { once: true })
        setTimeout(fail, 2500)
      })
    }).catch(() => {})
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
      const checkCardImages = thumbnailRoutes.has(canonicalPath(route))
      if (checkCardImages) {
        await forceLoadImages(page, '.article-preview-thumb, .blog-card-thumb')
      }
      await forceLoadImages(page, '.article-hero-image img')
      const data = await page.evaluate(() => {
        const header = document.querySelector('.site-header')
        const footer = document.querySelector('.footer')
        const main = document.querySelector('main') || document.querySelector('article')
        const headerBox = header?.getBoundingClientRect()
        const mainBox = main?.getBoundingClientRect()
        const thumbnails = [...document.querySelectorAll('.article-preview-thumb, .blog-card-thumb')]
        const heroImages = [...document.querySelectorAll('.article-hero-image img')]
        const homeLatestHrefs = [...document.querySelectorAll('.home-latest-section .article-preview-hitarea')]
          .map((link) => link.getAttribute('href') || '')
          .filter(Boolean)
        const duplicateHomeLatestHrefs = homeLatestHrefs.filter((href, index) => homeLatestHrefs.indexOf(href) !== index)
        return {
          title: document.title,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
          robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
          bodyChars: document.body.innerText.trim().length,
          hasHeader: Boolean(header),
          hasFooter: Boolean(footer),
          headerText: header?.textContent || '',
          headerLinks: Array.from(header?.querySelectorAll('a') || []).map((link) => link.getAttribute('href') || ''),
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          headerMainOverlap: Boolean(headerBox && mainBox && headerBox.bottom > mainBox.top + 4),
          cardCount: document.querySelectorAll('.article-preview-card, .blog-card').length,
          thumbnailCount: thumbnails.length,
          brokenThumbnails: thumbnails.filter((img) => !img.currentSrc || img.naturalWidth <= 0 || img.naturalHeight <= 0).length,
          homeLatestCount: homeLatestHrefs.length,
          duplicateHomeLatestHrefs,
          heroImageCount: heroImages.length,
          brokenHeroImages: heroImages.filter((img) => !img.currentSrc || img.naturalWidth <= 0 || img.naturalHeight <= 0).length,
        }
      })
      results.push({
        viewport: viewport.name,
        route,
        expectCardThumbnails: thumbnailRoutes.has(canonicalPath(route)),
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

    for (const check of codeBlockChecks) {
      errors.length = 0
      await page.goto(`${baseUrl}${check.route}`, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForSelector('.code-block-copy', { timeout: 5000 }).catch(() => {})
      const data = await page.evaluate(() => ({
        title: document.title,
        canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
        robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') || '',
        bodyChars: document.body.innerText.trim().length,
        hasHeader: Boolean(document.querySelector('.site-header')),
        hasFooter: Boolean(document.querySelector('.footer')),
        overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        headerMainOverlap: false,
        codeBlocks: document.querySelectorAll('.code-block').length,
        copyButtons: document.querySelectorAll('.code-block-copy').length,
        tokenSpans: document.querySelectorAll('[class^="code-token-"]').length,
      }))
      results.push({
        viewport: viewport.name,
        route: `${check.route} code:${check.label}`,
        expectedCanonical: expectedCanonical(check.route),
        expectedCodeBlocks: check.min,
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
    if (result.expectCardThumbnails) {
      if (result.cardCount < 1) issues.push('missing cards')
      if (result.thumbnailCount !== result.cardCount) issues.push(`thumbnails ${result.thumbnailCount} != cards ${result.cardCount}`)
      if (result.brokenThumbnails) issues.push(`broken thumbnails ${result.brokenThumbnails}`)
    }
    if (['/', '/en/'].includes(canonicalPath(result.route))) {
      if (result.homeLatestCount !== 6) issues.push(`home latest cards ${result.homeLatestCount} != 6`)
      if (result.duplicateHomeLatestHrefs?.length) issues.push(`duplicate home latest hrefs ${result.duplicateHomeLatestHrefs.join(', ')}`)
    }
    if (result.heroImageCount && result.brokenHeroImages) issues.push(`broken hero images ${result.brokenHeroImages}`)
    if (result.expectedCodeBlocks && result.codeBlocks < result.expectedCodeBlocks) issues.push(`code blocks ${result.codeBlocks || 0} < ${result.expectedCodeBlocks}`)
    if (result.expectedCodeBlocks && result.copyButtons < result.expectedCodeBlocks) issues.push(`copy buttons ${result.copyButtons || 0} < ${result.expectedCodeBlocks}`)
    if (result.canonical !== expected) issues.push(`canonical ${result.canonical || '<empty>'} != ${expected}`)
    if (!['index, follow', 'noindex, follow'].includes(result.robots)) issues.push(`robots ${result.robots || '<empty>'}`)
    const shell = languageShellExpectations[canonicalPath(result.route)]
    if (shell) {
      for (const link of shell.links) {
        if (!result.headerLinks?.includes(link)) issues.push(`header missing ${link}`)
      }
      for (const text of shell.requiredText) {
        if (!result.headerText?.includes(text)) issues.push(`header missing ${text}`)
      }
      for (const text of shell.forbiddenText) {
        if (result.headerText?.includes(text)) issues.push(`header leaked ${text}`)
      }
    }
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
