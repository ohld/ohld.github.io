# Live Cutover Runbook

Use this after the preview origin has passed strict verification and
`okhlopkov.com` DNS/Cloudflare has been pointed at the static origin.

## One Command

Run:

```bash
npm run cutover:live
```

This runs:

- `npm run verify:live`;
- browser smoke against `https://okhlopkov.com`.

`verify:live` requires:

- strict `404` for unknown URLs;
- real server-side redirects for legacy service URLs;
- edge redirects for `http` and `www` canonicalization;
- short cache headers for HTML/crawler files;
- immutable cache headers for hashed assets;
- preserved legacy URLs and backlink-critical URLs;
- sitemap with `lastmod`, `robots.txt`, `llms.txt`, `llms-full.txt`, analytics
  snippets and Yandex verification meta.

## Expected Before DNS Cutover

`npm run cutover:live` is expected to fail before DNS/Cloudflare is switched,
because live `okhlopkov.com` is still the Ghost origin.

## If It Fails After DNS Cutover

Do not delete Ghost data. Keep both origins running.

Triage by failure type:

- **Edge redirect failure**: fix Cloudflare/Caddy/Nginx host rules for
  `http -> https` and `www -> non-www`, then rerun `npm run verify:live`.
  If `x-okhlopkov-www-proxy: baidu-verification-temporary` appears on `www`,
  remove that temporary Cloudflare rule and replace it with a permanent redirect.
- **Legacy URL failure**: inspect the failing row in `migration/url-map.csv`.
  Add or fix a static page/redirect, redeploy preview, rerun strict preview
  verification, then rerun live verification.
- **Backlink-critical failure**: inspect `migration/backlink-critical-urls.csv`.
  Treat these as rollback-level failures if the URL was externally linked.
- **Sitemap/canonical failure**: confirm `SITE_URL=https://okhlopkov.com` was
  used in the Docker build and that the live host is serving the new
  `sitemap.xml` with `lastmod` entries.
- **Origin header failure**: check reverse proxy and Cloudflare rules. HTML,
  `robots.txt`, `sitemap.xml`, `llms.txt` and `llms-full.txt` should not be
  cached long-term; hashed assets can be immutable.
- **Browser smoke failure**: inspect the named route on desktop and mobile before
  submitting the sitemap to search engines.

If a high-value legacy or backlink-critical URL is broken and cannot be fixed
quickly, roll back DNS/Cloudflare to the old Ghost/Coolify origin and keep the
static container running for debugging.

## After It Passes

Then submit:

- `https://okhlopkov.com/sitemap.xml` in Google Search Console;
- `https://okhlopkov.com/sitemap.xml` in Yandex Webmaster.

In Google Search Console URL Inspection, live-test:

- homepage;
- sitemap URL;
- one new blog article;
- three high-value legacy URLs;
- one redirected service URL;
- every URL from `migration/backlink-critical-urls.csv`.
