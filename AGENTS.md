# okhlopkov.com agent guide

## Start here

- Query the `default` GBrain source for `okhlopkov.com` / Personal Brand SEO context before planning site or publishing work. The canonical workflow page is `projects/personal-brand-seo/workflows/agent-operating-memory`.
- The source repository is public. Never commit credentials, private messages, analytics dumps, raw private assets, or internal strategy.
- Keep unrelated dirty-worktree changes out of the task. Prefer a clean worktree and a `codex/*` branch.
- Publishing runs are manual. Open a PR with check results and wait for Dan to merge it. Scheduling, self-merge, autonomous noindex and rollback actions remain disabled. Future activation is one separate, explicit Dan-approved mode change after he accepts the reviewed output; this tooling does not implement or enable that switch.

## Prepare a RU or EN blog post for review

Use the canonical route `/ru/blog/<slug>/` or `/en/blog/<slug>/`. A React route by itself is not a published page on GitHub Pages: the build must emit `dist/<lang>/blog/<slug>/index.html`, otherwise a direct production visit can fall through to the homepage/404 shell.

Write the post, then register and check it:

```sh
npm run publish:blog -- --file content/blog-posts/<name>.md
npm run check:editorial -- content/blog-posts/<name>.md
```

- `content/blog-posts/<name>.md` (route `/ru/blog/<slug>/` or `/en/blog/<slug>/`) and `content/seo-articles/<name>.md` (`/ru/articles/<slug>/`, `/en/articles/<slug>/`) are the only source of a post: public body plus frontmatter. Use an existing post as the schema example; `lang` is `ru` or `en`. A blog post may share its slug with its other-language version; an article slug must be unique.
- `publish:blog` validates the frontmatter (required fields, dates, explicit `lang`, `primaryKeyword`, `coverAlt` and the cover file when `coverImage` is set), refuses a keyword used by another Markdown URL in the same language, and regenerates `src/generatedBlogPosts.ts` (runtime bodies) and `src/generatedBlogMetadata.ts` (cards). Existing keyword conflicts must be resolved by the content owner before registering either conflicting page; backdating cannot claim ownership. Never edit the registries by hand: `npm run check:blog-registry` fails the preflight when they differ from the Markdown. Existing card-only thumbnails are preserved. Title/description length produces warnings. The command writes local registries; it does not build, commit, push or publish.
- `check:editorial` is the deterministic anti-slop gate; the preflight runs it on posts changed since `origin/main`. Errors include banned phrases from `scripts/editorial-rules.json`, bare URLs, an extra body H1 (the frontmatter title supplies the page H1), missing internal routes, fewer than two distinct internal links, no code block/table/list, and for new posts fewer than 600 words. FAQ below 600 words is an error; H2 counts and undated price/version/limit patterns warn. It does not judge voice, factual accuracy or source quality.
- `src/App.tsx` — routing. The generic `/ru/blog/:slug` and `/en/blog/:slug` renderers are enough for ordinary Markdown posts. A custom React article needs an exact route before the generic one.
- `scripts/prerender.mjs` discovers the Markdown files and emits static HTML, canonical metadata, redirects, the `.md` mirror and the sitemap entry.
- `.github/workflows/preflight.yml` runs the tests and the full preflight on every pull request; `.github/workflows/deploy.yml` is the GitHub Pages release path.

For a former draft or moved page, add one canonical redirect through `content/articles/legacy-redirects.json`, regenerate `migration/url-map.csv` with `npm run migration:map`, and keep the SPA redirect in `src/App.tsx`. Do not publish under `/drafts/`.

Before merge:

```sh
npm run preflight:okhlopkov
test -f dist/ru/blog/<slug>/index.html
rg -n "/ru/blog/<slug>/" dist/sitemap.xml dist/ru/blog/<slug>/index.html
```

Also verify the homepage, language-specific blog index and post locally on mobile and desktop, plus any old URL redirect. Finish with a PR and check results for Dan's review. After Dan merges, the existing deployment workflow releases the site; production verification is a separate follow-up.

## Updating an existing page

For review-only updates to an existing Russian Markdown page, use `npm run content-loop:inventory` and `npm run content-loop:draft`. The draft CLI accepts a private evidence handoff plus complete article Markdown, or a normalized Candidate export. By default it writes a private review artifact; `--apply` synchronizes the article and card metadata on a `codex/*` branch after checking runtime registration. It never commits, pushes, deploys or publishes to Telegram. New pages and Watch decisions remain private handoffs. See `scripts/content-loop/README.md` for the input contract, idempotency and checks. Keep handoffs, evidence records and receipts outside this public repository.
