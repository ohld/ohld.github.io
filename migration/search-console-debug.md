# Search Console Sitemap Debug Checklist

This checklist is for GitHub Pages/custom-domain deployments of
`okhlopkov.com` and `ai.okhlopkov.com`.

## Official Rules To Respect

- Put the sitemap at the site root when possible.
- Use fully-qualified absolute URLs in `<loc>`.
- Include the canonical URLs you want Google to show.
- Do not send conflicting canonical signals: sitemap URL and page
  `rel="canonical"` should agree.
- Submit the exact sitemap URL in the matching Search Console property.
- Use URL Inspection live test: crawl allowed, page fetch successful, indexing
  allowed.
- A submitted sitemap is a hint, not an indexing guarantee.
- Recent pages can take at least a week to appear even after sitemap/indexing
  submission.

Sources:

- https://support.google.com/webmasters/answer/7451001
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://support.google.com/webmasters/answer/12061956
- https://support.google.com/webmasters/answer/7474347

## Current Live Observations

Checked on 2026-05-25:

- `https://ai.okhlopkov.com/sitemap.xml` returns `200` and `application/xml`,
  but the live sitemap still lists only the old `ai.okhlopkov.com` URLs.
- `https://ai.okhlopkov.com/robots.txt` points to that sitemap.
- `https://ohld.github.io/sitemap.xml` redirects to
  `https://ai.okhlopkov.com/sitemap.xml`.
- `https://okhlopkov.com/sitemap.xml` currently returns the Ghost sitemap index,
  not the static migration sitemap from this branch.
- The static migration sitemap should list 99 canonical URLs and include
  `lastmod` for each indexable URL.
- Live `ai.okhlopkov.com` pages use `https://ai.okhlopkov.com/...` as canonical.
- This migration branch generates canonical URLs for `https://okhlopkov.com/...`,
  but it is not live on the main domain yet.
- Live `ai.okhlopkov.com` HTML is not an empty SPA shell: pages include headings,
  meta tags and canonical links in the raw response.
- `https://www.okhlopkov.com/` returns `404`, and `www.ai.okhlopkov.com` does not
  resolve. Do not use `www` in sitemap, canonicals or GSC URL-prefix properties.
- `http://okhlopkov.com/` currently redirects to HTTPS with `307`. Use permanent
  `301`/`308` on the future canonical origin.

User clarification: the broken `sitemap.xml` issue was observed specifically on
the GitHub Actions/GitHub Pages deployment. Treat it as a Pages deployment
diagnostic, not as proof that the future `okhlopkov.com` static origin will have
the same problem.

## Most Likely Failure Modes

1. Search Console property mismatch:
   sitemap submitted under `okhlopkov.com`, but URLs are `ai.okhlopkov.com`, or
   vice versa.
2. Sitemap host mismatch:
   submitting the GitHub Pages redirect URL instead of the final custom-domain
   sitemap URL.
3. Canonical mismatch:
   sitemap lists one host while page HTML declares another canonical host.
4. New branch not deployed:
   local sitemap has 99 canonical URLs, but live `ai.okhlopkov.com` still has
   the old 7-URL sitemap.
5. Wrong domain target:
   `okhlopkov.com` is still Ghost/Hetzner/Cloudflare, so GSC for the root domain
   sees Ghost sitemap and old content until DNS/origin changes.
6. Pages not crawlable as static HTML:
   every indexable page should have title, meta, canonical, JSON-LD and body
   content in the HTML response before JavaScript runs.
7. Robots/noindex issue:
   page and sitemap must be allowed for crawl, and indexable pages must not have
   `noindex`.
8. Report expectation mismatch:
   a sitemap found only through `robots.txt` is not necessarily shown in the GSC
   Sitemaps report; submit it explicitly if you want report visibility.

## Next Checks

For any URL we want indexed, verify this exact set:

```text
curl -I https://host/path/
curl -s https://host/path/ | grep -E "canonical|robots|og:url|<h1"
curl -I https://host/sitemap.xml
curl -s https://host/sitemap.xml | grep "https://host/path/"
curl -s https://host/robots.txt | grep -i sitemap
```

Then run Search Console URL Inspection live test on:

- the sitemap URL;
- one representative article URL;
- one legacy preserved URL;
- one redirected Ghost service URL.

Expected result for indexable pages:

- crawl allowed: yes;
- page fetch: successful;
- indexing allowed: yes;
- canonical selected by Google matches our declared canonical.

For `ai.okhlopkov.com`, the first manual GSC check should be URL Inspection for
`https://ai.okhlopkov.com/about/`: verify `Google-selected canonical` and whether
GSC attributes the URL to the submitted sitemap.
