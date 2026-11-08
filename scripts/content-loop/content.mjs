import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

export function assert(ok, message) {
  if (!ok) throw new Error(message)
}

export function parseMarkdown(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]+)$/)
  assert(match, 'Expected complete article Markdown with frontmatter and body')
  const meta = {}
  for (const line of match[1].split('\n')) {
    const i = line.indexOf(':')
    assert(i > 0, 'Frontmatter supports one key: value per line')
    const key = line.slice(0, i).trim()
    assert(!(key in meta), `Duplicate frontmatter field: ${key}`)
    meta[key] = line.slice(i + 1).trim()
  }
  for (const key of ['slug', 'title', 'description', 'publishedAt', 'updatedAt', 'readingTime']) {
    assert(meta[key], `Missing article field: ${key}`)
  }
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug), 'Invalid article slug')
  meta.lang ||= 'ru'
  assert(['ru', 'en', 'zh'].includes(meta.lang), 'Invalid article language')
  for (const key of ['publishedAt', 'updatedAt']) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(meta[key]) && new Date(meta[key]).toISOString().startsWith(meta[key]), `Invalid ${key}`)
  }
  assert(meta.updatedAt >= meta.publishedAt, 'updatedAt precedes publishedAt')
  assert(match[2].trim(), 'Empty article body')
  return { meta, body: match[2] }
}

export function inventory(root) {
  const items = []
  for (const [directory, section] of [['blog-posts', 'blog'], ['seo-articles', 'articles']]) {
    for (const name of fs.readdirSync(path.join(root, 'content', directory)).filter((x) => x.endsWith('.md')).sort()) {
      const content_file = `content/${directory}/${name}`
      const { meta } = parseMarkdown(fs.readFileSync(path.join(root, content_file), 'utf8'))
      items.push({ canonical_path: `/${meta.lang}/${section}/${meta.slug}/`, content_file, format: 'markdown', section, ...meta })
    }
  }
  const legacy = JSON.parse(fs.readFileSync(path.join(root, 'content/articles/imported-index.json'), 'utf8'))
  for (const item of legacy) {
    items.push({ canonical_path: item.path, content_file: 'content/articles/imported-content.json', format: 'legacy', slug: item.slug, lang: item.lang, title: item.title, updatedAt: item.updatedAt })
  }
  const seen = new Set()
  for (const item of items) {
    assert(item.canonical_path && !seen.has(item.canonical_path), `Duplicate canonical URL: ${item.canonical_path}`)
    seen.add(item.canonical_path)
  }
  return items
}

function sourceFile(text, name) {
  return ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function arrayDeclaration(file, name) {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText(file) === name && declaration.initializer && ts.isArrayLiteralExpression(declaration.initializer)) return declaration.initializer
    }
  }
  throw new Error(`Missing registry array: ${name}`)
}

function literalValue(node) {
  if (ts.isStringLiteral(node)) return node.text
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue)
  throw new Error('Registry metadata must contain string literals or string arrays')
}

function objectValue(node, file) {
  assert(ts.isObjectLiteralExpression(node), 'Expected registry metadata object')
  return Object.fromEntries(node.properties.map((property) => {
    assert(ts.isPropertyAssignment(property), 'Unsupported registry metadata property')
    return [property.name.getText(file).replace(/^['"]|['"]$/g, ''), literalValue(property.initializer)]
  }))
}

export function prepareUpdate(root, target, draft) {
  assert(target.format === 'markdown', 'Update supports registered Markdown pages; legacy pages require manual review')
  const bodyPath = target.content_file
  const metadataPath = 'src/generatedBlogMetadata.ts'
  const runtimePath = 'src/generatedBlogPosts.ts'
  const originals = Object.fromEntries([bodyPath, metadataPath, runtimePath].map((p) => [p, fs.readFileSync(path.join(root, p), 'utf8')]))
  const { meta } = parseMarkdown(draft)
  for (const field of ['insight_id', 'evidence_urls', 'query_demand', 'metrics_plan', 'site_handoff', 'status']) assert(!(field in meta), `Private handoff field cannot enter public frontmatter: ${field}`)
  assert(meta.lang === 'ru' && meta.slug === target.slug, 'Draft identity does not match the intended RU URL')
  assert(meta.publishedAt === target.publishedAt, 'Update must preserve publishedAt')
  assert(meta.updatedAt >= target.updatedAt, 'Update cannot move updatedAt backwards')

  const runtime = sourceFile(originals[runtimePath], runtimePath)
  const imports = runtime.statements.filter(ts.isImportDeclaration).filter((node) => node.moduleSpecifier.text === `../${bodyPath}?raw`)
  assert(imports.length === 1, 'Article must have exactly one runtime body import')
  const binding = imports[0].importClause?.name?.text
  const runtimeArray = arrayDeclaration(runtime, target.section === 'blog' ? 'sources' : 'articleSources')
  assert(binding && runtimeArray.elements.filter((x) => ts.isIdentifier(x) && x.text === binding).length === 1, 'Article must appear exactly once in the runtime body registry')

  const file = sourceFile(originals[metadataPath], metadataPath)
  const metadataArray = arrayDeclaration(file, target.section === 'blog' ? 'generatedBlogPostMeta' : 'generatedArticlePostMeta')
  const matches = metadataArray.elements.map((node) => ({ node, value: objectValue(node, file) })).filter(({ value }) => value.slug === target.slug && value.lang === 'ru')
  assert(matches.length === 1, 'Article must appear exactly once in the card metadata registry')
  const { node, value } = matches[0]
  const fields = ['slug', 'title', 'description', 'seoTitle', 'seoDescription', 'publishedAt', 'updatedAt', 'lang', 'readingTime', 'tags', 'coverImage', 'coverAlt']
  for (const key of fields) {
    if (key === 'tags') value[key] = (meta.tags || '').split(',').map((x) => x.trim()).filter(Boolean)
    else if (meta[key]) value[key] = meta[key]
    else delete value[key]
  }
  const replacement = '{\n' + Object.entries(value).map(([key, val]) => `    ${key}: ${JSON.stringify(val)},`).join('\n') + '\n  }'
  const metadata = originals[metadataPath].slice(0, node.getStart(file)) + replacement + originals[metadataPath].slice(node.end)
  return { originals, changes: { [bodyPath]: draft, [metadataPath]: metadata }, registered_body: runtimePath }
}
