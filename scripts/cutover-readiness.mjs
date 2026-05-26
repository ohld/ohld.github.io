#!/usr/bin/env node
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const siteUrl = (process.env.SITE_URL || 'https://okhlopkov.com').replace(/\/+$/, '')
const previewUrl = (process.env.CUTOVER_PREVIEW_URL || '').replace(/\/+$/, '')
const runPreviewChecks = process.env.CUTOVER_RUN_PREVIEW_CHECKS === '1' && previewUrl
const requirePreview = process.env.CUTOVER_REQUIRE_PREVIEW === '1'

const requiredFiles = [
  '.github/workflows/deploy-vps.yml',
  'Dockerfile',
  'compose.yaml',
  'nginx.conf',
  'content/articles/imported-index.json',
  'content/articles/imported-content.json',
  'migration/backlink-critical-urls.csv',
  'migration/cutover-checklist.md',
  'migration/vps-deploy.md',
  'scripts/verify-static-migration.mjs',
  'scripts/browser-smoke.mjs',
]

const requiredPackageScripts = [
  'build:okhlopkov',
  'check:public-safety',
  'cutover:live',
  'preflight:okhlopkov',
  'smoke:browser',
  'verify:live',
  'verify:migration',
]

const EXPECTED_IMPORTED_ARTICLES = 88
const EXPECTED_REDIRECTS = 25
const BASE_STATIC_PATHS = [
  '/',
  '/en/',
  '/en/blog/',
  '/en/articles/',
  '/en/about/',
  '/about/',
  '/blog/',
  '/articles/',
  '/articles/ai-tools-for-designers-design-engineering-agents/',
  '/articles/markdown-vs-html/',
  '/topics/ai-agents/',
  '/topics/claude-code/',
  '/topics/codex/',
  '/topics/mcp/',
  '/topics/gstack/',
  '/topics/gbrain/',
  '/topics/ai-coding/',
  '/topics/ai-transformation/',
  '/topics/refactoring/',
  '/topics/ai-tools/',
  '/topics/design-engineering/',
  '/topics/html/',
  '/topics/second-brain/',
  '/topics/web-scraping/',
  '/topics/frameworks/',
  '/topics/workflow/',
  '/topics/community/',
  '/topics/openclaw/',
  '/topics/ton-data/',
  '/topics/telegram-automation/',
  '/privacy/',
]
const GENERATED_BLOG_POSTS_PATH = 'content/blog-posts'
const REQUIRED_STATIC_PATHS = [
  ...BASE_STATIC_PATHS,
  ...readGeneratedBlogPaths(),
]

function parseFrontmatter(raw, filename = 'markdown file') {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error(`${filename}: missing frontmatter`)
  const meta = {}
  for (const line of match[1].split('\n')) {
    const separator = line.indexOf(':')
    if (separator === -1) continue
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return meta
}

function readGeneratedBlogPaths() {
  if (!fs.existsSync(GENERATED_BLOG_POSTS_PATH)) return []
  return fs.readdirSync(GENERATED_BLOG_POSTS_PATH)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const meta = parseFrontmatter(fs.readFileSync(`${GENERATED_BLOG_POSTS_PATH}/${file}`, 'utf8'), file)
      return `/blog/${meta.slug}/`
    })
    .sort()
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"'
        i += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''))
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const [headers, ...dataRows] = rows
  return dataRows
    .filter((dataRow) => dataRow.some(Boolean))
    .map((dataRow) => Object.fromEntries(headers.map((header, index) => [header, dataRow[index] || ''])))
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function read(path) {
  return fs.readFileSync(path, 'utf8')
}

const results = []

function pass(label) {
  results.push({ status: 'PASS', label })
}

function fail(label) {
  results.push({ status: 'FAIL', label })
}

function pending(label) {
  results.push({ status: 'PENDING', label })
}

function check(condition, okLabel, failLabel = okLabel) {
  if (condition) pass(okLabel)
  else fail(failLabel)
}

function runCommand(label, command, args, env) {
  const result = spawnSync(command, args, {
    env: { ...process.env, ...env },
    stdio: 'inherit',
  })
  if (result.status === 0) {
    pass(label)
    return true
  }
  fail(`${label} failed with exit ${result.status ?? 'unknown'}`)
  return false
}

for (const file of requiredFiles) {
  check(fs.existsSync(file), `required file exists: ${file}`, `missing required file: ${file}`)
}

if (fs.existsSync('package.json')) {
  const packageJson = readJson('package.json')
  for (const scriptName of requiredPackageScripts) {
    check(Boolean(packageJson.scripts?.[scriptName]), `package script exists: ${scriptName}`, `missing package script: ${scriptName}`)
  }
}

if (fs.existsSync('content/articles/imported-index.json')) {
  const importedArticles = readJson('content/articles/imported-index.json')
  const paths = new Set(importedArticles.map((article) => article.path).filter(Boolean))
  check(importedArticles.length === EXPECTED_IMPORTED_ARTICLES, `imported article catalog has ${EXPECTED_IMPORTED_ARTICLES} articles`, `imported article catalog has ${importedArticles.length}, expected ${EXPECTED_IMPORTED_ARTICLES}`)
  check(paths.size === importedArticles.length, 'imported article paths are unique', 'imported article catalog has duplicate paths')
}

if (fs.existsSync('migration/url-map.csv')) {
  const rows = parseCsv(read('migration/url-map.csv'))
  const preserved = rows.filter((row) => row.action === 'preserve_same_path')
  const redirects = rows.filter((row) => row.expected_status === '308')
  const staticPages = rows.filter((row) => row.action === 'new_static_page')
  const expectedRows = EXPECTED_IMPORTED_ARTICLES + EXPECTED_REDIRECTS + REQUIRED_STATIC_PATHS.length
  check(rows.length === expectedRows, `migration URL map has ${expectedRows} rows`, `migration URL map has ${rows.length} rows, expected ${expectedRows}`)
  check(preserved.length === EXPECTED_IMPORTED_ARTICLES, `migration URL map preserves ${EXPECTED_IMPORTED_ARTICLES} imported articles`, `migration URL map preserves ${preserved.length} imported articles, expected ${EXPECTED_IMPORTED_ARTICLES}`)
  check(redirects.length === EXPECTED_REDIRECTS, `migration URL map has ${EXPECTED_REDIRECTS} redirects`, `migration URL map has ${redirects.length} redirects, expected ${EXPECTED_REDIRECTS}`)
  check(staticPages.length === REQUIRED_STATIC_PATHS.length, `migration URL map has ${REQUIRED_STATIC_PATHS.length} new static pages`, `migration URL map has ${staticPages.length} new static pages, expected ${REQUIRED_STATIC_PATHS.length}`)
  for (const requiredPath of REQUIRED_STATIC_PATHS) {
    check(staticPages.some((row) => row.new_path === requiredPath), `migration URL map includes static page: ${requiredPath}`)
  }
  check(rows.some((row) => row.old_path === '/projects/' && row.new_path === '/about/'), 'backlink redirect row exists: /projects/ -> /about/')
}

if (fs.existsSync('migration/backlink-critical-urls.csv')) {
  const rows = parseCsv(read('migration/backlink-critical-urls.csv'))
  check(rows.length >= 9, `backlink-critical inventory has ${rows.length} rows`, `backlink-critical inventory has ${rows.length} rows, expected at least 9`)
  check(rows.some((row) => row.old_path === '/claude-code-compaction-explained/' && row.expected_status === '200'), 'backlink-critical preserves Claude Code compaction URL')
}

if (fs.existsSync('.github/workflows/deploy-vps.yml')) {
  const workflow = read('.github/workflows/deploy-vps.yml')
  check(workflow.includes('VERIFY_REQUIRE_REAL_REDIRECTS=1'), 'VPS workflow requires real redirects')
  check(workflow.includes('VERIFY_REQUIRE_ORIGIN_HEADERS=1'), 'VPS workflow requires origin cache headers')
  check(workflow.includes('npm run smoke:browser'), 'VPS workflow runs browser smoke')
  check(workflow.includes('for attempt in'), 'VPS workflow waits for health checks with retries')
}

if (fs.existsSync('package.json')) {
  const scripts = readJson('package.json').scripts || {}
  check(scripts['verify:live']?.includes('VERIFY_REQUIRE_EDGE_REDIRECTS=1'), 'live verifier requires edge redirects')
  check(scripts['verify:live']?.includes('VERIFY_REQUIRE_ORIGIN_HEADERS=1'), 'live verifier requires origin cache headers')
  check(scripts['cutover:live']?.includes('npm run smoke:browser'), 'live cutover command runs browser smoke')
}

if (previewUrl) {
  pass(`preview URL configured: ${previewUrl}`)
  if (runPreviewChecks) {
    runCommand('preview strict migration verifier', 'npm', ['run', 'verify:migration'], {
      VERIFY_BASE_URL: previewUrl,
      SITE_URL: siteUrl,
      VERIFY_REQUIRE_STRICT_404: '1',
      VERIFY_REQUIRE_REAL_REDIRECTS: '1',
      VERIFY_REQUIRE_ORIGIN_HEADERS: '1',
    })
    runCommand('preview browser smoke', 'npm', ['run', 'smoke:browser'], {
      SMOKE_BASE_URL: previewUrl,
      SITE_URL: siteUrl,
    })
  } else {
    pending('preview URL is set, but CUTOVER_RUN_PREVIEW_CHECKS=1 was not used')
  }
} else if (requirePreview) {
  fail('CUTOVER_PREVIEW_URL is required but not set')
} else {
  pending('preview/VPS origin not configured yet: set CUTOVER_PREVIEW_URL=https://preview-host')
}

pending('RU and non-RU reachability must be verified against the deployed preview origin')
pending('live edge redirects require DNS/Cloudflare cutover, then run npm run verify:live')
pending('Search Console/Yandex Webmaster sitemap submission happens only after live static origin is serving sitemap.xml')

let failed = false
for (const result of results) {
  if (result.status === 'FAIL') failed = true
  console.log(`${result.status.padEnd(7)} ${result.label}`)
}

const counts = results.reduce((acc, result) => {
  acc[result.status] = (acc[result.status] || 0) + 1
  return acc
}, {})
console.log(`\nCutover readiness: ${counts.PASS || 0} pass, ${counts.PENDING || 0} pending, ${counts.FAIL || 0} fail`)

if (failed) process.exit(1)
