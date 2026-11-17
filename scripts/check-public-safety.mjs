#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const forbiddenMetricFields = [
  'clicks_90d',
  'impressions_90d',
  'ctr_90d',
  'position_90d',
  'top_queries_90d',
  'priority_score',
]

const forbiddenPathHints = [
  '.env',
  'telegram.session',
  'session_string',
  'search-console-export',
  'gsc-export',
  'wordstat-export',
  'ghost-export',
  'ghost_admin',
  'ghost-admin',
  'ghost_admin_key',
  'ghost-admin-key',
]

const checkedFiles = [
  'content/articles/imported-index.json',
  'content/articles/imported-content.json',
  'migration/url-map.csv',
  'migration/README.md',
  'migration/visual-assets.md',
  'migration/search-console-debug.md',
]

function fail(message) {
  console.error(`Public safety check failed: ${message}`)
  process.exitCode = 1
}

function readIfExists(relativePath) {
  const fullPath = path.join(root, relativePath)
  if (!fs.existsSync(fullPath)) return ''
  return fs.readFileSync(fullPath, 'utf8')
}

for (const relativePath of checkedFiles) {
  const content = readIfExists(relativePath)
  if (!content) continue

  for (const field of forbiddenMetricFields) {
    if (content.includes(field)) {
      fail(`${relativePath} contains private analytics field "${field}"`)
    }
  }
}

const urlMap = readIfExists('migration/url-map.csv')
if (urlMap) {
  const header = urlMap.split('\n')[0] || ''
  for (const field of forbiddenMetricFields) {
    if (header.includes(field)) {
      fail(`migration/url-map.csv exposes private analytics column "${field}"`)
    }
  }
}

function listRepoEntries(relativeDir) {
  const fullDir = path.join(root, relativeDir)
  if (!fs.existsSync(fullDir)) return []
  return fs.readdirSync(fullDir, { recursive: true }).map((p) => `${relativeDir}/${p}`)
}

const publicEntries = listRepoEntries('public')
const contentEntries = listRepoEntries('content')

for (const entry of [...publicEntries, ...listRepoEntries('migration'), ...contentEntries]) {
  const normalized = String(entry).toLowerCase()
  for (const hint of forbiddenPathHints) {
    if (normalized.includes(hint)) {
      fail(`public repository contains suspicious path "${entry}"`)
    }
  }
}

// Published files must not carry local machine paths (cover sidecars used to leak the reference file path).
const textFile = /\.(json|md|txt|html|xml|csv|svg|js|css|ya?ml|webmanifest)$/i
// These two existing tutorials intentionally document the container's workspace.
// Exempt only their exact code examples, never a username across all public files.
const tutorials = ['ai-agent-na-servere-24-7', 'always-on-ai-agent-server-setup']
const scrubTutorial = (article) => ({ ...article, bodyHtml: article.bodyHtml.replace(/<code>\/home\/agent\/workspace\/(?:memory\.md)?<\/code>/g, '<code>container workspace</code>') })
for (const entry of [...publicEntries, ...contentEntries]) {
  const fullPath = path.join(root, String(entry))
  if (!textFile.test(fullPath) || !fs.statSync(fullPath).isFile()) continue
  const content = fs.readFileSync(fullPath, 'utf8')
  let scanned = content
  if (entry === 'content/articles/imported-content.json') {
    scanned = JSON.stringify(JSON.parse(content).map((article) =>
      tutorials.some((slug) => article.path === `/${slug}/`) ? scrubTutorial(article) : article))
  } else if (tutorials.some((slug) => entry === `public/generated/imported-articles/${slug}.json`)) {
    scanned = JSON.stringify(scrubTutorial(JSON.parse(content)))
  }
  // A URL pathname such as https://example.com/home/topic/ is not a local path.
  scanned = scanned.replace(/https?:\/\/[^\s<>"'`\\]+/gi, '')
  for (const match of scanned.matchAll(/(?<![\w.-])(?:\/(?:Users|home)\/[^\s/<>"'`\\]+|[a-z]:\\{1,2}Users\\{1,2}[^\s\\<>"'`]+)(?=[/\\\s<>"'`]|$)/gi)) {
    fail(`${entry} contains an absolute home path`)
  }
  if (/\.meta\.json$/.test(fullPath) && /"reference_path"/.test(content)) fail(`${entry} exposes "reference_path"`)
}

if (!process.exitCode) {
  console.log('Public safety check passed')
}
