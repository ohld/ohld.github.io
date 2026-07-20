#!/usr/bin/env node
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { chromium } from 'playwright-core'

const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4207').replace(/\/+$/, '')
const executable = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean).find(candidate => fs.existsSync(candidate))

const browser = await chromium.launch(executable ? { executablePath: executable, headless: true } : { headless: true })

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 })
  await context.addInitScript(() => {
    const counters = { radialGradients: 0, arcs: 0, fills: 0, backgroundFills: 0, drawImages: 0, fullCanvasDrawImages: 0 }
    Object.defineProperty(window, '__atlasCanvasCounters', { value: counters })
    const prototype = CanvasRenderingContext2D.prototype
    const wrap = (method, key) => {
      const original = prototype[method]
      prototype[method] = function (...args) {
        counters[key] += 1
        return original.apply(this, args)
      }
    }
    wrap('createRadialGradient', 'radialGradients')
    wrap('arc', 'arcs')
    const fill = prototype.fill
    prototype.fill = function (...args) {
      counters.fills += 1
      if (this.canvas?.classList?.contains('atlas-canvas-background')) counters.backgroundFills += 1
      return fill.apply(this, args)
    }
    const drawImage = prototype.drawImage
    prototype.drawImage = function (...args) {
      counters.drawImages += 1
      const source = args[0]
      if (source && source.width >= 1_000 && source.height >= 500) counters.fullCanvasDrawImages += 1
      return drawImage.apply(this, args)
    }
  })
  const page = await context.newPage()
  await page.goto(`${baseUrl}/karta-postov-telegram/`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.totalPosts === '1556')

  const dimensions = await page.locator('canvas.atlas-canvas').evaluate(element => {
    const bounds = element.getBoundingClientRect()
    return {
      cssWidth: bounds.width,
      cssHeight: bounds.height,
      backingWidth: element.width,
      backingHeight: element.height,
      renderDpr: Number(element.dataset.renderDpr),
      deviceDpr: window.devicePixelRatio,
    }
  })
  const horizontalScale = dimensions.backingWidth / dimensions.cssWidth
  const verticalScale = dimensions.backingHeight / dimensions.cssHeight
  assert.equal(dimensions.deviceDpr, 2, 'performance smoke must emulate a Retina display')
  assert.ok(horizontalScale <= 1.51 && verticalScale <= 1.51, `Retina backing scale must be capped at 1.5x: ${JSON.stringify(dimensions)}`)
  assert.equal(dimensions.renderDpr, 1.5, 'canvas must expose its capped render DPR')
  console.log(`OK Retina canvas is capped at ${dimensions.renderDpr}x (${dimensions.backingWidth}×${dimensions.backingHeight})`)

  await page.evaluate(() => {
    for (const key of Object.keys(window.__atlasCanvasCounters)) window.__atlasCanvasCounters[key] = 0
  })
  await page.locator('.atlas-play-button').click()
  await page.waitForFunction(() => document.querySelector('canvas.atlas-canvas')?.dataset.playbackActive === 'true')
  await page.waitForTimeout(350)
  const activationCounters = await page.evaluate(() => ({ ...window.__atlasCanvasCounters }))
  const totalPosts = Number(await page.locator('canvas.atlas-canvas').getAttribute('data-total-posts'))
  assert.ok(activationCounters.backgroundFills >= totalPosts, `cached ghosts must use separate fills so overlaps preserve density: ${JSON.stringify(activationCounters)}`)
  console.log(`OK cached ghost overlaps preserve accumulated density (${activationCounters.backgroundFills} background fills)`)
  const ghostMaskSample = await page.evaluate(async () => {
    const response = await fetch('/data/telegram-atlas.json')
    const data = await response.json()
    const postTime = post => new Date(`${post.date.slice(0, 10)}T12:00:00Z`).getTime()
    const times = data.posts.map(postTime)
    const min = Math.min(...times)
    const max = Math.max(...times)
    const progress = Number(document.querySelector('input[aria-label="Временная шкала постов"]')?.value || 0)
    const playhead = min + (max - min) * progress / 1000
    const windowStart = new Date(playhead)
    windowStart.setUTCMonth(windowStart.getUTCMonth() - 6)
    const canvas = document.querySelector('canvas.atlas-canvas')
    const bounds = canvas.getBoundingClientRect()
    const visible = data.posts
      .filter(post => {
        const time = postTime(post)
        return time >= windowStart.getTime() && time <= playhead
      })
      .map(post => ({
        post,
        time: postTime(post),
        x: 30 + post.x * Math.max(1, bounds.width - 60),
        y: 30 + post.y * Math.max(1, bounds.height - 60),
      }))
      .filter(point => point.x >= 0 && point.y >= 0 && point.x < bounds.width && point.y < bounds.height)
    if (!visible.length) throw new Error('playback sample must include visible posts')
    for (const point of visible) {
      point.nearest = Math.min(...visible.filter(other => other !== point).map(other => Math.hypot(point.x - other.x, point.y - other.y)), Infinity)
    }
    visible.sort((left, right) => left.time - right.time || right.nearest - left.nearest)
    const sample = visible.find(point => point.nearest >= 8) || visible[0]
    const dpr = Number(canvas.dataset.renderDpr)
    const pixel = canvas.getContext('2d').getImageData(Math.round(sample.x * dpr), Math.round(sample.y * dpr), 1, 1).data
    return { alpha: pixel[3], postId: sample.post.id, progress, visiblePosts: visible.length }
  })
  assert.equal(ghostMaskSample.alpha, 255, `active points must mask their cached ghost before opacity is applied: ${JSON.stringify(ghostMaskSample)}`)
  console.log(`OK active point masks its cached ghost (${JSON.stringify(ghostMaskSample)})`)
  const playheadBeforeMeasurement = ghostMaskSample.progress
  await page.evaluate(() => {
    for (const key of Object.keys(window.__atlasCanvasCounters)) window.__atlasCanvasCounters[key] = 0
  })
  await page.waitForTimeout(1000)
  const counters = await page.evaluate(() => ({ ...window.__atlasCanvasCounters }))
  const playheadAfterMeasurement = await page.locator('input[aria-label="Временная шкала постов"]').inputValue().then(Number)
  assert.ok(playheadAfterMeasurement > playheadBeforeMeasurement, `playhead must advance during performance measurement: ${playheadBeforeMeasurement} -> ${playheadAfterMeasurement}`)
  console.log(`OK playhead advanced during measurement (${playheadBeforeMeasurement} -> ${playheadAfterMeasurement})`)
  assert.ok(counters.radialGradients <= 20, `playback must reuse point/background gradients, got ${counters.radialGradients}/s`)
  assert.equal(counters.backgroundFills, 0, `playback must not rebuild the cached ghost field: ${JSON.stringify(counters)}`)
  assert.ok(counters.arcs <= 2_000, `playback must reuse the historical ghost field, got ${counters.arcs} arc draws/s`)
  assert.ok(counters.drawImages >= 100, `playback must draw cached bitmap layers/sprites, got ${counters.drawImages}/s`)
  assert.equal(counters.fullCanvasDrawImages, 0, `playback must not copy a full-canvas bitmap every tick: ${JSON.stringify(counters)}`)
  console.log(`OK playback reuses cached Canvas work (${JSON.stringify(counters)})`)

  await context.close()
} finally {
  await browser.close()
}
