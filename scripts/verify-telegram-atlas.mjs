import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const datasetPath = resolve(process.cwd(), 'public/data/telegram-atlas.json')
const raw = await readFile(datasetPath, 'utf8')
const data = JSON.parse(raw)

assert.equal(data.version, 1, 'atlas version must be 1')
assert.equal(data.meta?.source, 'gbrain:writings', 'unexpected atlas source')
assert.ok(typeof data.meta?.generatedAt === 'string', 'generatedAt is required')
assert.ok(Array.isArray(data.topics) && data.topics.length >= 5 && data.topics.length <= 16, 'expected 5–16 topics')
assert.ok(Array.isArray(data.posts) && data.posts.length >= 1000, 'expected at least 1000 posts')
assert.equal(data.meta.posts, data.posts.length, 'meta.posts must match the post array')

const forbiddenKeys = new Set(['vector', 'embedding', 'embeddings', 'scale', 'database_url', 'token', 'api_key'])
function assertPublicShape(value, path = 'atlas') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertPublicShape(item, `${path}[${index}]`))
    return
  }
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    assert.ok(!forbiddenKeys.has(key.toLowerCase()), `private field ${path}.${key}`)
    assertPublicShape(nested, `${path}.${key}`)
  }
}
assertPublicShape(data)

const topicIds = new Set(data.topics.map(topic => topic.id))
assert.equal(topicIds.size, data.topics.length, 'topic IDs must be unique')
for (const topic of data.topics) {
  assert.ok(typeof topic.label === 'string' && topic.label.length >= 2, 'topic label is required')
  assert.match(topic.color, /^#[0-9a-f]{6}$/i, 'topic color must be hex')
  assert.ok(Number.isInteger(topic.count) && topic.count > 0, 'topic count must be positive')
}

assert.equal(data.topics.reduce((sum, topic) => sum + topic.count, 0), data.posts.length, 'topic counts must cover every post')

const ids = new Set()
for (const post of data.posts) {
  assert.ok(Number.isInteger(post.id) && post.id > 0, 'post.id must be a positive integer')
  assert.ok(!ids.has(post.id), `duplicate post id ${post.id}`)
  ids.add(post.id)
  assert.match(post.url, /^https:\/\/t\.me\/danokhlopkov\/\d+$/, `invalid URL for ${post.id}`)
  assert.match(post.date, /^\d{4}-\d{2}-\d{2}/, `invalid date for ${post.id}`)
  assert.equal(post.year, Number(post.date.slice(0, 4)), `year mismatch for ${post.id}`)
  assert.ok(typeof post.text === 'string' && post.text.trim().length > 0, `empty text for ${post.id}`)
  for (const metric of ['views', 'reactions', 'comments', 'forwards']) {
    assert.ok(Number.isInteger(post[metric]) && post[metric] >= 0, `invalid ${metric} for ${post.id}`)
  }
  assert.equal(typeof post.hasMedia, 'boolean', `invalid hasMedia for ${post.id}`)
  assert.ok(Number.isFinite(post.x) && post.x >= 0 && post.x <= 1, `invalid x for ${post.id}`)
  assert.ok(Number.isFinite(post.y) && post.y >= 0 && post.y <= 1, `invalid y for ${post.id}`)
  assert.ok(topicIds.has(post.topic), `unknown topic for ${post.id}`)
  assert.ok(Array.isArray(post.neighbors) && post.neighbors.length <= 8, `invalid neighbors for ${post.id}`)
}

for (const post of data.posts) {
  for (const neighbor of post.neighbors) {
    assert.ok(ids.has(neighbor.id), `missing neighbor ${neighbor.id} for ${post.id}`)
    assert.notEqual(neighbor.id, post.id, `post ${post.id} cannot neighbor itself`)
    assert.ok(Number.isFinite(neighbor.similarity) && neighbor.similarity >= -1 && neighbor.similarity <= 1, `invalid similarity for ${post.id}`)
  }
}

const bytes = Buffer.byteLength(raw)
assert.ok(bytes < 6_000_000, `atlas JSON is too large: ${bytes} bytes`)
console.log(JSON.stringify({ posts: data.posts.length, topics: data.topics.length, bytes }))
