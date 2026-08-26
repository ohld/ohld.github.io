# okhlopkov.com agent guide

## Start here

- Query the `default` GBrain source for `okhlopkov.com` / Personal Brand SEO context before planning site or publishing work. The canonical workflow page is `projects/personal-brand-seo/workflows/agent-operating-memory`.
- The source repository is public. Never commit credentials, private messages, analytics dumps, raw private assets, or internal strategy.
- Keep unrelated dirty-worktree changes out of the task. Prefer a clean worktree and a `codex/*` branch.

## Publish a Russian Dan-authored blog post

Use the canonical route `/ru/blog/<slug>/`. A React route by itself is not a published page on GitHub Pages: the build must emit `dist/ru/blog/<slug>/index.html`, otherwise a direct production visit can fall through to the homepage/404 shell.

Read these files before editing:

1. `content/blog-posts/<slug>.md` — public body and frontmatter; use an existing post as the schema example.
2. `src/generatedBlogPosts.ts` — runtime body registry. Import the Markdown file and add it to `sources`.
3. `src/generatedBlogMetadata.ts` — card metadata used by the blog index and homepage. Keep it synchronized with frontmatter.
4. `src/App.tsx` — routing. The generic `/ru/blog/:slug` renderer is enough for ordinary Markdown posts. A custom React article needs an exact `/ru/blog/<slug>` route before the generic route.
5. `scripts/prerender.mjs` — static HTML, canonical metadata, redirects, Markdown-for-agents, and sitemap generation. It discovers `content/blog-posts/*.md`; custom pages still need a normal blog Markdown entry so direct URLs are prerendered.
6. `scripts/verify-static-migration.mjs` and `scripts/browser-smoke.mjs` — production-shape and navigation checks.
7. `.github/workflows/deploy.yml` — the GitHub Pages release path.

For a former draft or moved page, add one canonical redirect through `content/articles/legacy-redirects.json`, regenerate `migration/url-map.csv` with `npm run migration:map`, and keep the SPA redirect in `src/App.tsx`. Do not publish under `/drafts/`.

Before merge:

```sh
npm run preflight:okhlopkov
test -f dist/ru/blog/<slug>/index.html
rg -n "/ru/blog/<slug>/" dist/sitemap.xml dist/ru/blog/<slug>/index.html
```

Also verify that `/`, `/ru/blog/`, and `/ru/blog/<slug>/` render locally on mobile and desktop, and that the old URL resolves to the canonical route. Completion means merge/push, a successful `Deploy to GitHub Pages` run, and a direct live check of `https://okhlopkov.com/ru/blog/<slug>/` without SPA fallback or homepage redirect.

## Current publishing bottleneck

Blog frontmatter and `src/generatedBlogMetadata.ts` duplicate metadata, while `src/generatedBlogPosts.ts` separately registers runtime bodies. This is why an agent can make a page that works in local SPA navigation but is absent from cards or direct GitHub Pages URLs. Until that architecture is simplified, treat the three files as one atomic publication change.

The preferred automation direction is a repository CLI as the source of truth, for example `npm run publish:blog -- --file ...`, which validates frontmatter, updates registries, creates redirects, builds, and checks canonical/sitemap/cards. An MCP should be a thin agent-facing wrapper around that CLI, not a second publishing implementation.
