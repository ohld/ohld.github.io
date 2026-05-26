# Visual Assets Workflow

This is the first contract for images in `/blog/` and SEO pages on
`okhlopkov.com`.

## When To Add A Visual

Add a visual when it makes the article easier to understand or share:

- hero/OG image for an important article;
- screenshot of a real tool, workflow, prompt output or UI state;
- diagram for a process, comparison or decision tree;
- generated illustration when a screenshot would be too noisy or impossible;
- table/chart when the content is data-heavy.

Do not add decorative images just to fill space. Every image needs a job:
explain, compare, prove, or make the page shareable.

## Source Policy

Preferred sources:

- Dan's own screenshots and screen recordings;
- images and visuals attached to Dan's original Telegram posts;
- YouTube thumbnails from Dan's own videos;
- generated images from Nano Banana or another model;
- public product screenshots when they are used as factual references;
- Pinterest or other saved images only as style references, not copied assets.

Reference images, Pinterest boards, raw prompts and private source packs are
not committed to this public repository unless they are explicitly safe to
publish.

## Generation Flow

1. Decide what the visual must explain in one sentence.
2. Pick the format: screenshot, diagram, generated hero, comparison table, or
   prompt card.
3. Write a short image brief with article slug, target section, audience, visual
   goal, aspect ratio, style references and required text, if any.
4. Generate with Nano Banana/Hermes or another approved image tool.
5. Review manually: no fake UI claims, broken text, distorted logos or private
   data.
6. Optimize for the web and add alt text before publishing.

Default hero format is 16:9. Use `1200x675` or `1600x900` source dimensions
before optimization.

## Storage

Store final publishable assets under:

```text
public/assets/blog/<article-slug>/<asset-name>.webp
```

Use stable, descriptive filenames:

```text
public/assets/blog/openclaw-vs-hermes-agent/agent-setup-flow.webp
```

If an image needs metadata, store a short public-safe sidecar next to it:

```text
public/assets/blog/<article-slug>/<asset-name>.meta.json
```

Allowed metadata:

- source type: `screenshot`, `generated`, `youtube-thumbnail`, `diagram`;
- generator/tool name;
- short public prompt summary;
- source URLs that are already public;
- license/usage note when relevant.

Do not store private Telegram exports, API keys, local session strings, paid SEO
exports, Pinterest private URLs, or raw Search Console query data in this repo.

## Web Requirements

- Prefer `.webp` for photos/illustrations and `.svg` only for hand-authored
  diagrams/icons.
- Keep article images under roughly 250 KB when practical.
- Add width, height, lazy loading and descriptive alt text.
- The hero/OG image should work as a social preview without relying on tiny
  text.
- Screenshots must be readable on mobile.
- If the visual summarizes a claim, include the source in the article body too.

## Article Integration

The article should say why the visual matters. Avoid orphan images.

Good placements:

- hero image after title/dek;
- screenshot inside a workflow section;
- diagram before a step-by-step section;
- comparison visual next to a table;
- generated image only when it clarifies the concept or improves shareability.

For Telegram-derived posts, keep Dan's original text intact and add visuals as
an editorial layer around the post, the same way we add headings, FAQ, source
packs and community insights.

If the source Telegram post has an image, screenshot, chart or other visual,
reuse it by default. Pick the strongest placement:

- hero/OG image when the visual summarizes the post or makes the card more
  clickable;
- inline figure when it supports a specific section;
- both only when the image remains useful in the article body after serving as
  the cover.

Use the OHLDBot channel media fetcher for source assets when available:

```bash
cd /Users/ohld/Documents/GitHub/ohldbot
python scripts/ohld_agent_api.py channel-media --channel danokhlopkov --message-id <id> --include-base64
```

If the private API token is not available, public Telegram CDN assets from
`https://t.me/danokhlopkov/<id>?embed=1&mode=tme` are acceptable for Dan's own
public channel posts. Store the final asset locally under
`public/assets/blog/<article-slug>/` instead of hotlinking Telegram.
