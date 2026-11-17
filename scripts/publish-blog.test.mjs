import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateRegistries, publish, validateChangedPosts } from './publish-blog.mjs'
import { inventory, prepareUpdate } from './content-loop/content.mjs'

const post = (fields) => `---\n${Object.entries({ slug: 'first', title: 'Первый пост', description: 'Описание.', publishedAt: '2026-01-01', updatedAt: '2026-01-02', readingTime: '3 мин', lang: 'ru', tags: 'Codex, Claude Code', primaryKeyword: 'первый запрос', ...fields }).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n\nТекст.\n`

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-publish-blog-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const folder of ['content/blog-posts', 'content/seo-articles', 'content/articles', 'src', 'public/assets', 'scripts']) fs.mkdirSync(path.join(root, folder), { recursive: true })
  const write = (file, text) => fs.writeFileSync(path.join(root, file), text)
  const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
  write('content/articles/imported-index.json', '[]')
  write('scripts/prerender.mjs', "const ROUTES = [{ path: '/' }]\n")
  write('content/blog-posts/first.md', post({}))
  write('src/generatedBlogPosts.ts', "import old from '../content/blog-posts/first.md?raw'\n\nconst sources = [old]\nconst articleSources = []\nexport const all = [...sources, ...articleSources]\n")
  write('src/generatedBlogMetadata.ts', "const generatedBlogPostMeta = [{ slug: 'first', lang: 'ru', title: 'Stale', thumbnailImage: '/assets/card.webp' }]\nconst generatedArticlePostMeta = []\nexport const all = [generatedBlogPostMeta, generatedArticlePostMeta]\n")
  return { root, write, read }
}

test('a new EN post and a new RU article are registered; rerun changes nothing', (t) => {
  const { root, write, read } = fixture(t)
  write('content/blog-posts/first-en.md', post({ lang: 'en', title: "Dan's first post", primaryKeyword: 'first query' }))
  write('content/seo-articles/guide.md', post({ slug: 'guide', primaryKeyword: 'гайд' }))
  const result = publish(root, 'content/blog-posts/first-en.md')
  assert.equal(result.canonical_path, '/en/blog/first/')
  assert.deepEqual(result.changed_files, ['src/generatedBlogPosts.ts', 'src/generatedBlogMetadata.ts'])
  assert.equal(result.warnings.length, 2)

  const runtime = read('src/generatedBlogPosts.ts')
  assert.match(runtime, /^import blogFirstEn from '\.\.\/content\/blog-posts\/first-en\.md\?raw'\nimport blogFirst from .*\nimport articleGuide from '\.\.\/content\/seo-articles\/guide\.md\?raw'\n\nconst sources = \[\n {2}blogFirstEn,\n {2}blogFirst,\n\]\nconst articleSources = \[\n {2}articleGuide,\n\]\nexport/)
  const metadata = read('src/generatedBlogMetadata.ts')
  assert.match(metadata, /title: 'Dan\\'s first post',/)
  assert.match(metadata, /title: 'Первый пост',\n {4}description: 'Описание.',\n {4}publishedAt: '2026-01-01',\n {4}updatedAt: '2026-01-02',\n {4}lang: 'ru',\n {4}readingTime: '3 мин',\n {4}tags: \['Codex', 'Claude Code'\],\n {4}thumbnailImage: '\/assets\/card.webp',/)
  assert.match(metadata, /generatedArticlePostMeta = \[\n {2}\{\n {4}slug: 'guide',/)

  assert.deepEqual(publish(root, 'content/seo-articles/guide.md').changed_files, [])
  assert.deepEqual(generateRegistries(root), { 'src/generatedBlogPosts.ts': runtime, 'src/generatedBlogMetadata.ts': metadata })
})

test('an updated post refreshes its card', (t) => {
  const { root, write, read } = fixture(t)
  publish(root, 'content/blog-posts/first.md')
  write('content/blog-posts/first.md', post({ updatedAt: '2026-02-01', title: 'Новый заголовок' }))
  assert.deepEqual(publish(root, 'content/blog-posts/first.md').changed_files, ['src/generatedBlogMetadata.ts'])
  assert.match(read('src/generatedBlogMetadata.ts'), /title: 'Новый заголовок',[\s\S]*updatedAt: '2026-02-01',/)
})

test('custom article slugs cannot be shadowed by a new English article', (t) => {
  const { root, write, read } = fixture(t)
  write('scripts/prerender.mjs', fs.readFileSync(fileURLToPath(new URL('./prerender.mjs', import.meta.url)), 'utf8'))
  const files = ['src/generatedBlogPosts.ts', 'src/generatedBlogMetadata.ts']
  const before = files.map(read)
  for (const [slug, canonical] of [
    ['ai-tools-for-designers-design-engineering-agents', '/ru/articles/ai-tools-for-designers-design-engineering-agents/'],
    ['markdown-vs-html', '/articles/markdown-vs-html/'],
  ]) {
    write('content/seo-articles/custom-en.md', post({ slug, lang: 'en', primaryKeyword: 'custom guide' }))
    assert.throws(() => publish(root, 'content/seo-articles/custom-en.md'), { message: `Article slug is already used by ${canonical}` })
    assert.throws(() => validateChangedPosts(root), /Article slug is already used by/)
    assert.deepEqual(files.map(read), before)
  }
})

test('imported article identities participate in slug uniqueness across languages', (t) => {
  const { root, write, read } = fixture(t)
  write('content/articles/imported-index.json', JSON.stringify([{ path: '/imported-guide/', slug: 'imported-guide', lang: 'ru', title: 'Imported guide' }]))
  write('content/seo-articles/imported-en.md', post({ slug: 'imported-guide', lang: 'en', primaryKeyword: 'imported guide' }))
  const files = ['src/generatedBlogPosts.ts', 'src/generatedBlogMetadata.ts']
  const before = files.map(read)
  assert.throws(() => publish(root, 'content/seo-articles/imported-en.md'), /Article slug is already used by \/imported-guide\//)
  assert.throws(() => validateChangedPosts(root), /Article slug is already used by/)
  assert.deepEqual(files.map(read), before)
})

test('invalid posts are refused before any registry write', (t) => {
  const { root, write, read } = fixture(t)
  const before = read('src/generatedBlogMetadata.ts')
  const refuse = (fields, pattern, file = 'content/blog-posts/second.md') => {
    write(file, post({ slug: 'second', primaryKeyword: 'второй запрос', ...fields }))
    assert.throws(() => publish(root, file), pattern)
    fs.rmSync(path.join(root, file))
  }
  refuse({ primaryKeyword: 'Первый  ЗАПРОС' }, /already owned by \/ru\/blog\/first\//)
  refuse({ primaryKeyword: '' }, /primaryKeyword/)
  refuse({ lang: 'zh' }, /lang must be ru or en/)
  refuse({ publishedAt: '2026-02-30' }, /Invalid publishedAt/)
  refuse({ coverImage: '/assets/cover.webp' }, /coverImage requires coverAlt/)
  refuse({ coverImage: '/assets/cover.webp', coverAlt: 'Обложка' }, /Cover asset is missing/)
  refuse({ insight_id: 'private' }, /Private handoff field/)
  refuse({ slug: 'first' }, /Duplicate canonical URL/)
  refuse({}, /must be a Markdown file in content/, 'content/articles/second.md')
  write('content/seo-articles/a.md', post({ slug: 'same', primaryKeyword: 'a' }))
  refuse({ slug: 'same', lang: 'en' }, /Article slug is already used by \/ru\/articles\/same\//, 'content/seo-articles/b.md')
  assert.equal(read('src/generatedBlogMetadata.ts'), before)
  // Backdating a new URL must not steal a keyword from an existing URL.
  write('content/blog-posts/later.md', post({ slug: 'later', publishedAt: '2026-01-02' }))
  assert.throws(() => publish(root, 'content/blog-posts/first.md'), /already owned by/)
})

test('draft updater stays consistent with generated cards', (t) => {
  const { root, write, read } = fixture(t)
  publish(root, 'content/blog-posts/first.md')
  const target = inventory(root).find((item) => item.slug === 'first')
  const draft = post({ title: "Dan's updated guide", updatedAt: '2026-02-01', thumbnailImage: '/assets/new-card.webp' })
  const plan = prepareUpdate(root, target, draft)
  for (const [file, text] of Object.entries(plan.changes)) write(file, text)
  for (const [file, text] of Object.entries(generateRegistries(root))) assert.equal(read(file), text)
})

test('explicit language, public cover paths and import identities are enforced', (t) => {
  const { root, write, read } = fixture(t)
  write('content/blog-posts/first.md', post({}).replace('lang: ru\n', ''))
  assert.throws(() => publish(root, 'content/blog-posts/first.md'), /Explicit lang/)
  write('content/blog-posts/first.md', post({ coverImage: '/../package.json', coverAlt: 'Cover' }))
  assert.throws(() => publish(root, 'content/blog-posts/first.md'), /canonical root-relative/)
  write('content/blog-posts/first.md', post({}))
  write('content/blog-posts/a1.md', post({ slug: 'a1', primaryKeyword: 'one' }))
  write('content/blog-posts/a-1.md', post({ slug: 'a-1', primaryKeyword: 'two' }))
  const before = read('src/generatedBlogPosts.ts')
  assert.throws(() => publish(root, 'content/blog-posts/first.md'), /duplicate import binding/)
  assert.equal(read('src/generatedBlogPosts.ts'), before)
})

test('full generation cannot silently register an invalid second draft', (t) => {
  const { root, write, read } = fixture(t)
  const before = read('src/generatedBlogPosts.ts')
  write('content/blog-posts/unreviewed.md', post({ slug: 'unreviewed', primaryKeyword: '' }))
  assert.throws(() => publish(root, 'content/blog-posts/first.md'), /primaryKeyword/)
  assert.throws(() => validateChangedPosts(root), /primaryKeyword/)
  assert.equal(read('src/generatedBlogPosts.ts'), before)
})
