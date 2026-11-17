import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkEditorial, routeInventory } from './check-editorial.mjs'
import { staticPrerenderRoutes } from './prerender-routes.mjs'

const routes = new Set(['/ru/blog/', '/ru/blog/first/', '/ru/articles/second/'])
const filler = Array.from({ length: 130 }, (_, i) => `Проверил шаг ${i} на живом сервере руками.`).join(' ')
const post = ({ body, description = 'Короткое описание.' }) => `---
slug: sample
title: Пример
description: ${description}
publishedAt: 2026-11-01
updatedAt: 2026-11-01
readingTime: 5 мин
---

${body}
`
const good = `${filler}

## Раз

- пункт со [ссылкой](/ru/blog/first/)

## Два

Текст и [вторая ссылка](https://okhlopkov.com/ru/articles/second).

## Три

Текст.

## Четыре

Текст.`
const check = (body, options = {}) => checkEditorial(post({ body, ...options }), { routes, ...options })

test('a clean new post passes without warnings', () => {
  const result = check(good)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.warnings, [])
  assert.ok(result.words >= 600)
})

test('thin new post: word count, artifact, internal links and FAQ are errors', () => {
  const { errors } = check('Короткий текст.\n\n## FAQ\n\nОтвет.')
  for (const pattern of [/at least 600/, /no code block, table or list/, /0 internal links/, /FAQ section \(line 12\)/]) assert.ok(errors.some((error) => pattern.test(error)), String(pattern))
  const update = check('Короткий текст.\n\n- пункт', { isNew: false })
  assert.deepEqual(update.errors, ['0 internal links to existing pages; a post needs at least 2'])
  assert.ok(update.warnings.some((warning) => /at least 600/.test(warning)))
})

test('banned phrases fail in body and description; contrast construction only warns', () => {
  const result = check(`${good}\n\nДавайте разберёмся. I am excited to share this. Это не чат, а команда.`, { description: 'Это decision page.' })
  for (const pattern of [/filler opener: "давайте разберемся"/, /LinkedIn tone: "excited to share"/, /editorial mechanics: "decision page" \(description\)/]) assert.ok(result.errors.some((error) => pattern.test(error)), String(pattern))
  assert.ok(result.warnings.some((warning) => /не X, а Y/.test(warning)))
  assert.deepEqual(check(`${good}\n\n\`\`\`\nдавайте разберемся: https://example.com\n\`\`\`\n\nКод \`delve\` не считается.`).errors, [])
})

test('bare URLs, extra H1 and invented internal links are errors', () => {
  const { errors } = check(`# Второй заголовок\n\n${good}\n\nСмотрите https://example.com и [https://example.com](https://example.com), а ещё [тут](/ru/blog/missing/) и [файл](/assets/missing.webp).`, { assetExists: () => false })
  for (const pattern of [/body has an H1 \(line 10\)/, /bare URL \(line/, /bare URL as link text/, /not in the route inventory: \/ru\/blog\/missing\//, /linked file does not exist: \/assets\/missing.webp/]) assert.ok(errors.some((error) => pattern.test(error)), String(pattern))
})

test('heading count and undated prices or versions warn', () => {
  const { errors, warnings } = check(`${good}\n\nТариф стоит $20 в месяц.\n\nВ ноябре 2026 вышла v2.1 за $5.\n\n## Пять\n\n## Шесть\n\n## Семь\n\n## Восемь`)
  assert.deepEqual(errors, [])
  assert.deepEqual(warnings, ['8 H2 headings; aim for 4-7', 'price, version or limit without a date or source in the same paragraph (line 28)'])
})

test('updates need two distinct destinations; self links and images do not count', () => {
  const body = '- [одна](/ru/blog/first/) [та же](/ru/blog/first/#part) ![картинка](/ru/articles/second/) [сам](/ru/blog/sample/)'
  const result = check(body, { isNew: false, routes: new Set([...routes, '/ru/blog/sample/']) })
  assert.ok(result.errors.includes('1 internal links to existing pages; a post needs at least 2'))
})

test('code fences close only on a matching marker of sufficient length', () => {
  const result = check(`${good}\n\n\`\`\`\`markdown\n\`\`\`\n~~~\nДавайте разберемся https://example.com\n\`\`\`\`\n\nКод \`\`https://example.com и \`delve\`\` здесь.`)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.warnings, [])
  assert.ok(check(`${good}\n\n~~~\nignored\n~~~\nДавайте разберемся`).errors.some((error) => /filler opener/.test(error)))
})

test('other H1 forms fail and bare URLs in metadata fail', () => {
  for (const extra of ['   # Второй', 'Второй\n===', '<h1>Второй</h1>']) {
    assert.ok(check(`${good}\n\n${extra}`).errors.some((error) => /body has an H1/.test(error)))
  }
  assert.ok(check(good, { description: 'Сайт https://example.com' }).errors.some((error) => /bare URL \(description\)/.test(error)))
})

test('reference definitions and HTML attributes cannot hide broken internal links', () => {
  const result = check(`${good}\n\n[данные][source]\n\n[source]: /ru/blog/missing/\n\n<a href="/ru/articles/missing/">Руководство</a>`)
  for (const target of ['/ru/blog/missing/', '/ru/articles/missing/']) {
    assert.ok(result.errors.some((error) => error.includes(`not in the route inventory: ${target}`)))
  }
})

test('an HTTPS link to a different hostname is external; protocol-relative site links are checked', () => {
  const result = check(`${good}\n\n[внешняя](https://okhlopkov.com.example.com/ru/blog/missing/) [битая](//okhlopkov.com/ru/blog/missing/)`)
  assert.equal(result.errors.filter((error) => /not in the route inventory/.test(error)).length, 1)
})

test('numeric limits need a date or source hint; vague limits are left to review', () => {
  const result = check(`${good}\n\nЛимит 100 запросов.\n\nQuota: 20 calls.\n\n100 requests/minute.\n\nЛимит 50 запросов по [документации](https://example.com).\n\nЛимиты бывают разными.`)
  assert.deepEqual(result.errors, [])
  assert.equal(result.warnings.filter((warning) => /price, version or limit/.test(warning)).length, 3)
})

test('links to the existing private channel pass the editorial gate', () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const publicRoutes = routeInventory(root)
  const body = `${filler}\n\n- [Канал](/private-channel/)\n- [Обо мне](/about/)`
  assert.deepEqual(check(body, { routes: publicRoutes }).errors, [])
  for (const route of staticPrerenderRoutes(root)) assert.ok(publicRoutes.has(route), route)
})

test('the route inventory follows static prerender declarations, including appended routes', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-editorial-routes-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const directory of ['scripts', 'content/blog-posts', 'content/seo-articles', 'content/articles']) fs.mkdirSync(path.join(root, directory), { recursive: true })
  const write = (file, text) => fs.writeFileSync(path.join(root, file), text)
  write('content/articles/imported-index.json', '[]')
  write('content/articles/legacy-redirects.json', '[]')
  write('content/topic-hubs.json', '{"hubs": []}')
  write('scripts/prerender.mjs', `
    const unrelated = { path: '/not-a-route' }
    const ROUTES = [{ path: '/' }, { path: '/new-static-page' }]
    ROUTES.push({ path: '/appended-static-page/' })
    ROUTES.push({ path: dynamicPath })
  `)
  assert.deepEqual([...routeInventory(root)], ['/', '/new-static-page/', '/appended-static-page/'])
})
