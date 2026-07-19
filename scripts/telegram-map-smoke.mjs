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

try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport })
    const errors = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    page.on('pageerror', error => errors.push(error.message))

    await page.goto(`${baseUrl}/telegram-map/?post=1718`, { waitUntil: 'networkidle' })
    await page.locator('.atlas-workspace').waitFor()
    await page.locator('.atlas-count').filter({ hasText: '1 556 из 1 556' }).waitFor()
    await page.locator('.atlas-post-text').filter({ hasText: 'Нескучном саду' }).waitFor()
    assert.match(page.url(), /post=1718/, 'deep link must survive initial data loading')
    assert.equal(await page.locator('canvas.atlas-canvas').count(), 1)
    assert.equal(await page.locator('.atlas-legend button').count(), 12)

    await page.locator('.atlas-search input').fill('настольный теннис')
    const result = page.locator('.atlas-search-results button').first()
    await result.waitFor()
    await result.click()
    await page.locator('.atlas-post-text').filter({ hasText: 'Нескучном саду' }).waitFor()
    assert.match(await page.locator('.atlas-telegram-link').getAttribute('href'), /\/1718$/)
    assert.match(page.url(), /post=1718/)

    if (viewport.name === 'desktop') {
      const beforeNeighbor = page.url()
      await page.locator('.atlas-neighbors button').first().click()
      assert.notEqual(page.url(), beforeNeighbor)
      assert.match(page.url(), /post=\d+/)
    }

    await page.locator('.atlas-search input').fill('')
    await page.screenshot({ path: `${artifacts}/telegram-map-${viewport.name}.png`, fullPage: false })
    if (viewport.name === 'mobile') {
      await page.locator('.atlas-canvas-wrap').screenshot({ path: `${artifacts}/telegram-map-mobile-canvas.png` })
    }

    const topicSelect = page.locator('.atlas-toolbar select').first()
    await topicSelect.selectOption({ index: 1 })
    const filteredCount = await page.locator('.atlas-count').textContent()
    assert.ok(filteredCount && !filteredCount.startsWith('1 556 из'), filteredCount || '')

    assert.deepEqual(errors, [], `Browser errors on ${viewport.name}: ${errors.join(' | ')}`)
    console.log(`OK ${viewport.name} search/select/filter/screenshot`)
    await page.close()
  }
} finally {
  await browser.close()
}
