import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('./check-public-safety.mjs', import.meta.url))
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'site-public-safety-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    fs.writeFileSync(path.join(root, file), text)
    const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' })
    fs.rmSync(path.join(root, file))
    return result
  }
}

test('public and content paths fail without disclosing the matched private path', (t) => {
  const run = fixture(t)
  for (const home of ['/Users/alice', '/Users/user/private.jpg', '/home/agent/private.jpg', '/home/root/file', 'C:\\Users\\alice\\private.jpg']) {
    for (const file of ['public/assets/cover.meta.json', 'content/example.md']) {
      const result = run(file, JSON.stringify({ reference: home }))
      assert.equal(result.status, 1, `${file}: ${home}`)
      assert.match(result.stderr, /absolute home path/)
      assert.ok(!result.stderr.includes(home))
    }
  }
})

test('sidecars refuse reference_path even with a relative value', (t) => {
  const result = fixture(t)('public/cover.meta.json', '{"reference_path":"private/reference.jpg"}')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /reference_path/)
})

test('web URL paths are allowed; the two exact container tutorial examples are scoped', (t) => {
  const run = fixture(t)
  assert.equal(run('content/example.md', '[Reference](https://example.com/home/reader/topic/)').status, 0)
  const tutorial = { path: '/ai-agent-na-servere-24-7/', bodyHtml: '<code>/home/agent/workspace/</code> and <code>/home/agent/workspace/memory.md</code>' }
  assert.equal(run('content/articles/imported-content.json', JSON.stringify([tutorial])).status, 0)
  assert.equal(run('public/generated/imported-articles/ai-agent-na-servere-24-7.json', JSON.stringify(tutorial)).status, 0)
  assert.equal(run('content/articles/imported-content.json', JSON.stringify([{ ...tutorial, path: '/unrelated/' }])).status, 1)
  assert.equal(run('content/articles/imported-content.json', JSON.stringify([{ ...tutorial, bodyHtml: '<code>/home/agent/workspace/private.jpg</code>' }])).status, 1)
})
