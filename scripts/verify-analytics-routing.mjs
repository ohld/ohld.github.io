#!/usr/bin/env node
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'

const distDir = path.resolve(process.env.ANALYTICS_DIST_DIR || 'dist')
const host = process.env.ANALYTICS_DIST_HOST || '127.0.0.1'
const requestedPort = Number(process.env.ANALYTICS_DIST_PORT || 0)
const providedBaseUrl = process.env.ANALYTICS_BASE_URL || process.env.SMOKE_BASE_URL || ''
const siteUrl = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
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

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function canonicalPath(route) {
  const pathname = new URL(route, siteUrl).pathname
  if (pathname === '/') return '/'
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function safeResolve(urlPath) {
  const decoded = decodeURIComponent(urlPath)
  const normalized = path.posix.normalize(decoded)
  const resolved = path.resolve(distDir, normalized.replace(/^\/+/, ''))
  if (!resolved.startsWith(`${distDir}${path.sep}`) && resolved !== distDir) return null
  return resolved
}

function candidateFiles(urlPath) {
  const resolved = safeResolve(urlPath)
  if (!resolved) return []
  const candidates = [resolved]
  const ext = path.extname(resolved)
  if (!ext) candidates.push(path.join(resolved, 'index.html'))
  if (urlPath.endsWith('/')) candidates.unshift(path.join(resolved, 'index.html'))
  return candidates
}

function sendFile(res, reqMethod, filePath, statusCode = 200) {
  const ext = path.extname(filePath)
  const body = fs.readFileSync(filePath)
  res.writeHead(statusCode, {
    'content-type': contentTypes[ext] || 'application/octet-stream',
    'content-length': body.byteLength,
  })
  if (reqMethod === 'HEAD') {
    res.end()
    return
  }
  res.end(body)
}

function createStaticServer() {
  return http.createServer((req, res) => {
    try {
      const url = new URL(req.url || '/', `http://${req.headers.host || host}`)
      for (const candidate of candidateFiles(url.pathname)) {
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          sendFile(res, req.method || 'GET', candidate)
          return
        }
      }
      sendFile(res, req.method || 'GET', path.join(distDir, '404.html'), 404)
    } catch {
      res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
      res.end('Bad request')
    }
  })
}

function findExecutable() {
  return executableCandidates.find((candidate) => fs.existsSync(candidate))
}

async function loadPlaywright() {
  try {
    return await import('playwright-core')
  } catch (error) {
    throw new Error(`playwright-core is not available. Run npm install first. ${error.message}`)
  }
}

async function installAnalyticsMocks(context) {
  await context.route(/https:\/\/(?:www\.)?googletagmanager\.com\/gtag\/js.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
  })
  await context.route(/https:\/\/telegram\.org\/js\/telegram-web-app\.js.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
  })
  await context.route(/https:\/\/mc\.yandex\.(?:ru|com)\/metrika\/tag\.js.*/, async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })
  })
  await context.route(/https:\/\/(?:www|region1)\.google-analytics\.com\/g\/collect.*/, async (route) => {
    await route.fulfill({ status: 204, body: '' })
  })
  await context.route(/https:\/\/t\.me\/.*/, async (route) => {
    await route.fulfill({ status: 204, contentType: 'text/plain; charset=utf-8', body: '' })
  })

  await context.addInitScript(() => {
    const gaCalls = []
    const ymCalls = []
    const dataLayer = []
    const originalPush = dataLayer.push.bind(dataLayer)

    dataLayer.push = function pushWithCapture(...items) {
      for (const item of items) {
        try {
          gaCalls.push(Array.from(item))
        } catch {
          gaCalls.push([item])
        }
      }
      return originalPush(...items)
    }

    Object.defineProperty(window, 'dataLayer', {
      configurable: true,
      get() {
        return dataLayer
      },
      set(value) {
        if (Array.isArray(value) && value !== dataLayer) {
          dataLayer.length = 0
          dataLayer.push(...value)
        }
      },
    })

    window.__GA_TEST_CALLS__ = gaCalls
    window.__YM_TEST_CALLS__ = ymCalls
    window.ym = function ymMock() {
      ymCalls.push(Array.from(arguments))
    }
  })
}

async function getAnalyticsCalls(page) {
  return page.evaluate(() => ({
    ga: window.__GA_TEST_CALLS__ || [],
    ym: window.__YM_TEST_CALLS__ || [],
  }))
}

function gaPageViews(calls) {
  return calls.ga
    .filter((call) => call[0] === 'event' && call[1] === 'page_view')
    .map((call) => call[2] || {})
}

function ymHits(calls) {
  return calls.ym
    .filter((call) => call[1] === 'hit')
    .map((call) => ({ url: call[2], options: call[3] || {} }))
}

function ymInitCalls(calls) {
  return calls.ym
    .filter((call) => call[1] === 'init')
    .map((call) => call[2] || {})
}

function gaEventPayloads(calls, eventName) {
  return calls.ga
    .filter((call) => call[0] === 'event' && call[1] === eventName)
    .map((call) => call[2] || {})
}

function ymGoalPayloads(calls, eventName) {
  return calls.ym
    .filter((call) => call[1] === 'reachGoal' && call[2] === eventName)
    .map((call) => call[3] || {})
}

async function waitForPageView(page, pagePath, count = 1) {
  await page.waitForFunction(
    ({ expectedPath, expectedCount }) => {
      const calls = window.__GA_TEST_CALLS__ || []
      return calls.filter((call) => (
        call[0] === 'event'
        && call[1] === 'page_view'
        && call[2]
        && call[2].page_path === expectedPath
      )).length >= expectedCount
    },
    { expectedPath: pagePath, expectedCount: count },
    { timeout: 5000 },
  )
}

async function waitForMetrikaHit(page, pagePath, count = 1) {
  await page.waitForFunction(
    ({ expectedPath, expectedCount }) => {
      const calls = window.__YM_TEST_CALLS__ || []
      return calls.filter((call) => {
        if (call[1] !== 'hit' || typeof call[2] !== 'string') return false
        try {
          const pathname = new URL(call[2]).pathname
          return (pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`) === expectedPath
        } catch {
          return false
        }
      }).length >= expectedCount
    },
    { expectedPath: pagePath, expectedCount: count },
    { timeout: 5000 },
  )
}

async function waitForAnalyticsEvent(page, eventName, count = 1) {
  await page.waitForFunction(
    ({ expectedEvent, expectedCount }) => {
      const gaCalls = window.__GA_TEST_CALLS__ || []
      const ymCalls = window.__YM_TEST_CALLS__ || []
      const gaCount = gaCalls.filter((call) => call[0] === 'event' && call[1] === expectedEvent).length
      const ymCount = ymCalls.filter((call) => call[1] === 'reachGoal' && call[2] === expectedEvent).length
      return gaCount >= expectedCount && ymCount >= expectedCount
    },
    { expectedEvent: eventName, expectedCount: count },
    { timeout: 5000 },
  )
}

async function clickHeaderLink(page, href, expectedPath) {
  await page.locator(`.site-header-link[href="${href}"]`).first().click()
  await page.waitForFunction(
    (path) => window.location.pathname.replace(/\/+$/, '') === path.replace(/\/+$/, ''),
    expectedPath,
    { timeout: 5000 },
  )
  await waitForPageView(page, canonicalPath(expectedPath))
  await waitForMetrikaHit(page, canonicalPath(expectedPath))
}

function assertPageViewCounts(calls, expectedPaths) {
  const views = gaPageViews(calls)
  for (const expectedPath of expectedPaths) {
    const count = views.filter((view) => view.page_path === expectedPath).length
    assert(count === 1, `${expectedPath}: expected exactly one GA4 page_view, got ${count}`)
  }
}

function assertMetrikaHitCounts(calls, expectedPaths) {
  const hits = ymHits(calls)
  for (const expectedPath of expectedPaths) {
    const count = hits.filter((hit) => canonicalPath(hit.url) === expectedPath).length
    assert(count === 1, `${expectedPath}: expected exactly one Metrika hit, got ${count}`)
  }
}

function assertPageViewFirstForPath(calls, expectedPath) {
  const eventsForPath = calls.ga.filter((call) => call[0] === 'event' && call[2]?.page_path === expectedPath)
  assert(eventsForPath.length > 0, `${expectedPath}: no GA events found`)
  assert(eventsForPath[0][1] === 'page_view', `${expectedPath}: first GA event was ${eventsForPath[0][1]}, not page_view`)
}

function assertSafeLocation(view, expectedPath) {
  assert(view.page_title && view.page_title.trim(), `${expectedPath}: missing page_title`)
  assert(view.page_location?.startsWith(`${siteUrl}${expectedPath}`), `${expectedPath}: bad page_location ${view.page_location}`)
  assert(!view.page_location.includes('tgWebApp'), `${expectedPath}: page_location leaked Telegram launch params`)
  assert(!view.page_location.includes('#'), `${expectedPath}: page_location should not include hash`)
}

function assertSharedEventPayload(payload, eventName, expected) {
  for (const [key, value] of Object.entries(expected)) {
    assert(payload[key] === value, `${eventName}: expected ${key}=${value}, got ${payload[key]}`)
  }
}

async function assertHeaderCtaTracking(page) {
  const href = await page.locator('.site-header-cta').first().getAttribute('href')
  assert(href === 'https://t.me/danokhlopkov?direct', `header CTA href mismatch: ${href}`)

  const popup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null)
  await page.locator('.site-header-cta').first().click({ noWaitAfter: true })
  const openedPopup = await popup
  if (openedPopup) await openedPopup.close()
  await waitForAnalyticsEvent(page, 'lead_contact_click')

  const calls = await getAnalyticsCalls(page)
  const expected = {
    event_category: 'about_header',
    event_label: 'telegram_direct',
    click_text: 'telegram_direct',
    cta_id: 'telegram_direct',
    link_url: 'https://t.me/danokhlopkov?direct',
    link_domain: 't.me',
  }
  const gaPayload = gaEventPayloads(calls, 'lead_contact_click').at(-1)
  const ymPayload = ymGoalPayloads(calls, 'lead_contact_click').at(-1)
  assert(gaPayload, 'header CTA: missing GA4 lead_contact_click')
  assert(ymPayload, 'header CTA: missing Metrika lead_contact_click goal')
  assertSharedEventPayload(gaPayload, 'GA4 lead_contact_click', expected)
  assertSharedEventPayload(ymPayload, 'Metrika lead_contact_click', expected)
}

async function assertBackButtonTracking(context, baseUrl) {
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.goto(`${baseUrl}/ru/articles/hermes-agent-vs-openclaw/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await page.locator('.back-nav').first().click()
    await waitForAnalyticsEvent(page, 'navigation_back_click')
    await page.waitForFunction(() => window.location.pathname === '/ru/articles/', null, { timeout: 5000 })

    const calls = await getAnalyticsCalls(page)
    const expected = {
      event_category: 'navigation',
      event_label: 'back',
      click_text: 'back',
      destination: '/ru/articles/',
      navigation_mode: 'fallback',
    }
    const gaPayload = gaEventPayloads(calls, 'navigation_back_click').at(-1)
    const ymPayload = ymGoalPayloads(calls, 'navigation_back_click').at(-1)
    assert(gaPayload, 'back button: missing GA4 navigation_back_click')
    assert(ymPayload, 'back button: missing Metrika navigation_back_click goal')
    assertSharedEventPayload(gaPayload, 'GA4 navigation_back_click', expected)
    assertSharedEventPayload(ymPayload, 'Metrika navigation_back_click', expected)
  } finally {
    await page.close()
  }
}

async function run(baseUrl) {
  const { chromium } = await loadPlaywright()
  const executablePath = findExecutable()
  const launchOptions = executablePath ? { executablePath } : {}
  const browser = await chromium.launch({ headless: true, ...launchOptions })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await installAnalyticsMocks(context)

  const page = await context.newPage()
  const expectedPaths = ['/', '/blog/', '/articles/', '/about/']

  await page.goto(`${baseUrl}/?utm_source=codex&tgWebAppData=secret#tgWebAppData=secret`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  })
  await waitForPageView(page, '/')
  await waitForMetrikaHit(page, '/')

  await clickHeaderLink(page, '/blog', '/blog')
  await clickHeaderLink(page, '/articles', '/articles')
  await clickHeaderLink(page, '/about', '/about')
  await page.waitForTimeout(250)

  const calls = await getAnalyticsCalls(page)
  const initCalls = ymInitCalls(calls)
  assert(initCalls.some((init) => init.defer === true), 'Metrika init should use defer:true for SPA manual hits')

  assertPageViewCounts(calls, expectedPaths)
  assertMetrikaHitCounts(calls, expectedPaths)
  for (const expectedPath of expectedPaths) assertPageViewFirstForPath(calls, expectedPath)

  const views = gaPageViews(calls)
  for (const expectedPath of expectedPaths) {
    const view = views.find((item) => item.page_path === expectedPath)
    assertSafeLocation(view, expectedPath)
  }
  assert(views[0].page_location.includes('utm_source=codex'), '/: attribution query should be preserved')

  const hits = ymHits(calls)
  for (const hit of hits) {
    assert(!hit.url.includes('tgWebApp'), `Metrika hit leaked Telegram launch params: ${hit.url}`)
    assert(!hit.url.includes('#'), `Metrika hit should not include hash: ${hit.url}`)
    assert(hit.options.title && hit.options.title.trim(), `Metrika hit missing title for ${hit.url}`)
  }

  await assertHeaderCtaTracking(page)
  await assertBackButtonTracking(context, baseUrl)

  await browser.close()
  console.log(`✓ analytics routing and click goals (${expectedPaths.join(', ')})`)
}

async function main() {
  if (providedBaseUrl) {
    await run(providedBaseUrl.replace(/\/+$/, ''))
    return
  }

  assert(fs.existsSync(path.join(distDir, 'index.html')), `${distDir}: missing index.html; run npm run build first`)
  const server = createStaticServer()
  await new Promise((resolve) => server.listen(requestedPort, host, resolve))
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : requestedPort
  const baseUrl = `http://${host}:${port}`

  try {
    await run(baseUrl)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
