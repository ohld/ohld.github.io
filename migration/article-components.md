# Article Components And Blog Formatting

This is the first formatting contract for future `/blog/` posts and
`/articles/` SEO pages on `okhlopkov.com`.

## Goals

- Keep articles indexable as real HTML, not hidden client-only content.
- Make dense AI-agent posts readable: lists, tables, source links and examples.
- Support prompts and code snippets that readers can copy.
- Treat YouTube/Telegram as sources and distribution, while the canonical
  evergreen article lives on `okhlopkov.com`.

## URL Shape

- Telegram-derived posts: `/blog/<semantic-slug>/`
- SEO tutorials/comparisons/source-pack pages: `/articles/<semantic-slug>/`
- English index pages: `/en/blog/`, `/en/articles/`
- Do not create source-based URL buckets like `/video/`, `/telegram/`, `/notes/`.
  Source type belongs in metadata, not in the URL architecture.
- Content is RU-first. Translate only selected winning pages when there is a real
  SEO, distribution or backlink reason.

## Required Article Skeleton

1. `<article>` with one `<h1>`.
2. Short dek/description under the title.
3. `Last updated` date as visible text and `dateModified` in JSON-LD.
4. Short abstract/dek for answer-engine style extraction. Do not label it
   "Коротко" or "TL;DR" unless the label is part of the original post.
5. Main body with semantic `<h2>`/`<h3>` sections.
6. Source pack section: YouTube, Telegram posts, transcripts, docs, tools.
7. Optional community insights section from Telegram chat discussion.
8. Related internal links: `/articles/`, tool pages, comparisons, blog posts.
9. FAQ/AEO block when the query has clear direct questions.

## Telegram Post Preservation

When an article is based on Dan's own Telegram post, preserve the original text
as much as possible. The voice is the asset. Do not rewrite the whole post into
generic SEO prose.

SEO work should happen around the post:

- title and dek;
- semantic headings;
- intro/context;
- TL;DR;
- bullet summaries;
- source links;
- visuals/tables;
- internal links;
- FAQ/AEO blocks;
- `Community insights` section.

If the original Telegram post contains a useful image or visual, bring it into
the site article. Use it as the cover/OG image when it can sell the article in
cards and social previews; otherwise place it near the section it explains.
Do not leave Telegram visuals behind during adaptation.

`Community insights` can synthesize what people discussed in Telegram chats
after the post was published. That section can be rewritten more aggressively in
Dan's voice and optimized for search because it is enrichment, not the original
post.

English versions are editorial adaptations, not automatic mirrors.

## YouTube Block

Default component: thumbnail card linking to YouTube.

Why:

- it always works even when embedding is disabled;
- a user who clicks through and watches is counted on YouTube itself;
- it keeps the article fast and avoids loading the full YouTube player by default.

Data:

- `videoId`
- `title`
- `thumbnailUrl`, usually `https://i.ytimg.com/vi/<videoId>/hqdefault.jpg`
- `watchUrl`, usually `https://www.youtube.com/watch?v=<videoId>`
- optional `publishedAt`
- optional `summary`

If using a real embed, use the standard YouTube click-to-play embed, never
autoplay/scripted playback. YouTube's own guidance says embedded videos should
use the standard click-to-play player and be large enough for a good user
experience. YouTube also says metrics are algorithmically confirmed and
low-quality playbacks can be discarded.

Sources:

- https://help.youtube.com/support/youtube/bin/answer.py?answer=132596&hl=en
- https://support.google.com/youtube/answer/2991785?hl=en

## X/Twitter Links

Do not rely on official X/Twitter embeds for article layout. The widget often
does not render reliably under current platform/CSP constraints and degrades
into raw text. Use a normal contextual hyperlink inside the paragraph instead.

## Core Blocks

### Quote

Use for a real quote, a strong editorial take or a short extracted line.

Semantic HTML:

```html
<blockquote>
  <p>Quote text.</p>
  <cite>Source or speaker</cite>
</blockquote>
```

### Callout

Use for notes, warnings, source context and practical takeaways.

Types: `note`, `take`, `warning`, `checklist`, `source`.

### Table

Use for comparisons, tool matrices, keyword clusters, pros/cons and benchmark
results. Include a short caption when the table needs context.

### Code Block

Use for commands, configs, JSON, snippets and reusable prompts.

Requirements:

- preserve whitespace;
- show language label when known;
- provide a copy button with progressive enhancement;
- keep the raw text selectable even if JavaScript fails.

Prompt blocks are code blocks with language `text` or `prompt`.

### Source List

Each article should have a compact source list when it synthesizes external
materials. Prefer source links over vague claims.

## Visual Assets

Use `migration/visual-assets.md` for image briefs, Nano Banana/Hermes generation,
asset storage, optimization and public-repo safety.

## SEO Notes

- Use one clear canonical URL per article.
- Keep internal links inside the body, not only in footer/nav.
- Public page copy must not expose internal editorial/migration mechanics. Avoid
  phrases like "preserved notes", "translated when there is demand",
  "Telegram posts turned into articles", "static migration", "legacy HTML" or
  similar service-language on visible pages and metadata.
- Lists and tables are good, but every generated page needs original synthesis:
  a take, tested workflow, source pack, examples or screenshots.
- Add `BlogPosting` JSON-LD for articles.
- Add `VideoObject` JSON-LD only when the article materially features a video
  with title, thumbnail and upload/publish date.
