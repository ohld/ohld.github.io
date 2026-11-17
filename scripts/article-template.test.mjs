import assert from 'node:assert/strict'
import test from 'node:test'
import { articleEndingMarkdown, selectRelatedArticles } from '../src/articleEnding.mts'
import { headingId, withSectionLinks } from '../src/articleSections.mts'

test('heading IDs use normalized Cyrillic and visible inline text', () => {
  assert.equal(headingId('<strong>Ёлка</strong>: AI &amp; <code>MCP</code><br>Как начать?'), 'ёлка-ai-mcp-как-начать')
  assert.equal(headingId('Е\u0308лка'), 'ёлка')
  assert.equal(headingId('You can&rsquo;t cram everything'), 'you-cant-cram-everything')
  assert.equal(headingId('A&amp;B'), 'a-b')
  assert.equal(headingId('🗯️!'), 'section')
})

test('heading links use deterministic unique IDs and preserve imported fragments', () => {
  const input = '<h2>FAQ</h2><h3>FAQ</h3><h2 id="faq">Original</h2><h2>FAQ-2</h2><pre>&lt;h2&gt;FAQ&lt;/h2&gt;</pre>'
  const rendered = withSectionLinks(input, 'ru')
  assert.deepEqual([...rendered.matchAll(/<h[23] id="([^"]+)"/g)].map((match) => match[1]), ['faq-2', 'faq-3', 'faq', 'faq-2-2'])
  assert.equal((rendered.match(/aria-label="Скопировать ссылку на раздел"/g) || []).length, 4)
  assert.match(rendered, /<pre>&lt;h2&gt;FAQ&lt;\/h2&gt;<\/pre>/)
  assert.equal(withSectionLinks(input, 'ru'), rendered)
})

const article = (path, options = {}) => ({
  path,
  title: path,
  lang: 'ru',
  tags: [],
  publishedAt: '2026-11-17',
  ...options,
})

test('related selection ranks tags and hub membership within the article language', () => {
  const current = article('/ru/blog/current/', { tags: ['AI', 'Telegram'] })
  const sharedTags = article('/ru/blog/tagged/', { tags: ['telegram', 'AI', 'ai'], publishedAt: '2026-10-01' })
  const sharedHub = article('/legacy/', { title: 'Guide to Hermes' })
  const neither = article('/ru/articles/other/')
  const fallback = article('/ru/articles/z/')
  const candidates = [
    fallback,
    neither,
    sharedHub,
    article('/en/articles/english/', { lang: 'en', tags: ['AI', 'Telegram'] }),
    article('/ru/blog/current'),
    sharedTags,
    { ...sharedTags, path: '/ru/blog/tagged' },
  ]
  const topics = [{ aliases: ['hermes'], articlePaths: ['/ru/blog/current'] }]
  for (const rows of [candidates, [...candidates].reverse()]) {
    assert.deepEqual(selectRelatedArticles(current, rows, topics).map(({ path }) => path), [
      sharedTags.path,
      sharedHub.path,
      neither.path,
    ])
  }
})

test('Bot Revolution mirror includes its authored links in the related selection', () => {
  const markdown = articleEndingMarkdown('/en/blog/bot-revolution')
  assert.match(markdown, /^\n\n## Read next\n/)
  assert.match(markdown, /\]\(\/en\/articles\/hermes-agent-vps-telegram-setup\/\)/)
  assert.equal(markdown.match(/^- /gm)?.length, 3)
})
