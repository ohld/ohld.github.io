# okhlopkov.com Static Migration

## Current production

`okhlopkov.com` is a Coolify service running `ghost:latest` with MySQL and a
persistent Ghost content volume. Do not replace that service directly.

## Target rollout

1. Export Ghost posts with `npm run export:ghost`. The raw export goes to
   ignored `private/ghost-export/` by default and only exports
   `status:published` posts unless `GHOST_EXPORT_FILTER` is explicitly changed.
2. Snapshot high-value indexed URLs with `npm run snapshot:legacy`.
3. Before Ghost freeze/cutover, check that the saved legacy snapshot still
   matches live Ghost with `npm run check:legacy-drift`.
4. Build this app as a Docker image or static `dist/`.
5. Deploy it as a new Coolify/VPS application on a temporary host.
6. Run `VERIFY_BASE_URL=https://preview-host npm run verify:migration`.
7. Verify analytics, page speed and RU/non-RU access manually.
8. Switch `okhlopkov.com` routing only after redirects are ready.

## Deploy paths

Current GitHub Pages deploy remains in `.github/workflows/deploy.yml` for the
existing `ai.okhlopkov.com`/Pages surface. It runs `npm run preflight:pages`, so
Pages output uses `https://ai.okhlopkov.com` in canonical URLs, `robots.txt` and
`sitemap.xml`, then verifies legacy URLs, sitemap and backlink-critical paths
against the built `dist/` and runs browser smoke before publishing.

For the future `okhlopkov.com` origin, use the Docker path:

- `Dockerfile` builds the static site and serves `dist/` with Nginx;
- `nginx.conf` owns real permanent redirects for legacy Ghost service and tag
  URLs;
- `compose.yaml` runs the container on `127.0.0.1:${OKHLOPKOV_PORT:-8080}`;
- `.github/workflows/deploy-vps.yml` is manual-only and deploys to a VPS via SSH.
- `npm run build:okhlopkov` is the root-domain build and keeps canonical URLs on
  `https://okhlopkov.com`.
- `npm run preflight:okhlopkov` is the pre-deploy gate: root-domain build, URL
  map generation, public-repo safety scan, static migration verification and
  browser smoke against the built `dist/`.
- `npm run verify:migration` also checks GA4, Yandex Metrika,
  `yandex-verification` meta, `robots.txt`, `llms.txt` and `llms-full.txt`.
- The manual VPS workflow also starts the Docker image in CI and runs the
  verifier with `VERIFY_REQUIRE_REAL_REDIRECTS=1`, so server-side `308`
  redirects are required before deploy can continue. It also sets
  `VERIFY_REQUIRE_ORIGIN_HEADERS=1`, so the Nginx origin must return short cache
  headers for HTML/crawler files and immutable cache headers for assets.

Required GitHub secrets for manual VPS deploy:

- `OKHLOPKOV_VPS_HOST`;
- `OKHLOPKOV_VPS_USER`;
- `OKHLOPKOV_VPS_SSH_KEY`;
- `OKHLOPKOV_VPS_PATH`.

Optional GitHub environment variable:

- `OKHLOPKOV_PORT` (defaults to `8080`).
- `OKHLOPKOV_SITE_URL` (defaults to `https://okhlopkov.com`).

See `migration/vps-deploy.md` for the server spec, setup commands, reverse proxy
shape, GitHub environment configuration and rollback steps.

Do not point the main domain at this container until `npm run preflight:okhlopkov`
passes in CI and `npm run verify:migration` passes against the deployed preview
URL. The verifier checks the public IA (`/`, `/blog/`, `/articles/`, `/about/`
and EN equivalents), all saved legacy pages from
`content/legacy-pages/pages.json`, service-page redirects, backlink-critical
URLs, legacy internal links, analytics snippets, crawler files and sitemap
inclusion/exclusion rules. The sitemap also includes `lastmod` for every
indexable URL, currently pinned to the static migration update date
`2026-05-25`.

Use `migration/cutover-checklist.md` as the DNS switch runbook. It includes the
Ghost freeze, public-safety check, strict preview verification, GSC submission
and rollback gates.

Run deployed preview verification in strict mode:

```bash
VERIFY_BASE_URL=https://preview-host \
VERIFY_REQUIRE_STRICT_404=1 \
VERIFY_REQUIRE_REAL_REDIRECTS=1 \
VERIFY_REQUIRE_ORIGIN_HEADERS=1 \
npm run verify:migration
```

Before freezing Ghost, run the live drift check against the current production
origin:

```bash
npm run check:legacy-drift
```

It fetches every saved page from `content/legacy-pages/pages.json` on live
`okhlopkov.com` and fails if any page no longer returns `200` or its title has
changed. If this fails, refresh the snapshot/migration map before cutover.

After DNS cutover, run:

```bash
npm run cutover:live
```

Use `migration/live-cutover-runbook.md` for failure triage and rollback
decision rules.

Before pushing or deploying from this public repository, run:

```bash
npm run check:public-safety
```

To see which automated gates are already in place and which preview/live checks
remain pending, run:

```bash
npm run readiness:cutover
```

When a preview origin exists:

```bash
CUTOVER_PREVIEW_URL=https://preview-host \
CUTOVER_RUN_PREVIEW_CHECKS=1 \
npm run readiness:cutover
```

Strict mode requires unknown URLs to return real `404` with `noindex, follow`.
This is expected for the Nginx/VPS origin. Local Vite/GitHub Pages style preview
can still behave as a SPA fallback and return `200` for unknown paths.

## Language policy

`/` is the Russian canonical homepage and returns `200 OK`.
`/en/` is the English homepage.
`/ru/` redirects to `/`.

Do not redirect by browser language, IP or `Accept-Language`.

The blog is RU-first because Dan's Russian Telegram voice is a core asset.
Translate only selected winning articles into English after there is a clear
SEO, distribution or backlink reason. Do not auto-translate every post by
default.

## Future content formatting

Future `/blog/` posts and `/articles/` SEO pages should follow
`migration/article-components.md`.
Important defaults:

- YouTube appears as a thumbnail card linking to YouTube unless a standard
  click-to-play embed is explicitly useful and allowed;
- code/prompt blocks must be copyable with progressive enhancement;
- quotes, callouts, tables and source lists should render as semantic HTML;
- generated articles need original synthesis, not duplicated Telegram posts or
  plain transcript dumps.
- Russian Telegram-derived blog posts should preserve Dan's original voice; English
  versions are separate editorial adaptations, not automatic mirrors.

Visual assets should follow `migration/visual-assets.md`: final optimized images
can live in `public/assets/blog/<slug>/`, but private source packs, raw prompts,
Search Console query data, Telegram exports and credentials must stay outside
this public repository.

## Redirect source of truth

The first GSC migration inventory lives in:

`projects/personal-brand-seo/ai-docs/migration-2026-05-25/`

Any URL marked `preserve_or_301` must either keep the same path or get a
server-side permanent redirect before the domain is switched to this app.

For the current static migration branch, generate the operational URL map with:

```bash
npm run migration:map
```

This writes `migration/url-map.csv` with:

- 88 preserved Ghost/GSC content URLs from `content/legacy-pages/pages.json`;
- Ghost service and legacy tag redirects that Nginx must own as real `308`
  redirects;
- backlink-critical redirects such as `/projects/` from external referring
  pages;
- new static app routes that should be indexed.

Use this CSV as the cutover checklist before changing DNS or Cloudflare origin:
every `preserve_same_path` row must return `200`, every `308_redirect` row must
redirect at the server layer, and no private/noindex route should appear in
`sitemap.xml`. Every sitemap URL must include a `lastmod` entry.

Also keep `migration/backlink-critical-urls.csv` in sync with Ahrefs/GSC backlink
exports. The migration verifier treats those externally linked URLs as deploy
blockers: each must preserve the same path or have a permanent redirect before
DNS cutover. The only deferred local check is edge-level `http -> https`/`www`
canonicalization, which must be verified on the public host after Cloudflare/DNS
is pointed at the new origin. Use `VERIFY_REQUIRE_EDGE_REDIRECTS=1` only when
running the verifier against the public canonical domain.

Ghost service pages are excluded from snapshot content and redirected instead:

- `/author/okhlopkov/` → `/about/`
- `/tag/second-brain/` → `/vtoroj-mozg-ai-assistent-obsidian-claude-code/`
- `/tag/ai-agents/` → `/articles/`
- `/tag/telegram/` → `/blog/`
- `/cn/` → `/en/`

Additional legacy tag URLs found inside preserved articles also redirect instead
of becoming 404s: `/tag/ai/`, `/tag/analytics/`, `/tag/claude-code/`,
`/tag/crypto/`, `/tag/dokku/`, `/tag/parsing/`, `/tag/telegram-cn/`,
`/tag/telegram-en/` and `/tag/web-scraping/`.

Static cleanup redirects also collapse old duplicated mini-app surfaces:

- `/posts/` → `/blog/`
- `/ai-agents/` → `/articles/`
- `/ai-course/` → `/articles/`
- `/blog/ai-tools-for-designers-design-engineering-agents/` →
  `/articles/ai-tools-for-designers-design-engineering-agents/`
