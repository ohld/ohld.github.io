import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'

const articleChecks = [
  { route: '/ru/blog/improve-codebase-architecture-prompt/', lang: 'ru' },
  { route: '/ru/articles/hermes-agent-vps-telegram-ustanovka/', lang: 'ru' },
  { route: '/en/articles/hermes-agent-vps-telegram-setup/', lang: 'en' },
  { route: '/claude-code-nastrojka-mcp-hooks-skills-2026/', lang: 'ru' },
  { route: '/ru/blog/bot-revolution/', lang: 'ru' },
  { route: '/en/blog/bot-revolution/', lang: 'en' },
]

async function articleSnapshot(page, check) {
  const result = await page.locator('#article-content').evaluate((article) => {
    const headings = [...article.querySelectorAll('h2, h3')]
    const ending = article.querySelector('.article-ending')
    return {
      ids: headings.map((heading) => heading.id),
      controls: headings.map((heading) => {
        const button = heading.querySelector('button.article-section-link')
        return Boolean(button?.getAttribute('aria-label') && button.type === 'button')
      }),
      related: [...article.querySelectorAll('.article-ending-related a')].map((link) => link.getAttribute('href')),
      endingText: ending?.textContent || '',
      authorImage: ending?.querySelector('img')?.getAttribute('src') || '',
      telegram: [...(ending?.querySelectorAll('a') || [])].map((link) => link.getAttribute('href')),
    }
  })
  assert(result.ids.length >= 3, `${check.route}: missing article headings`)
  assert(result.ids.every(Boolean), `${check.route}: a heading has no ID`)
  assert.equal(new Set(result.ids).size, result.ids.length, `${check.route}: duplicate heading IDs`)
  assert(result.controls.every(Boolean), `${check.route}: a heading lacks an accessible anchor button`)
  assert.equal(result.related.length, 3, `${check.route}: expected three related articles`)
  assert.equal(new Set(result.related).size, 3, `${check.route}: duplicate related articles`)
  assert(!result.related.includes(check.route), `${check.route}: related articles include self`)
  assert.match(result.endingText, check.lang === 'ru' ? /Охлопков/ : /Okhlopkov/)
  assert(result.authorImage, `${check.route}: author photo missing`)
  assert(result.telegram.includes('https://t.me/danokhlopkov'), `${check.route}: channel link missing`)
  assert(result.telegram.includes('https://t.me/ohld_chat'), `${check.route}: chat link missing`)
  return result
}

async function assertFragmentScroll(page, id, label) {
  // Browser-side polling stops when this context disables JavaScript.
  let position
  for (let attempt = 0; attempt < 50; attempt += 1) {
    position = await page.evaluate((headingId) => ({
      top: document.getElementById(headingId)?.getBoundingClientRect().top,
      scrollY: window.scrollY,
      height: window.innerHeight,
    }), id)
    if (position.scrollY > 0 && position.top >= -2 && position.top < position.height / 2) return
    await delay(100)
  }
  assert.fail(`${label}: direct fragment did not reach "${id}" (${JSON.stringify(position)})`)
}

async function assertControlVisible(page, id, label) {
  await page.waitForFunction((headingId) => {
    let element = document.getElementById(headingId)?.querySelector('button.article-section-link')
    if (!element) return false
    for (; element; element = element.parentElement) {
      if (Number(getComputedStyle(element).opacity) < 0.99) return false
    }
    return true
  }, id, { timeout: 2000 }).catch(() => assert.fail(`${label}: anchor control is hidden`))
}

export async function checkArticleTemplates(browser, baseUrl, viewport) {
  const staticContext = await browser.newContext({ viewport, javaScriptEnabled: false })
  const liveContext = await browser.newContext({ viewport, hasTouch: viewport.name === 'mobile' })
  const staticPage = await staticContext.newPage()
  const livePage = await liveContext.newPage()
  await livePage.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (value) => { window.__SMOKE_SECTION_COPY__ = value } },
    })
  })

  try {
    for (const check of articleChecks) {
      await staticPage.goto(`${baseUrl}${check.route}`, { waitUntil: 'domcontentloaded' })
      const snapshot = await articleSnapshot(staticPage, check)
      const id = snapshot.ids[2]
      if (check.lang === 'ru' && check.route.startsWith('/ru/')) {
        assert(snapshot.ids.some((value) => /[а-яё]/i.test(value)), `${check.route}: Cyrillic headings lost readable IDs`)
      }
      const fragmentUrl = `${baseUrl}${check.route}#${encodeURIComponent(id)}`
      await staticPage.goto('about:blank')
      await staticPage.goto(fragmentUrl, { waitUntil: 'domcontentloaded' })
      await assertFragmentScroll(staticPage, id, `${check.route} static`)

      const mirrorHref = await staticPage.locator('link[rel="alternate"][type="text/markdown"]').getAttribute('href')
      assert(mirrorHref, `${check.route}: Markdown mirror link missing`)
      const mirror = await staticPage.request.get(new URL(mirrorHref, baseUrl).href)
      assert(mirror.ok(), `${check.route}: Markdown mirror failed`)
      const markdown = await mirror.text()
      for (const related of snapshot.related) {
        assert(markdown.includes(`](${related})`), `${check.route}: Markdown mirror lacks related link ${related}`)
        const response = await staticPage.request.get(new URL(related, baseUrl).href)
        assert(response.ok(), `${check.route}: related article failed ${related}`)
        assert.match(await response.text(), new RegExp(`<html lang="${check.lang}"`), `${check.route}: related article language differs ${related}`)
      }

      await livePage.goto(fragmentUrl, { waitUntil: 'domcontentloaded' })
      await livePage.waitForSelector('#article-content.article-engine, #article-content:has(.bot-revolution-chapter)')
      await livePage.waitForSelector('.article-ending')
      await livePage.waitForSelector('h2 .article-section-link, h3 .article-section-link')
      const liveSnapshot = await articleSnapshot(livePage, check)
      assert.deepEqual(liveSnapshot.ids, snapshot.ids, `${check.route}: static and browser heading IDs differ`)
      assert.deepEqual(liveSnapshot.related, snapshot.related, `${check.route}: static and browser related articles differ`)
      await assertFragmentScroll(livePage, id, `${check.route} browser`)
      const control = livePage.locator('#article-content h2, #article-content h3').nth(2).locator('button.article-section-link')
      if (viewport.name === 'mobile') {
        await assertControlVisible(livePage, id, `${check.route} touch`)
      }
      await control.focus()
      await assertControlVisible(livePage, id, `${check.route} focused`)
      await control.press('Enter')
      await livePage.waitForFunction((expected) => window.__SMOKE_SECTION_COPY__ === expected, fragmentUrl)
      const feedback = await control.evaluate((node) => node.parentElement.querySelector('[role="status"]')?.textContent || '')
      assert.match(feedback.toLowerCase(), check.lang === 'ru' ? /скопировано/ : /copied/)
      console.log(`OK ${viewport.name} ${check.route} article anchors, ending and Markdown mirror`)
    }
  } finally {
    await staticContext.close()
    await liveContext.close()
  }
}
