import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { runDraft } from './draft.mjs'
import { inventory } from './content.mjs'

const slug = 'agent-handoff'
const articleFile = `content/blog-posts/${slug}.md`
const markdown = `---
slug: ${slug}
title: Передача проекта агенту
description: Проверка контекста и тестов.
publishedAt: 2026-01-01
updatedAt: 2026-01-01
readingTime: 3 мин
tags: Codex, Claude Code
---

Исходная статья.
`

function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'site-content-loop-'))
  t.after(() => fs.rmSync(base, { recursive: true, force: true }))
  const root = path.join(base, 'repo')
  const privateDir = path.join(base, 'private')
  for (const folder of ['content/blog-posts', 'content/seo-articles', 'content/articles', 'src']) fs.mkdirSync(path.join(root, folder), { recursive: true })
  fs.mkdirSync(privateDir)
  fs.writeFileSync(path.join(root, articleFile), markdown)
  fs.writeFileSync(path.join(root, 'content/articles/imported-index.json'), '[]')
  fs.writeFileSync(path.join(root, 'src/generatedBlogPosts.ts'), `import post from '../${articleFile}?raw'\nconst sources = [post]\nconst articleSources = []\n`)
  fs.writeFileSync(path.join(root, 'src/generatedBlogMetadata.ts'), `const generatedBlogPostMeta = [{ slug: '${slug}', lang: 'ru', title: 'Передача проекта агенту', description: 'Проверка контекста и тестов.', publishedAt: '2026-01-01', updatedAt: '2026-01-01', readingTime: '3 мин', tags: ['Codex'] }]\nconst generatedArticlePostMeta = []\n`)
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  git('init', '-b', 'codex/test')
  git('add', '.')
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'fixture')
  const job = {
    schema_version: 1, insight_id: 'test-handoff', evidence_urls: ['https://example.com/source'],
    decision: 'Update', intended_ru_url: `/ru/blog/${slug}/`, status: 'draft',
    query_demand: { query: 'как сменить агента', source_ref: 'private:baseline', observed_at: '2026-01-01', summary: 'Historical baseline; refresh before publication.' },
    metrics_plan: { experiment_id: 'agent_handoff', primary_metric: 'GSC impressions and clicks by URL/query', conversion_metric: 'telegram_subscribe_click (outbound clicks only)', baseline_window: 'refresh before publication', review_after_days: [14, 28] },
  }
  const options = { root, input: path.join(privateDir, 'job.json'), body: path.join(privateDir, 'article.md'), outputDir: path.join(privateDir, 'output') }
  const saveJob = () => fs.writeFileSync(options.input, JSON.stringify(job))
  saveJob()
  fs.writeFileSync(options.body, markdown.replace('updatedAt: 2026-01-01', 'updatedAt: 2026-01-02') + '\n## Проверка\n\nПроверяем инварианты и одну задачу.\n')
  return { root, options, job, saveJob, git }
}

test('inventory exposes canonical identities; dry run leaves checkout unchanged', (t) => {
  const { root, options, git } = fixture(t)
  assert.equal(inventory(root)[0].canonical_path, `/ru/blog/${slug}/`)
  const result = runDraft(options)
  assert.equal(result.status, 'draft_prepared')
  assert.equal(result.publication_status, 'not_published')
  assert.equal(git('status', '--porcelain'), '')
  assert.ok(fs.readFileSync(path.join(result.artifact_dir, 'review.diff'), 'utf8').includes('Проверяем инварианты'))
  assert.equal(fs.statSync(path.join(result.artifact_dir, 'handoff.json')).mode & 0o777, 0o600)
})

test('apply updates body and card metadata together, preserving one runtime import', (t) => {
  const { root, options, git } = fixture(t)
  const runtimeBefore = fs.readFileSync(path.join(root, 'src/generatedBlogPosts.ts'), 'utf8')
  runDraft(options)
  const result = runDraft({ ...options, apply: true })
  assert.equal(result.status, 'draft_applied')
  assert.match(fs.readFileSync(path.join(root, articleFile), 'utf8'), /updatedAt: 2026-01-02/)
  assert.match(fs.readFileSync(path.join(root, 'src/generatedBlogMetadata.ts'), 'utf8'), /updatedAt: "2026-01-02"/)
  assert.match(fs.readFileSync(path.join(root, 'src/generatedBlogMetadata.ts'), 'utf8'), /tags: \["Codex","Claude Code"\]/)
  assert.equal(fs.readFileSync(path.join(root, 'src/generatedBlogPosts.ts'), 'utf8'), runtimeBefore)
  assert.equal(git('diff', '--name-only').trim().split('\n').length, 2)
  assert.equal(runDraft({ ...options, apply: true }).duplicate, true)
})

test('duplicate ID with changed draft is refused', (t) => {
  const { options, git } = fixture(t)
  runDraft(options)
  fs.appendFileSync(options.body, '\nИная версия.\n')
  assert.throws(() => runDraft(options), /already exists with different content/)
  assert.equal(git('status', '--porcelain'), '')
})

test('missing evidence, demand, and invalid canonical fail before artifacts or mutations', (t) => {
  const { options, job, saveJob, git } = fixture(t)
  job.evidence_urls = []
  saveJob()
  assert.throws(() => runDraft(options), /evidence URL/)
  job.evidence_urls = ['https://example.com/source']
  const demand = job.query_demand
  job.query_demand = null
  saveJob()
  assert.throws(() => runDraft(options), /query-demand proof/)
  job.query_demand = demand
  job.intended_ru_url = '/ru/blog/../../secrets/'
  saveJob()
  assert.throws(() => runDraft(options), /exact canonical/)
  assert.equal(fs.existsSync(options.outputDir), false)
  assert.equal(git('status', '--porcelain'), '')
})

test('missing Update target and existing New target are refused', (t) => {
  const { options, job, saveJob } = fixture(t)
  job.intended_ru_url = '/ru/blog/unknown/'
  saveJob()
  assert.throws(() => runDraft(options), /absent from the content inventory/)
  job.intended_ru_url = `/ru/blog/${slug}/`
  job.decision = 'New'
  saveJob()
  assert.throws(() => runDraft(options), /already exists; choose Update/)
})

test('duplicate runtime registration aborts before updating any file', (t) => {
  const { root, options } = fixture(t)
  const file = path.join(root, 'src/generatedBlogPosts.ts')
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('[post]', '[post, post]'))
  const metadataBefore = fs.readFileSync(path.join(root, 'src/generatedBlogMetadata.ts'), 'utf8')
  assert.throws(() => runDraft({ ...options, apply: true }), /exactly once in the runtime/)
  assert.equal(fs.readFileSync(path.join(root, articleFile), 'utf8'), markdown)
  assert.equal(fs.readFileSync(path.join(root, 'src/generatedBlogMetadata.ts'), 'utf8'), metadataBefore)
})

test('draft cannot rename article or write public handoff artifacts', (t) => {
  const { root, options } = fixture(t)
  fs.writeFileSync(options.body, markdown.replace(`slug: ${slug}`, 'slug: other'))
  assert.throws(() => runDraft(options), /identity does not match/)
  assert.throws(() => runDraft({ ...options, outputDir: path.join(root, 'content/private') }), /outside the public repository/)
})

test('private output refuses a symlinked insight directory', (t) => {
  const { root, options, git } = fixture(t)
  fs.mkdirSync(options.outputDir)
  fs.symlinkSync(path.join(root, 'content'), path.join(options.outputDir, 'test-handoff'), 'dir')
  assert.throws(() => runDraft(options), /insight path must be a directory/)
  assert.equal(git('status', '--porcelain'), '')
  assert.equal(fs.existsSync(path.join(root, 'content/handoff.json')), false)
})

test('private output refuses symlinked receipts, handoffs and review backups', (t) => {
  const { root, options, git } = fixture(t)
  const directory = path.join(options.outputDir, 'test-handoff')
  const publicFile = path.join(root, articleFile)
  fs.mkdirSync(directory, { recursive: true })
  for (const name of ['receipt.json', 'handoff.json', '.before-agent-handoff.md']) {
    const link = path.join(directory, name)
    fs.symlinkSync(publicFile, link)
    assert.throws(() => runDraft({ ...options, apply: true }), /Unsafe private artifact path/)
    assert.equal(fs.readFileSync(publicFile, 'utf8'), markdown)
    assert.equal(git('status', '--porcelain'), '')
    assert.deepEqual(fs.readdirSync(directory), [name])
    fs.unlinkSync(link)
  }
})

test('private output refuses another worktree with a Git pointer file', (t) => {
  const { root, options, git } = fixture(t)
  const sibling = path.join(path.dirname(root), 'sibling')
  git('worktree', 'add', '-b', 'codex/sibling', sibling)
  assert.equal(fs.statSync(path.join(sibling, '.git')).isFile(), true)
  const outputDir = path.join(sibling, 'private', 'nested')
  assert.throws(() => runDraft({ ...options, outputDir }), /outside all Git worktrees/)
  assert.equal(fs.existsSync(path.join(sibling, 'private')), false)
})

test('frontmatter cannot poison inventory structure or an applied draft', (t) => {
  const { root, options, git } = fixture(t)
  const spoof = 'canonical_path: /ru/blog/unrelated/\ncontent_file: src/unrelated.ts\nformat: legacy\nsection: articles\n'
  const addSpoof = (text) => text.replace('---\n', '---\n' + spoof)
  fs.writeFileSync(path.join(root, articleFile), addSpoof(markdown))
  const [target] = inventory(root)
  assert.equal(target.canonical_path, `/ru/blog/${slug}/`)
  assert.equal(target.content_file, articleFile)
  assert.equal(target.format, 'markdown')
  assert.equal(target.section, 'blog')
  fs.writeFileSync(path.join(root, articleFile), markdown)
  fs.writeFileSync(options.body, addSpoof(fs.readFileSync(options.body, 'utf8')))
  assert.throws(() => runDraft({ ...options, apply: true }), /Reserved inventory field/)
  assert.equal(fs.existsSync(options.outputDir), false)
  assert.equal(git('status', '--porcelain'), '')
})

test('Watch explicitly carries missing demand without creating a public page', (t) => {
  const { options, job, saveJob, git } = fixture(t)
  job.decision = 'Watch'
  job.intended_ru_url = null
  job.query_demand = null
  job.missing_evidence = ['Collect current URL/query baseline before choosing a rewrite.']
  saveJob()
  const result = runDraft({ ...options, body: undefined })
  assert.deepEqual(result.changed_files, [])
  assert.equal(result.intended_ru_url, null)
  assert.throws(() => runDraft({ ...options, body: undefined, apply: true }), /only supports Update/)
  assert.equal(git('status', '--porcelain'), '')
})

test('unknown canonical target is accepted only for Watch', (t) => {
  const { options, job, saveJob, git } = fixture(t)
  job.intended_ru_url = null
  for (const decision of ['Update', 'New']) {
    job.decision = decision
    saveJob()
    assert.throws(() => runDraft(options), /Expected exact canonical/)
  }
  assert.equal(git('status', '--porcelain'), '')
  assert.equal(fs.existsSync(options.outputDir), false)
})

test('Candidate export preserves dossier identity and canonical source mapping', (t) => {
  const { options, job } = fixture(t)
  const candidate = path.join(path.dirname(options.input), 'candidate.json')
  const value = {
    site_handoff: job,
    seo_draft: { schema_version: 1, format: 'markdown', status: 'draft', canonical_path: job.intended_ru_url, content_file: articleFile, source_dossier_id: job.insight_id, body: fs.readFileSync(options.body, 'utf8') },
  }
  fs.writeFileSync(candidate, JSON.stringify(value))
  const candidateOptions = { root: options.root, candidate, outputDir: options.outputDir }
  assert.equal(runDraft(candidateOptions).status, 'draft_prepared')
  value.seo_draft.source_dossier_id = 'unrelated-dossier'
  fs.writeFileSync(candidate, JSON.stringify(value))
  assert.throws(() => runDraft(candidateOptions), /source_dossier_id must match/)
})

test('prepared draft refuses an intervening committed source update', (t) => {
  const { root, options, git } = fixture(t)
  runDraft(options)
  fs.appendFileSync(path.join(root, articleFile), '\nOther author added this.\n')
  git('add', articleFile)
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'other author')
  assert.throws(() => runDraft({ ...options, apply: true }), /Source changed since preparation/)
  assert.match(fs.readFileSync(path.join(root, articleFile), 'utf8'), /Other author/)
  assert.equal(git('status', '--porcelain'), '')
})

test('dirty target and duplicate card registration cannot be applied', (t) => {
  const { root, options } = fixture(t)
  fs.appendFileSync(path.join(root, articleFile), '\nUnsaved work.\n')
  assert.throws(() => runDraft({ ...options, apply: true }), /uncommitted changes/)
  fs.writeFileSync(path.join(root, articleFile), markdown)
  const metadata = path.join(root, 'src/generatedBlogMetadata.ts')
  const text = fs.readFileSync(metadata, 'utf8')
  const entry = text.match(/\[({[^\n]+})\]/)[1]
  fs.writeFileSync(metadata, text.replace(`[${entry}]`, `[${entry}, ${entry}]`))
  assert.throws(() => runDraft({ ...options, apply: true }), /exactly once in the card/)
  assert.equal(fs.readFileSync(path.join(root, articleFile), 'utf8'), markdown)
})

test('a failed metadata write rolls back the already-written article', (t) => {
  const { root, options, git } = fixture(t)
  const write = fs.writeFileSync
  let injected = false
  fs.writeFileSync = function (file, ...args) {
    if (!injected && file === path.join(root, 'src/generatedBlogMetadata.ts')) {
      injected = true
      throw new Error('Injected metadata write failure')
    }
    return write.call(this, file, ...args)
  }
  try { assert.throws(() => runDraft({ ...options, apply: true }), /Injected metadata write failure/) }
  finally { fs.writeFileSync = write }
  assert.equal(git('status', '--porcelain'), '')
  assert.equal(fs.existsSync(path.join(options.outputDir, 'test-handoff/receipt.json')), false)
})


test('a failed applied receipt replacement preserves the prepared receipt and rolls back the source', (t) => {
  const { options, git } = fixture(t)
  const prepared = runDraft(options)
  const receipt = path.join(prepared.artifact_dir, 'receipt.json')
  const originalReceipt = fs.readFileSync(receipt, 'utf8')
  const rename = fs.renameSync
  fs.renameSync = function (from, to) {
    if (to === receipt) throw new Error('Injected receipt replacement failure')
    return rename.call(this, from, to)
  }
  try { assert.throws(() => runDraft({ ...options, apply: true }), /Injected receipt replacement failure/) }
  finally { fs.renameSync = rename }
  assert.equal(fs.readFileSync(receipt, 'utf8'), originalReceipt)
  assert.equal(git('status', '--porcelain'), '')
  assert.equal(fs.readdirSync(prepared.artifact_dir).some((name) => name.startsWith('.write-')), false)
  assert.equal(runDraft({ ...options, apply: true }).status, 'draft_applied')
})
