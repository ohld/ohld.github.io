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
  const labelBoxes = await page.locator('.atlas-map-label').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect()
    return { text: element.textContent || '', left: box.left, right: box.right, top: box.top, bottom: box.bottom }
  }))
  assert.ok(canvasBox, 'map must have bounds')
  for (const label of labelBoxes) {
    assert.ok(label.left >= canvasBox.x && label.right <= canvasBox.x + canvasBox.width, `${label.text} must fit horizontally inside the map`)
    assert.ok(label.top >= canvasBox.y && label.bottom <= canvasBox.y + canvasBox.height, `${label.text} must fit vertically inside the map`)
  }
  for (let leftIndex = 0; leftIndex < labelBoxes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < labelBoxes.length; rightIndex += 1) {
      const left = labelBoxes[leftIndex]
      const right = labelBoxes[rightIndex]
      assert.equal(boxesOverlap(left, right), false, `map labels must not overlap: ${JSON.stringify(left)} / ${JSON.stringify(right)}`)
    }
  }
}

async function mapLabelPositions(page) {
  const entries = await page.locator('.atlas-map-label').evaluateAll(elements => {
    const canvas = document.querySelector('.atlas-canvas-wrap')?.getBoundingClientRect()
    if (!canvas) return []
    return elements.map(element => {
      const box = element.getBoundingClientRect()
      return [element.textContent || '', {
        left: box.left - canvas.left + box.width / 2,
        top: box.top - canvas.top + box.height / 2,
      }]
    })
  })
  return Object.fromEntries(entries)
}

async function assertPinchZoomsMap(page, canvas, canvasBox) {
  const session = await page.context().newCDPSession(page)
  const centerX = canvasBox.x + canvasBox.width / 2
  const centerY = canvasBox.y + Math.min(canvasBox.height / 2, 220)
  const scaleBefore = Number(await canvas.getAttribute('data-view-scale'))
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [
      { id: 1, x: centerX - 28, y: centerY },
      { id: 2, x: centerX + 28, y: centerY },
    ],
  })
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [
      { id: 1, x: centerX - 66, y: centerY },
      { id: 2, x: centerX + 66, y: centerY },
    ],
  })
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(160)
  const scaleAfter = Number(await canvas.getAttribute('data-view-scale'))
  assert.ok(scaleAfter > scaleBefore * 1.25, `pinch-out must increase map scale, got ${scaleBefore} -> ${scaleAfter}`)
  await session.detach()
}

try {
  const deepLinkPage = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await deepLinkPage.goto(`${baseUrl}/karta-postov-telegram/?post=1718`, { waitUntil: 'networkidle' })
  await deepLinkPage.locator('.atlas-post-text').filter({ hasText: 'Нескучном саду' }).waitFor()
  assert.match(deepLinkPage.url(), /post=1718/, 'deep link must survive initial data loading')
  assert.equal(await deepLinkPage.locator('.atlas-telegram-link').getAttribute('href'), 'tg://resolve?domain=danokhlopkov&post=1718')
  assert.equal(await deepLinkPage.locator('.atlas-telegram-web-link').getAttribute('href'), 'https://t.me/danokhlopkov/1718')
  console.log('OK Telegram app/web links and deep-link state')
  await deepLinkPage.close()

  const pausePage = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await pausePage.goto(`${baseUrl}/karta-postov-telegram/`, { waitUntil: 'networkidle' })
  const pauseCanvas = pausePage.locator('canvas.atlas-canvas')
  await pausePage.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.totalPosts === '1556')
  const earliestPost = await pausePage.evaluate(async () => {
    const response = await fetch('/data/telegram-atlas.json')
    const atlas = await response.json()
    return atlas.posts.reduce((earliest, post) => post.date < earliest.date ? post : earliest)
  })
  await pausePage.locator('.atlas-play-button').click()
  await pausePage.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.playbackActive === 'true')
  assert.match(await pausePage.locator('.atlas-play-button').getAttribute('class'), /is-playing/, 'evolution must be running before selecting a post')
  const pauseCanvasBox = await pauseCanvas.boundingBox()
  assert.ok(pauseCanvasBox, 'pause-on-post canvas must have bounds')
  await pauseCanvas.click({
    position: {
      x: 30 + earliestPost.x * Math.max(1, pauseCanvasBox.width - 60),
      y: 30 + earliestPost.y * Math.max(1, pauseCanvasBox.height - 60),
    },
  })
  await pausePage.locator('.atlas-detail').waitFor()
  assert.doesNotMatch(await pausePage.locator('.atlas-play-button').getAttribute('class'), /is-playing/, 'selecting a visible post during evolution must pause playback')
  assert.match(await pausePage.locator('.atlas-play-button').textContent(), /Продолжить/, 'paused evolution must offer to continue')
  const selectedPostUrl = pausePage.url()
  const selectedPostDate = await pausePage.locator('.atlas-playback-date').textContent()
  await pausePage.waitForTimeout(500)
  assert.equal(await pausePage.locator('.atlas-playback-date').textContent(), selectedPostDate, 'timeline must stay frozen while the selected post preview is open')
  assert.equal(pausePage.url(), selectedPostUrl, 'selected post preview must stay open while playback is paused')
  console.log('OK selecting a post pauses evolution and preserves the preview')
  await pausePage.close()

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile-320', width: 320, height: 568 },
    { name: 'mobile-360', width: 360, height: 640 },
    { name: 'mobile-375', width: 375, height: 667 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport, hasTouch: viewport.name.startsWith('mobile') })
    const errors = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))

    await page.goto(`${baseUrl}/karta-postov-telegram/`, { waitUntil: 'networkidle' })
    await page.locator('.atlas-workspace').waitFor({ state: 'attached', timeout: 60_000 })
    const canvas = page.locator('canvas.atlas-canvas')
    await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.totalPosts === '1556')

    assert.equal(await page.locator('.atlas-meta').count(), 0, 'visual atlas subtitle must be removed')
    assert.equal(await page.locator('.atlas-map-hint').count(), 0, 'instructional map hint must be removed')
    assert.equal(await page.locator('.atlas-count').count(), 0, 'redundant visible/total counter must be removed')
    assert.equal(await page.locator('.atlas-year-filters').count(), 0, 'year chips must be replaced by the timeline scrubber')
    assert.equal(await page.locator('.atlas-topic-filters button').count(), 13, 'all-topics plus twelve topic buttons must remain available in the collapsed topic panel')
    assert.equal(await page.locator('.atlas-filter-panel').getAttribute('open'), null, 'topic filters must start collapsed')
    const collapsedTopicsBox = await page.locator('.atlas-topic-filters').boundingBox()
    assert.ok(!collapsedTopicsBox || collapsedTopicsBox.width * collapsedTopicsBox.height === 0, 'collapsed topic filters must not consume map space')
    assert.equal(await page.locator('.atlas-play-button').count(), 1, 'timeline play control must be visible')
    assert.equal(await page.locator('.atlas-timeline input[type="range"]').count(), 1, 'timeline scrubber must stay visible below the map')
    assert.equal(await page.locator('.atlas-zoom-controls').count(), 0, 'zoom/reset buttons must be removed from the map')
    assert.equal(await canvas.getAttribute('data-point-rendering'), 'radial-gradient', 'posts must render as one radial gradient instead of a solid dot plus halo')
    assert.equal(await canvas.getAttribute('data-layout-mode'), 'fixed-semantic', 'playback must preserve a stable semantic geography')
    assert.equal(await canvas.getAttribute('data-graph-mode'), 'static-neighbors', 'all-history mode must keep graph edges quiet')
    assert.equal(await page.locator('.atlas-career-context').count(), 0, 'career context must stay hidden outside timeline mode')
    assert.equal(await page.locator('.atlas-playback-insights').count(), 0, 'playback insights must stay hidden outside timeline mode')
    assert.doesNotMatch(await page.locator('.atlas-header .sr-only').textContent(), /рост/i, 'accessible map description must not promise a removed growth metric')

    if (viewport.name.startsWith('mobile')) {
      const compactControls = async (rightSelector) => page.evaluate((selector) => {
        const bounds = (target) => {
          const box = document.querySelector(target)?.getBoundingClientRect()
          return box && box.width > 0 && box.height > 0
            ? { x: box.x, y: box.y, width: box.width, height: box.height }
            : null
        }
        return {
          row: bounds('.atlas-search-row'),
          play: bounds('.atlas-play-button'),
          search: bounds('.atlas-search input'),
          right: bounds(selector),
        }
      }, rightSelector)

      const idleControls = await compactControls('.atlas-search-toggle')
      assert.ok(idleControls.row && idleControls.play && idleControls.right, `mobile idle controls must be visible: ${JSON.stringify(idleControls)}`)
      assert.equal(idleControls.search, null, 'mobile search input must start collapsed')
      assert.ok(Math.abs(idleControls.play.y - idleControls.right.y) <= 1, `mobile idle controls must share one row: ${JSON.stringify(idleControls)}`)
      assert.ok(idleControls.row.height <= 50, `mobile idle controls must stay one compact row, got ${idleControls.row.height}px`)
      assert.ok(Math.abs(idleControls.right.width - idleControls.right.height) <= 1, `mobile search control must be square: ${JSON.stringify(idleControls.right)}`)
      await page.screenshot({ path: `${artifacts}/telegram-map-v4-${viewport.name}-idle.png`, fullPage: false })

      await page.locator('.atlas-search-toggle').click()
      await page.locator('.atlas-search input').waitFor({ state: 'visible' })
      assert.equal(await page.locator('.atlas-search input').evaluate(element => document.activeElement === element), true, 'expanded mobile search must focus the input')
      const searchControls = await compactControls('.atlas-search-close')
      assert.ok(searchControls.row && searchControls.search && searchControls.right, `mobile search controls must be visible: ${JSON.stringify(searchControls)}`)
      assert.equal(searchControls.play, null, 'mobile play control must hide while search is expanded')
      assert.ok(Math.abs(searchControls.search.y - searchControls.right.y) <= 1, `mobile search controls must share one row: ${JSON.stringify(searchControls)}`)
      assert.ok(searchControls.row.height <= 50, `expanded mobile search must stay one compact row, got ${searchControls.row.height}px`)
      assert.ok(Math.abs(searchControls.right.width - searchControls.right.height) <= 1, `mobile search close control must be square: ${JSON.stringify(searchControls.right)}`)
      await page.screenshot({ path: `${artifacts}/telegram-map-v4-${viewport.name}-search.png`, fullPage: false })
      await page.keyboard.press('Escape')
      await page.locator('.atlas-search-toggle').waitFor({ state: 'visible' })
      assert.equal(await page.locator('.atlas-search input').isVisible(), false, 'Escape must collapse mobile search')
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
    const touchMovePrevented = await canvas.evaluate(element => {
      const event = new Event('touchmove', { bubbles: true, cancelable: true })
      element.dispatchEvent(event)
      return event.defaultPrevented
    })
    assert.equal(touchMovePrevented, true, 'cancelable touchmove over the canvas must be contained inside the map')
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

    if (viewport.name === 'mobile-360') await assertPinchZoomsMap(page, canvas, canvasBox)

    const allPosts = Number(await canvas.getAttribute('data-total-posts'))
    await page.locator('.atlas-filter-panel summary').click()
    assert.equal(await page.locator('.atlas-filter-panel').getAttribute('open'), '', 'topic panel must expand on demand')
    const topicPopularity = await page.locator('.atlas-topic-filters button[data-topic-count]').evaluateAll(buttons => buttons.map(button => ({
      count: Number(button.getAttribute('data-topic-count')),
      share: Number(button.getAttribute('data-topic-share')),
      weight: Number(button.getAttribute('data-topic-weight')),
      visibleShare: button.querySelector('.atlas-topic-share')?.textContent || '',
      fillWidth: Number.parseFloat(getComputedStyle(button, '::before').width),
    })))
    assert.equal(topicPopularity.length, 12, 'every topic must expose its popularity')
    assert.deepEqual(
      topicPopularity.map(item => item.count),
      [...topicPopularity].map(item => item.count).sort((left, right) => right - left),
      'topic filters must be sorted from most to least popular',
    )
    assert.ok(topicPopularity[0].count > topicPopularity.at(-1).count, 'topic popularity must distinguish the largest and smallest topics')
    assert.equal(topicPopularity[0].weight, 100, 'the most popular topic must define the full visual scale')
    assert.ok(topicPopularity.every(item => item.share > 0 && item.share < 100 && /%$/.test(item.visibleShare)), 'each topic must show its share of all posts')
    assert.ok(topicPopularity[0].fillWidth > topicPopularity.at(-1).fillWidth, 'the most popular topic must have a wider color fill than the least popular topic')
    if (viewport.name === 'desktop') {
      const topicGeometry = await page.locator('.atlas-topic-filters').evaluate(element => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }))
      assert.ok(topicGeometry.scrollWidth <= topicGeometry.clientWidth + 1, `desktop topic filters must not be clipped: ${JSON.stringify(topicGeometry)}`)
    }
    await page.locator('.atlas-topic-filters button').nth(1).click()
    await page.waitForFunction(total => Number(document.querySelector('canvas.atlas-canvas')?.dataset.visiblePosts) < total, allPosts)
    const topicPosts = Number(await canvas.getAttribute('data-visible-posts'))
    assert.ok(topicPosts > 0 && topicPosts < allPosts, `topic filter must reduce posts, got ${topicPosts}`)
    if (viewport.name === 'desktop') {
      await page.locator('.atlas-filter-panel summary').click()
      await page.locator('.atlas-play-button').click()
      await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.playbackActive === 'true')
      await page.locator('.atlas-play-button').click()
      await page.locator('.atlas-history-button').click()
      await page.waitForFunction(expected => Number(document.querySelector('canvas.atlas-canvas')?.dataset.visiblePosts) === expected, topicPosts)
      assert.match(await page.locator('.atlas-topic-filters button').nth(1).getAttribute('class'), /is-active/, 'topic choice must survive playback and return with all-history mode')
      await page.locator('.atlas-filter-panel summary').click()
      await page.locator('.atlas-topic-filters button').first().click()
      await page.locator('.atlas-filter-panel summary').click()
    } else {
      await page.locator('.atlas-topic-filters button').first().click()
      await page.locator('.atlas-filter-panel summary').click()
    }

    if (viewport.name === 'desktop') {
      const dateBefore = await page.locator('.atlas-playback-date').textContent()
      await page.locator('.atlas-play-button').click()
      await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.playbackActive === 'true')
      assert.equal(await page.locator('.atlas-filter-panel').count(), 0, 'topic filters must hide during evolution')
      assert.equal(await page.locator('.atlas-workspace .atlas-playback-insights').count(), 0, 'insights must never overlay the canvas')
      const activeWorkspaceBox = await page.locator('.atlas-workspace').boundingBox()
      const lowerPanelBox = await page.locator('.atlas-lower-panel').boundingBox()
      assert.ok(activeWorkspaceBox && lowerPanelBox, 'map and lower panel must have bounds')
      assert.ok(lowerPanelBox.y >= activeWorkspaceBox.y + activeWorkspaceBox.height - 1, 'timeline and insights must sit below the canvas')
      assert.ok(lowerPanelBox.height <= 120, `desktop lower panel must stay compact, got ${lowerPanelBox.height}px`)
      assert.equal(await canvas.getAttribute('data-graph-mode'), 'similarity-flow', 'playback must animate the active similarity graph')
      await page.waitForTimeout(900)
      const dateAfter = await page.locator('.atlas-playback-date').textContent()
      assert.notEqual(dateAfter, dateBefore, 'playback date must advance while playing')
      const playbackPosts = Number(await canvas.getAttribute('data-visible-posts'))
      assert.ok(playbackPosts > 0 && playbackPosts < allPosts, `playback must show a moving time window, got ${playbackPosts}`)
      const careerContext = page.locator('.atlas-career-context')
      await careerContext.waitFor()
      assert.equal(await careerContext.getAttribute('data-career-companies'), '')
      assert.match(await page.locator('.atlas-career-context').textContent(), /Работа.*Между ролями/, 'playback must not stretch Sweatcoin into the 2020 career gap')
      const scrubber = page.locator('.atlas-timeline input[type="range"]')
      await scrubber.scrollIntoViewIfNeeded()
      let scrubberBox = await scrubber.boundingBox()
      assert.ok(scrubberBox, 'timeline scrubber must have bounds')
      await page.mouse.move(scrubberBox.x + scrubberBox.width * 0.72, scrubberBox.y + scrubberBox.height / 2)
      await page.mouse.down()
      await page.mouse.move(scrubberBox.x + scrubberBox.width * 0.28, scrubberBox.y + scrubberBox.height / 2, { steps: 8 })
      await page.mouse.up()
      const dragProgress = Number(await scrubber.inputValue())
      assert.ok(dragProgress > 0 && dragProgress < 500, `pointer drag must rewind the active timeline, got ${dragProgress}`)
      assert.match(await page.locator('.atlas-play-button').getAttribute('class'), /is-playing/, 'pointer drag must not pause playback')
      await scrubber.focus()
      await page.keyboard.press('Home')
      const homeProgress = Number(await scrubber.inputValue())
      assert.ok(homeProgress < 50, `Home must rewind close to the timeline start during playback, got ${homeProgress}`)
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(100)
      assert.ok(Number(await scrubber.inputValue()) > homeProgress, 'ArrowRight must advance the active timeline')
      assert.match(await page.locator('.atlas-play-button').getAttribute('class'), /is-playing/, 'keyboard seek must not pause playback')
      await scrubber.fill('650')
      const seekForwardDate = await page.locator('.atlas-playback-date').textContent()
      assert.match(await page.locator('.atlas-play-button').getAttribute('class'), /is-playing/, 'seeking must not pause playback')
      await page.waitForTimeout(500)
      assert.notEqual(await page.locator('.atlas-playback-date').textContent(), seekForwardDate, 'playback must continue after seeking forward')
      await scrubber.fill('200')
      const rewindDate = await page.locator('.atlas-playback-date').textContent()
      assert.notEqual(rewindDate, seekForwardDate, 'timeline must rewind while playback is active')
      await page.waitForTimeout(500)
      assert.notEqual(await page.locator('.atlas-playback-date').textContent(), rewindDate, 'playback must continue after rewinding')
      const progressBeforeActiveWheel = Number(await scrubber.inputValue())
      const scrollBeforeActiveWheel = await page.evaluate(() => window.scrollY)
      await page.mouse.move(scrubberBox.x + scrubberBox.width / 2, scrubberBox.y + scrubberBox.height / 2)
      await page.mouse.wheel(0, 120)
      await page.waitForTimeout(120)
      assert.ok(Number(await scrubber.inputValue()) > progressBeforeActiveWheel, 'wheel must seek while playback remains active')
      assert.equal(await page.evaluate(() => window.scrollY), scrollBeforeActiveWheel, 'active timeline wheel must not scroll the page')
      assert.match(await page.locator('.atlas-play-button').getAttribute('class'), /is-playing/, 'wheel seek must not pause playback')
      await page.locator('.atlas-play-button').click()
      const pausedDate = await page.locator('.atlas-playback-date').textContent()
      await page.waitForTimeout(400)
      assert.equal(await page.locator('.atlas-playback-date').textContent(), pausedDate, 'playback date must stop while paused')
      await scrubber.fill('350')
      await page.waitForTimeout(100)
      const playbackTopicPopularity = await page.locator('.atlas-map-label').evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element)
        return {
          count: Number(element.getAttribute('data-topic-count')),
          share: Number(element.getAttribute('data-topic-share')),
          weight: Number(element.getAttribute('data-topic-weight')),
          fontSize: Number.parseFloat(style.fontSize),
          opacity: Number.parseFloat(style.opacity),
        }
      }).sort((left, right) => right.weight - left.weight))
      assert.ok(playbackTopicPopularity.length > 1, 'playback must expose several ranked topic labels')
      assert.equal(playbackTopicPopularity[0].weight, 100, 'the leading visible topic label must define the full visual scale')
      assert.ok(playbackTopicPopularity[0].count > playbackTopicPopularity.at(-1).count, 'active topic labels must expose different current-window popularity')
      assert.ok(playbackTopicPopularity[0].fontSize > playbackTopicPopularity.at(-1).fontSize, 'a more popular topic label must render larger')
      assert.ok(playbackTopicPopularity[0].opacity > playbackTopicPopularity.at(-1).opacity, 'a more popular topic label must render brighter')
      assert.ok(
        Math.abs(playbackTopicPopularity.reduce((sum, item) => sum + item.share, 0) - 100) < 0.2,
        'visible playback topic shares must account for the current six-month window',
      )
      await assertMapLabels(page, playbackTopicPopularity.length)
      const earlyPlaybackLabels = await mapLabelPositions(page)
      assert.ok(Object.keys(earlyPlaybackLabels).length > 0, 'early playback must expose at least one topic label')
      await scrubber.fill('700')
      await page.waitForTimeout(100)
      const laterPlaybackLabels = await mapLabelPositions(page)
      for (const [label, position] of Object.entries(earlyPlaybackLabels)) {
        assert.ok(laterPlaybackLabels[label], `${label} must remain visible after it first appears during playback`)
        assert.ok(
          Math.abs(laterPlaybackLabels[label].left - position.left) <= 0.5
            && Math.abs(laterPlaybackLabels[label].top - position.top) <= 0.5,
          `${label} must keep a stable playback position: ${JSON.stringify(position)} -> ${JSON.stringify(laterPlaybackLabels[label])}`,
        )
      }
      await scrubber.scrollIntoViewIfNeeded()
      scrubberBox = await scrubber.boundingBox()
      assert.ok(scrubberBox, 'timeline scrubber must have bounds')
      const progressBeforeWheel = Number(await scrubber.inputValue())
      const scrollBeforeWheel = await page.evaluate(() => window.scrollY)
      await page.mouse.move(scrubberBox.x + scrubberBox.width / 2, scrubberBox.y + scrubberBox.height / 2)
      await page.mouse.wheel(0, 120)
      await page.waitForTimeout(120)
      assert.ok(Number(await scrubber.inputValue()) > progressBeforeWheel, 'wheel over timeline must seek forward')
      assert.equal(await page.evaluate(() => window.scrollY), scrollBeforeWheel, 'wheel over timeline must not scroll the page')
      await page.locator('.atlas-timeline input[type="range"]').fill('1000')
      const insights = page.locator('.atlas-playback-insights')
      await insights.waitFor()
      assert.equal(await insights.getAttribute('data-window-months'), '6')
      assert.equal(await insights.getAttribute('data-leading-topic'), 'AI-инструменты и контент')
      assert.equal(await insights.getAttribute('data-career-companies'), 'TON Foundation')
      assert.deepEqual(
        await insights.locator('.atlas-insight-card').evaluateAll(elements => elements.map(element => element.getAttribute('data-insight'))),
        ['career', 'leading'],
        'playback context must show work first and the leading topic second',
      )
      assert.doesNotMatch(await insights.textContent(), /Рост|п\.п\./, 'playback context must omit growth in percentage points')
      await page.locator('.atlas-map-block').screenshot({ path: `${artifacts}/telegram-map-v3-playback-desktop.png` })
      await page.locator('.atlas-history-button').click()
      assert.equal(await canvas.getAttribute('data-playback-active'), 'false', 'all-history action must exit playback mode')
      assert.equal(await page.locator('.atlas-career-context').count(), 0, 'career context must hide after returning to all history')
      assert.equal(await page.locator('.atlas-playback-insights').count(), 0, 'insights must hide after returning to all history')
      assert.equal(await page.locator('.atlas-filter-panel').count(), 1, 'topic filters must return after leaving evolution')
    }

    if (viewport.name.startsWith('mobile')) {
      await page.locator('.atlas-play-button').click()
      await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.playbackActive === 'true')
      const evolutionControls = await page.evaluate(() => {
        const bounds = (selector) => {
          const box = document.querySelector(selector)?.getBoundingClientRect()
          return box && box.width > 0 && box.height > 0 ? { x: box.x, y: box.y, width: box.width, height: box.height } : null
        }
        return {
          row: bounds('.atlas-search-row'),
          play: bounds('.atlas-play-button'),
          exit: bounds('.atlas-history-button'),
          historyLabelDisplay: getComputedStyle(document.querySelector('.atlas-history-label')).display,
          historyIconDisplay: getComputedStyle(document.querySelector('.atlas-history-icon')).display,
        }
      })
      assert.ok(evolutionControls.row && evolutionControls.play && evolutionControls.exit, `mobile evolution controls must be visible: ${JSON.stringify(evolutionControls)}`)
      assert.ok(Math.abs(evolutionControls.play.y - evolutionControls.exit.y) <= 1, `mobile evolution controls must share one row: ${JSON.stringify(evolutionControls)}`)
      assert.ok(evolutionControls.row.height <= 50, `mobile evolution controls must stay one compact row, got ${evolutionControls.row.height}px`)
      assert.ok(Math.abs(evolutionControls.exit.width - evolutionControls.exit.height) <= 1, `mobile evolution exit control must be square: ${JSON.stringify(evolutionControls.exit)}`)
      assert.equal(evolutionControls.historyLabelDisplay, 'none', 'mobile evolution exit must hide the “Вся история” label')
      assert.notEqual(evolutionControls.historyIconDisplay, 'none', 'mobile evolution exit must show the close icon')
      await page.locator('.atlas-search-row').screenshot({ path: `${artifacts}/telegram-map-v4-${viewport.name}-evolution-controls.png` })
      await page.locator('.atlas-play-button').click()
      await page.locator('.atlas-timeline input[type="range"]').fill('1000')
      await page.locator('.atlas-playback-insights').waitFor()
      assert.equal(await page.locator('.atlas-workspace .atlas-playback-insights').count(), 0, 'mobile insights must not overlay the canvas')
      const criticalMetrics = await page.locator('.atlas-insight-card strong em').evaluateAll(elements => elements.map(element => {
        const metric = element.getBoundingClientRect()
        const card = element.closest('.atlas-insight-card')?.getBoundingClientRect()
        return { text: element.textContent || '', width: metric.width, left: metric.left, right: metric.right, cardLeft: card?.left || 0, cardRight: card?.right || 0 }
      }))
      assert.equal(criticalMetrics.length, 1, 'mobile insights must expose only the leading topic share')
      for (const metric of criticalMetrics) {
        assert.ok(metric.width > 0 && metric.left >= metric.cardLeft - 1 && metric.right <= metric.cardRight + 1, `critical mobile metric must not be clipped: ${JSON.stringify(metric)}`)
      }
      const mobileLayout = await page.evaluate(() => {
        const bounds = (selector) => {
          const box = document.querySelector(selector)?.getBoundingClientRect()
          return box ? { x: box.x, y: box.y, width: box.width, height: box.height } : null
        }
        return {
          workspace: bounds('.atlas-workspace'),
          panel: bounds('.atlas-lower-panel'),
          insights: bounds('.atlas-playback-insights'),
        }
      })
      const mobileWorkspaceBox = mobileLayout.workspace
      const mobilePanelBox = mobileLayout.panel
      const mobileInsightsBox = mobileLayout.insights
      assert.ok(mobileWorkspaceBox && mobilePanelBox && mobileInsightsBox, 'mobile map and lower panel must have bounds')
      assert.ok(
        mobilePanelBox.y >= mobileWorkspaceBox.y + mobileWorkspaceBox.height - 3,
        `mobile lower panel may share only its border with the canvas: workspace=${JSON.stringify(mobileWorkspaceBox)} panel=${JSON.stringify(mobilePanelBox)}`,
      )
      assert.ok(
        mobileInsightsBox.y >= mobileWorkspaceBox.y + mobileWorkspaceBox.height - 1,
        `mobile insight text must begin below the canvas: workspace=${JSON.stringify(mobileWorkspaceBox)} insights=${JSON.stringify(mobileInsightsBox)}`,
      )
      assert.ok(mobilePanelBox.height <= 130, `mobile lower panel must stay compact, got ${mobilePanelBox.height}px`)
      assert.ok(mobileInsightsBox.height <= 72, `mobile insights must stay terse, got ${mobileInsightsBox.height}px`)
      await page.locator('.atlas-map-block').screenshot({ path: `${artifacts}/telegram-map-v3-playback-mobile.png` })
      await page.locator('.atlas-history-button').click()
    }

    if (viewport.name.startsWith('mobile')) await page.locator('.atlas-search-toggle').click()
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

    if (viewport.name.startsWith('mobile')) {
      assert.equal(await page.locator('.atlas-search input').isVisible(), false, 'selecting a mobile search result must collapse search')
    } else {
      await page.locator('.atlas-search input').fill('')
    }
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
