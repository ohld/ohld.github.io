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

async function waitForGaEvent(page, eventName, expected = {}) {
  await page.waitForFunction(
    ({ expectedEvent, expectedParams }) => {
      const calls = window.__GA_TEST_CALLS__ || []
      return calls.some((call) => (
        call[0] === 'event'
        && call[1] === expectedEvent
        && Object.entries(expectedParams).every(([key, value]) => call[2]?.[key] === value)
      ))
    },
    { expectedEvent: eventName, expectedParams: expected },
    { timeout: 8000 },
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
  assert(href === 'https://t.me/+klIZiMe4w30zZTgy', `header CTA href mismatch: ${href}`)

  const popup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null)
  await page.locator('.site-header-cta').first().click({ noWaitAfter: true })
  const openedPopup = await popup
  if (openedPopup) await openedPopup.close()
  await waitForAnalyticsEvent(page, 'lead_contact_click')

  const calls = await getAnalyticsCalls(page)
  const expected = {
    event_category: 'about_header',
    event_label: 'telegram_channel_invite',
    click_text: 'telegram_channel_invite',
    cta_id: 'telegram_channel_invite',
    link_url: 'https://t.me/+klIZiMe4w30zZTgy',
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

async function assertArticleTelegramSubscribeTracking(context, baseUrl) {
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.goto(`${baseUrl}/web-scraping-ai-agents-2026/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    const cta = page.locator('[data-cta-id="telegram_web_scraping_ai_agents"]').first()
    await cta.waitFor({ timeout: 5000 })
    await page.evaluate(() => {
      const link = document.querySelector('[data-cta-id="telegram_web_scraping_ai_agents"]')
      link?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    })
    await waitForAnalyticsEvent(page, 'telegram_subscribe_click')

    const calls = await getAnalyticsCalls(page)
    const expected = {
      event_category: 'subscribe',
      event_label: 'telegram_web_scraping_ai_agents',
      cta_id: 'telegram_web_scraping_ai_agents',
      link_url: 'https://t.me/+klIZiMe4w30zZTgy',
      link_domain: 't.me',
      experiment_id: 'seo_ctr_web_scraping_ai_agents_2026_06_19',
      cluster_id: 'web_scraping_ai_agents',
      experiment_variant: 'title_meta_stack_answer_faq_related_cta_v1',
    }
    const gaPayload = gaEventPayloads(calls, 'telegram_subscribe_click').at(-1)
    const ymPayload = ymGoalPayloads(calls, 'telegram_subscribe_click').at(-1)
    assert(gaPayload, 'article Telegram CTA: missing GA4 telegram_subscribe_click')
    assert(ymPayload, 'article Telegram CTA: missing Metrika telegram_subscribe_click goal')
    assertSharedEventPayload(gaPayload, 'GA4 telegram_subscribe_click', expected)
    assertSharedEventPayload(ymPayload, 'Metrika telegram_subscribe_click', expected)
  } finally {
    await page.close()
  }
}

async function assertTelegramStoryViewerSourceTracking(context, baseUrl) {
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.goto(`${baseUrl}/how-to-watch-telegram-stories-from-python/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await waitForPageView(page, '/how-to-watch-telegram-stories-from-python/')
    await page.locator('.code-block-copy').first().waitFor({ timeout: 5000 })
    const source = page.locator('a[href^="https://core.telegram.org/method/stories.readStories"]').first()
    await source.waitFor({ timeout: 5000 })
    const popup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null)
    await source.evaluate((link) => {
      link.setAttribute('target', '_blank')
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))
    })
    const openedPopup = await popup
    if (openedPopup) await openedPopup.close()
    await waitForAnalyticsEvent(page, 'source_link_click')

    const calls = await getAnalyticsCalls(page)
    const expected = {
      link_domain: 'core.telegram.org',
      experiment_id: 'seo_exact_query_telegram_story_viewer_2026_08_15',
      cluster_id: 'telegram_stories_python',
      experiment_variant: 'exact_query_intent_clarifier_official_sources_v2',
      experiment_started_at: '2026-08-15',
    }
    const gaPayload = gaEventPayloads(calls, 'source_link_click').at(-1)
    const ymPayload = ymGoalPayloads(calls, 'source_link_click').at(-1)
    assert(gaPayload, 'Telegram Stories source: missing GA4 source_link_click')
    assert(ymPayload, 'Telegram Stories source: missing Metrika source_link_click goal')
    assertSharedEventPayload(gaPayload, 'GA4 Telegram Stories source_link_click', expected)
    assertSharedEventPayload(ymPayload, 'Metrika Telegram Stories source_link_click', expected)
  } finally {
    await page.close()
  }
}

async function assertBotRevolutionReadingTracking(context, baseUrl) {
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  await page.addInitScript(() => {
    window.__COPIED_TEXT__ = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('clipboard unavailable in test')) },
    })
    document.execCommand = (command) => {
      if (command !== 'copy') return false
      window.__COPIED_TEXT__ = document.activeElement?.value || ''
      return true
    }
  })
  await page.clock.install()
  try {
    await page.goto(`${baseUrl}/ru/blog/bot-revolution/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await waitForPageView(page, '/ru/blog/bot-revolution/')
    await waitForGaEvent(page, 'article_section_view', { section_id: 'hook' })

    const heroImage = page.locator('.bot-revolution-hero-art img')
    const srcset = await heroImage.getAttribute('srcset')
    assert(srcset?.includes('bot-weather-map-640.webp 640w'), 'Bot Revolution hero: missing responsive 640w source')
    assert(srcset?.includes('bot-weather-map-1024.webp 1024w'), 'Bot Revolution hero: missing responsive 1024w source')

    const contextSection = page.locator('[data-analytics-section="context_limit"]')
    await contextSection.scrollIntoViewIfNeeded()
    await waitForGaEvent(page, 'article_section_view', { section_id: 'context_limit' })
    await page.clock.runFor(5200)
    await waitForGaEvent(page, 'article_section_read', { section_id: 'context_limit' })

    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
    })
    await page.clock.runFor(1100)
    const bfcacheCalls = await getAnalyticsCalls(page)
    assert(gaEventPayloads(bfcacheCalls, 'article_read_summary').length === 0, 'Bot Revolution: BFCache pagehide finalized the reading session')

    await page.clock.runFor(10_000)
    await waitForAnalyticsEvent(page, 'article_engaged')
    const incompleteCalls = await getAnalyticsCalls(page)
    assert(gaEventPayloads(incompleteCalls, 'article_read_complete').length === 0, 'Bot Revolution: completed before conclusion was reached')

    const promptButton = page.locator('.bot-revolution-prompt-actions button')
    await promptButton.scrollIntoViewIfNeeded()
    await promptButton.click()
    await waitForAnalyticsEvent(page, 'code_copy')

    assert(await promptButton.textContent() === 'Скопировано', 'Bot Revolution prompt: missing copied state')
    assert(
      await page.evaluate(() => window.__COPIED_TEXT__) === 'Based on what you know about me, how would you set up GrokBot? Which bots should we set up?',
      'Bot Revolution prompt: fallback copied the wrong text',
    )
    await page.clock.runFor(1900)
    assert(await promptButton.textContent() === 'Копировать', 'Bot Revolution prompt: copied state did not reset')

    const sourceLink = page.locator('a[href="https://docs.x.ai/grok-bot/chat-and-collaboration"]').first()
    const sourcePopup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null)
    await sourceLink.click({ noWaitAfter: true })
    const openedSourcePopup = await sourcePopup
    if (openedSourcePopup) await openedSourcePopup.close()
    await waitForAnalyticsEvent(page, 'source_link_click')

    const conclusion = page.locator('[data-analytics-section="conclusion"]')
    await conclusion.scrollIntoViewIfNeeded()
    await waitForGaEvent(page, 'article_section_view', { section_id: 'conclusion' })
    await page.clock.runFor(15_000)
    await waitForAnalyticsEvent(page, 'article_read_complete')

    const channel = page.locator('[data-cta-id="bot_revolution_channel"]')
    const channelPopup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null)
    await channel.click({ noWaitAfter: true })
    const openedChannelPopup = await channelPopup
    if (openedChannelPopup) await openedChannelPopup.close()
    await waitForAnalyticsEvent(page, 'telegram_subscribe_click')

    const chat = page.locator('[data-cta-id="bot_revolution_chat"]')
    const chatPopup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null)
    await chat.click({ noWaitAfter: true })
    const openedChatPopup = await chatPopup
    if (openedChatPopup) await openedChatPopup.close()
    await waitForAnalyticsEvent(page, 'article_cta_click')

    await page.locator('.language-switcher a[href="/en/blog/bot-revolution/"]').click()
    await page.waitForFunction(() => window.location.pathname === '/en/blog/bot-revolution/', null, { timeout: 5000 })
    await waitForGaEvent(page, 'article_read_summary', { exit_reason: 'route_change' })
    await waitForGaEvent(page, 'article_internal_click', { destination: '/en/blog/bot-revolution/' })

    const calls = await getAnalyticsCalls(page)
    const sectionView = gaEventPayloads(calls, 'article_section_view')
      .find((payload) => payload.section_id === 'context_limit')
    const sectionRead = gaEventPayloads(calls, 'article_section_read')
      .find((payload) => payload.section_id === 'context_limit')
    const sectionAttention = gaEventPayloads(calls, 'article_section_attention')
      .find((payload) => payload.section_id === 'context_limit')
    const summary = gaEventPayloads(calls, 'article_read_summary').at(-1)
    const copyGa = gaEventPayloads(calls, 'code_copy').at(-1)
    const copyYm = ymGoalPayloads(calls, 'code_copy').at(-1)
    const botMetrikaInit = ymInitCalls(calls).at(-1)

    assert(sectionView?.article_slug === 'bot-revolution', 'Bot Revolution section view: missing article_slug')
    assert(sectionView?.section_count === 10, `Bot Revolution section view: expected 10 sections, got ${sectionView?.section_count}`)
    assert(sectionRead?.attention_seconds >= 5, `Bot Revolution section read: expected >=5s, got ${sectionRead?.attention_seconds}`)
    assert(sectionAttention?.attention_seconds >= 5, `Bot Revolution section attention: expected >=5s, got ${sectionAttention?.attention_seconds}`)
    assert(sectionAttention?.section_pass >= 1, `Bot Revolution section attention: expected a visible pass, got ${sectionAttention?.section_pass}`)
    assert(summary?.sections_viewed >= 2, `Bot Revolution summary: expected >=2 viewed sections, got ${summary?.sections_viewed}`)
    assert(summary?.sections_read >= 1, `Bot Revolution summary: expected >=1 read section, got ${summary?.sections_read}`)
    assert(summary?.exit_reason === 'route_change', `Bot Revolution summary: expected route_change, got ${summary?.exit_reason}`)
    assert(summary?.engaged_reader === 1, 'Bot Revolution summary: reader should be engaged')
    assert(summary?.read_complete === 1, 'Bot Revolution summary: reader should be complete')
    assert(summary?.transport_type === 'beacon', 'Bot Revolution summary: expected beacon transport')
    assert(copyGa?.event_label === 'bot_revolution_prompt', 'Bot Revolution prompt: bad GA4 copy label')
    assert(copyYm?.event_label === 'bot_revolution_prompt', 'Bot Revolution prompt: bad Metrika copy label')
    assert(botMetrikaInit?.clickmap === true, 'Bot Revolution: Metrika click map should be enabled on direct entry')
    assert(botMetrikaInit?.webvisor === true, 'Bot Revolution: Metrika Webvisor should be enabled on direct entry')
  } finally {
    await page.close()
  }
}

async function assertEnglishBotRevolutionTracking(context, baseUrl) {
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.goto(`${baseUrl}/en/blog/bot-revolution/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await waitForPageView(page, '/en/blog/bot-revolution/')
    await waitForGaEvent(page, 'article_section_view', { section_id: 'hook', article_lang: 'en' })
    const calls = await getAnalyticsCalls(page)
    const botMetrikaInit = ymInitCalls(calls).at(-1)
    assert(botMetrikaInit?.clickmap === true, 'English Bot Revolution: Metrika click map should be enabled on direct entry')
    assert(botMetrikaInit?.webvisor === true, 'English Bot Revolution: Metrika Webvisor should be enabled on direct entry')
    assert(await page.locator('html').getAttribute('lang') === 'en', 'English Bot Revolution: wrong document language')
    assert(await page.locator('.language-switcher a[aria-current="page"]').textContent() === 'EN', 'English Bot Revolution: EN switch should be active')
    const contextIllustration = await page.locator('[data-analytics-section="context_limit"] .bot-revolution-art img').getAttribute('src')
    const chiefImage = page.locator('[data-analytics-section="chief_model"] .bot-revolution-art img')
    const chiefIllustration = await chiefImage.getAttribute('src')
    const chiefSrcset = await chiefImage.getAttribute('srcset')
    assert(
      chiefIllustration === '/assets/drafts/bot-revolution/one-main-hundred-agents-en.webp',
      'English Bot Revolution: chief illustration should use the translated chief asset',
    )
    assert(chiefIllustration !== contextIllustration, 'English Bot Revolution: chief illustration duplicates the context-limit image')
    assert(chiefSrcset?.includes('one-main-hundred-agents-en-640.webp 640w'), 'English Bot Revolution: chief illustration is missing its 640w variant')
    assert(chiefSrcset?.includes('one-main-hundred-agents-en.webp 1024w'), 'English Bot Revolution: chief illustration is missing its native 1024w master')
    assert(!chiefSrcset?.includes('one-main-hundred-agents-en-1024.webp'), 'English Bot Revolution: chief illustration has a duplicate 1024w descriptor')

    const xCard = page.locator('[data-cta-id="bot_revolution_x"]')
    assert(await xCard.getAttribute('href') === 'https://x.com/danokhlopkov', 'English Bot Revolution: X card points to the wrong profile')
    assert((await xCard.textContent())?.includes('@danokhlopkov'), 'English Bot Revolution: X card is missing the username')
    assert((await xCard.textContent())?.includes('okhlopkov.ton'), 'English Bot Revolution: X card is missing the display name')
    assert(
      await xCard.locator('img').getAttribute('src') === '/assets/drafts/bot-revolution/telegram-cards/dan-x.webp',
      'English Bot Revolution: X card is missing the current avatar',
    )

    const xPopup = page.waitForEvent('popup', { timeout: 1000 }).catch(() => null)
    await xCard.click({ noWaitAfter: true })
    const openedXPopup = await xPopup
    if (openedXPopup) await openedXPopup.close()
    await waitForAnalyticsEvent(page, 'article_cta_click')
    const xCalls = await getAnalyticsCalls(page)
    const xGa = gaEventPayloads(xCalls, 'article_cta_click').at(-1)
    const xYm = ymGoalPayloads(xCalls, 'article_cta_click').at(-1)
    assert(xGa?.cta_id === 'bot_revolution_x', 'English Bot Revolution: X click has the wrong GA4 cta_id')
    assert(xYm?.cta_id === 'bot_revolution_x', 'English Bot Revolution: X click has the wrong Metrika cta_id')
    assert(xGa?.link_domain === 'x.com', 'English Bot Revolution: X click has the wrong GA4 link domain')

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }),
      page.locator('.site-header-link[href="/en/blog/"]').click(),
    ])
    await waitForPageView(page, '/en/blog/')
    const destinationCalls = await getAnalyticsCalls(page)
    const destinationInit = ymInitCalls(destinationCalls).at(-1)
    assert(destinationInit?.clickmap === false, 'English Bot Revolution: clickmap stayed enabled after leaving the article')
    assert(destinationInit?.webvisor === false, 'English Bot Revolution: Webvisor stayed enabled after leaving the article')
    assert(!await page.locator('body').evaluate((body) => body.classList.contains('bot-revolution-body')), 'English Bot Revolution: article body class leaked after navigation')
  } finally {
    await page.close()
  }
}

async function assertBotRevolutionClipboardFailure(context, baseUrl) {
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('clipboard unavailable in test')) },
    })
    document.execCommand = () => false
  })
  try {
    await page.goto(`${baseUrl}/en/blog/bot-revolution/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    const promptButton = page.locator('.bot-revolution-prompt-actions button')
    await promptButton.scrollIntoViewIfNeeded()
    await promptButton.click()
    await page.waitForTimeout(250)
    const calls = await getAnalyticsCalls(page)
    assert(gaEventPayloads(calls, 'code_copy').length === 0, 'Bot Revolution prompt: failed copy emitted a GA4 conversion')
    assert(ymGoalPayloads(calls, 'code_copy').length === 0, 'Bot Revolution prompt: failed copy emitted a Metrika conversion')
    assert(await promptButton.textContent() === 'Copy', 'Bot Revolution prompt: failed copy showed a success state')
  } finally {
    await page.close()
  }
}

async function assertMissingEnglishPostStaysEnglish(context, baseUrl) {
  const page = await context.newPage({ viewport: { width: 390, height: 844 } })
  try {
    await page.goto(`${baseUrl}/en/blog/__missing-post__/`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    })
    await page.waitForFunction(() => window.location.pathname === '/en/blog/', null, { timeout: 5000 })
    assert(await page.locator('html').getAttribute('lang') === 'en', 'Missing English post: redirect switched to Russian')
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
  const expectedPaths = ['/', '/ru/blog/', '/ru/articles/', '/about/']

  await page.goto(`${baseUrl}/?utm_source=codex&tgWebAppData=secret#tgWebAppData=secret`, {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  })
  await waitForPageView(page, '/')
  await waitForMetrikaHit(page, '/')

  await clickHeaderLink(page, '/ru/blog/', '/ru/blog/')
  await clickHeaderLink(page, '/ru/articles/', '/ru/articles/')
  await clickHeaderLink(page, '/about', '/about')
  await page.waitForTimeout(250)

  const calls = await getAnalyticsCalls(page)
  const initCalls = ymInitCalls(calls)
  assert(initCalls.some((init) => init.defer === true), 'Metrika init should use defer:true for SPA manual hits')
  assert(initCalls.some((init) => init.clickmap === false), 'Metrika clickmap should stay disabled for Core Web Vitals')
  assert(initCalls.some((init) => init.webvisor === false), 'Metrika Webvisor should stay disabled for Core Web Vitals')

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
  await assertArticleTelegramSubscribeTracking(context, baseUrl)
  await assertTelegramStoryViewerSourceTracking(context, baseUrl)
  await assertBotRevolutionReadingTracking(context, baseUrl)
  await assertEnglishBotRevolutionTracking(context, baseUrl)
  await assertBotRevolutionClipboardFailure(context, baseUrl)
  await assertMissingEnglishPostStaysEnglish(context, baseUrl)

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
  console.error(error.stack || error.message)
  process.exit(1)
})
