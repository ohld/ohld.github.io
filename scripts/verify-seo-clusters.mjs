#!/usr/bin/env node
import fs from 'node:fs'

const clustersPath = process.env.VERIFY_SEO_CLUSTERS || 'content/seo-clusters.json'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function canonicalPath(pathname) {
  assert(typeof pathname === 'string' && pathname.startsWith('/'), `bad canonical path: ${pathname}`)
  return pathname.endsWith('/') ? pathname : `${pathname}/`
}

function assertNonEmpty(value, label) {
  assert(typeof value === 'string' && value.trim(), `${label}: missing`)
}

function verifyCandidate(candidate, cluster, requiredFields, canonicalPaths) {
  for (const field of requiredFields) assert(candidate[field] !== undefined, `${cluster.cluster_id}/${candidate.slug || '<missing-slug>'}: missing ${field}`)

  assertNonEmpty(candidate.slug, `${cluster.cluster_id}: candidate slug`)
  assertNonEmpty(candidate.target_query_group, `${cluster.cluster_id}/${candidate.slug}: target_query_group`)
  assertNonEmpty(candidate.source_pack, `${cluster.cluster_id}/${candidate.slug}: source_pack`)
  assertNonEmpty(candidate.unique_proof, `${cluster.cluster_id}/${candidate.slug}: unique_proof`)
  assertNonEmpty(candidate.schema_type, `${cluster.cluster_id}/${candidate.slug}: schema_type`)
  assert(['planned', 'drafting', 'published', 'paused'].includes(candidate.status), `${cluster.cluster_id}/${candidate.slug}: invalid status ${candidate.status}`)
  assert(['index_when_published', 'noindex_until_enriched'].includes(candidate.sitemap_eligibility), `${cluster.cluster_id}/${candidate.slug}: invalid sitemap_eligibility`)

  const candidatePath = canonicalPath(candidate.canonical_path)
  assert(!canonicalPaths.has(candidatePath), `${cluster.cluster_id}/${candidate.slug}: duplicate canonical_path ${candidatePath}`)
  canonicalPaths.add(candidatePath)

  assert(Array.isArray(candidate.internal_links), `${cluster.cluster_id}/${candidate.slug}: internal_links must be an array`)
  assert(candidate.internal_links.length >= 3, `${cluster.cluster_id}/${candidate.slug}: needs at least 3 internal links`)
  for (const link of candidate.internal_links) canonicalPath(link)

  assert(Array.isArray(candidate.faq_questions), `${cluster.cluster_id}/${candidate.slug}: faq_questions must be an array`)
  assert(candidate.faq_questions.length >= 3, `${cluster.cluster_id}/${candidate.slug}: needs at least 3 FAQ questions`)
  for (const question of candidate.faq_questions) assertNonEmpty(question, `${cluster.cluster_id}/${candidate.slug}: FAQ question`)
}

export function verifySeoClusters(filePath = clustersPath) {
  assert(fs.existsSync(filePath), `${filePath}: missing`)
  const manifest = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const gates = manifest.quality_gates || {}
  const requiredFields = gates.required_candidate_fields || []
  assert(requiredFields.includes('unique_proof'), `${filePath}: quality gate must require unique_proof`)
  assert(requiredFields.includes('source_pack'), `${filePath}: quality gate must require source_pack`)
  assert(gates.minimum_internal_links >= 3, `${filePath}: minimum_internal_links must be at least 3`)
  assert(gates.minimum_faq_questions >= 3, `${filePath}: minimum_faq_questions must be at least 3`)
  assert(Array.isArray(manifest.clusters) && manifest.clusters.length > 0, `${filePath}: clusters must be non-empty`)

  const canonicalPaths = new Set()
  let candidateCount = 0
  for (const cluster of manifest.clusters) {
    assertNonEmpty(cluster.cluster_id, 'cluster_id')
    assertNonEmpty(cluster.title, `${cluster.cluster_id}: title`)
    assert(['ru', 'en'].includes(cluster.language), `${cluster.cluster_id}: language must be ru or en`)
    assert(['planned', 'active', 'paused'].includes(cluster.status), `${cluster.cluster_id}: invalid status ${cluster.status}`)
    canonicalPath(cluster.hub_path)
    assert(cluster.measurement?.primary_metric, `${cluster.cluster_id}: missing measurement.primary_metric`)
    assert(Array.isArray(cluster.candidates) && cluster.candidates.length > 0, `${cluster.cluster_id}: candidates must be non-empty`)
    for (const candidate of cluster.candidates) {
      verifyCandidate(candidate, cluster, requiredFields, canonicalPaths)
      candidateCount += 1
    }
  }

  console.log(`✓ SEO clusters (${manifest.clusters.length} clusters, ${candidateCount} candidate pages, strict quality gates)`)
  return { clusters: manifest.clusters.length, candidates: candidateCount }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    verifySeoClusters()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}
