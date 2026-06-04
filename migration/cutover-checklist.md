# Ghost To Static Cutover Checklist

Historical operational checklist for the Ghost/Coolify to static-site cutover.
The live production path is now GitHub Pages through `.github/workflows/deploy.yml`.

## Current State

- Live `okhlopkov.com` is served from this repository through GitHub Pages.
- The static migration branch preserves 88 indexed content URLs as static HTML.
- Ghost service pages are redirected by Nginx: `/author/`, selected `/tag/`,
  `/cn/`, `/ru/` and `/closed/`.
- Duplicate static surfaces redirect into the focused IA:
  `/work-together/` → `/about/` and `/markdown-vs-html/` →
  `/articles/markdown-vs-html/`.
- `okhlopkov.com` is the canonical SEO domain and should become the GitHub Pages
  custom domain for this repository.
- `ai.okhlopkov.com` is temporary preview history. Remove it after the
  root-domain Pages cutover.
- `ohld.github.io` is the GitHub Pages default host. After Pages is configured
  with `okhlopkov.com` as the custom domain, it should redirect to the root
  domain.
- The known broken sitemap problem was observed on the GitHub Pages deployment.
  Re-test on the future `okhlopkov.com` origin instead of assuming the same
  failure mode will repeat.

## Do Not Switch DNS Until

0. `npm run readiness:cutover` has no `FAIL` rows. `PENDING` rows are expected
   until the deployed preview origin and live DNS cutover exist.
1. `npm run preflight:okhlopkov` passes. This covers the root-domain build,
   URL map, public-repo safety scan, sitemap, legacy pages, legacy internal
   links and backlink-critical URL gate against the built `dist/`.
2. Docker/Nginx strict verification passes:

   ```bash
   VERIFY_BASE_URL=http://127.0.0.1:4186 \
   SITE_URL=https://okhlopkov.com \
   VERIFY_REQUIRE_STRICT_404=1 \
   VERIFY_REQUIRE_REAL_REDIRECTS=1 \
   VERIFY_REQUIRE_ORIGIN_HEADERS=1 \
   npm run verify:migration
   ```

   Last local static preflight: 2026-05-25 passed with 88 legacy pages,
   23 redirects, 99 sitemap URLs, strict 404 and origin cache headers.

3. A deployed preview URL passes the same strict verifier.
4. Browser smoke test passes with `SMOKE_BASE_URL=https://preview-host npm run
   smoke:browser` for key rendered routes:
   - `/`
   - `/en/`
   - `/en/blog/`
   - `/en/articles/`
   - `/en/about/`
   - `/ru/blog/`
   - `/ru/articles/`
   - `/ru/articles/ai-tools-for-designers-design-engineering-agents/`
   - `/articles/markdown-vs-html/`
   - `/about/`
5. Every URL in `migration/backlink-critical-urls.csv` returns the same URL with
   `200` or a permanent redirect to the mapped destination.
6. Analytics IDs are present in page HTML. The migration verifier checks GA4 and
   Yandex Metrika snippets on every URL-map page.
7. `robots.txt` points to the canonical sitemap, and `llms.txt`/`llms-full.txt`
   are served for AI/search crawlers.
8. `sitemap.xml` contains only canonical `https://okhlopkov.com/...` URLs,
   includes `lastmod`, and excludes noindex/private routes.
9. HTML and crawler files use short cache headers; hashed assets use immutable
   cache headers.
10. The preview origin is reachable from Russia and non-Russia networks.

`migration/vps-deploy.md` is historical context for the abandoned VPS path. See
`migration/live-cutover-runbook.md` for post-DNS verification and failure triage
notes.

## Ghost Freeze

Before final export:

1. Stop publishing new Ghost posts.
2. Export Ghost content with `npm run export:ghost` if Ghost API credentials are
   available locally. Keep raw export in ignored `private/ghost-export/`; do not
   commit it to the public repo.
3. Run `npm run check:legacy-drift` against live Ghost to confirm the saved
   legacy snapshot still matches current production titles and `200` status.
4. Re-run `npm run snapshot:legacy` if the drift check fails or the GSC
   high-value URL set changed.
5. Re-run `npm run migration:map`.
6. Re-run the full verification suite.

Do not commit Ghost credentials, Search Console raw exports, Telegram exports or
paid SEO exports to this public repository.

## DNS / Cloudflare Switch

1. Keep the old Ghost/Coolify service running during the first switch.
2. For GitHub Pages cutover, set the repository Pages custom domain to
   `okhlopkov.com`.
3. Point `okhlopkov.com` to GitHub Pages using DNS-only records, not Cloudflare
   orange-cloud/proxied records:
   - `A @ 185.199.108.153`
   - `A @ 185.199.109.153`
   - `A @ 185.199.110.153`
   - `A @ 185.199.111.153`
   - optional `AAAA @ 2606:50c0:8000::153`
   - optional `AAAA @ 2606:50c0:8001::153`
   - optional `AAAA @ 2606:50c0:8002::153`
   - optional `AAAA @ 2606:50c0:8003::153`
   - optional `CNAME www ohld.github.io`
4. Remove or stop using `ai.okhlopkov.com` after `okhlopkov.com` is live and
   verified.
5. Preserve HTTPS and non-`www` canonical host.
6. Ensure `http://okhlopkov.com/` uses permanent `301` or `308` to HTTPS.
7. Ensure `www.okhlopkov.com` either redirects permanently to non-`www` or stays
   intentionally unused and absent from sitemap/canonicals.
8. Run the live cutover command against `https://okhlopkov.com`, including edge
   canonicalization and browser smoke:

   ```bash
   npm run cutover:live
   ```

9. Submit `https://okhlopkov.com/sitemap.xml` in the matching Search Console
   property.
10. In Search Console URL Inspection, live-test:
   - sitemap URL and `lastmod` entries;
   - homepage;
   - one new blog post index page;
   - one new SEO article;
   - three high-value legacy URLs;
   - one redirected service URL;
   - every backlink-critical URL from `migration/backlink-critical-urls.csv`.

## Rollback

Rollback is DNS/Cloudflare-level:

1. Point `okhlopkov.com` back to the old Ghost/Coolify origin.
2. Keep the static container running for debugging.
3. Record the failed verifier output and affected URL map rows.
4. Fix in the static branch and redeploy preview before another switch.

Do not delete Ghost volumes or MySQL data until Search Console and server logs
show the static origin is stable for at least two crawl cycles.

## Post-Switch Monitoring

For the first 72 hours:

- run `npm run verify:migration` against the live domain at least daily;
- watch Cloudflare/Caddy/Nginx logs for `404`, redirect loops and asset errors;
- check Google Search Console indexing and sitemap status;
- check Yandex Webmaster after sitemap submission;
- compare GA4/Yandex Metrika traffic against the pre-switch baseline;
- keep a list of pages where Google-selected canonical differs from declared
  canonical.
