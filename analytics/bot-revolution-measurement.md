# The Bot Revolution: measurement plan

Applies to:

- `/ru/blog/bot-revolution/`
- `/en/blog/bot-revolution/`

## Decisions this measurement should support

1. Which sections earn attention and which are skimmed or skipped?
2. Where do qualified readers stop?
3. Which links, prompts, and subscription cards turn attention into action?
4. Do Russian and English readers behave differently?

## Primary KPIs

| KPI | Definition | Event |
| --- | --- | --- |
| Qualified reader rate | At least 15 active seconds and at least two sections viewed, divided by article views | `article_engaged` |
| Completion rate | At least 30 active seconds, conclusion viewed, and max scroll at least 75%, divided by article views | `article_read_complete` |
| Engaged CTA rate | Unique engaged sessions with a prompt copy, channel click, chat click, or source click, divided by engaged sessions | click/copy events |

Do not set an arbitrary success target before launch. Establish the baseline after either seven days or 100 non-internal article views, whichever comes later. Compare future revisions and RU/EN versions against that baseline.

## Section funnel

The article has nine stable section IDs:

1. `hook`
2. `evolution`
3. `context_limit`
4. `team_structure`
5. `chief_model`
6. `telegram_primitives`
7. `pricing`
8. `personal_prompt`
9. `conclusion`

For every section, report:

- view rate: sessions with `article_section_view` / article views;
- read rate: sessions with `article_section_read` / article views;
- view-to-read rate: readers / viewers;
- median and average active attention from `article_section_attention`;
- next-section continuation: viewers of section N+1 / viewers of section N.

A section is considered substantially visible when at least half of it, capped at 45% of the viewport height, is visible. A section is considered read after five cumulative active seconds. Attention pauses when the tab is hidden or the reader has been idle for 30 seconds.

## Exit diagnostics

`article_read_summary` is emitted on page hide or route change with:

- `sections_viewed`, `sections_read`, and `section_count`;
- `max_section_index` and `last_section_id`;
- `active_seconds` and `elapsed_seconds`;
- `max_scroll_percent`;
- `engaged_reader` and `read_complete`.

Use `last_section_id` only for qualified readers when diagnosing drop-off. Bounces with a few seconds of active time are acquisition quality, not a content-section failure.

## Conversion events

| Action | Event | ID / label |
| --- | --- | --- |
| Copy the personal setup prompt | `code_copy` | `bot_revolution_prompt` |
| Click the Telegram channel card | `telegram_subscribe_click` | `bot_revolution_channel` |
| Click the secondary footer card | `article_cta_click` | `bot_revolution_chat` (RU) / `bot_revolution_x` (EN) |
| Click an article source | `source_link_click` | link text and domain |
| Switch language | `article_internal_click` | EN/RU destination |

## GA4 setup after deployment

Register these event-scoped custom dimensions:

- `article_slug`, `article_lang`;
- `section_id`, `section_title`;
- `last_section_id`, `exit_reason`;
- `cta_id`, `link_domain`.

Register these event-scoped custom metrics:

- `active_seconds`, `elapsed_seconds`;
- `attention_seconds`, `attention_total_seconds`;
- `section_index`, `section_count`, `sections_viewed`, `sections_read`;
- `max_section_index`, `max_scroll_percent`.

Mark `article_engaged` and `article_read_complete` as key events only if they are useful in the shared GA property. They are already sent as Yandex Metrika JavaScript goals, but the matching goals must also be created in the Metrika counter UI.

## Recommended report

Build one exploration filtered to `article_slug = bot-revolution`:

1. scorecards for article views, qualified reader rate, completion rate, and engaged CTA rate;
2. a RU/EN comparison;
3. a section table with view rate, read rate, attention, and continuation;
4. an exit table by `last_section_id`, filtered to qualified readers;
5. CTA and source-link clicks by `cta_id` and `link_domain`.

Keep Core Web Vitals beside the content KPIs. A drop in completion after a heavier release may be a loading regression rather than weaker writing.

Yandex click maps and Webvisor are enabled for direct Bot Revolution entries as a qualitative audit layer, while remaining off across the rest of the site for performance. Use them to inspect unusual section drop-offs, not as the primary KPI source: section events are stable and comparable, while replay review is manual and sample-based.
