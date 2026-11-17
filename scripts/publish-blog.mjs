#!/usr/bin/env node
// Registers a new or updated RU/EN Markdown post: validates frontmatter and regenerates the
// two src registries from content/blog-posts/*.md and content/seo-articles/*.md, so the build
// emits the static page, sitemap entry, cards and .md mirror. Never commits or pushes.
//   npm run publish:blog -- --file content/blog-posts/<name>.md
//   npm run check:blog-registry        (fails when a registry differs from the Markdown files)
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import { PRIVATE_FIELDS, arrayDeclaration, assert, inventory, objectValue, parseMarkdown, renderCard, sourceFile } from './content-loop/content.mjs'
import { staticPrerenderRoutes } from './prerender-routes.mjs'

const RUNTIME = 'src/generatedBlogPosts.ts'
const METADATA = 'src/generatedBlogMetadata.ts'
const SECTIONS = [
  { dir: 'content/blog-posts', section: 'blog', prefix: 'blog', runtimeArray: 'sources', metaArray: 'generatedBlogPostMeta' },
  { dir: 'content/seo-articles', section: 'articles', prefix: 'article', runtimeArray: 'articleSources', metaArray: 'generatedArticlePostMeta' },
]
const binding = (prefix, name) => prefix + name.replace(/\.md$/, '').split(/[^a-zA-Z0-9]+/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join('')
const normalizeKeyword = (value = '') => value.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()

function markdownFiles(root, dir) {
  return fs.readdirSync(path.join(root, dir)).filter((name) => name.endsWith('.md')).sort()
}

function splice(text, edits) {
  for (const [start, end, replacement] of edits.sort((a, b) => b[0] - a[0])) text = text.slice(0, start) + replacement + text.slice(end)
  return text
}

// Returns the two registry files as they must look for the Markdown files currently on disk.
export function generateRegistries(root) {
  const runtimeText = fs.readFileSync(path.join(root, RUNTIME), 'utf8')
  const metadataText = fs.readFileSync(path.join(root, METADATA), 'utf8')
  const runtime = sourceFile(runtimeText, RUNTIME)
  const metadata = sourceFile(metadataText, METADATA)
  const rawImports = runtime.statements.filter((node) => ts.isImportDeclaration(node) && /^\.\.\/content\/.+\.md\?raw$/.test(node.moduleSpecifier.text))
  const runtimeEdits = []
  const metadataEdits = []
  const importLines = []
  const bindings = new Set()

  for (const { dir, prefix, runtimeArray, metaArray } of SECTIONS) {
    const names = markdownFiles(root, dir)
    for (const name of names) {
      assert(/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(name), `Unsupported Markdown filename: ${dir}/${name}`)
      const id = binding(prefix, name)
      assert(!bindings.has(id), `Markdown filenames produce a duplicate import binding: ${name}`)
      bindings.add(id)
      importLines.push(`import ${id} from '../${dir}/${name}?raw'`)
    }
    const runtimeNode = arrayDeclaration(runtime, runtimeArray)
    runtimeEdits.push([runtimeNode.getStart(runtime), runtimeNode.end, `[\n${names.map((name) => `  ${binding(prefix, name)},\n`).join('')}]`])

    const metaNode = arrayDeclaration(metadata, metaArray)
    const previous = metaNode.elements.map((node) => objectValue(node, metadata))
    const entries = names.map((name) => {
      const { meta } = parseMarkdown(fs.readFileSync(path.join(root, dir, name), 'utf8'))
      // Card fields that frontmatter does not carry (a hand-picked thumbnailImage) survive regeneration.
      const kept = previous.find((entry) => entry.slug === meta.slug && entry.lang === meta.lang) || {}
      return `  ${renderCard(meta, kept)},\n`
    })
    metadataEdits.push([metaNode.getStart(metadata), metaNode.end, `[\n${entries.join('')}]`])
  }

  if (rawImports.length) {
    runtimeEdits.push([rawImports[0].getStart(runtime), rawImports[0].end, importLines.join('\n')])
    for (const node of rawImports.slice(1)) runtimeEdits.push([node.getFullStart(), node.end, ''])
  }
  else runtimeEdits.push([0, 0, importLines.join('\n') + '\n'])
  return { [RUNTIME]: splice(runtimeText, runtimeEdits), [METADATA]: splice(metadataText, metadataEdits) }
}

// Validates one post against the rest of the content inventory. Throws on errors, returns warnings.
export function validatePost(root, contentFile) {
  const config = SECTIONS.find(({ dir }) => path.dirname(contentFile) === dir)
  assert(config && contentFile.endsWith('.md'), '--file must be a Markdown file in content/blog-posts/ or content/seo-articles/')
  const raw = fs.readFileSync(path.join(root, contentFile), 'utf8')
  const { meta } = parseMarkdown(raw)
  assert(/^lang:\s*(ru|en)\s*$/m.test(raw.split('\n---\n')[0]), 'Explicit lang must be ru or en')
  assert(['ru', 'en'].includes(meta.lang), 'lang must be ru or en')
  assert(meta.primaryKeyword, 'Missing article field: primaryKeyword')
  for (const field of PRIVATE_FIELDS) assert(!(field in meta), `Private handoff field cannot enter public frontmatter: ${field}`)
  for (const field of ['canonical_path', 'content_file', 'format', 'section']) assert(!(field in meta), `Reserved inventory field: ${field}`)
  if (meta.coverImage) {
    assert(meta.coverAlt, 'coverImage requires coverAlt')
    assert(meta.coverImage.startsWith('/') && !meta.coverImage.startsWith('//') && path.posix.normalize(meta.coverImage) === meta.coverImage && !meta.coverImage.includes('\\'), 'coverImage must be a canonical root-relative public path')
    assert(meta.coverImage.startsWith('/') && fs.existsSync(path.join(root, 'public', meta.coverImage)), `Cover asset is missing: public${meta.coverImage}`)
  }

  const items = inventory(root) // also rejects duplicate canonical URLs
  const self = items.find((item) => item.content_file === contentFile)
  // The article renderer looks generated posts up by slug before custom articles. Reserve all
  // article identities, including imported and prerendered custom pages, across languages.
  const customArticles = [...staticPrerenderRoutes(root)].flatMap((canonical_path) => {
    const match = canonical_path.match(/^\/(?:ru\/|en\/)?articles\/([^/]+)\/$/)
    return match ? [{ slug: match[1], canonical_path, section: 'articles' }] : []
  })
  const sameSlug = [...items, ...customArticles].find((item) => item !== self && (item.section === 'articles' || item.format === 'legacy') && self.section === 'articles' && item.slug === self.slug)
  assert(!sameSlug, `Article slug is already used by ${sameSlug?.canonical_path}`)
  // Dates are editable, so they cannot grant a new URL ownership over an existing one.
  const owner = items.find((item) => item !== self && item.format === 'markdown' && item.lang === self.lang && normalizeKeyword(item.primaryKeyword) === normalizeKeyword(self.primaryKeyword))
  assert(!owner, `primaryKeyword "${self.primaryKeyword}" is already owned by ${owner?.canonical_path}; resolve the conflict before registering this page`)

  const warnings = []
  const length = (value, min, max, label) => {
    const size = [...value].length
    if (size < min || size > max) warnings.push(`${label} is ${size} characters; aim for ${min}-${max}`)
  }
  length(meta.seoTitle || meta.title, 55, 65, meta.seoTitle ? 'seoTitle' : 'title')
  length(meta.seoDescription || meta.description, 140, 160, meta.seoDescription ? 'seoDescription' : 'description')
  return { canonical_path: self.canonical_path, warnings }
}

export function publish(root, file) {
  const contentFile = path.relative(root, path.resolve(root, file)).split(path.sep).join('/')
  const { canonical_path, warnings } = validatePost(root, contentFile)
  validateChangedPosts(root, contentFile)
  const changed_files = writeRegistries(root)
  return { canonical_path, content_file: contentFile, changed_files, warnings }
}

// Full generation must not register a second, unvalidated draft as a side effect.
// Untouched legacy posts may have pre-existing keyword conflicts; validate this run's changes.
export function validateChangedPosts(root, selectedFile) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  let base
  try { base = git('merge-base', 'origin/main', 'HEAD') } catch { /* standalone fixtures: validate every post */ }
  const dirs = SECTIONS.map(({ dir }) => dir)
  const files = base
    ? [...git('diff', '--name-only', '--diff-filter=d', base, '--', ...dirs).split('\n'), ...git('ls-files', '--others', '--exclude-standard', '--', ...dirs).split('\n')]
    : dirs.flatMap((dir) => markdownFiles(root, dir).map((name) => `${dir}/${name}`))
  for (const file of new Set(files.filter((file) => file.endsWith('.md') && file !== selectedFile))) validatePost(root, file)
}

function staleRegistries(root) {
  return Object.entries(generateRegistries(root)).filter(([file, text]) => fs.readFileSync(path.join(root, file), 'utf8') !== text)
}

function writeRegistries(root) {
  const stale = staleRegistries(root)
  for (const [file, text] of stale) fs.writeFileSync(path.join(root, file), text)
  return stale.map(([file]) => file)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
    const args = process.argv.slice(2)
    if (args[0] === '--check' && args.length === 1) {
      validateChangedPosts(root)
      const stale = staleRegistries(root).map(([file]) => file)
      assert(!stale.length, `${stale.join(', ')} out of sync with content Markdown; run npm run publish:blog -- --file <path.md>`)
      console.log('✓ blog registries match content Markdown')
    } else {
      assert(args[0] === '--file' && args[1] && args.length === 2, 'Usage: npm run publish:blog -- --file content/blog-posts/<name>.md')
      console.log(JSON.stringify(publish(root, path.resolve(args[1])), null, 2))
    }
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
