#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { assert, inventory, prepareUpdate } from './content.mjs'

const sha = (value) => crypto.createHash('sha256').update(value).digest('hex')
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0

function publicUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}

export function validateJob(job) {
  assert(job.schema_version === 1, 'Expected schema_version: 1')
  assert(/^[a-z0-9][a-z0-9_-]{2,100}$/.test(job.insight_id || ''), 'Invalid insight_id')
  assert(['Update', 'New', 'Watch'].includes(job.decision), 'decision must be Update, New or Watch')
  assert(job.status === 'draft', 'Only draft status is accepted')
  assert(Array.isArray(job.evidence_urls) && job.evidence_urls.length && job.evidence_urls.every(publicUrl), 'At least one valid evidence URL is required')
  assert(new Set(job.evidence_urls).size === job.evidence_urls.length, 'Duplicate evidence URLs')
  const unknownWatchTarget = job.decision === 'Watch' && job.intended_ru_url === null
  assert(unknownWatchTarget || /^\/ru\/(blog|articles)\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(job.intended_ru_url || ''), 'Expected exact canonical /ru/blog/.../ or /ru/articles/.../ URL (Watch may use null)')
  if (job.decision === 'Watch' && !job.query_demand) {
    assert(Array.isArray(job.missing_evidence) && job.missing_evidence.length && job.missing_evidence.every(nonempty), 'Watch without query demand must explain missing_evidence')
  } else {
    const demand = job.query_demand || {}
    assert(nonempty(demand.query) && nonempty(demand.summary), 'Dated query-demand proof is required')
    assert(publicUrl(demand.evidence_url) || nonempty(demand.source_ref), 'Query-demand proof requires evidence_url or source_ref')
    assert(/^\d{4}-\d{2}-\d{2}$/.test(demand.observed_at || '') && new Date(demand.observed_at).toISOString().startsWith(demand.observed_at), 'Query-demand proof requires valid observed_at date')
    assert(demand.observed_at <= new Date().toISOString().slice(0, 10), 'Query-demand evidence cannot be future-dated')
  }
  const metrics = job.metrics_plan || {}
  for (const field of ['experiment_id', 'primary_metric', 'conversion_metric', 'baseline_window']) assert(nonempty(metrics[field]), `metrics_plan.${field} is required`)
  assert(Array.isArray(metrics.review_after_days) && metrics.review_after_days.includes(14) && metrics.review_after_days.includes(28), 'Metrics plan must include 14/28 day reviews')
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function externalPath(root, candidate) {
  let existing = path.resolve(candidate)
  const suffix = []
  while (!fs.lstatSync(existing, { throwIfNoEntry: false })) { suffix.unshift(path.basename(existing)); existing = path.dirname(existing) }
  const resolved = path.join(fs.realpathSync(existing), ...suffix)
  const relative = path.relative(fs.realpathSync(root), resolved)
  assert(relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative), 'Private inputs and output must stay outside the public repository')
  return resolved
}

function assertOutsideWorktree(directory) {
  for (let parent = directory;; parent = path.dirname(parent)) {
    assert(!fs.lstatSync(path.join(parent, '.git'), { throwIfNoEntry: false }), 'Private output must stay outside all Git worktrees')
    if (parent === path.dirname(parent)) return
  }
}

function assertPrivateFile(file) {
  const entry = fs.lstatSync(file, { throwIfNoEntry: false })
  assert(!entry || (entry.isFile() && entry.nlink === 1), `Unsafe private artifact path: ${file}`)
  return Boolean(entry)
}

function readPrivateReceipt(file) {
  if (!assertPrivateFile(file)) return null
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW)
  try {
    const entry = fs.fstatSync(fd)
    assert(entry.isFile() && entry.nlink === 1, `Unsafe private receipt path: ${file}`)
    return JSON.parse(fs.readFileSync(fd, 'utf8'))
  } finally {
    fs.closeSync(fd)
  }
}

function writePrivateFile(file, text) {
  assertPrivateFile(file)
  // Write to a new private file before replacing the artifact. Rename does not
  // follow a symlink at the destination and leaves a complete receipt on retry.
  const temporary = fs.mkdtempSync(path.join(path.dirname(file), '.write-'))
  const staged = path.join(temporary, 'artifact')
  try {
    fs.writeFileSync(staged, text, { flag: 'wx', mode: 0o600 })
    fs.renameSync(staged, file)
  } finally {
    if (fs.existsSync(staged)) fs.unlinkSync(staged)
    fs.rmdirSync(temporary)
  }
}

export function runDraft({ root, input, candidate, body, outputDir, apply = false }) {
  assert(Boolean(input) !== Boolean(candidate), 'Provide either --input or --candidate')
  assert(!candidate || !body, '--candidate includes the article body; do not also pass --body')
  const inputPath = externalPath(root, input || candidate)
  const output = externalPath(root, outputDir)
  assertOutsideWorktree(output)
  const document = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
  const job = candidate ? document.site_handoff : document
  assert(job && typeof job === 'object', 'Candidate requires site_handoff')
  validateJob(job)
  const seo = candidate ? document.seo_draft : null
  if (seo) {
    assert(seo.schema_version === 1 && seo.format === 'markdown' && seo.status === 'draft', 'Candidate seo_draft must be draft Markdown schema_version 1')
    assert(seo.canonical_path === job.intended_ru_url, 'Candidate SEO canonical does not match site_handoff')
    assert(seo.source_dossier_id === job.insight_id, 'Candidate SEO source_dossier_id must match site_handoff.insight_id')
    assert(typeof seo.body === 'string' && seo.body.trim(), 'Candidate SEO body is empty')
  }
  const draft = candidate ? (seo?.body || '') : body ? fs.readFileSync(externalPath(root, body), 'utf8') : ''
  const fingerprint = sha(JSON.stringify(job) + '\n' + draft)
  const directory = path.join(output, job.insight_id)
  const existingDirectory = fs.lstatSync(directory, { throwIfNoEntry: false })
  assert(!existingDirectory || existingDirectory.isDirectory(), 'Private insight path must be a directory, not a symlink')
  assertOutsideWorktree(directory)
  const receiptPath = path.join(directory, 'receipt.json')
  const receipt = readPrivateReceipt(receiptPath)
  if (receipt) {
    assert(receipt.fingerprint === fingerprint, 'insight_id already exists with different content; use a new revision ID')
    if (!apply || receipt.status === 'draft_applied') {
      if (receipt.status === 'draft_applied') for (const [file, hash] of Object.entries(receipt.applied_hashes)) assert(sha(fs.readFileSync(path.join(root, file))) === hash, 'Previously applied draft changed; review before retrying')
      return { ...receipt, duplicate: true, artifact_dir: directory }
    }
    for (const [file, hash] of Object.entries(receipt.source_hashes || {})) assert(sha(fs.readFileSync(path.join(root, file))) === hash, 'Source changed since preparation; create a new reviewed revision')
  }
  const items = inventory(root)
  const target = items.find((x) => x.canonical_path === job.intended_ru_url)
  if (seo && target) assert(seo.content_file === target.content_file, 'Candidate SEO content_file does not match the inventory')
  assert(job.decision !== 'Update' || target, 'Update target is absent from the content inventory')
  assert(job.decision !== 'New' || !target, 'New target already exists; choose Update')
  assert(!apply || job.decision === 'Update', '--apply only supports Update; New and Watch remain private handoffs')
  assert(job.decision !== 'Update' || draft, 'Update requires --body with complete article Markdown')
  const plan = job.decision === 'Update' ? prepareUpdate(root, target, draft) : null
  const branch = git(root, ['branch', '--show-current'])
  if (apply) {
    assert(branch.startsWith('codex/'), 'Apply requires an isolated codex/* review branch')
    assert(!git(root, ['status', '--porcelain', '--', ...Object.keys(plan.originals)]), 'Target article or registries have uncommitted changes')
  }
  const artifactNames = ['handoff.json', 'receipt.json', ...(draft ? ['article.md'] : [])]
  if (plan) {
    artifactNames.push('review.diff')
    for (const file of Object.keys(plan.changes)) artifactNames.push(path.basename(file), `.before-${path.basename(file)}`)
  }
  for (const name of artifactNames) assertPrivateFile(path.join(directory, name))
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  fs.chmodSync(directory, 0o700)
  const writePrivate = (name, text) => writePrivateFile(path.join(directory, name), text)
  writePrivate('handoff.json', JSON.stringify(job, null, 2) + '\n')
  if (draft) writePrivate('article.md', draft)
  if (plan) {
    for (const [file, text] of Object.entries(plan.changes)) writePrivate(path.basename(file), text)
    const diffs = []
    for (const [file, text] of Object.entries(plan.changes)) {
      const original = path.join(directory, `.before-${path.basename(file)}`)
      writePrivate(path.basename(original), plan.originals[file])
      try {
        const changed = path.join(directory, path.basename(file))
        try { diffs.push(execFileSync('git', ['diff', '--no-index', '--no-ext-diff', '--', original, changed], { encoding: 'utf8' })) }
        catch (error) { assert(error.status === 1, 'Could not create review diff'); diffs.push(error.stdout) }
      } finally { fs.unlinkSync(original) }
    }
    writePrivate('review.diff', diffs.join('\n'))
  }
  const result = {
    schema_version: 1, insight_id: job.insight_id, fingerprint,
    status: apply ? 'draft_applied' : 'draft_prepared', decision: job.decision,
    intended_ru_url: job.intended_ru_url, base_commit: git(root, ['rev-parse', 'HEAD']), branch,
    changed_files: plan ? Object.keys(plan.changes) : [], verified_runtime_registry: plan?.registered_body,
    source_hashes: plan ? Object.fromEntries(Object.entries(plan.originals).map(([file, text]) => [file, sha(text)])) : {},
    publication_status: 'not_published', recorded_at: new Date().toISOString(),
  }
  if (apply) {
    const written = []
    try {
      for (const [file, original] of Object.entries(plan.originals)) assert(fs.readFileSync(path.join(root, file), 'utf8') === original, 'Source changed while preparing draft; retry')
      for (const [file, text] of Object.entries(plan.changes)) { written.push(file); fs.writeFileSync(path.join(root, file), text) }
      result.applied_hashes = Object.fromEntries(Object.entries({ ...plan.originals, ...plan.changes }).map(([file, text]) => [file, sha(text)]))
      writePrivate('receipt.json', JSON.stringify(result, null, 2) + '\n')
    } catch (error) {
      for (const file of written) fs.writeFileSync(path.join(root, file), plan.originals[file])
      throw error
    }
  } else writePrivate('receipt.json', JSON.stringify(result, null, 2) + '\n')
  return { ...result, artifact_dir: directory }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2)
    const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
    if (args[0] === 'inventory') console.log(JSON.stringify({ schema_version: 1, repo_commit: git(root, ['rev-parse', 'HEAD']), items: inventory(root) }, null, 2))
    else {
      const options = { root }
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--apply') options.apply = true
        else {
          const name = { '--input': 'input', '--candidate': 'candidate', '--body': 'body', '--output-dir': 'outputDir' }[args[i]]
          assert(name && args[i + 1] && !args[i + 1].startsWith('--'), 'Usage: --input private.json [--body article.md] --output-dir private-directory [--apply]')
          assert(!options[name], `Duplicate option: ${args[i]}`)
          options[name] = args[++i]
        }
      }
      assert((options.input || options.candidate) && options.outputDir, '--input or --candidate, and --output-dir are required')
      console.log(JSON.stringify(runDraft(options), null, 2))
    }
  } catch (error) { console.error(error.message); process.exitCode = 1 }
}
