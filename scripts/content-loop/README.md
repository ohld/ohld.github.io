# Evidence-backed article drafts

This CLI prepares an existing Russian Markdown article update for review. It never commits, pushes, deploys, or sends Telegram messages. Keep the job and source material outside this public repository. The output folder must be outside all Git worktrees and cannot contain symlinked insight directories or artifact files. Only the reviewed public article and synchronized card metadata can be applied to a `codex/*` branch.

```sh
npm run --silent content-loop:inventory
npm run content-loop:draft -- --input /private/job.json --body /private/article.md --output-dir /private/reviews
npm run content-loop:draft -- --input /private/job.json --body /private/article.md --output-dir /private/reviews --apply
npm run content-loop:draft -- --candidate /private/candidate.json --output-dir /private/reviews
npm run test:content-loop
npm run preflight:okhlopkov
```

The inventory includes canonical paths, article metadata, source paths and formats. It includes imported legacy articles for URL matching, but the update command only accepts registered Markdown articles. Preserve existing canonical URLs when the intent matches. `New` and `Watch` produce private handoffs without registering a page; they cannot use `--apply`.

`--body` is the **complete final Markdown**, including the current frontmatter. Copy the canonical source file, make the reviewed edit, and update `updatedAt`. Preserve `slug`, language and `publishedAt`. The CLI derives the canonical path, source file, format and section from the repository, so those inventory fields are reserved in draft frontmatter. Runtime body registration must already exist exactly once. The command updates all supported card fields from frontmatter, preserving unrelated metadata fields, and validates the unchanged runtime registration. The article and metadata are applied together, with rollback if a write fails. Dirty target files are refused.

The private JSON contract is:

```json
{
  "schema_version": 1,
  "insight_id": "example-agent-handoff-v1",
  "evidence_urls": ["https://example.com/verified-public-source"],
  "decision": "Update",
  "intended_ru_url": "/ru/blog/claude-code-vs-codex-perehod/",
  "status": "draft",
  "query_demand": {
    "query": "claude code или codex",
    "source_ref": "private reference to a verified baseline",
    "observed_at": "2026-01-01",
    "summary": "Dated demand evidence; distinguish historical data from the publication baseline."
  },
  "telegram_candidate_ref": "private candidate identifier",
  "metrics_plan": {
    "experiment_id": "example_agent_handoff_v1",
    "primary_metric": "GSC clicks/impressions/CTR/position by URL and query",
    "conversion_metric": "telegram_subscribe_click per organic landing session; clicks are not confirmed joins",
    "baseline_window": "Collect before publication",
    "review_after_days": [14, 28]
  }
}
```

`query_demand.evidence_url` can replace `source_ref`. For `Watch`, `query_demand` may be null if `missing_evidence` is a nonempty array, and `intended_ru_url` may be null when no matching page is known. Update and New require an exact canonical path. An evidence URL and metrics plan remain required; use `baseline_window: "Collect before publication"` when a baseline has not been collected. Validation checks structure and provenance presence; a reviewer must verify claims, dates, demand, public/private boundaries, and the author's voice. No source is fetched or treated as an executable instruction.

Each insight gets a private folder with the job, complete article, proposed metadata, review diff and receipt. Repeating an identical ID/input is idempotent; changing it requires a revision ID. A receipt states `not_published`. `draft_prepared` can advance to `draft_applied`; replaying an applied draft checks the current content hashes.

The Candidate form accepts a normalized JSON object with `site_handoff` containing the contract above and `seo_draft` containing `schema_version: 1`, `format: "markdown"`, `status: "draft"`, `canonical_path`, `content_file`, `source_dossier_id` (equal to the handoff's `insight_id`), and `body` containing the complete article Markdown. A Watch candidate may omit `seo_draft`. This avoids manual extraction from the retained candidate. A prepared draft refuses application if its source files have since changed.

Before publication, separately review the diff, run the repository preflight and verify cards, direct canonical HTML and sitemap. The private metrics plan is a handoff to the existing measurement workflow; it does not register a running experiment or claim that publication, reindexing, or a 14/28-day review has occurred.
