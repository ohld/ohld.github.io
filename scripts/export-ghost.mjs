#!/usr/bin/env node
/**
 * Export Ghost posts into local JSON/HTML files for static migration.
 *
 * Required env:
 *   GHOST_URL=https://okhlopkov.com
 *   GHOST_ADMIN_KEY=<id>:<hex-secret>
 *
 * Output:
 *   private/ghost-export/posts.json
 *   private/ghost-export/posts/<slug>.html
 */
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const ghostUrl = process.env.GHOST_URL || 'https://okhlopkov.com'
const adminKey = process.env.GHOST_ADMIN_KEY
const outDir = process.env.GHOST_EXPORT_DIR || 'private/ghost-export'
const exportFilter = process.env.GHOST_EXPORT_FILTER || 'status:published'

if (!adminKey) {
  console.error('Missing GHOST_ADMIN_KEY')
  process.exit(1)
}

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function signJwt() {
  const [kid, secret] = adminKey.split(':')
  if (!kid || !secret) throw new Error('GHOST_ADMIN_KEY must be <id>:<hex-secret>')

  const iat = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT', kid }
  const payload = { iat, exp: iat + 300, aud: '/admin/' }
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`
  const signature = crypto
    .createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(unsigned)
    .digest('base64url')
  return `${unsigned}.${signature}`
}

async function ghostGet(pathname) {
  const url = new URL(pathname, ghostUrl)
  const res = await fetch(url, {
    headers: {
      Authorization: `Ghost ${signJwt()}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body.slice(0, 500)}`)
  }
  return res.json()
}

async function exportPosts() {
  await fs.mkdir(path.join(outDir, 'posts'), { recursive: true })

  const allPosts = []
  let page = 1
  let pages = 1
  do {
    const params = new URLSearchParams({
      limit: '100',
      page: String(page),
      formats: 'html',
      include: 'tags,authors',
      filter: exportFilter,
    })
    const data = await ghostGet(`/ghost/api/admin/posts/?${params}`)
    const posts = data.posts || []
    allPosts.push(...posts)
    pages = data.meta?.pagination?.pages || page
    page += 1
  } while (page <= pages)

  const manifest = allPosts.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    url: post.url,
    published_at: post.published_at,
    updated_at: post.updated_at,
    excerpt: post.excerpt,
    meta_title: post.meta_title,
    meta_description: post.meta_description,
    tags: (post.tags || []).map((tag) => tag.name),
    authors: (post.authors || []).map((author) => author.name),
  }))

  for (const post of allPosts) {
    const html = `---
title: ${JSON.stringify(post.title)}
slug: ${JSON.stringify(post.slug)}
published_at: ${JSON.stringify(post.published_at)}
updated_at: ${JSON.stringify(post.updated_at)}
---

${post.html || ''}
`
    await fs.writeFile(path.join(outDir, 'posts', `${post.slug}.html`), html)
  }

  await fs.writeFile(path.join(outDir, 'posts.json'), JSON.stringify(manifest, null, 2))
  console.log(`Exported ${allPosts.length} Ghost posts to ${outDir}`)
}

exportPosts().catch((err) => {
  console.error(err)
  process.exit(1)
})
