#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4174').replace(/\/+$/, '')
const executable = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean).find(candidate => fs.existsSync(candidate))

const browser = await chromium.launch(executable ? { executablePath: executable, headless: true } : { headless: true })
const artifacts = '/opt/data/workspace/telegram-atlas/artifacts'
await mkdir(artifacts, { recursive: true })

const boxesOverlap = (left, right) => (
  left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top
)

async function assertMapLabels(page, expectedCount) {
  await page.waitForFunction(count => document.querySelectorAll('.atlas-map-label').length === count, expectedCount)
  const canvasBox = await page.locator('.atlas-canvas-wrap').boundingBox()
  const zoomBox = await page.locator('.atlas-zoom-controls').boundingBox()
  const labelBoxes = await page.locator('.atlas-map-label').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect()
    return { text: element.textContent || '', left: box.left, right: box.right, top: box.top, bottom: box.bottom }
  }))
  assert.ok(canvasBox && zoomBox, 'map and zoom controls must have bounds')
  const zoom = { left: zoomBox.x, right: zoomBox.x + zoomBox.width, top: zoomBox.y, bottom: zoomBox.y + zoomBox.height }
  for (const label of labelBoxes) {
    assert.ok(label.left >= canvasBox.x && label.right <= canvasBox.x + canvasBox.width, `${label.text} must fit horizontally inside the map`)
    assert.ok(label.top >= canvasBox.y && label.bottom <= canvasBox.y + canvasBox.height, `${label.text} must fit vertically inside the map`)
    assert.equal(boxesOverlap(label, zoom), false, `${label.text} must not overlap zoom controls`)
  }
  for (let leftIndex = 0; leftIndex < labelBoxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < labelBoxes.length; rightIndex += 1) {
      const left = labelBoxes[leftIndex]
      const right = labelBoxes[rightIndex]
      assert.equal(boxesOverlap(left, right), false, `map labels must not overlap: ${JSON.stringify(left)} / ${JSON.stringify(right)}`)
    }
  }
}

try {
  const deepLinkPage = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await deepLinkPage.goto(`${baseUrl}/telegram-map/?post=1718`, { waitUntil: 'networkidle' })
  await deepLinkPage.locator('.atlas-post-text').filter({ hasText: 'Нескучном саду' }).waitFor()
  assert.match(deepLinkPage.url(), /post=1718/, 'deep link must survive initial data loading')
  assert.equal(await deepLinkPage.locator('.atlas-telegram-link').getAttribute('href'), 'tg://resolve?domain=danokhlopkov&post=1718')
  assert.equal(await deepLinkPage.locator('.atlas-telegram-web-link').getAttribute('href'), 'https://t.me/danokhlopkov/1718')
  console.log('OK Telegram app/web links and deep-link state')
  await deepLinkPage.close()

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile-320', width: 320, height: 568 },
    { name: 'mobile-360', width: 360, height: 640 },
    { name: 'mobile-375', width: 375, height: 667 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport })
    const errors = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))

    await page.goto(`${baseUrl}/telegram-map/`, { waitUntil: 'networkidle' })
    await page.locator('.atlas-workspace').waitFor({ state: 'attached', timeout: 60_000 })
    const canvas = page.locator('canvas.atlas-canvas')
    await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.totalPosts === '1556')

    assert.equal(await page.locator('.atlas-map-hint').count(), 0, 'instructional map hint must be removed')
    assert.equal(await page.locator('.atlas-count').count(), 0, 'redundant visible/total counter must be removed')
    assert.equal(await page.locator('.atlas-year-filters button').count(), 8, 'all-years plus seven year buttons must be visible')
    assert.equal(await page.locator('.atlas-topic-filters button').count(), 13, 'all-topics plus twelve topic buttons must be visible')
    assert.equal(await page.locator('.atlas-play-button').count(), 1, 'timeline play control must be visible')
    assert.equal(await page.locator('.atlas-timeline input[type="range"]').count(), 1, 'timeline scrubber must be visible')
    if (viewport.name === 'desktop') {
      const topicGeometry = await page.locator('.atlas-topic-filters').evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }))
      assert.ok(topicGeometry.scrollWidth <= topicGeometry.clientWidth + 1, `desktop topic filters must not be clipped: ${JSON.stringify(topicGeometry)}`)
    }

    const workspaceBox = await page.locator('.atlas-workspace').boundingBox()
    assert.ok(workspaceBox, 'workspace must have bounds')
    assert.ok(workspaceBox.x <= 1, `workspace must start at viewport edge, got x=${workspaceBox.x}`)
    assert.ok(workspaceBox.width >= viewport.width - 2, `workspace must span viewport, got ${workspaceBox.width}/${viewport.width}`)

    const minRadius = Number(await canvas.getAttribute('data-min-radius'))
    const maxRadius = Number(await canvas.getAttribute('data-max-radius'))
    const lowViews = Number(await canvas.getAttribute('data-radius-low-views'))
    const highViews = Number(await canvas.getAttribute('data-radius-high-views'))
    const radiusExponent = Number(await canvas.getAttribute('data-radius-exponent'))
    assert.ok(Number.isFinite(minRadius) && Number.isFinite(maxRadius), 'canvas must expose point radius domain')
    assert.ok(maxRadius - minRadius >= 9, `views must create a clearly visible radius range, got ${minRadius}–${maxRadius}`)
    assert.ok(lowViews >= 1_300 && lowViews <= 1_500, `low radius bound must track the 10th views percentile, got ${lowViews}`)
    assert.ok(highViews >= 14_000 && highViews <= 15_000, `high radius bound must track the 99th views percentile, got ${highViews}`)
    assert.ok(radiusExponent >= 1.2, `radius exponent must keep the median away from the visual ceiling, got ${radiusExponent}`)

    const radiusForViews = views => {
      const normalized = Math.max(0, Math.min(1, (
        Math.log1p(views) - Math.log1p(lowViews)
      ) / Math.max(0.001, Math.log1p(highViews) - Math.log1p(lowViews))))
      return minRadius + normalized ** radiusExponent * (maxRadius - minRadius)
    }
    const medianRadius = radiusForViews(5_044)
    const topDecileRadius = radiusForViews(9_921)
    assert.ok(topDecileRadius - medianRadius >= 2.8, `median and top-decile posts must be visibly distinct, got ${medianRadius.toFixed(2)} / ${topDecileRadius.toFixed(2)}`)

    await assertMapLabels(page, 12)

    await page.evaluate(() => {
      const workspace = document.querySelector('.atlas-workspace')
      if (workspace) window.scrollTo({ top: workspace.getBoundingClientRect().top + window.scrollY, behavior: 'instant' })
    })
    await page.waitForTimeout(100)
    const canvasBox = await page.locator('.atlas-canvas-wrap').boundingBox()
    assert.ok(canvasBox, 'canvas must have bounds')
    const scrollBefore = await page.evaluate(() => window.scrollY)
    const scaleBefore = Number(await canvas.getAttribute('data-view-scale'))
    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + Math.min(canvasBox.height / 2, viewport.height / 3))
    await page.mouse.wheel(0, 80)
    await page.waitForTimeout(160)
    const scrollAfter = await page.evaluate(() => window.scrollY)
    const scaleAfter = Number(await canvas.getAttribute('data-view-scale'))
    assert.equal(scrollAfter, scrollBefore, 'wheel over map must not scroll the page')
    assert.notEqual(scaleAfter, scaleBefore, 'wheel over map must adjust map scale')
    await assertMapLabels(page, 12)

    const controlsBox = await page.locator('.atlas-zoom-controls').boundingBox()
    assert.ok(controlsBox, 'zoom controls must have bounds')
    const controlsScrollBefore = await page.evaluate(() => window.scrollY)
    const controlsScaleBefore = Number(await canvas.getAttribute('data-view-scale'))
    await page.mouse.move(controlsBox.x + controlsBox.width / 2, controlsBox.y + controlsBox.height / 2)
    await page.mouse.wheel(0, -80)
    await page.waitForTimeout(160)
    const controlsScrollAfter = await page.evaluate(() => window.scrollY)
    const controlsScaleAfter = Number(await canvas.getAttribute('data-view-scale'))
    assert.equal(controlsScrollAfter, controlsScrollBefore, 'wheel over map controls must not scroll the page')
    assert.notEqual(controlsScaleAfter, controlsScaleBefore, 'wheel over map controls must still adjust map scale')
    await page.getByRole('button', { name: 'Сбросить масштаб' }).click()

    const allPosts = Number(await canvas.getAttribute('data-total-posts'))
    await page.locator('.atlas-year-filters button[data-year="2022"]').click()
    await page.waitForFunction(total => Number(document.querySelector('canvas.atlas-canvas')?.dataset.visiblePosts) < total, allPosts)
    const yearPosts = Number(await canvas.getAttribute('data-visible-posts'))
    assert.ok(yearPosts > 0 && yearPosts < allPosts, `year filter must reduce posts, got ${yearPosts}`)
    await page.locator('.atlas-year-filters button[data-year="all"]').click()

    if (viewport.name === 'desktop') {
      const dateBefore = await page.locator('.atlas-playback-date').textContent()
      await page.locator('.atlas-play-button').click()
      await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.playbackActive === 'true')
      await page.waitForTimeout(900)
      const dateAfter = await page.locator('.atlas-playback-date').textContent()
      assert.notEqual(dateAfter, dateBefore, 'playback date must advance while playing')
      const playbackPosts = Number(await canvas.getAttribute('data-visible-posts'))
      assert.ok(playbackPosts > 0 && playbackPosts < allPosts, `playback must show a moving time window, got ${playbackPosts}`)
      await page.locator('.atlas-play-button').click()
      const pausedDate = await page.locator('.atlas-playback-date').textContent()
      await page.waitForTimeout(400)
      assert.equal(await page.locator('.atlas-playback-date').textContent(), pausedDate, 'playback date must stop while paused')
      await page.locator('.atlas-history-button').click()
      assert.equal(await canvas.getAttribute('data-playback-active'), 'false', 'all-history action must exit playback mode')
    }

    await page.locator('.atlas-search input').fill('настольный теннис')
    const result = page.locator('.atlas-search-results button').first()
    await result.waitFor()
    await result.click()
    await page.locator('.atlas-post-text').filter({ hasText: 'Нескучном саду' }).waitFor()
    const telegramLink = page.locator('.atlas-telegram-link')
    assert.equal(await telegramLink.getAttribute('href'), 'tg://resolve?domain=danokhlopkov&post=1718')
    const telegramWebLink = page.locator('.atlas-telegram-web-link')
    assert.equal(await telegramWebLink.getAttribute('href'), 'https://t.me/danokhlopkov/1718')
    assert.equal(await telegramWebLink.getAttribute('target'), '_blank')
    assert.equal(await telegramWebLink.getAttribute('rel'), 'noreferrer')

    await page.locator('.atlas-search input').fill('')
    await page.locator('.atlas-detail-close').click()
    await page.screenshot({ path: `${artifacts}/telegram-map-v2-${viewport.name}.png`, fullPage: false })
    await page.locator('.atlas-canvas-wrap').screenshot({ path: `${artifacts}/telegram-map-v2-${viewport.name}-canvas.png` })

    assert.deepEqual(errors, [], `Browser errors on ${viewport.name}: ${errors.join(' | ')}`)
    console.log(`OK ${viewport.name} full-width/filter/zoom/play/search/link/screenshot`)
    await page.close()
  }

} finally {
  await browser.close()
}
