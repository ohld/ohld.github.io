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

const publicEntries = [
  ...listRepoEntries('public'),
  ...listRepoEntries('migration'),
  ...listRepoEntries('content'),
]

for (const entry of publicEntries) {
  const normalized = String(entry).toLowerCase()
  for (const hint of forbiddenPathHints) {
    if (normalized.includes(hint)) {
      fail(`public repository contains suspicious path "${entry}"`)
    }
  }
}

if (!process.exitCode) {
  console.log('Public safety check passed')
}
