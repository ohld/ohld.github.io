#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const importedIndexPath = path.join('content', 'articles', 'imported-index.json')
const importedContentPath = path.join('content', 'articles', 'imported-content.json')
const outputDir = path.join('public', 'generated', 'imported-articles')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function fallbackSlug(articlePath = '') {
  return articlePath
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
}

const importedIndex = readJson(importedIndexPath)
const importedContent = readJson(importedContentPath)
const slugByPath = new Map(importedIndex.map((article) => [article.path, article.slug || fallbackSlug(article.path)]))

fs.rmSync(outputDir, { recursive: true, force: true })
fs.mkdirSync(outputDir, { recursive: true })

let count = 0
for (const article of importedContent) {
  const slug = slugByPath.get(article.path) || fallbackSlug(article.path)
  if (!slug) throw new Error(`${importedContentPath}: missing slug for ${article.path}`)
  fs.writeFileSync(
    path.join(outputDir, `${slug}.json`),
    `${JSON.stringify({ path: article.path, bodyHtml: article.bodyHtml || '' })}\n`,
  )
  count += 1
}

console.log(`✓ wrote imported article body files (${count})`)
